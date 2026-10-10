// الملف: DynamicWheel.tsx

import React, { useState, useEffect, useRef } from 'react';
// تأكد من صحة هذا المسار في مشروعك
import { BaseItem } from '../../core/types/core'; 
import { WHEEL_THEMES } from './wheelThemes';

interface DynamicWheelProps {
  items: BaseItem[];
  isSpinning: boolean;
  onSpin: () => void;
  spinButtonText?: string;
  themeId?: string; // استقبال الثيم كخاصية مباشرة من الإعدادات
}

export const DynamicWheel: React.FC<DynamicWheelProps> = ({
  items,
  isSpinning,
  onSpin,
  spinButtonText = 'ابدأ التدوير 🎲',
  themeId = 'cyber'
}) => {
  // حالة الدوران
  const [rotation, setRotation] = useState<number>(0);
  const currentRotationRef = useRef<number>(0);
  
  // البحث الذكي عن الثيم مع تحويل النص وتجربة كافة المسميات
  const cleanThemeId = (themeId || '').toLowerCase().trim();
  const theme = WHEEL_THEMES[cleanThemeId] || WHEEL_THEMES[themeId || ''] || WHEEL_THEMES['cyber'];  useEffect(() => {
    if (isSpinning) {
      // إضافة دورات عشوائية كاملة مع زاوية عشوائية إضافية
      const randomSpins = 360 * 5; // 5 دورات كاملة على الأقل
      const extraAngle = Math.floor(Math.random() * 360);
      const newRotation = currentRotationRef.current + randomSpins + extraAngle;
      currentRotationRef.current = newRotation;
      setRotation(newRotation);
    }
  }, [isSpinning]);

  const numItems = items.length;
  const angleStep = numItems > 0 ? 360 / numItems : 360;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '100%', maxWidth: '450px', margin: '0 auto' }}>
      
      {/* تم إزالة القائمة المنسدلة الداخلية لأن الثيم يأتي الآن من الإعدادات الخارجية بشكل تلقائي */}

      {/* 2. حاوية العجلة والمؤشر */}
      <div style={{ position: 'relative', marginTop: '10px' }}>
        {/* المؤشر العلوي للعجلة */}
        <div style={{
          position: 'absolute',
          top: '-15px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          width: '0',
          height: '0',
          borderLeft: '18px solid transparent',
          borderRight: '18px solid transparent',
          borderTop: `32px solid ${theme.pointerColor}`,
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))',
          transition: 'border-top-color 0.3s ease'
        }} />

        {/* إطار العجلة الخارجي */}
        <div style={{
          position: 'relative',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          border: `10px solid ${theme.outerBorder}`,
          boxShadow: theme.shadow,
          overflow: 'hidden',
          backgroundColor: theme.centerColor,
          transition: 'all 0.3s ease'
        }}>
          
          {/* العجلة الدوارة */}
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            position: 'relative',
            transition: isSpinning ? 'transform 5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
            transform: `rotate(${rotation}deg)`
          }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              {numItems === 0 ? (
                <circle cx="50" cy="50" r="50" fill={theme.centerColor} />
              ) : (
                items.map((item, index) => {
                  const startAngle = index * angleStep;
                  const endAngle = (index + 1) * angleStep;
                  
                  const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
                  const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);

                  const largeArcFlag = angleStep > 180 ? 1 : 0;
                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                  const fillColor = theme.colors[index % theme.colors.length];

                  // حساب موقع النص داخل القطاع الدائري
                  const midAngle = startAngle + angleStep / 2;
                  const textRadius = 32;
                  const textX = 50 + textRadius * Math.cos((midAngle * Math.PI) / 180);
                  const textY = 50 + textRadius * Math.sin((midAngle * Math.PI) / 180);

                  return (
                    <g key={item.id || index}>
                      <path d={pathData} fill={fillColor} stroke={theme.outerBorder} strokeWidth="0.8" style={{ transition: 'fill 0.3s ease' }} />
                      <text
                        x={textX}
                        y={textY}
                        fill={theme.textColor}
                        fontSize="5"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                        style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill 0.3s ease' }}
                      >
                        {item.displayId && item.displayId.length > 12 ? item.displayId.substring(0, 10) + '..' : (item.displayId || 'عنصر')}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>
          </div>

          {/* مركز العجلة الداخلي */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: theme.centerColor,
            border: `4px solid ${theme.pointerColor}`,
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: theme.pointerColor, transition: 'background-color 0.3s ease' }} />
          </div>
        </div>
      </div>

      {/* 3. زر التدوير */}
      <button
        onClick={onSpin}
        disabled={isSpinning || numItems === 0}
        style={{
          marginTop: '25px',
          padding: '14px 35px',
          fontSize: '1.3rem',
          fontWeight: 'bold',
          color: '#ffffff',
          background: isSpinning ? '#64748b' : `linear-gradient(135deg, ${theme.colors[0]} 0%, ${theme.colors[1]} 100%)`, // جعل لون الزر متناسقاً مع الثيم
          border: 'none',
          borderRadius: '35px',
          cursor: isSpinning || numItems === 0 ? 'not-allowed' : 'pointer',
          boxShadow: `0 8px 20px ${theme.shadow.split(' ')[4] || 'rgba(0,0,0,0.2)'}`,
          transition: 'all 0.2s ease',
          transform: isSpinning ? 'scale(0.96)' : 'scale(1)'
        }}
      >
        {spinButtonText}
      </button>

    </div>
  );
};