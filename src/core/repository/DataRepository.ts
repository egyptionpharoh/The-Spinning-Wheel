// /src/core/repository/DataRepository.ts
import { BaseItem } from '../types/core';

/**
 * مستودع البيانات (Data Repository)
 * المسؤول الوحيد عن تخزين العناصر واسترجاعها وتحديثها أثناء الجلسة.
 */
export class DataRepository {
  private items: Map<string, BaseItem> = new Map();

  public save(item: BaseItem): void {
    this.items.set(item.id, item);
  }

  public saveAll(items: BaseItem[]): void {
    items.forEach(item => this.save(item));
  }

  public get(id: string): BaseItem | undefined {
    return this.items.get(id);
  }

  public getAll(): BaseItem[] {
    return Array.from(this.items.values());
  }

  public update(id: string, updates: Partial<BaseItem>): void {
    const item = this.items.get(id);
    if (item) {
      this.items.set(id, { ...item, ...updates });
    }
  }

  public clear(): void {
    this.items.clear();
  }
}