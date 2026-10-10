import { useState, useEffect } from 'react';
import { stateManager } from '../../core/store/StateManager';
import { SessionStatistics } from '../../core/types/core';

export const useStatistics = () => {
  const [stats, setStats] = useState<SessionStatistics | null>(() => {
    try {
      // استخدام as unknown ثم as SessionStatistics لتفادي تعارض الواجهات القديمة والجديدة
      return (stateManager.getStatistics() as unknown) as SessionStatistics | null;
    } catch (error) {
      console.warn("لم يتم تهيئة الإحصائيات بعد...", error);
      return null;
    }
  });

  useEffect(() => {
    if (!stateManager || typeof stateManager.subscribe !== 'function') return;

    const unsubscribe = stateManager.subscribe(() => {
      try {
        setStats((stateManager.getStatistics() as unknown) as SessionStatistics | null);
      } catch (error) {
        console.error("حدث خطأ أثناء تحديث الإحصائيات:", error);
      }
    });
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return { stats };
};