// /src/core/engines/EvaluationEngine.ts
import { BaseItem, EvaluationOutcome, WheelPresence, SessionSettings } from '../types';

export class EvaluationEngine {
  /**
   * حساب الحالة الجديدة للعنصر بناءً على التقييم وإعدادات الجلسة
   */
  public static processEvaluation(
    item: BaseItem,
    outcome: EvaluationOutcome,
    shouldRemoveFromWheel: boolean,
    settings: SessionSettings
  ): { newOutcome: EvaluationOutcome; newPresence: WheelPresence } {
    
    let newPresence = item.presence;

    // 1. تحديد التواجد (Presence)
    if (outcome === 'ABSENT') {
      newPresence = 'EXCLUDED'; // الغائب يُستبعد تماماً
    } else if (shouldRemoveFromWheel) {
      newPresence = 'EXCLUDED'; // تم طلب الاستبعاد من الـ Plugin
    } else if (outcome === 'PASSED' && settings.autoRemoveOnPass && !settings.allowRepeat) {
      newPresence = 'EXCLUDED'; // النظام يستبعد الناجحين لمنع التكرار
    } else if (outcome === 'RETRY') {
      newPresence = 'IN_WHEEL'; // يعود للعجلة للمحاولة مرة أخرى
    } else if (outcome === 'SKIPPED') {
      newPresence = 'IN_WHEEL'; // تم التخطي، يظل في العجلة
    }

    return {
      newOutcome: outcome,
      newPresence
    };
  }
}