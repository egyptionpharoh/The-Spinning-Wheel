import { BaseItem } from '../types';
import { IRandomProvider } from '../providers/RandomProvider';

export class RandomizerEngine {
  /**
   * اختيار عنصر عشوائي من بين العناصر المتاحة في العجلة
   * تم حقن IRandomProvider بدلاً من الاعتماد المباشر على المتصفح
   */
  public static pickNext(items: Map<string, BaseItem>, randomProvider?: IRandomProvider): BaseItem | null {
    const availableItems = Array.from(items.values()).filter(
      item => item.presence === 'IN_WHEEL'
    );

    if (availableItems.length === 0) {
      return null; 
    }

    const totalWeight = availableItems.reduce(
      (sum, item) => sum + (item.weight || 1),
      0
    );

    // إذا لم يتم تمرير الأداة (randomProvider)، سنستخدم أداة المتصفح الافتراضية لمنع الانهيار
    const randomFloat = randomProvider ? randomProvider.getFloat() : Math.random();
    let randomValue = randomFloat * totalWeight;
    
    for (const item of availableItems) {
      randomValue -= (item.weight || 1);
      if (randomValue <= 0) {
        return item;
      }
    }

    return availableItems[availableItems.length - 1];
  }
}