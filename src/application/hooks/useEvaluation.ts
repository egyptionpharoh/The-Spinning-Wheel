// src/application/hooks/useEvaluation.ts
import { useCallback } from 'react';
import { stateManager } from '../../core/store/StateManager';
import { EvaluationOutcome } from '../../core/types/core';

export const useEvaluation = () => {
  const evaluate = useCallback((itemId: string, outcome: EvaluationOutcome) => {
    // الواجهة تمرر (itemId, outcome) فقط
    // النواة تطلب (itemId, outcome, shouldRemove, decisionDurationMs)
    // نمرر قيماً افتراضية آمنة (false, 0) حيث أن الإزالة التلقائية تتحكم بها إعدادات الجلسة تلقائياً في النواة.
    stateManager.evaluateItem(itemId, outcome, false, 0);
  }, []);

  const undoLast = useCallback(() => {
    // ملاحظة هيكلية: النواة الحالية (StateManager) لم تربط CommandManager بشكل مباشر.
    // لتجنب تعديل الـ Core بالكامل أو كسر الواجهة التي تتوقع هذه الدالة، يتم توفير دالة آمنة لا تفعل شيئاً حالياً حتى لا يتحطم التطبيق عند الضغط على الزر.
    console.warn("Undo is disabled: CommandManager is not yet integrated into StateManager.");
  }, []);

  return { evaluate, undoLast };
};