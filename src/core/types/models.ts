// src/types/models.ts
import { SessionSettings, EvaluationOutcome, WheelPresence, ItemSnapshot } from './core';

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