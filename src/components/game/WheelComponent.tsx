import React from 'react';
import { BaseItem } from '../../core/types/core';
import { DynamicWheel } from '../wheel/DynamicWheel';

interface WheelComponentProps {
  items: BaseItem[];
  isSpinning: boolean;
  onSpin: () => void;
  title?: string;
  spinButtonText?: string;
  themeId?: string; // إضافة خاصية الثيم لاستقبال الألوان
  sound?: boolean; 
  
  // يمكنك ترك هذه الخصائص في الواجهة إذا كانت تُمرر من مكون أب 
  // ولكننا لن نستقبلها في المكون بالأسفل طالما أننا لا نستخدمها
  selectedItem?: BaseItem | null;
  emptyText?: string;
  readyText?: string;
}

export const WheelComponent: React.FC<WheelComponentProps> = ({ 
  items, 
  isSpinning, 
  onSpin,
  title = "عجلة الحظ العشوائية",
  spinButtonText = "اسحب 🎲",
  themeId // استقبال الثيم
}) => {
  
  return (
    <div className="game-panel wheel-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 className="panel-title" style={{ marginBottom: '20px' }}>
        {title}
        <span className="student-badge" style={{ marginRight: '10px' }}>المتاح: {items.length}</span>
      </h2>
      
      {/* استبدال الشكل القديم (hologram-orb) بالعجلة الدوارة الحقيقية */}
      <DynamicWheel 
        items={items}
        isSpinning={isSpinning}
        onSpin={onSpin}
        spinButtonText={spinButtonText}
        themeId={themeId}
      />
    </div>
  );
};