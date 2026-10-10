import { EvaluationOutcome } from './core';

export type HistoryEventType = 'EVALUATION' | 'MANUAL_ADJUSTMENT' | 'PLUGIN_ACTION';

export type WheelPresence = 'IN_WHEEL' | 'OUT_OF_WHEEL' | 'ABSENT';

/**
 * يمثل حدثاً واحداً في سجل الجلسة لدعم التدقيق والتراجع
 */
export interface HistoryEvent {
  id: string;
  timestamp: number;
  type: HistoryEventType;
  itemId: string;
  previousState: {
    outcome?: EvaluationOutcome;
    presence: WheelPresence;
  };
  newState: {
    outcome?: EvaluationOutcome;
    presence: WheelPresence;
  };
  pluginId?: string;
}