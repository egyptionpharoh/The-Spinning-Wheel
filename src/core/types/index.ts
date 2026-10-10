// src/types/index.ts

// 1. استخدام "import type" لإخبار Vite أن هذه مجرد أنواع وليست قيماً
import type { SessionSettings, EvaluationOutcome, WheelPresence, ItemSnapshot, BaseItem } from './core';

// 2. استخدام "export type" عند إعادة التصدير
export type { SessionSettings, EvaluationOutcome, WheelPresence, ItemSnapshot, BaseItem };

// 3. تصدير البلوجنز 
export * from './plugin';

// 4. الواجهات
export interface HistoryEvent {
  eventId: string;
  timestamp: number;
  itemId: string;
  pluginId: string;
  actionTaken: EvaluationOutcome;
  previousPresence: WheelPresence;
  newPresence: WheelPresence;
  decisionDurationMs: number;
  itemSnapshot: ItemSnapshot;
}

export interface SessionData {
  sessionId: string;
  pluginId: string;
  startTime: number;
  endTime: number | null;
  className: string;
  totalSpins: number;
  settings: SessionSettings;
  events: HistoryEvent[];
}

export interface SessionStatistics {
  totalItems: number;
  inWheelCount: number;
  excludedCount: number;
  passedCount: number;
  failedCount: number;
  absentCount: number;
  retryCount: number;
  completionPercentage: number;
}