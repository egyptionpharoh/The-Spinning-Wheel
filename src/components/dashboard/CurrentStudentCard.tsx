import React from 'react';
import { BaseItem } from '../../core/types/core';
import '../../styles/dashboard.css';

interface CurrentStudentCardProps {
  student: BaseItem | null;
  toastItem: BaseItem | null;
  isToastVisible: boolean;
  currentQuestion: any | null; // يفضل استبدال any بـ Question إذا كان النوع متاحاً
}

export const CurrentStudentCard: React.FC<CurrentStudentCardProps> = ({
  student,
  toastItem,
  isToastVisible,
  currentQuestion
}) => {
  // 1. مرحلة الإشعار (Toast Phase)
  if (isToastVisible && toastItem) {
    return (
      <div className="toast-container active">
        <div className="toast-icon">🎉</div>
        <div className="toast-message">تم اختيار الطالب</div>
        <div className="toast-student-id">رقم {toastItem.id}</div>
        <div className="toast-student-name">{toastItem.displayId}</div>
      </div>
    );
  }

  // حماية إضافية في حال عدم وجود طالب
  if (!student) return null;

  // 2. مرحلة الإجابة (Answering Phase - Question Display)
  if (currentQuestion) {
    return (
      <div className="student-card active" style={{ padding: '30px', textAlign: 'center', background: '#fdfbfb' }}>
        <span className="card-label">الطالب: {student.displayId}</span>
        <div className="question-container" style={{ margin: '20px 0' }}>
          <span style={{ display: 'inline-block', background: '#ffeaa7', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', marginBottom: '10px' }}>
            مستوى الصعوبة: {currentQuestion.difficulty}
          </span>
          <h2 style={{ fontSize: '24px', color: '#2d3436', lineHeight: '1.5' }}>
            {currentQuestion.text}
          </h2>
        </div>
      </div>
    );
  }

  // 3. مرحلة التقييم المباشر (بدون سؤال)
  return (
    <div className="student-card active">
      <span className="card-label">الطالب الحالي</span>
      <h2 className="student-name">{student.displayId}</h2>
      <div className="student-details" style={{ margin: '10px 0', fontSize: '14px', color: '#666' }}>
        <span>ID: {student.id}</span>
      </div>
      <span className={`status-badge ${student.lastOutcome?.toLowerCase() || 'none'}`}>
        {student.lastOutcome === 'NONE' ? 'قيد الانتظار' : student.lastOutcome}
      </span>
    </div>
  );
};