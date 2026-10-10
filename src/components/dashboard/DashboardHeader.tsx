import React from 'react';
import { Button } from '../common/Button';

// 🌟 1. إضافة واجهة (Interface) لاستقبال الخصائص من الصفحة الرئيسية (DashboardPage)
interface DashboardHeaderProps {
  onShowLeaderboard?: () => void;
  onEndSession?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onShowLeaderboard, 
}) => {

  return (
    <header className="dashboard-header">
      <div className="header-info">
        <h1>MusiTeacher Randomizer</h1>
        <span className="session-status">Live Session</span>
      </div>
      
      {/* 🌟 3. إضافة مسافة (gap) لترتيب الأزرار بشكل أنيق */}
      <div className="header-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        
        {/* زر لوحة الشرف (أضفناه في الهيدر كخيار سريع للمعلم إذا أراد استعراض النقاط أثناء اللعب) */}
        {onShowLeaderboard && (
          <Button variant="primary" onClick={onShowLeaderboard} style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none' }}>
            🏆 لوحة الشرف
          </Button>
        )}
      </div>
    </header>
  );
};