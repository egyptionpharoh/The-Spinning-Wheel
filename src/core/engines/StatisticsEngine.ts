// /src/core/engines/StatisticsEngine.ts
import { BaseItem, SessionStatistics } from '../types';

export class StatisticsEngine {
  /**
   * حساب الإحصائيات الفورية بناءً على حالة العناصر الحالية
   */
  public static calculate(items: Map<string, BaseItem>): SessionStatistics {
    const itemsArray = Array.from(items.values());
    const totalItems = itemsArray.length;

    let inWheelCount = 0;
    let excludedCount = 0;
    let passedCount = 0;
    let failedCount = 0;
    let absentCount = 0;
    let retryCount = 0;

    itemsArray.forEach(item => {
      // حساب التواجد
      if (item.presence === 'IN_WHEEL') inWheelCount++;
      if (item.presence === 'EXCLUDED') excludedCount++;

      // حساب التقييمات
      switch (item.lastOutcome) {
        case 'PASSED': passedCount++; break;
        case 'FAILED': failedCount++; break;
        case 'ABSENT': absentCount++; break;
        case 'RETRY': retryCount++; break;
      }
    });

    // نسبة الإنجاز (كم عنصراً تم تقييمه بنجاح أو فشل أو غياب مقارنة بالعدد الكلي)
    const completedCount = passedCount + failedCount + absentCount;
    const completionPercentage = totalItems > 0 
      ? Math.round((completedCount / totalItems) * 100) 
      : 0;

    return {
      totalItems,
      inWheelCount,
      excludedCount,
      passedCount,
      failedCount,
      absentCount,
      retryCount,
      completionPercentage
    };
  }
}