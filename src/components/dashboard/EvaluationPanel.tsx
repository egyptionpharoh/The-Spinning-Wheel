import React from 'react';
import { useEvaluation } from '../../application/hooks/useEvaluation';
import { useWheel } from '../../application/hooks/useWheel';
import { Button } from '../common/Button';
import { EvaluationOutcome } from '../../core/types/core';
// @ts-ignore
import '../../styles/dashboard.css';
export const EvaluationPanel: React.FC = () => {
  const { evaluate, undoLast } = useEvaluation();
  const { selectedItem, isSpinning, isToastVisible } = useWheel();

  const handleEvaluate = (outcome: EvaluationOutcome) => {
    if (selectedItem && selectedItem.id && evaluate) {
      evaluate(selectedItem.id, outcome);
    }
  };

  // إخفاء اللوحة تماماً أثناء الدوران، وأثناء التوست، وإذا لم يكن هناك طالب
  if (isSpinning || isToastVisible || !selectedItem) {
    return null; 
  }

  return (
    <div className="evaluation-panel">
      <h3>تقييم الطالب</h3>
      <div className="eval-grid">
        <Button variant="success" onClick={() => handleEvaluate('PASSED')}>
          نجاح
        </Button>
        <Button variant="danger" onClick={() => handleEvaluate('FAILED')}>
          رسوب
        </Button>
        <Button variant="warning" onClick={() => handleEvaluate('RETRY')}>
          إعادة
        </Button>
        <Button variant="outline" onClick={() => handleEvaluate('ABSENT')}>
          غياب
        </Button>
      </div>
      <div className="eval-actions">
        <Button 
          variant="secondary" 
          fullWidth 
          disabled={!undoLast} 
          onClick={undoLast}
        >
          تراجع عن التقييم السابق
        </Button>
      </div>
    </div>
  );
};