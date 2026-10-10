import { useState, useCallback, useEffect } from 'react';
import { stateManager } from '../../core/store/StateManager';
import { BaseItem } from '../../core/types/core';

// 1. إنشاء حالة موحدة (Micro-Store) خارج الهوك لتشاركها جميع المكونات
let globalIsSpinning = false;
let globalSelectedItem: BaseItem | null = null;
let globalToastItem: BaseItem | null = null;
let globalIsToastVisible = false;

// 2. نظام إشعارات بسيط لإجبار المكونات على إعادة التصيير (Re-render)
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());

export const useWheel = () => {
  // خدعة بسيطة لإجبار المكون الحالي على التحديث عندما تتغير الحالة العامة
  const [, setTick] = useState(0);

  useEffect(() => {
    const forceUpdate = () => setTick(t => t + 1);
    listeners.add(forceUpdate);
    return () => {
      listeners.delete(forceUpdate);
    };
  }, []);

  // الاستماع لتحديثات الـ Core (مثل التقييم أو التراجع)
  useEffect(() => {
    const unsubscribe = stateManager.subscribe(() => {
      if (globalSelectedItem) {
        const items = stateManager.getItems();
        const updatedItem = items.find(i => i.id === globalSelectedItem!.id);
        if (updatedItem) {
          globalSelectedItem = updatedItem;
          notify(); // تحديث جميع المكونات
        }
      }
    });
    return unsubscribe;
  }, []);

  const spin = useCallback((durationMs: number) => {
    if (globalIsSpinning || globalIsToastVisible) return null;
    
    // تفعيل حالة الدوران للجميع
    globalIsSpinning = true;
    globalSelectedItem = null;
    globalToastItem = null;
    globalIsToastVisible = false;
    notify();

    // السحب من الـ Core فوراً
    const winner = stateManager.drawNextItem();

    // المرحلة 1: انتهاء الدوران وظهور الـ Toast
    setTimeout(() => {
      globalIsSpinning = false;
      globalToastItem = winner;
      globalIsToastVisible = true;
      notify();
      
      // المرحلة 2: اختفاء الـ Toast وظهور بطاقة التقييم
      setTimeout(() => {
        globalIsToastVisible = false;
        globalSelectedItem = winner;
        
        // سحب سؤال للطالب الفائز (إذا كانت الأسئلة مفعلة)
        if (winner) {
          stateManager.drawQuestionForItem(winner.id);
        }
        
        notify();
      }, 3500); 
      
    }, durationMs);

    return winner;
  }, []);

  // إرجاع الحالة العامة بدلاً من الحالة المحلية المنعزلة
  return { 
    spin, 
    isSpinning: globalIsSpinning, 
    selectedItem: globalSelectedItem, 
    toastItem: globalToastItem, 
    isToastVisible: globalIsToastVisible 
  };
};