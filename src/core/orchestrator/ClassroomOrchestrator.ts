import { DataRepository } from '../repository/DataRepository';
import { CommandManager } from '../commands/CommandManager';
import { EventBus } from '../events/EventBus';
import { IRandomProvider } from '../providers/RandomProvider';
import { RandomizerEngine } from '../engines/RandomizerEngine';
import { EvaluateItemCommand } from '../commands/EvaluateItemCommand';
import { 
  BaseItem, 
  EvaluationOutcome, 
  SessionSettings, 
  SessionData, 
  SessionStatistics 
} from '../types/core';
import { 
  SessionStartedEvent, 
  ItemSelectedEvent, 
  StatisticsUpdatedEvent 
} from '../types/events';

/**
 * ClassroomOrchestrator: المنسق المركزي للجلسة الصفية (Session-Scoped).
 * يدير حالة الجلسة، يتلقى الإجراءات، ويوجه الأوامر للمستودع والمحركات 
 * مع إطلاق الأحداث عبر الـ EventBus (تطبيق CQRS Lite و Command Pattern).
 */
export class ClassroomOrchestrator {
  private sessionData: SessionData | null = null;

  constructor(
    private readonly repository: DataRepository,
    private readonly commandManager: CommandManager,
    private readonly eventBus: EventBus,
    private readonly randomProvider: IRandomProvider
  ) {}

  /**
   * بدء جلسة صفية جديدة وتهيئة المستودع بالعناصر (الطلاب)
   */
  public startSession(settings: SessionSettings, initialItems: BaseItem[]): void {
    // إصلاح خطأ ReferenceError إذا كان كائن crypto غير معرف في بيئة التطوير
    const sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : `session_${Date.now()}`;
    
    this.sessionData = {
      id: sessionId,
      startTime: Date.now(),
      settings,
      isActive: true,
    };

    // تهيئة المستودع (Single Source of Truth)
    this.repository.saveAll(initialItems);

    // إطلاق حدث بدء الجلسة
    const event: SessionStartedEvent = {
      type: 'SESSION_STARTED',
      timestamp: Date.now(),
      payload: {
        sessionId,
        settings,
      },
    };
    this.eventBus.publish(event);

    this.updateAndEmitStatistics();
  }

  /**
   * اختيار الطالب التالي باستخدام المحرك النقي ومزود العشوائية المحقون
   */
  public pickNextItem(): BaseItem | null {
    if (!this.sessionData || !this.sessionData.isActive) {
      return null;
    }

    const allItemsData = this.repository.getAll();
    
    // استخراج العناصر مع تحديد نوعها الصريح (BaseItem) ليتعرف عليها TypeScript
    const itemsList = Array.isArray(allItemsData) 
      ? (allItemsData as BaseItem[]) 
      : Array.from((allItemsData as Map<string, BaseItem>).values());
      
    // بناء الخريطة (Map) بالنوع الصحيح
    const itemsMap = new Map<string, BaseItem>(
      itemsList.map((item: BaseItem) => [item.id, item])
    );
    
    const nextItem = RandomizerEngine.pickNext(itemsMap, this.randomProvider);
    if (nextItem) {
      const event: ItemSelectedEvent = {
        type: 'ITEM_SELECTED',
        timestamp: Date.now(),
        payload: {
          item: nextItem,
        },
      };
      this.eventBus.publish(event);
    }

    return nextItem;
  }

  /**
   * تقييم عنصر/طالب وتوجيه العملية عبر Command Pattern لضمان دعم الـ Undo
   */
  public evaluateItem(
    itemId: string, 
    outcome: EvaluationOutcome, 
    shouldRemove: boolean, 
    decisionDurationMs: number = 0
  ): void {
    if (!this.sessionData || !this.sessionData.isActive) {
      return;
    }

    const item = this.repository.get(itemId);
    if (!item) return;

    const command = new EvaluateItemCommand(
      this.repository,
      this.eventBus,
      itemId,
      outcome,
      shouldRemove,
      this.sessionData.settings,
      decisionDurationMs
    );

    this.commandManager.executeCommand(command);
    this.updateAndEmitStatistics();
  }

  /**
   * التراجع عن آخر إجراء تم تنفيذه
   */
  public undoLastAction(): void {
    if (!this.sessionData || !this.sessionData.isActive) {
      return;
    }

    this.commandManager.undoLast();
    this.updateAndEmitStatistics();
  }

  /**
   * إنهاء الجلسة الحالية
   */
  public endSession(): void {
    if (this.sessionData) {
      this.sessionData.isActive = false;
      this.sessionData.endTime = Date.now();
    }
  }

  /**
   * جلب نسخة قراءة فقط من حالة العناصر الحالية (Read Model - CQRS Lite)
   */
  public getSnapshot(): BaseItem[] {
    const map = this.repository.getAll();
    return Array.from(map.values());
  }

  /**
   * حساب وإرسال تحديثات الإحصائيات عبر الحدث
   */
  private updateAndEmitStatistics(): void {
    const items = Array.from(this.repository.getAll().values());
    
    let passedCount = 0;
    let failedCount = 0;
    let inWheelCount = 0;

    for (const item of items) {
      if (item.presence === 'IN_WHEEL') {
        inWheelCount++;
      }
      if (item.lastOutcome === 'PASSED') {
        passedCount++;
      } else if (item.lastOutcome === 'FAILED') {
        failedCount++;
      }
    }

    const statistics: SessionStatistics = {
      totalEvaluations: passedCount + failedCount, // تقريبي مبدئي
      passedCount,
      failedCount,
      absentCount: 0,
      retryCount: 0,
      skippedCount: 0,
      inWheelCount,
    };

    const event: StatisticsUpdatedEvent = {
      type: 'STATISTICS_UPDATED',
      timestamp: Date.now(),
      payload: {
        statistics,
      },
    };

    this.eventBus.publish(event);
  }
}