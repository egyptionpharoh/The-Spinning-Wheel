import { 
  BaseItem, SessionData, SessionStatistics, EvaluationOutcome, SessionSettings 
} from '../types';
import { Question } from '../types/core'; // تم تصحيح مسار استيراد السؤال
import { Session } from '../types/core';
import { RandomizerEngine } from '../engines/RandomizerEngine';
import { SessionEngine } from '../engines/SessionEngine';
import { EvaluationEngine } from '../engines/EvaluationEngine';
import { StatisticsEngine } from '../engines/StatisticsEngine';

export class StateManager {
  private static instance: StateManager;
  
  // حالة النظام (State)
  private items: Map<string, BaseItem> = new Map();
  
  // حالة نظام الأسئلة
  private questions: Question[] = [];
  private askedQuestionIds: Set<string> = new Set();
  private currentQuestion: Question | null = null;

  // تمرير قاعدة بيانات وهمية (Mock) لتجنب خطأ undefined الذي يمنع الجلسة من البدء
  private sessionEngine: SessionEngine = new SessionEngine({ saveAll: () => {}, save: () => {}, getAll: () => [] } as any);
  
  // نظام المستمعين (Listeners) لتحديث واجهة React عند تغير البيانات
  private listeners: Set<() => void> = new Set();

  private constructor() {}

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  // === إدارة المستمعين (Pub/Sub) ===
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  // === إدارة الجلسة والبيانات ===
  public initializeSession(
    pluginIdOrSession: string | Session, 
    classNameOrSettings?: string | SessionSettings, 
    initialItems?: BaseItem[], 
    settings?: SessionSettings,
    initialQuestions?: Question[]
  ): void {
    this.sessionEngine.startSession(pluginIdOrSession, classNameOrSettings, initialItems, settings);
    
    this.items.clear();
    const isCompiledSession = typeof pluginIdOrSession === 'object';
    const actualItems = isCompiledSession ? pluginIdOrSession.activeItems : (initialItems || []);
    actualItems.forEach(item => this.items.set(item.id, item));
    
    if (isCompiledSession) {
      this.questions = pluginIdOrSession.compiledQuestions.map(cq => cq.question);
    } else {
      this.questions = initialQuestions || [];
    }

    this.askedQuestionIds.clear();
    this.currentQuestion = null;

    this.notify();
  }

  // === العمليات الأساسية ===
  
  /** يسحب عنصراً عشوائياً ويسجل السحبة */
  public drawNextItem(): BaseItem | null {
    const winner = RandomizerEngine.pickNext(this.items);
    if (winner) {
      // تم تصحيح اسم الدالة إلى incrementSpinCount لكي لا ينهار التطبيق عند دوران العجلة
      this.sessionEngine.incrementSpinCount();
      this.notify();
    }
    return winner;
  }

  /** ينفذ التقييم القادم من الواجهة */
  public evaluateItem(
    itemId: string, 
    outcome: EvaluationOutcome, 
    shouldRemove: boolean,
    decisionDurationMs: number,
    earnedScore: number = 0
  ): void {
    const item = this.items.get(itemId);
    
    // تم تصحيح اسم الدالة إلى getCurrentSession
    const session = this.sessionEngine.getCurrentSession();
    
    if (!item || !session) return;

    // أخذ لقطة للحالة قبل التغيير (يفيد في الـ Undo لاحقاً)
    const itemSnapshot = { ...item };
    const previousPresence = item.presence;

    // معالجة القرار
    const { newOutcome, newPresence } = EvaluationEngine.processEvaluation(
      item, outcome, shouldRemove, session.settings
    );

    // تحديث العنصر
    item.lastOutcome = newOutcome;
    item.presence = newPresence;
    
    // إضافة النقاط الجديدة إلى رصيد الطالب السابق (إن وجد)
    item.score = (item.score || 0) + earnedScore;
    
    this.items.set(itemId, item);

    // تم تصحيح استدعاء تسجيل الحدث ليتطابق مع دالة recordEvent في SessionEngine
    this.sessionEngine.recordEvent(
      item.id,
      outcome,
      previousPresence,
      newPresence,
      decisionDurationMs,
      itemSnapshot
    );

    this.notify(); // تحديث الواجهة فوراً
  }
  // === إدارة الأسئلة ===
  
  /** يختار سؤالاً مناسباً للعنصر المسحوب (طالب محدد أو عام) */
  public drawQuestionForItem(itemId: string): Question | null {
    const session = this.sessionEngine.getCurrentSession();
    if (!session?.settings.enableQuestions || this.questions.length === 0) {
      return null;
    }

    // تصفية الأسئلة التي لم تُطرح بعد لضمان عدم تكرار السؤال نفسَه
    const unaskedQuestions = this.questions.filter(q => !this.askedQuestionIds.has(q.id));
    if (unaskedQuestions.length === 0) return null;

    // إعطاء الأولوية للأسئلة المخصصة للطالب المسحوب (إن وجدت)، أو اختيار سؤال عام
    const targetedQuestions = unaskedQuestions.filter(q => (q as any).targetItemId === itemId);
    const generalQuestions = unaskedQuestions.filter(q => !(q as any).targetItemId);
    
    // إذا وجدنا أسئلة مخصصة لهذا الطالب تحديداً سنختار منها، وإلا سنبحث في الأسئلة العامة
    const availableQuestions = targetedQuestions.length > 0 ? targetedQuestions : generalQuestions;

    if (availableQuestions.length === 0) return null;

    // اختيار سؤال عشوائي من بنك الأسئلة المتاح بكل سلاسة
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQ = availableQuestions[randomIndex];

    if (selectedQ) {
      this.currentQuestion = selectedQ;
      this.askedQuestionIds.add(selectedQ.id); // تسجيل السؤال كـ "تم طرحه"
      this.notify();
    }

    return selectedQ || null;
  }

  public clearCurrentQuestion(): void {
    this.currentQuestion = null;
    this.notify();
  }

  public getCurrentQuestion(): Question | null {
    return this.currentQuestion;
  }

  // === دوال جلب البيانات للواجهة ===
  public getItems(): BaseItem[] {
    return Array.from(this.items.values());
  }

  public getSession(): SessionData | null {
    // تم تصحيح اسم الدالة إلى getCurrentSession
    return this.sessionEngine.getCurrentSession();
  }

  public getStatistics(): SessionStatistics {
    return StatisticsEngine.calculate(this.items);
  }
}

export const stateManager = StateManager.getInstance();