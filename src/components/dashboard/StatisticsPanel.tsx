import React from 'react';
import { useStatistics } from '../../application/hooks/useStatistics';
import '../../styles/dashboard.css';

export const StatisticsPanel: React.FC = () => {
  const { stats } = useStatistics();

  if (!stats) return <div className="statistics-panel">No stats available.</div>;

  // دالة مساعدة لتحويل camelCase و PascalCase إلى كلمات منفصلة ومقروءة
  const formatLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1') // إضافة مسافة قبل أي حرف كبير
      .replace(/^./, str => str.toUpperCase()) // تكبير الحرف الأول دائماً
      .trim(); // إزالة أي مسافات زائدة
  };

  return (
    <div className="statistics-panel">
      <h3>Session Statistics</h3>
      <ul className="stats-list">
        {Object.entries(stats).map(([key, value]) => (
          <li key={key}>
            <span className="stat-key">{formatLabel(key)}</span>
            <strong className="stat-value">{String(value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
};