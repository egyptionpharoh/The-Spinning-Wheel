// /src/core/events/EventBus.ts
import { AppEvent, EventType } from '../types/events';

type EventHandler<T extends AppEvent> = (event: T) => void;

export class EventBus {
  // تخزين المستمعين لكل نوع حدث بشكل مستقل
  private listeners: Map<EventType, Set<EventHandler<any>>> = new Map();

  /**
   * الاشتراك في حدث معين
   * يعود بدالة لإلغاء الاشتراك (Unsubscribe) لتنظيف الذاكرة
   */
  public subscribe<T extends AppEvent>(
    type: T['type'], 
    handler: EventHandler<T>
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    this.listeners.get(type)!.add(handler);

    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  /**
   * إطلاق الحدث لجميع المشتركين
   */
  public publish(event: AppEvent): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }
}