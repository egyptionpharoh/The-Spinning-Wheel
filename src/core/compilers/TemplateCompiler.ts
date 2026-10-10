import { Template, Session, Question, BaseItem } from '../types/core';

/**
 * Game Engine: Template Compiler
 * المسؤول عن تحويل قالب اللعبة (وقت التصميم) إلى جلسة تشغيل (وقت التشغيل).
 * لا يقوم الـ Game Runner بقراءة القالب أبداً، بل يقرأ الجلسة الناتجة من هذا المترجم.
 */
export class TemplateCompiler {
  
  /**
   * ترجمة القالب إلى جلسة تشغيلية.
   * @param template القالب المصمم بواسطة المعلم
   * @param questionLibrary واجهة لجلب الأسئلة الحقيقية من المكتبة بواسطة الـ IDs
   */
  public static compile(
    template: Template, 
    questionLibrary: Map<string, Question>
  ): Session {
    
    // 1. تجهيز المشاركين (استبعاد الغياب، ترتيب الفرق)
    const activeItems: BaseItem[] = template.participants.filter(p => p.presence === 'IN_WHEEL');
    
    // 2. تجميع الأسئلة (جلب تفاصيل السؤال من المكتبة ودمجها مع قواعد الربط في القالب)
    const compiledQuestions = template.questionRefs.map(ref => {
      const actualQuestion = questionLibrary.get(ref.questionId);
      
      if (!actualQuestion) {
        throw new Error(`Question with ID ${ref.questionId} not found in library.`);
      }

      return {
        question: actualQuestion,
        assignmentRule: ref.assignmentRule,
        // الأولوية لوقت السؤال المخصص داخل القالب، ثم وقت السؤال الأصلي، ثم وقت الجلسة الافتراضي
        effectiveTimer: ref.overrideTimerSec || actualQuestion.timerSec || template.settings.questionTimeLimitSec || 30
      };
    });

    // 3. بناء الجلسة التشغيلية (Runtime Copy)
    const session: Session = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      templateId: template.id,
      runDate: Date.now(),
      status: 'READY',
      activeItems,
      compiledQuestions
    };

    return session;
  }
}