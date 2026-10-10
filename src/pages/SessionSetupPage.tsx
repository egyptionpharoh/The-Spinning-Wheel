import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QuestionBuilder } from '../components/setup/QuestionBuilder';
import { Button } from '../components/common/Button';
import { SessionSettings, BaseItem, Question, Template, TemplateQuestionRef } from '../core/types/core';
import '../styles/session-setup.css';
import '../styles/forms.css';
import '../styles/buttons.css';

type TabType = 'IDENTITY' | 'PARTICIPANTS' | 'QUESTIONS';

export const SessionSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlTemplateId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState<TabType>('IDENTITY');

  const [sessionName, setSessionName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [className, setClassName] = useState('');
  const [studentsInput, setStudentsInput] = useState('');
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [settings, setSettings] = useState<SessionSettings | any>({
    autoRemoveOnPass: true,
    allowRepeat: false,
    themeVariant: 'vintage',
    enableQuestions: true,
    enableLifelines: true,
    gameMode: 'WHEEL'
  });

  const [errors, setErrors] = useState<{ sessionName?: string; students?: string; questions?: string }>({});

  const [templateId, setTemplateId] = useState<string>(() => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9));
  const [originalCreatedAt, setOriginalCreatedAt] = useState<number>(Date.now());
  const [existingParticipants, setExistingParticipants] = useState<BaseItem[]>([]);
  
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedTemplatesList, setSavedTemplatesList] = useState<Template[]>([]);

  // دالة ذكية لقراءة الملفات النصية وملفات CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setStudentsInput(prev => prev ? prev + '\n' + text : text);
        if (errors.students) setErrors({ ...errors, students: undefined });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // تحميل القالب والأسئلة عند التمرير
  useEffect(() => {
    if (urlTemplateId) {
      try {
        const existingTemplates = JSON.parse(localStorage.getItem('edu_templates') || '[]');
        const savedTemplate = existingTemplates.find((t: Template) => t.id === urlTemplateId);
        
        if (savedTemplate) {
          setTemplateId(savedTemplate.id);
          setSessionName(savedTemplate.name);
          setClassName(savedTemplate.classId || '');
          
          const teacherMatch = savedTemplate.description?.match(/أعد بواسطة: (.*)/);
          if (teacherMatch) setTeacherName(teacherMatch[1]);

          setSettings({ ...{ autoRemoveOnPass: true, allowRepeat: false, themeVariant: 'system', enableQuestions: true, enableLifelines: true, gameMode: 'WHEEL' }, ...(savedTemplate.settings || {}) });
          setExistingParticipants(savedTemplate.participants || []);
          setOriginalCreatedAt(savedTemplate.createdAt || Date.now());
          
          const studentsText = (savedTemplate.participants || []).map((p: BaseItem) => p.displayId).join('\n');
          setStudentsInput(studentsText);

          if (savedTemplate.questionRefs && savedTemplate.questionRefs.length > 0) {
            const allQuestions = JSON.parse(localStorage.getItem('edu_questions') || '[]');
            const templateQuestions = allQuestions.filter((q: Question) => 
              savedTemplate.questionRefs.some((ref: TemplateQuestionRef) => ref.questionId === q.id)
            );
            setQuestions(templateQuestions);
          }
        }
      } catch (e) {
        console.error("Failed to load template", e);
      }
    }
  }, [urlTemplateId]);

  const buildTemplate = (): Template | null => {
    const newErrors: { sessionName?: string; students?: string; questions?: string } = {};
    
    if (!sessionName.trim()) {
      newErrors.sessionName = 'يرجى إدخال اسم النشاط أو القالب.';
      setActiveTab('IDENTITY');
    }

    const rawNames = studentsInput.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    
    if (rawNames.length === 0) {
      newErrors.students = 'يرجى إضافة طالب واحد على الأقل.';
      if (!newErrors.sessionName) setActiveTab('PARTICIPANTS');
    }

    if (settings.enableQuestions && questions.length === 0) {
      newErrors.questions = 'يرجى إضافة سؤال واحد على الأقل لبدء المسابقة.';
      if (!newErrors.sessionName && !newErrors.students) setActiveTab('QUESTIONS');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return null;
    }

    const initialItems: BaseItem[] = rawNames.map((name) => {
      const existingStudent = existingParticipants.find(p => p.displayId === name);
      return {
        id: existingStudent ? existingStudent.id : (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)),
        displayId: name,
        presence: existingStudent ? existingStudent.presence : 'IN_WHEEL',
        lastOutcome: existingStudent ? existingStudent.lastOutcome : 'NONE',
        weight: existingStudent ? existingStudent.weight : 1
      };
    });

    const questionRefs: TemplateQuestionRef[] = questions.map(q => ({
    questionId: q.id,
    assignmentRule: 'ALL' as any
}));

    const newTemplate: Template = {
      id: templateId,
      name: sessionName,
      description: teacherName ? `أعد بواسطة: ${teacherName}` : '',
      classId: className,
      participantsMode: 'INDIVIDUAL',
      participants: initialItems,
      questionRefs: questionRefs,
      settings: settings,
      createdAt: originalCreatedAt,
      updatedAt: Date.now()
    };

    return newTemplate;
  };

  const saveTemplate = (template: Template) => {
    try {
      const existingTemplates = JSON.parse(localStorage.getItem('edu_templates') || '[]');
      const filtered = existingTemplates.filter((t: Template) => t.id !== template.id);
      const updatedTemplates = [...filtered, template];
      localStorage.setItem('edu_templates', JSON.stringify(updatedTemplates));

      if (questions.length > 0 || template.id === 'temp_run_session') {
        const existingQuestions = JSON.parse(localStorage.getItem('edu_questions') || '[]');
        const updatedQuestions = [...existingQuestions];
        
        questions.forEach(newQ => {
          const index = updatedQuestions.findIndex((q: Question) => q.id === newQ.id);
          if (index >= 0) updatedQuestions[index] = newQ;
          else updatedQuestions.push(newQ);
        });
        
        // --- مكنسة الذاكرة التلقائية ---
        // في كل مرة تحفظ فيها أو تشغل اللعبة، سيتم مسح أي صور وأسئلة غير مرتبطة بقوالبك المحفوظة فوراً
        const usedQuestionIds = new Set<string>();
        updatedTemplates.forEach((tpl: Template) => {
          if (tpl.questionRefs) {
            tpl.questionRefs.forEach((ref: any) => usedQuestionIds.add(ref.questionId));
          }
        });
        
        const finalQuestions = updatedQuestions.filter((q: Question) => usedQuestionIds.has(q.id));
        localStorage.setItem('edu_questions', JSON.stringify(finalQuestions));
      }
    } catch (e) {
      console.error("Failed to save template to hub", e);
    }
  };

  const handleSaveOnly = () => {
    const template = buildTemplate();
    if (template) {
      saveTemplate(template);
      alert('تم حفظ القالب والأسئلة بنجاح!'); 
    }
  };

  const handleRunOnly = () => {
    // 🌟 1. تكبير الشاشة تلقائياً فور ضغطة المعلم
    try {
      const elem = document.documentElement as any;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }

      // 🎵 2. فك حظر نظام الصوت بالمتصفح أثناء هذه الضغطة المباشرة
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      }
    } catch (e) {
      console.error("Fullscreen or Audio unlock failed", e);
    }

    const template = buildTemplate();
    if (template) {
      // إعطاء القالب مُعرّفاً مؤقتاً حتى لا يتم حفظه بشكل دائم في القائمة
      const tempRunTemplate = { ...template, id: 'temp_run_session' };
      saveTemplate(tempRunTemplate);
      navigate(`/dashboard?templateId=${tempRunTemplate.id}`);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setTemplateId(template.id);
    setSessionName(template.name);
    setClassName(template.classId || '');
    const teacherMatch = template.description?.match(/أعد بواسطة: (.*)/);
    setTeacherName(teacherMatch ? teacherMatch[1] : '');
    setSettings({ ...{ autoRemoveOnPass: true, allowRepeat: false, themeVariant: 'system', enableQuestions: true, enableLifelines: true, gameMode: 'WHEEL' }, ...(template.settings || {}) });
    setExistingParticipants(template.participants || []);
    setOriginalCreatedAt(template.createdAt || Date.now());
    setStudentsInput((template.participants || []).map(p => p.displayId).join('\n'));

    if (template.questionRefs && template.questionRefs.length > 0) {
      const allQuestions = JSON.parse(localStorage.getItem('edu_questions') || '[]');
      const templateQuestions = allQuestions.filter((q: Question) => 
        template.questionRefs.some((ref: TemplateQuestionRef) => ref.questionId === q.id)
      );
      setQuestions(templateQuestions);
    } else {
      setQuestions([]);
    }
    setShowLoadModal(false);
  };

  const handleDeleteSavedTemplate = (idToDelete: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // تم إزالة نافذة التأكيد (confirm) لأنها تسبب تجميد الزر في بعض المتصفحات
    const updatedTemplates = savedTemplatesList.filter(t => t.id !== idToDelete);
    setSavedTemplatesList(updatedTemplates);
    localStorage.setItem('edu_templates', JSON.stringify(updatedTemplates));

    try {
      const allQuestions = JSON.parse(localStorage.getItem('edu_questions') || '[]');
      const usedQuestionIds = new Set<string>();
      
      updatedTemplates.forEach((tpl: Template) => {
        if (tpl.questionRefs) {
          tpl.questionRefs.forEach((ref: any) => usedQuestionIds.add(ref.questionId));
        }
      });

      const filteredQuestions = allQuestions.filter((q: Question) => usedQuestionIds.has(q.id));
      localStorage.setItem('edu_questions', JSON.stringify(filteredQuestions));
    } catch (error) {
      console.error("Failed to clean up orphaned questions", error);
    }
  };

  const currentStudents = studentsInput
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(name => {
      const existing = existingParticipants.find(p => p.displayId === name);
      const studentId = existing ? existing.id : name;
      return {
        id: studentId,
        displayId: name,
        name: name,
        text: name
      };
    });

  const renderTabButton = (id: TabType, icon: string, label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
        padding: '12px 16px', border: activeTab === id ? '2px solid #8b6508' : '1px solid #d4af37', 
        borderRadius: '8px', cursor: 'pointer',
        textAlign: 'right', fontSize: '1rem', fontWeight: activeTab === id ? 'bold' : '500',
        backgroundColor: activeTab === id ? '#8b0000' : 'rgba(255, 248, 220, 0.6)',
        color: activeTab === id ? '#fff8dc' : '#3e2723',
        transition: 'all 0.2s ease',
        boxShadow: activeTab === id ? '0 4px 10px rgba(139, 0, 0, 0.4)' : 'none'
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxHeight: '100vh',
      backgroundColor: '#2e1d0f',
      direction: 'rtl',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      
      {/* الحاوية الرئيسية المحبوكة لمنع التكبير والتصغير المزعج */}
      <div style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '20px',
        gap: '20px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        
        {/* الشريط الجانبي الثابت */}
        <div style={{
          width: '270px',
          minWidth: '270px',
          backgroundColor: '#fff8dc',
          border: '2px solid #b8860b',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}>
          <div>
            {/* ترويسة القائمة الجانبية */}
            <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px dashed #b8860b' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#3e2723', fontWeight: 'bold' }}>🧭 إعدادات عامة</h2>
            </div>

            {/* أزرار التبويبات */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {renderTabButton('IDENTITY', '📜', 'البيانات الأساسية')}
              {renderTabButton('PARTICIPANTS', '🏴‍☠️', 'تسجيل المتسابقون')}
              {settings.enableQuestions && renderTabButton('QUESTIONS', '💎', 'إعداد الاسئلة')}
            </div>
          </div>

          {/* زر الاسترداد وأزرار العمليات الرئيسية مثبتة بالأسفل */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '15px', borderTop: '2px dashed #b8860b' }}>
            <button
              onClick={() => {
                const existing = localStorage.getItem('edu_templates');
                const parsed = existing ? JSON.parse(existing) : [];
                // إخفاء القالب المؤقت الخاص بالانطلاق السريع من القائمة
                const validTemplates = parsed.filter((t: Template) => t.id !== 'temp_run_session');
                setSavedTemplatesList(validTemplates);
                setShowLoadModal(true);
              }}
              style={{
                width: '100%', padding: '10px', backgroundColor: '#fff3cd', color: '#3e2723',
                border: '1px solid #b8860b', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              🗺️ استرداد القوالب المحفوظة
            </button>

            <button
              onClick={handleSaveOnly}
              style={{
                width: '100%', padding: '12px', backgroundColor: '#b8860b', color: '#fff8dc',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
                transition: 'background 0.2s', boxShadow: '0 4px 0 #8b6508'
              }}
            >
              💾 حفظ القالب
            </button>

            <button
              onClick={handleRunOnly}
              style={{
                width: '100%', padding: '12px', backgroundColor: '#8b0000', color: '#fff8dc',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem',
                boxShadow: '0 4px 0 #5c0000'
              }}
            >
              🏴‍☠️ انطلاق المغامرة الآن
            </button>
          </div>
        </div>

        {/* المساحة الرئيسية المتغيرة (محتوى التبويب) */}
        <div style={{
          flex: 1,
          backgroundColor: '#fff8dc',
          border: '2px solid #b8860b',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}>

          {/* التبويب الأول: البيانات الأساسية */}
          {activeTab === 'IDENTITY' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* اللوجو واسم اللعبة المخصص لثيم الكنز والمغامرة */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '35px', userSelect: 'none' }}>
                <style>
                  {`
                    @keyframes slowSpin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  `}
                </style>
                <div style={{ display: 'inline-block', animation: 'slowSpin 25s linear infinite', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="110" height="110">
                    <defs>
                      <radialGradient id="wood" cx="50%" cy="50%" r="50%">
                        <stop offset="70%" stopColor="#8b5a2b"/>
                        <stop offset="100%" stopColor="#5c3a21"/>
                      </radialGradient>
                      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffd700"/>
                        <stop offset="50%" stopColor="#daa520"/>
                        <stop offset="100%" stopColor="#b8860b"/>
                      </linearGradient>
                      <linearGradient id="ruby" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e74c3c"/>
                        <stop offset="100%" stopColor="#8b0000"/>
                      </linearGradient>
                      <linearGradient id="emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2ecc71"/>
                        <stop offset="100%" stopColor="#006400"/>
                      </linearGradient>
                      <linearGradient id="sapphire" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3498db"/>
                        <stop offset="100%" stopColor="#00008b"/>
                      </linearGradient>
                      <linearGradient id="topaz" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f1c40f"/>
                        <stop offset="100%" stopColor="#b8860b"/>
                      </linearGradient>
                    </defs>
                    <g>
                      {/* مقابض دريكسيون السفينة */}
                      <line x1="60" y1="4" x2="60" y2="116" stroke="url(#wood)" strokeWidth="8" strokeLinecap="round"/>
                      <line x1="4" y1="60" x2="116" y2="60" stroke="url(#wood)" strokeWidth="8" strokeLinecap="round"/>
                      <line x1="20" y1="20" x2="100" y2="100" stroke="url(#wood)" strokeWidth="8" strokeLinecap="round"/>
                      <line x1="20" y1="100" x2="100" y2="20" stroke="url(#wood)" strokeWidth="8" strokeLinecap="round"/>
                      
                      {/* الإطار الخشبي الخارجي للسفينة */}
                      <circle cx="60" cy="60" r="46" fill="#3e2723" stroke="url(#wood)" strokeWidth="12" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke="url(#gold)" strokeWidth="2" />
                      <circle cx="60" cy="60" r="40" fill="none" stroke="url(#gold)" strokeWidth="2" />

                      {/* أجزاء عجلة الحظ الداخلية كأنها أحجار كريمة */}
                      <path d="M60,60 L60,20 A40,40 0 0,1 100,60 Z" fill="url(#ruby)"/>
                      <path d="M60,60 L100,60 A40,40 0 0,1 60,100 Z" fill="url(#topaz)"/>
                      <path d="M60,60 L60,100 A40,40 0 0,1 20,60 Z" fill="url(#emerald)"/>
                      <path d="M60,60 L20,60 A40,40 0 0,1 60,20 Z" fill="url(#sapphire)"/>
                      
                      {/* الفواصل الذهبية */}
                      <line x1="20" y1="60" x2="100" y2="60" stroke="url(#gold)" strokeWidth="3"/>
                      <line x1="60" y1="20" x2="60" y2="100" stroke="url(#gold)" strokeWidth="3"/>

                      {/* قلب العجلة الذهبي البارز */}
                      <circle cx="60" cy="60" r="14" fill="url(#gold)" stroke="#5c3a21" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"/>
                      <circle cx="60" cy="60" r="5" fill="#3e2723" />
                      
                      {/* مسامير التثبيت النحاسية على الإطار الخشبي */}
                      <circle cx="60" cy="14" r="2.5" fill="url(#gold)"/>
                      <circle cx="106" cy="60" r="2.5" fill="url(#gold)"/>
                      <circle cx="60" cy="106" r="2.5" fill="url(#gold)"/>
                      <circle cx="14" cy="60" r="2.5" fill="url(#gold)"/>
                      <circle cx="27.5" cy="27.5" r="2.5" fill="url(#gold)"/>
                      <circle cx="92.5" cy="27.5" r="2.5" fill="url(#gold)"/>
                      <circle cx="92.5" cy="92.5" r="2.5" fill="url(#gold)"/>
                      <circle cx="27.5" cy="92.5" r="2.5" fill="url(#gold)"/>
                    </g>
                  </svg>
                </div>
                <h1 style={{ 
                  fontSize: '2.8rem', 
                  color: '#b8860b', 
                  margin: '10px 0 5px 0', 
                  fontFamily: '"Tajawal", "Cairo", system-ui, sans-serif', 
                  fontWeight: '900', 
                  textShadow: '2px 2px 0px #3e2723, 4px 4px 0px rgba(184, 134, 11, 0.4)', 
                  letterSpacing: '1px' 
                }}>
                  العجلة الدوارة الذكية
                </h1>
                <p style={{ color: '#3e2723', fontSize: '1.1rem', margin: '0', fontWeight: 'bold' }}>
                 أول لعبة تعليمية ذكية تعتمد على الاختيار العشوائي للمتسابقون والأسئلة 🏴‍☠️✨
                </p>
              </div>

              <div style={{ borderBottom: '2px dashed #b8860b', paddingBottom: '12px', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: '#3e2723', fontSize: '1.5rem' }}>📜يرجى تعبئة الحقول التالية للعبة التعليمية</h2>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 'bold', color: '#3e2723', marginBottom: '8px', display: 'block' }}>عنوان الدرس *</label>
                  <input 
                    type="text" className="form-input" 
                    placeholder="مثال: رحلة البحث عن الموازين الموسيقية"
                    value={sessionName} 
                    onChange={(e) => { setSessionName(e.target.value); if (errors.sessionName) setErrors({ ...errors, sessionName: undefined }); }}
                    style={{ width: '100%', padding: '14px', fontSize: '1.1rem', backgroundColor: 'rgba(255, 248, 220, 0.9)', color: '#3e2723', border: '2px solid #8b6508', borderRadius: '8px' }}
                  />
                  {errors.sessionName && <p className="form-error" style={{ color: '#b22222', marginTop: '6px', fontWeight: 'bold' }}>{errors.sessionName}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#3e2723', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>اسم المعلم/ة</label>
                    <input type="text" className="form-input" placeholder="مثال: القبطان د. حسين" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(255, 248, 220, 0.9)', color: '#3e2723', border: '2px solid #8b6508', borderRadius: '8px' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#3e2723', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>الصف</label>
                    <input type="text" className="form-input" placeholder="مثال: فرسان الصف السابع (أ)" value={className} onChange={(e) => setClassName(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(255, 248, 220, 0.9)', color: '#3e2723', border: '2px solid #8b6508', borderRadius: '8px' }} />
                  </div>
                </div>

                {/* خيارات سريعة للإعدادات */}
                <div style={{ backgroundColor: 'rgba(184, 134, 11, 0.1)', padding: '18px', borderRadius: '10px', marginTop: '10px', border: '1px solid #b8860b' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#3e2723' }}>⚙️ إعدادات العجلة الدوارة</h4>
                  
                  {/* إضافة قائمة اختيار ثيم العجلة */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px dashed #b8860b' }}>
                    <label style={{ fontWeight: 'bold', color: '#3e2723', fontSize: '1.05rem' }}>🎨 اختر الشكل المناسب للعجلة الدوارة</label>
                    <select
                      value={settings.themeVariant || 'vintage'}
                      onChange={(e) => setSettings({ ...settings, themeVariant: e.target.value })}
                      style={{ 
                        flex: 1, 
                        padding: '10px', 
                        borderRadius: '8px', 
                        border: '2px solid #8b6508', 
                        backgroundColor: '#fff8dc',
                        color: '#3e2723',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="vintage">📜 الكنز القديم (Vintage Wood)</option>
                      <option value="gold">🏆 الأسطول الذهبي (Gold Fleet)</option>
                      <option value="ocean">🌊 المحيط الهادئ (Pacific Ocean)</option>
                      <option value="cyber">🤖 السيبراني المضيء (Cyber Neon)</option>
                      <option value="nature">🌿 خريطة الغابة (Jungle Map)</option>
                      <option value="sunset">🌅 جزيرة الغروب (Sunset Island)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#3e2723', fontWeight: '500' }}>
                      <input 
                        type="checkbox" 
                        checked={settings.autoRemoveOnPass} 
                        onChange={(e) => setSettings({ ...settings, autoRemoveOnPass: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#8b0000' }}
                      />
                     إخفاء اسم المتسابق  من العجلة بعد اجابته لعدم تكراره  (يفضل تركه كما هو)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#3e2723', fontWeight: '500' }}>
                      <input 
                        type="checkbox" 
                        checked={settings.enableQuestions} 
                        onChange={(e) => setSettings({ ...settings, enableQuestions: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#8b0000' }}
                      />
                     تفعيل الوسائل المساعدة للمتسابق مثل حذف اجابتين & الاستعانة بصديق
                    </label>

                    {settings.enableQuestions && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#8b0000', fontWeight: 'bold', paddingRight: '25px', animation: 'fadeIn 0.3s ease-in' }}>
                        <input 
                          type="checkbox" 
                          checked={settings.enableLifelines !== false} 
                          onChange={(e) => setSettings({ ...settings, enableLifelines: e.target.checked })}
                          style={{ width: '18px', height: '18px', accentColor: '#8b0000' }}
                        />
                        💡 يتم خصم نقاط من المتسابق نتيجة استخدام هذا الاختيار
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', borderTop: '2px dashed #b8860b', paddingTop: '16px' }}>
                <Button size="lg" onClick={() => setActiveTab('PARTICIPANTS')} style={{ backgroundColor: '#8b0000', color: '#fff8dc', padding: '12px 28px', fontSize: '1.05rem', borderRadius: '8px', border: '1px solid #5c0000' }}>
                                   الخطوة التالية: تسجيل المتسابقون ⬅️

                </Button>
              </div>
            </div>
          )}

          {/* التبويب الثاني: إدارة المشاركين */}
          {activeTab === 'PARTICIPANTS' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ borderBottom: '2px dashed #b8860b', paddingBottom: '12px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#3e2723', fontSize: '1.5rem' }}>🏴‍☠️ اسماء  المتسابقون</h2>
                <p style={{ margin: '4px 0 0 0', color: '#5c0000', fontSize: '0.95rem' }}>يرجى كتابة أو إدراج قائمة بأسماء المتسابقون (كل اسم في سطر جديد)</p>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.95rem', color: '#3e2723', fontWeight: 'bold' }}>يمكنك النسخ واللصق مباشرة من  قائمة المتسابقون:</span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', backgroundColor: '#b8860b', color: '#fff8dc', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 0 #8b6508' }}>
                    <span>📜 إدراج  القائمة (.txt, .csv)</span>
                    <input type="file" accept=".txt,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />
                  </label>
                </div>

                <textarea 
                  value={studentsInput}
                  onChange={(e) => { setStudentsInput(e.target.value); if (errors.students) setErrors({ ...errors, students: undefined }); }}
                  onFocus={() => setIsTextareaFocused(true)}
                  onBlur={() => setIsTextareaFocused(false)}
                  placeholder="أحمد&#10;محمد&#10;فاطمة..."
                  style={{ 
                    flex: 1,
                    minHeight: '260px',
                    width: '100%', 
                    padding: '24px', 
                    fontSize: '1.25rem', 
                    color: '#3e2723', 
                    fontFamily: '"Cairo", "Amiri", system-ui, sans-serif',
                    fontWeight: '700',
                    lineHeight: '2.2',
                    backgroundColor: isTextareaFocused ? '#ffffff' : 'rgba(255, 248, 220, 0.85)',
                    border: isTextareaFocused ? '2px solid #8b0000' : '2px solid #8b6508',
                    borderRadius: '8px',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    boxShadow: isTextareaFocused 
                      ? '0 0 20px rgba(139, 0, 0, 0.3)' 
                      : 'inset 0 2px 5px rgba(0,0,0,0.1)',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
                {errors.students && <p style={{ color: '#b22222', marginTop: '8px', fontWeight: 'bold' }}>{errors.students}</p>}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed #b8860b', paddingTop: '16px' }}>
                <Button onClick={() => setActiveTab('IDENTITY')} style={{ backgroundColor: '#8b6508', color: '#fff8dc', padding: '10px 20px', borderRadius: '8px' }}>
                  ➡️ السابق
                </Button>
                {settings.enableQuestions ? (
                  <Button onClick={() => setActiveTab('QUESTIONS')} style={{ backgroundColor: '#8b0000', color: '#fff8dc', padding: '12px 28px', fontSize: '1.05rem', borderRadius: '8px', border: '1px solid #5c0000' }}>
                    الخطوة التالية: إعداد الاسئلة⬅️
                  </Button>
                ) : (
                  <Button onClick={handleRunOnly} style={{ backgroundColor: '#8b0000', color: '#fff8dc', padding: '12px 28px', fontSize: '1.05rem', borderRadius: '8px', boxShadow: '0 4px 0 #5c0000' }}>
                    🏴‍☠️ انطلاق المغامرة الآن
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* التبويب الثالث: ألغاز الكنز والأسئلة */}
          {activeTab === 'QUESTIONS' && settings.enableQuestions && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ borderBottom: '2px dashed #b8860b', paddingBottom: '12px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#3e2723', fontSize: '1.5rem' }}>💎 إعدادات الاسئلة</h2>
                <p style={{ margin: '4px 0 0 0', color: '#5c0000', fontSize: '0.95rem' }}>أضف الاسئلة وحدد خياراتها وإجاباتها الصحيحة</p>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                <QuestionBuilder 
                  questions={questions} 
                  onChange={setQuestions} 
                  currentStudents={currentStudents}
                  participants={currentStudents}
                />
                {errors.questions && <p style={{ color: '#b22222', marginTop: '12px', fontWeight: 'bold' }}>{errors.questions}</p>}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed #b8860b', paddingTop: '16px' }}>
                <Button onClick={() => setActiveTab('PARTICIPANTS')} style={{ backgroundColor: '#8b6508', color: '#fff8dc', padding: '10px 20px', borderRadius: '8px' }}>
                  ➡️ السابق
                </Button>
                <Button onClick={handleRunOnly} style={{ backgroundColor: '#8b0000', color: '#fff8dc', padding: '12px 28px', fontSize: '1.05rem', borderRadius: '8px', boxShadow: '0 4px 0 #5c0000' }}>
                  🏴‍☠️ انطلاق المغامرة الآن
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* نافذة استرداد خرائط الكنوز المحفوظة (Modal) */}
      {showLoadModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(46, 29, 15, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff8dc', border: '2px solid #b8860b', borderRadius: '12px', padding: '24px',
            width: '90%', maxWidth: '550px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px dashed #b8860b', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#3e2723' }}>🗺️ خرائط الكنوز المحفوظة</h3>
              <button onClick={() => setShowLoadModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#8b6508' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {savedTemplatesList.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#8b6508', padding: '30px 0', fontWeight: 'bold' }}>لا يوجد أي خريطة محفوظة حالياً.</p>
              ) : (
                savedTemplatesList.map((tpl) => (
                  <div 
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    style={{
                      padding: '14px 18px', borderRadius: '8px', border: '1px solid #b8860b',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer', transition: 'all 0.2s', backgroundColor: 'rgba(255, 248, 220, 0.9)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff3cd'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 248, 220, 0.9)'}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#3e2723' }}>{tpl.name}</h4>
                      <span style={{ fontSize: '0.85rem', color: '#5c0000', fontWeight: '500' }}>
                        الفرسان: {tpl.participants?.length || 0} | الطاقم: {tpl.classId || 'غير محدد'}
                      </span>
                    </div>

                    <button 
                      onClick={(e) => handleDeleteSavedTemplate(tpl.id, e)}
                      style={{ padding: '6px 12px', backgroundColor: '#8b0000', color: '#fff8dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      حذف 🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};