import React from 'react';
import { BaseItem, EvaluationOutcome } from '../../core/types/core';

interface EvaluationPanelProps {
  item: BaseItem;
  onEvaluate: (outcome: EvaluationOutcome, shouldRemove: boolean) => void;
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({ item, onEvaluate }) => {
  return (
    <div className="game-panel evaluation-container">
      <h3 className="panel-title">
        تقييم الطالب: <span className="highlight-text">{item.displayId}</span>
      </h3>
      
      <div className="evaluation-grid">
        <button 
          onClick={() => onEvaluate('PASSED', false)} 
          className="btn eval-btn btn-success"
        >
          اجتاز (إبقاء) ⭐
        </button>
        <button 
          onClick={() => onEvaluate('PASSED', true)} 
          className="btn eval-btn btn-success-dark"
        >
          اجتاز (استبعاد) 🏆
        </button>
        <button 
          onClick={() => onEvaluate('FAILED', false)} 
          className="btn eval-btn btn-danger"
        >
          لم يجتز 💔
        </button>
        <button 
          onClick={() => onEvaluate('RETRY', false)} 
          className="btn eval-btn btn-warning"
        >
          إعادة محاولة 🔄
        </button>
        <button 
          onClick={() => onEvaluate('ABSENT', true)} 
          className="btn eval-btn btn-neutral"
        >
          غائب 👻
        </button>
      </div>
    </div>
  );
};