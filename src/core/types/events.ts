import { BaseItem, ItemSnapshot, SessionSettings, SessionStatistics } from './core';

export type EventType = 
  | 'SESSION_STARTED'
  | 'ITEM_SELECTED'
  | 'EVALUATION_APPLIED'
  | 'UNDO_PERFORMED'
  | 'STATISTICS_UPDATED';

export interface AppEventBase {
  type: EventType;
  timestamp: number;
}

export interface SessionStartedEvent extends AppEventBase {
  type: 'SESSION_STARTED';
  payload: { 
    sessionId: string; 
    settings: SessionSettings;
  };
}

export interface ItemSelectedEvent extends AppEventBase {
  type: 'ITEM_SELECTED';
  payload: { 
    item: BaseItem; 
  };
}

export interface EvaluationAppliedEvent extends AppEventBase {
  type: 'EVALUATION_APPLIED';
  payload: { 
    itemId: string; 
    snapshotBefore: ItemSnapshot; 
    snapshotAfter: ItemSnapshot;
    decisionDurationMs: number;
  };
}

export interface UndoPerformedEvent extends AppEventBase {
  type: 'UNDO_PERFORMED';
  payload: { 
    itemId: string; 
    restoredSnapshot: ItemSnapshot; 
  };
}

export interface StatisticsUpdatedEvent extends AppEventBase {
  type: 'STATISTICS_UPDATED';
  payload: {
    // تم ربطها بكيان الإحصائيات الرسمي (Domain Projection) لضمان Single Source of Truth
    statistics: SessionStatistics;
  };
}

// توحيد جميع الأحداث في نوع واحد (Discriminated Union)
export type AppEvent = 
  | SessionStartedEvent 
  | ItemSelectedEvent 
  | EvaluationAppliedEvent 
  | UndoPerformedEvent 
  | StatisticsUpdatedEvent;