/**
 * حالة تواجد العنصر داخل العجلة
 * تم تبسيطها لمنع التضارب: إما داخل العجلة أو مستبعد منها.
 */
export type WheelPresence = 'IN_WHEEL' | 'EXCLUDED';

/**
 * النتيجة التربوية النهائية بعد التقييم
 */
export type EvaluationOutcome = 'NONE' | 'PASSED' | 'FAILED' | 'RETRY' | 'ABSENT' | 'SKIPPED';

/**
 * نوع الإجراء التاريخي (يُستخدم في سجل الـ Domain)
 */
export type HistoryEventType = 'EVALUATION' | 'MANUAL_ADJUSTMENT' | 'PLUGIN_ACTION';
export type QuestionType = 
  | 'MULTIPLE_CHOICE' 
  | 'TRUE_FALSE' 
  | 'MATCHING' 
  | 'ORDERING' 
  | 'NOTATION' 
  | 'RHYTHM' 
  | 'PRACTICAL' 
  | 'LISTENING' 
  | 'IMAGE' 
  | 'VIDEO' 
  | 'FILL_BLANK'
  | 'ESSAY';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED';

// كيان مستقل يحدد "من سيلعب هذا السؤال؟"
export type AssignmentTarget = 'RANDOM' | 'SPECIFIC_STUDENT' | 'SPECIFIC_TEAM' | 'SPECIFIC_LEVEL' | 'ANY_STUDENT';

export interface AssignmentRule {
  target: AssignmentTarget;
  targetIds?: string[]; // IDs للطلاب أو الفرق إذا كان التحديد خاصاً
}

export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
  mediaUrl?: string; // لدعم الإجابات بالصور أو الصوت
}

// السؤال ككيان مستقل يعيش في مكتبة الأسئلة (Question Library)
export interface Question {
  targetItemId?: string;
  id: string;
  libraryId: string; // المجلد أو المكتبة التي ينتمي إليها
  text: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  options: AnswerOption[];
  timerSec?: number; // مؤقت خاص بالسؤال (اختياري)
  mediaUrls?: string[]; // مرفقات السؤال
  tags?: string[];
  notes?: string;
}

// مرجع للسؤال داخل القالب (لأن القالب لا ينسخ السؤال، بل يشير إليه ويحدد طريقة ربطه في هذه اللعبة تحديداً)
export interface TemplateQuestionRef {
  questionId: string;
  assignmentRule: AssignmentRule;
  overrideTimerSec?: number; // المعلم يمكنه تغيير وقت السؤال داخل هذا القالب فقط
}

/**
 * لقطة (Snapshot) لحالة العنصر، تستخدم في نمط الأوامر (Command Pattern) 
 * لضمان دقة التراجع (Undo) حتى لو تغيرت البيانات لاحقاً.
 */
export interface ItemSnapshot {
  id: string;
  presence: WheelPresence;
  lastOutcome: EvaluationOutcome;
  score?: number;
}

/**
 * العنصر المجرد والموحد لجميع أنواع السحوبات
 */
export interface BaseItem {
  id: string;
  displayId: string;
  presence: WheelPresence;
  lastOutcome: EvaluationOutcome;
  weight: number; // إلزامي لتجنب أخطاء undefined في حسابات الاحتمالات
  score?: number;
}

/**
 * إعدادات الجلسة (تتحكم في مسار التقييم تلقائياً دون تضارب مع الإجراءات)
 */
export interface SessionSettings {
  allowRepeat: boolean;      // هل يُسمح بتكرار السحب لنفس العنصر؟
  autoRemoveOnPass: boolean; // هل يُستبعد العنصر تلقائياً عند النجاح؟
  themeVariant: 'light' | 'dark' | 'system';
  decisionDurationMs?: number; // أضيفت للتوافق مع استدعاءات الأحداث التي رأيناها
  
  // إعدادات نظام الأسئلة
  enableQuestions?: boolean; 
  questionTimeLimitSec?: number; 
}

/**
 * البيانات الوصفية للجلسة الحالية (Root Aggregate)
 */
export interface SessionData {
  id: string;
  startTime: number;
  endTime?: number;
  settings: SessionSettings;
  isActive: boolean;
}

/**
 * الإحصائيات المجمعة للجلسة الحالية (Domain Projection)
 */
export interface SessionStatistics {
  totalEvaluations: number;
  passedCount: number;
  failedCount: number;
  absentCount: number;
  retryCount: number;
  skippedCount: number;
  inWheelCount: number;
}

/**
 * يمثل حدثاً واحداً في سجل الجلسة لدعم التدقيق (Audit) والتراجع 
 * (هذا كيان Domain وليس Payload لـ EventBus)
 */
export interface HistoryEvent {
  id: string;
  timestamp: number;
  type: HistoryEventType;
  itemId: string;
  previousState: ItemSnapshot;
  newState: ItemSnapshot;
  pluginId?: string;
}
// ============================================================================
// === الكيانات المعمارية الكبرى (Template-Driven Architecture) ===
// ============================================================================

export interface Asset {
  id: string;
  type: 'IMAGE' | 'AUDIO' | 'SVG' | 'VIDEO';
  url: string;
  name: string;
}

export interface QuestionPool {
  id: string;
  name: string;
  questions: Question[]; // يعتمد على مكتبة الأسئلة
}

export interface Student {
  id: string;
  name: string;
  isAbsent: boolean;
}

export interface Team {
  id: string;
  name: string;
  leaderId?: string;
  memberIds: string[];
  score: number;
}

export interface Classroom {
  id: string;
  name: string;
  grade: string;
  students: Student[];
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  grade?: string;
  classId?: string;
  activityName?: string;
  logoUrl?: string; // Asset ID
  
  participantsMode: 'INDIVIDUAL' | 'TEAM';
  participants: BaseItem[]; 
  teams?: Team[];
  
  // القالب يشير إلى الأسئلة وقواعد ربطها، ولا يخزن السؤال بالكامل
  questionRefs: TemplateQuestionRef[];
  
  settings: SessionSettings; 
  
  createdAt: number;
  updatedAt: number;
}

// الجلسة هي الـ Runtime Copy التي ينتجها الـ Compiler
export interface Session {
  id: string;
  templateId: string; 
  runDate: number;
  status: 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  
  // الـ Compiler يقوم بجلب الطلاب والفرق بناءً على القالب ويجهزهم
  activeItems: BaseItem[];
  
  // الـ Compiler يقوم بسحب بيانات الأسئلة الحقيقية من الـ Library ويربطها بالقواعد
  compiledQuestions: {
    question: Question;
    assignmentRule: AssignmentRule;
    effectiveTimer: number;
  }[];
  
  // الـ Compiler يولد تسلسل مبدئي للعب
  playSequence?: string[]; 
}