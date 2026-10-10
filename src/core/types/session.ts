/**
 * إعدادات الجلسة التي تتحكم في سلوك المحركات (Engines) والأوامر (Commands)
 */
export interface SessionSettings {
  autoRemoveOnPass: boolean;
  allowRepeat: boolean;
  weightsEnabled: boolean;
  decisionDurationMs?: number;
}

/**
 * البيانات الوصفية للجلسة الحالية
 */
export interface SessionData {
  id: string;
  startTime: number;
  endTime?: number;
  settings: SessionSettings;
  isActive: boolean;
}