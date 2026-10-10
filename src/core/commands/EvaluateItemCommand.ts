import { ICommand } from './ICommand';
import { DataRepository } from '../repository/DataRepository';
import { EventBus } from '../events/EventBus';
import { EvaluationOutcome, SessionSettings, ItemSnapshot } from '../types/core';
import { EvaluationAppliedEvent, UndoPerformedEvent } from '../types/events';
import { EvaluationEngine } from '../engines/EvaluationEngine';

export class EvaluateItemCommand implements ICommand {
  private snapshotBefore: ItemSnapshot | null = null;
  private snapshotAfter: ItemSnapshot | null = null;

  constructor(
    private repository: DataRepository,
    private eventBus: EventBus,
    private itemId: string,
    private outcome: EvaluationOutcome,
    private shouldRemove: boolean,
    private settings: SessionSettings,
    private decisionDurationMs: number
  ) {}

  public execute(): void {
    const item = this.repository.get(this.itemId);
    if (!item) return;

    this.snapshotBefore = {
      id: item.id,
      presence: item.presence,
      lastOutcome: item.lastOutcome,
    };

    // تم إصلاح استدعاء الدالة لتطابق التوقيع الفعلي في EvaluationEngine
    const { newOutcome, newPresence } = EvaluationEngine.processEvaluation(
      item, this.outcome, this.shouldRemove, this.settings
    );

    // تم استخدام دالة update الحقيقية الموجودة في DataRepository
    this.repository.update(this.itemId, {
      lastOutcome: newOutcome,
      presence: newPresence,
    });

    this.snapshotAfter = {
      id: item.id,
      presence: newPresence,
      lastOutcome: newOutcome,
    };

    const event: EvaluationAppliedEvent = {
      type: 'EVALUATION_APPLIED',
      timestamp: Date.now(),
      payload: {
        itemId: this.itemId,
        snapshotBefore: this.snapshotBefore,
        snapshotAfter: this.snapshotAfter,
        decisionDurationMs: this.decisionDurationMs,
      }
    };
    // تم استخدام دالة publish الحقيقية الموجودة في EventBus
    this.eventBus.publish(event);
  }

  public undo(): void {
    if (!this.snapshotBefore) return;

    this.repository.update(this.itemId, {
      presence: this.snapshotBefore.presence,
      lastOutcome: this.snapshotBefore.lastOutcome,
    });

    const event: UndoPerformedEvent = {
      type: 'UNDO_PERFORMED',
      timestamp: Date.now(),
      payload: {
        itemId: this.itemId,
        restoredSnapshot: this.snapshotBefore,
      }
    };
    this.eventBus.publish(event);
  }
}