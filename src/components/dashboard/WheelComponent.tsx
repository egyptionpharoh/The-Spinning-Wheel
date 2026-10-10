import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { BaseItem } from '../../core/types/core';
import { wheelThemes, WheelTheme } from '../wheel/wheelThemes';
import '../../styles/dashboard.css';

interface WheelComponentProps {
  sound?: boolean;
  items: BaseItem[];
  isSpinning: boolean;
  onSpin: () => BaseItem | null | undefined;
  spinButtonText?: string;
  spinningText?: string;
  themeId?: string; // إضافة خاصية الثيم
}

export const WheelComponent: React.FC<WheelComponentProps> = ({
  items = [],
  isSpinning = false,
  onSpin = () => null,
  spinButtonText = "اسحب 🎲",
  spinningText = "جاري السحب...",
  themeId = 'cyber'
}) => {
  const uiSpinDuration = 5000;
  const [rotationAngle, setRotationAngle] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  // 🌟 إضافة حالات جديدة لإدارة الثيم التفاعلي، الفائز، وقصاصات الاحتفال
  const [activeThemeId, setActiveThemeId] = useState<string>(themeId);
  const [winningItem, setWinningItem] = useState<BaseItem | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);

  // مزامنة الثيم الخارجي عند تغييره من الإعدادات
  useEffect(() => {
    setActiveThemeId(themeId);
  }, [themeId]);

  // استدعاء بيانات الثيم المختار ديناميكياً
  const theme: WheelTheme = wheelThemes[activeThemeId] || wheelThemes['cyber'];

  const handleSpin = () => {
    if (!isSpinning && items.length > 0) {
      setShowResult(false);
      setConfettiActive(false);
      
      const winner = onSpin(); 
      
      if (winner) {
        setWinningItem(winner); // 🌟 حفظ اسم الطالب الفائز لتسليط الضوء عليه
        const winnerIndex = items.findIndex(i => i.id === winner.id);
        if (winnerIndex !== -1) {
          const sliceAngle = 360 / items.length;
          const itemAngle = (sliceAngle * winnerIndex) + (sliceAngle / 2);
          const normalizedTarget = 360 - itemAngle;
          
          setRotationAngle(prev => {
            const currentBase = Math.floor(prev / 360) * 360;
            return currentBase + (360 * 10) + normalizedTarget;
          });

          let delay = 10;
          let timeElapsed = 0;
          const spinAudioDuration = uiSpinDuration - 200; 

          const tickDeceleration = () => {
            if (timeElapsed >= spinAudioDuration) return;
            const progress = timeElapsed / spinAudioDuration;
            delay = 20 + (progress * progress * 350); 
            timeElapsed += delay;
            setTimeout(tickDeceleration, delay);
          };
          
          tickDeceleration(); 

          // 🌟 عند لحظة وصول العجلة للنتيجة النهائية: إطلاق الاحتفال والتوهج
          setTimeout(() => {
            setShowResult(true);
            setConfettiActive(true);
          }, uiSpinDuration);
        }
      }
    }
  };

  const generateGradient = () => {
    if (items.length === 0) return 'conic-gradient(#edf2f7 0deg, #e2e8f0 360deg)';
    const sliceAngle = 360 / items.length;
    // استخدام ألوان الشرائح من الثيم ديناميكياً
    const colors = theme.colors.slices;
    let gradient = '';
    let currentAngle = 0;
    items.forEach((_, index) => {
      const nextAngle = currentAngle + sliceAngle;
      gradient += `${colors[index % colors.length]} ${currentAngle}deg ${nextAngle}deg, `;
      currentAngle = nextAngle;
    });
    return `conic-gradient(${gradient.slice(0, -2)})`;
  };

  return (
    <div className="wheel-wrapper" style={{ position: 'relative', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* 🌟 الحقن الديناميكي لخصائص الثيم لتغيير الشكل بالكامل */}
      <style>{`
        .wheel-scene {
          perspective: ${theme.scene.perspective}; 
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .wheel-3d-container {
           transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
           transform: ${showResult ? theme.scene.tiltStopped : (isSpinning ? theme.scene.tiltSpinning : theme.scene.tiltStopped)};
           transform-style: preserve-3d;
           margin-bottom: 20px;
           position: relative;
           z-index: 2;
           filter: ${theme.scene.dropShadow};
        }
        .wheel-outer-ring {
          position: relative;
          width: 528px;
          height: 528px;
          border-radius: 50%;
          background: ${theme.ring.background};
          box-shadow: ${theme.ring.boxShadow};
          border: ${theme.ring.border};
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .wheel-circle-container {
          position: relative;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          border: 4px solid #000;
          box-shadow: 0 0 25px rgba(0,0,0,0.9);
          overflow: hidden;
        }
        .wheel-circle {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          filter: ${theme.effects.hasMotionBlur && isSpinning ? 'blur(1.5px) contrast(1.2)' : 'none'};
        }
        .glass-dome {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 40%, rgba(0,0,0,0.5) 100%);
          pointer-events: none;
          z-index: 6;
          box-shadow: inset 0 0 15px rgba(255,255,255,0.4);
          display: ${theme.effects.hasGlassDome ? 'block' : 'none'};
        }

        .neon-bulb {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        /* تطبيق الفئات الديناميكية للنيون من الثيم */
        .bulb-idle {
          background-color: #f8fafc;
          animation: neon-idle 1.5s infinite alternate;
        }
        .bulb-spin {
          background-color: #fff;
          animation: neon-spin 0.2s infinite;
        }

        @keyframes neon-idle {
          0% { box-shadow: 0 0 4px #fff, 0 0 10px #38bdf8; opacity: 0.6; }
          100% { box-shadow: 0 0 8px #fff, 0 0 20px #0369a1; opacity: 1; }
        }
        @keyframes neon-spin {
          0% { box-shadow: 0 0 10px #fff, 0 0 25px #38bdf8; transform: scale(1); }
          50% { box-shadow: 0 0 15px #fff, 0 0 35px #ec4899; transform: scale(1.3); }
          100% { box-shadow: 0 0 10px #fff, 0 0 25px #38bdf8; transform: scale(1); }
        }

        /* 1. إضاءة ثيم الفضاء الكوني (Space Glow) */
        .bulb-space-idle {
          background-color: #38bdf8;
          animation: space-pulse 2s infinite alternate ease-in-out;
        }
        .bulb-space-spin {
          background-color: #a855f7;
          animation: space-fast-spin 0.15s infinite;
        }
        @keyframes space-pulse {
          0% { box-shadow: 0 0 5px #38bdf8, 0 0 12px #a855f7; transform: scale(0.9); }
          100% { box-shadow: 0 0 15px #38bdf8, 0 0 25px #ec4899; transform: scale(1.2); }
        }
        @keyframes space-fast-spin {
          0% { box-shadow: 0 0 10px #06b6d4, 0 0 20px #ec4899; }
          50% { box-shadow: 0 0 20px #a855f7, 0 0 35px #38bdf8; }
          100% { box-shadow: 0 0 10px #06b6d4, 0 0 20px #ec4899; }
        }

        /* 2. إضاءة ثيم الكنز الخشبي القديم (Vintage Glow) */
        .bulb-gold-idle {
          background-color: #f59e0b;
          box-shadow: 0 0 8px #d97706, inset 0 0 4px #fef3c7;
        }

        /* 3. إضاءة ثيم الريترو (Retro Arcade Flicker) */
        .bulb-retro-idle {
          background-color: #00f0ff;
          animation: retro-flicker 1.2s infinite steps(2);
        }
        .bulb-retro-spin {
          background-color: #ff007f;
          animation: retro-hyper 0.1s infinite alternate;
        }
        @keyframes retro-flicker {
          0%, 100% { box-shadow: 0 0 8px #00f0ff, 0 0 15px #7000ff; opacity: 1; }
          50% { box-shadow: 0 0 2px #ff007f; opacity: 0.4; }
        }
        @keyframes retro-hyper {
          0% { box-shadow: 0 0 12px #ff007f, 0 0 25px #00f0ff; transform: scale(1); }
          100% { box-shadow: 0 0 20px #ffb700, 0 0 30px #00ff66; transform: scale(1.3); }
        }

        /* 4. إضاءة ثيم الكريستال والماس (Crystal Prism Glow) */
        .bulb-crystal-idle {
          background-color: #ffffff;
          animation: crystal-shimmer 2.5s infinite alternate;
        }
        .bulb-crystal-spin {
          background-color: #bae6fd;
          animation: crystal-spin-glow 0.2s infinite;
        }
        @keyframes crystal-shimmer {
          0% { box-shadow: 0 0 6px rgba(255, 255, 255, 0.8), 0 0 12px #38bdf8; opacity: 0.7; }
          100% { box-shadow: 0 0 12px #ffffff, 0 0 22px #f472b6; opacity: 1; }
        }
        @keyframes crystal-spin-glow {
          0% { box-shadow: 0 0 10px #38bdf8, 0 0 20px #f472b6; transform: scale(1); }
          100% { box-shadow: 0 0 18px #ffffff, 0 0 30px #c084fc; transform: scale(1.2); }
        }

        .wheel-center-3d {
          position: absolute;
          width: 102px;
          height: 102px;
          border-radius: 50%;
          z-index: 10;
          background: ${theme.center.background};
          box-shadow: ${theme.center.boxShadow};
          border: ${theme.center.border};
          animation: ${theme.center.hasPulse ? 'core-pulse 2s infinite alternate' : 'none'};
        }

        @keyframes core-pulse {
          0% { filter: brightness(1); }
          100% { filter: brightness(1.5); }
        }

        .wheel-stand {
          width: 192px;
          height: 204px;
          clip-path: polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%);
          margin-top: -90px; 
          transform: rotateX(10deg);
          z-index: 1;
          background: ${theme.stand.background};
          box-shadow: ${theme.stand.boxShadow};
        }
        
        /* 📍 المؤشر العلوي للعجلة (السهم المضيء) */
        .wheel-pointer {
          position: absolute;
          top: 05px;
          left: 50%;
          transform: translateX(-50%);
          width: 0; 
          height: 0; 
          border-left: 30px solid transparent;
          border-right: 30px solid transparent;
          border-top: 65px solid ${theme.pointer.baseColor};
          filter: ${theme.pointer.dropShadow};
          z-index: 35;
          animation: ${theme.pointer.hasBounce ? 'pointer-bounce 0.5s infinite alternate' : 'none'};
        }
        
        .wheel-pointer::after {
          content: '';
          position: absolute;
          top: -65px;
          left: -18px;
          width: 0; 
          height: 0; 
          border-left: 18px solid transparent;
          border-right: 18px solid transparent;
          border-top: 40px solid ${theme.pointer.topColor};
        }

        @keyframes pointer-bounce {
          0% { transform: translateX(-50%) translateY(0); }
          100% { transform: translateX(-50%) translateY(${isSpinning ? '-8px' : '0'}); }
        }

        .shockwave {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 15px solid #60a5fa;
          opacity: 0;
          z-index: 1;
          pointer-events: none;
          display: ${theme.effects.hasShockwave ? 'block' : 'none'};
        }
        .shockwave.explode {
          animation: shockwave-burst 1.2s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
        }
        @keyframes shockwave-burst {
          0% { width: 360px; height: 360px; opacity: 1; border-width: 25px; }
          100% { width: 900px; height: 900px; opacity: 0; border-width: 0px; }
        }

        /* 📍 1. دبابيس الفصل المعدنية 3D */
        .metallic-pin {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 40%, #475569 85%, #0f172a 100%);
          box-shadow: 0 2px 4px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.9);
          border: 1px solid #94a3b8;
          z-index: 8;
        }

        /* 📍 2. توهج الشريحة الفائزة */
        .winning-slice-glow {
          animation: winner-pulse 0.8s infinite alternate ease-in-out;
          color: #fef08a !important;
          text-shadow: 0 0 12px #eab308, 0 0 25px #ca8a04, 2px 2px 4px rgba(0,0,0,0.9) !important;
          font-scale: 1.2;
        }

        @keyframes winner-pulse {
          0% { transform: translate(-50%, -50%) rotate(var(--rot)) translateY(-132px) scale(1); }
          100% { transform: translate(-50%, -50%) rotate(var(--rot)) translateY(-132px) scale(1.3); }
        }

        /* 📍 3. عرض الفائز في المسمار المركزي */
        .center-winner-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: #fbbf24;
          font-weight: 900;
          font-size: 14px;
          text-align: center;
          padding: 4px;
          animation: pop-center 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes pop-center {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* 📍 4. قصاصات الاحتفال المتحركة */
        .confetti-particle {
          position: absolute;
          width: 10px;
          height: 14px;
          opacity: 0;
          pointer-events: none;
          z-index: 40;
          animation: confetti-fall 2.5s ease-out forwards;
        }

        @keyframes confetti-fall {
          0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(720deg); }
        }

        /* 📍 5. شريط التبديل السريع للثيمات */
        .theme-switcher-bar {
          display: flex;
          gap: 10px;
          background: rgba(15, 23, 42, 0.75);
          padding: 8px 16px;
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          margin-bottom: 15px;
          z-index: 20;
        }
        .theme-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 14px;
          font-weight: bold;
          padding: 6px 12px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .theme-btn.active {
          background: #3b82f6;
          color: #ffffff;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
        }
      `}</style>
      
      <div className="wheel-scene">
        <div className="wheel-3d-container">
          <div className="wheel-pointer"></div>
          
          <div className="wheel-outer-ring">
            
            <div className={`shockwave ${showResult ? 'explode' : ''}`}></div>

            {/* 📍 قصاصات الاحتفال المتحركة عند توقف العجلة */}
            {confettiActive && Array.from({ length: 30 }).map((_, i) => {
              const angle = (360 / 30) * i;
              const distance = 140 + (i % 5) * 35;
              const dx = Math.cos((angle * Math.PI) / 180) * distance;
              const dy = Math.sin((angle * Math.PI) / 180) * distance;
              const confettiColors = ['#fbbf24', '#ec4899', '#3b82f6', '#10b981', '#a855f7', '#ef4444'];
              return (
                <div 
                  key={`confetti-${i}`}
                  className="confetti-particle"
                  style={{
                    top: '50%',
                    left: '50%',
                    backgroundColor: confettiColors[i % confettiColors.length],
                    borderRadius: i % 2 === 0 ? '50%' : '2px',
                    '--dx': `${dx}px`,
                    '--dy': `${dy}px`,
                    animationDelay: `${(i % 5) * 0.08}s`
                  } as React.CSSProperties}
                />
              );
            })}

            {/* رسم لمبات النيون بناءً على العدد المحدد في الثيم */}
            {Array.from({ length: theme.neon.count || 0 }).map((_, i) => {
              const angle = (360 / (theme.neon.count || 1)) * i;
              return (
                <div 
                  key={`bulb-${i}`}
                  className={`neon-bulb ${isSpinning ? (theme.neon.spinClass || 'bulb-spin') : (theme.neon.idleClass || 'bulb-idle')}`}
                  style={{
                    top: 'calc(50% - 7px)',
                    left: 'calc(50% - 7px)',
                    transform: `rotate(${angle}deg) translateY(-234px)`,
                    animationDelay: isSpinning ? `${(i % 3) * 0.05}s` : `${(i % 4) * 0.25}s`
                  }}
                />
              );
            })}

            <div className="wheel-circle-container">
              {/* القبة الزجاجية تظهر بناءً على الثيم */}
              <div className="glass-dome"></div>

              {/* 📍 دبابيس الفصل المعدنية 3D بين الشرائح */}
              {items.map((_, i) => {
                const pinAngle = (360 / items.length) * i;
                return (
                  <div 
                    key={`pin-${i}`}
                    className="metallic-pin"
                    style={{
                      top: 'calc(50% - 6px)',
                      left: 'calc(50% - 6px)',
                      transform: `rotate(${pinAngle}deg) translateY(-205px)`
                    }}
                  />
                );
              })}
              
              <div 
                className="wheel-circle"
                style={{ 
                  background: generateGradient(), 
                  transform: `rotate(${rotationAngle}deg)`,
                  transition: `transform ${uiSpinDuration}ms cubic-bezier(0.1, 0.9, 0.1, 1)`
                }}
              >
                {items.map((item, index) => {
                  const rotation = (360 / items.length) * index + (360 / items.length) / 2;
                  const isWinner = showResult && winningItem?.id === item.id;
                  // فحص بسيط: إذا كان العنصر يحتوي على 'type' أو إذا كان زر السحب يحتوي على كلمة 'سؤال'
                  const isQuestion = 'type' in item || (spinButtonText && spinButtonText.includes('سؤال'));
                  
                  return (
                    <div 
                      key={item.id} 
                      className={isWinner ? 'winning-slice-glow' : ''}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${rotation}deg) translateY(-132px)`,
                        color: '#fff',
                        fontWeight: '900',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)',
                        whiteSpace: 'nowrap',
                        fontSize: '24px', // تم تكبير الخط قليلاً لأن الأرقام أوضح
                        zIndex: 5,
                        '--rot': `${rotation}deg`
                      } as React.CSSProperties}
                    >
                      {isQuestion ? `س${index + 1}` : index + 1}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* 📍 المسمار المركزي 3D وعرض اسم الطالب الفائز بوضوح */}
            <div className="wheel-center-3d">
              {showResult && winningItem && (
                <div className="center-winner-display">
                  <span>🏆</span>
                  <span style={{ fontSize: '16px', lineHeight: '1.2', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {('type' in winningItem || (spinButtonText && spinButtonText.includes('سؤال'))) 
                      ? `س${items.findIndex(i => i.id === winningItem.id) + 1}` 
                      : items.findIndex(i => i.id === winningItem.id) + 1}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="wheel-stand"></div>
        </div>
      </div>
      
      <div className="wheel-controls" style={{ zIndex: 10, marginTop: '20px' }}>
        <Button 
          size="lg" 
          onClick={handleSpin} 
          disabled={isSpinning || items.length === 0}
        >
          {isSpinning ? spinningText : spinButtonText}
        </Button>
      </div>
    </div>
  );
};