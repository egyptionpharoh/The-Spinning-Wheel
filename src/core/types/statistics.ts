/**
 * الإحصائيات المجمعة للجلسة الحالية لدعم لوحة التحكم (Dashboard)
 */
export interface SessionStatistics {
  totalEvaluations: number;
  passedCount: number;
  failedCount: number;
  absentCount: number;
  retryCount: number;
  skippedCount: number;
}