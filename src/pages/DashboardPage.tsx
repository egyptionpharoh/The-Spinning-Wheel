import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { WheelComponent } from '../components/dashboard/WheelComponent';
import { EvaluationPanel } from '../components/dashboard/EvaluationPanel';
import { useWheel } from '../application/hooks/useWheel';
import { useSession } from '../application/hooks/useSession';
import { stateManager } from '../core/store/StateManager';
import { BaseItem, Question, Template } from '../core/types/core';
import { audioManager } from '../core/media/AudioManager';
import '../styles/dashboard.css';

type GamePhase = 'STUDENT_WHEEL' | 'STUDENT_RESULT' | 'QUESTION_WHEEL' | 'QUESTION_RESULT' | 'LEADERBOARD' | 'SESSION_ENDED';

export const DashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const templateId = searchParams.get('templateId');
  const { startSession } = useSession();

  const { spin, isSpinning } = useWheel();
  const [wheelItems, setWheelItems] = useState<BaseItem[]>([]);
  const [questionsList, setQuestionsList] = useState<(BaseItem & Question)[]>([]);

  const [phase, setPhase] = useState<GamePhase>('STUDENT_WHEEL');
  const [selectedStudent, setSelectedStudent] = useState<BaseItem | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<(BaseItem & Question) | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userSelectedOptionId, setUserSelectedOptionId] = useState<string | null>(null);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);

  // 🌟 حالات المؤقت الزمني
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [questionMaxTime, setQuestionMaxTime] = useState<number>(45); // لتنظيم حركة شريط التقدم
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const audioLock = useRef<boolean>(false);
  // 🌟 حالات وسائل المساعدة (من سيربح المليون)
  const [usedFiftyFifty, setUsedFiftyFifty] = useState<boolean>(false);
  const [usedPhoneFriend, setUsedPhoneFriend] = useState<boolean>(false);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [showPhoneFriendToast, setShowPhoneFriendToast] = useState<boolean>(false);
  const [sessionSettings, setSessionSettings] = useState<any>(null);
  
  // 🌟 حالة تتبع وضع ملء الشاشة
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // 🌟 حالات سؤال التوصيل (التفاعل السحري)
  const [matchLeft, setMatchLeft] = useState<{id: string, text: string, image?: string}[]>([]);
  const [matchRight, setMatchRight] = useState<{id: string, text: string, image?: string}[]>([]);
  const [activeMatch, setActiveMatch] = useState<{left: string | null, right: string | null}>({left: null, right: null});
  const [completedMatches, setCompletedMatches] = useState<{id: string, leftId?: string, rightId?: string, color: string, isCorrect?: boolean}[]>([]);
  const matchColors = ['#f43f5e', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#06b6d4', '#84cc16'];
  const [matchCoordinates, setMatchCoordinates] = useState<Record<string, {y1: number, y2: number}>>({});  // 🌟 إعداد وتنظيف الصوت (Audio Setup & Cleanup)
  // 🌟 إعداد وتنظيف الصوت وفك حظر المتصفح (Audio Setup & Unlock)
  useEffect(() => {
    audioManager.preload({
      'tick': '/games/musiteacher-randomizer/assets/audio/tick.wav',
      'correct': '/games/musiteacher-randomizer/assets/audio/correct.ogg',
      'wrong': '/games/musiteacher-randomizer/assets/audio/wrong.ogg',
      'win': '/games/musiteacher-randomizer/assets/audio/victory.ogg',
      'wheelSpin': '/games/musiteacher-randomizer/assets/audio/wheel.wav',
      'fiftyFifty': '/games/musiteacher-randomizer/assets/audio/fifty.wav',
      'phoneFriend': '/games/musiteacher-randomizer/assets/audio/phone.wav'
    });

    // 🌟 خدعة لفك حظر الصوت في المتصفحات عند أول تفاعل للمستخدم
    const unlockAudio = () => {
      // تشغيل صامت جداً لتهيئة سياق الصوت 
      audioManager.play('tick', { volume: 0 }); 
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      audioManager.clearCache();
    };
  }, []);
  
  // 1. تحميل القالب والأسئلة كاملة مع الخيارات
  useEffect(() => {
    if (templateId) {
      try {
        const existingTemplates = JSON.parse(localStorage.getItem('edu_templates') || '[]');
        const savedTemplate = existingTemplates.find((t: Template) => t.id === templateId);
        
        if (savedTemplate) {
          const allQuestions: Question[] = JSON.parse(localStorage.getItem('edu_questions') || '[]');
          
          let templateQuestions: Question[] = [];

          if (savedTemplate.questionRefs && savedTemplate.questionRefs.length > 0) {
            const refIds = savedTemplate.questionRefs.map((r: any) => r.questionId);
            templateQuestions = allQuestions.filter(q => refIds.includes(q.id));
          } else {
            templateQuestions = allQuestions;
          }

          const formattedQuestions = templateQuestions.map(q => ({
            ...q,
            displayId: q.text
          }));

          setSessionSettings(savedTemplate.settings);
          startSession(savedTemplate.settings, savedTemplate.participants, formattedQuestions as any);
        }
      } catch (e) {
        console.error("حدث خطأ أثناء تحميل القالب والأسئلة", e);
      }
    }
  }, [templateId, startSession]);

  // 🌟 منع إغلاق أو تحديث الصفحة بالخطأ أثناء الجلسة النشطة
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase !== 'SESSION_ENDED') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [phase]);

  // 🌟 مراقبة وتحديث حالة ملء الشاشة، والخروج منها تلقائياً عند مغادرة الصفحة
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // دالة التنظيف (تعمل فوراً عند الضغط على الرجوع للخلف أو إنهاء ومغادرة اللعبة)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      
      // إغلاق وضع ملء الشاشة تلقائياً لكي لا ينحبس المستخدم في الشاشة الرئيسية
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.log(err));
      }
    };
  }, []);

  // 2. مزامنة البيانات مع مدير الحالة
  useEffect(() => {
    const updateData = () => {
      const items = stateManager.getItems().filter(item => item.presence === 'IN_WHEEL');
      setWheelItems(items);
      
      const rawQuestions = (stateManager as any).questions || [];
      const formattedQs = rawQuestions.map((q: any) => ({
        ...q,
        displayId: q.displayId || q.text
      }));
      setQuestionsList(formattedQs);
    };
    
    updateData();
    return stateManager.subscribe(updateData);
  }, []);

  // 🌟 تشغيل وإدارة المؤقت الزمني والصوت
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (phase === 'QUESTION_RESULT' && isTimerActive && timeLeft > 0 && !showAnswer && !userSelectedOptionId) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 10 && prev > 1) audioManager.play('tick', { playbackRate: 1.0 }); // صوت تحذيري بآخر 10 ثواني
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive && !showAnswer) {
      // عندما ينتهي الوقت يتم إيقاف المؤقت وكشف الإجابة تلقائياً
      if (!audioLock.current) {
        audioLock.current = true;
        setIsTimerActive(false);
        
        // 🌟 منع كشف الإجابة تلقائياً في سؤال التوصيل حتى لا تحرق خطوط الإجابة للطالب
        if (selectedQuestion?.type !== 'MATCHING') {
          setShowAnswer(true);
        }
        
        audioManager.stopAll(); // إيقاف أي صوت سابق لمنع التداخل
        audioManager.play('wrong'); // 🌟 تشغيل صوت الإنذار لانتهاء الوقت
      }
    }
      return () => clearInterval(timer);
    }, [phase, isTimerActive, timeLeft, showAnswer, userSelectedOptionId]);
    // 🌟 إعداد سؤال التوصيل وخلط القوائم
  useEffect(() => {
    if (selectedQuestion && selectedQuestion.type === 'MATCHING' && selectedQuestion.options) {
      try {
        const parsed = selectedQuestion.options.map((opt: any) => ({
          id: opt.id,
          optMedia: opt.imageUrl || opt.image || opt.mediaUrl, // سحب الصورة من الاختيار نفسه إن وجدت
          ...JSON.parse(opt.text)
        }));
        // خلط العمود الأول والثاني بشكل مستقل مع دعم الصور من كافة المصادر الممكنة
        const lefts = parsed.map(p => ({ id: p.id, text: p.left, image: p.leftImage || p.image || p.optMedia })).sort(() => Math.random() - 0.5);
        const rights = parsed.map(p => ({ id: p.id, text: p.right, image: p.rightImage || p.image || p.optMedia })).sort(() => Math.random() - 0.5);
        
        setMatchLeft(lefts);
        setMatchRight(rights);
        setCompletedMatches([]); // 🌟 تصفير الخطوط إجبارياً هنا لمنع ظهورها قبل أوانها 
        setActiveMatch({left: null, right: null});
      } catch (e) {
        console.error("خطأ في قراءة بيانات التوصيل", e);
      }
    }
  }, [selectedQuestion]);

  // 🌟 منطق التحقق من صحة التوصيل وتحديث الخطوط
  useEffect(() => {
    if (activeMatch.left && activeMatch.right) {
      const isCorrect = activeMatch.left === activeMatch.right;
      
      if (isCorrect) {
        audioManager.play('correct');
      } else {
        audioManager.play('wrong');
      }

      // استخدام اللون الأخضر النيون للتوصيل الصحيح والأحمر للتوصيل الخاطئ
      const color = isCorrect ? '#39ff14' : '#ef4444'; 
      
      const newMatches = [...completedMatches, {
        id: `${activeMatch.left}-${activeMatch.right}`, 
        leftId: activeMatch.left, 
        rightId: activeMatch.right, 
        color, 
        isCorrect 
      }];
      setCompletedMatches(newMatches);
      setActiveMatch({left: null, right: null});
      
      // التحقق مما إذا كان الطالب قد أنهى جميع التوصيلات (سواء كانت صحيحة أو خاطئة)
      if (newMatches.length === matchLeft.length && matchLeft.length > 0) {
        setIsTimerActive(false);
        const allCorrect = newMatches.every(m => m.isCorrect !== false);
        setUserSelectedOptionId(allCorrect ? 'MATCHING_DONE' : 'MATCHING_FAILED'); // كود لإعلام النظام بالنتيجة النهائية
      }
    }
  }, [activeMatch, matchLeft, matchRight, completedMatches, matchColors]);
  // 🌟 حساب إحداثيات خطوط التوصيل ديناميكياً لتناسب أي حجم للصور أو النصوص
  useEffect(() => {
    const calculateCoords = () => {
      const container = document.getElementById('match-svg-container');
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const newCoords: Record<string, {y1: number, y2: number}> = {};
      
      // حساب خطوط الإجابات الخاصة بالطالب (سواء صحيحة أو خاطئة)
      completedMatches.forEach(match => {
        const leftEl = document.getElementById(`match-left-${match.leftId || match.id}`);
        const rightEl = document.getElementById(`match-right-${match.rightId || match.id}`);
        if (leftEl && rightEl) {
          const leftRect = leftEl.getBoundingClientRect();
          const rightRect = rightEl.getBoundingClientRect();
          newCoords[match.id] = {
            y1: leftRect.top - containerRect.top + (leftRect.height / 2),
            y2: rightRect.top - containerRect.top + (rightRect.height / 2)
          };
        }
      });

      // حساب خطوط كشف الإجابة (للمعلم)
      if (showAnswer) {
        matchLeft.forEach(lItem => {
           const rItem = matchRight.find(r => r.id === lItem.id);
           if (rItem) {
             const leftEl = document.getElementById(`match-left-${lItem.id}`);
             const rightEl = document.getElementById(`match-right-${lItem.id}`);
             if (leftEl && rightEl) {
               const leftRect = leftEl.getBoundingClientRect();
               const rightRect = rightEl.getBoundingClientRect();
               newCoords[`ans-${lItem.id}`] = {
                 y1: leftRect.top - containerRect.top + (leftRect.height / 2),
                 y2: rightRect.top - containerRect.top + (rightRect.height / 2)
               };
             }
           }
        });
      }
      setMatchCoordinates(newCoords);
    };

    // حساب الإحداثيات فوراً، وبعد فترة قصيرة لضمان تحميل العناصر والصور بالكامل
    calculateCoords();
    const t1 = setTimeout(calculateCoords, 100);
    const t2 = setTimeout(calculateCoords, 600);
    
    // إعادة الحساب إذا تم تكبير أو تصغير الشاشة
    window.addEventListener('resize', calculateCoords);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', calculateCoords);
    };
  }, [completedMatches, matchLeft, matchRight, showAnswer]);

  // 🌟 دالة للتحكم اليدوي في وضع ملء الشاشة
  const toggleFullScreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    } catch (e) {}
  };

  const handleSpinStudent = () => {
    // 🎵 إيقاف أي صوت سابق وتشغيل العجلة فوراً (بدون تأخير زمني لتجنب حظر المتصفح للصوت)
    audioManager.stopAll();
    audioManager.play('wheelSpin');

    if (wheelItems.length === 0) return null;
    const winner = wheelItems[Math.floor(Math.random() * wheelItems.length)];
    setSelectedStudent(winner);

    spin(5000);
    setTimeout(() => {
      setPhase('STUDENT_RESULT');
    }, 5000);
    return winner;
  };

  const handleNextToQuestion = () => {
    setPhase('QUESTION_WHEEL');
  };

  const handleSpinQuestion = () => {
    // 🎵 عزف صوت العجلة فوراً (بدون تأخير زمني لتجنب حظر المتصفح للصوت)
    audioManager.stopAll();
    audioManager.play('wheelSpin');

    // 1. تصفية الأسئلة لاستبعاد ما تم سؤاله سابقاً
    const availableQuestions = questionsList.filter(q => !usedQuestionIds.includes(q.id));

    let winner = stateManager.drawQuestionForItem(selectedStudent?.id || 'general');
    
    // 2. التأكد من أن السؤال لم يُستخدم من قبل، وإن كان قد استُخدم نسحب واحداً جديداً من المتاح
    if (!winner || usedQuestionIds.includes(winner.id)) {
      if (availableQuestions.length > 0) {
        winner = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      } else {
        winner = { id: 'empty', text: 'لا توجد أسئلة متبقية لهذا النشاط!', displayId: 'لا توجد أسئلة!', type: 'ESSAY' } as any;
      }
    } else {
      (winner as any).displayId = (winner as any).displayId || winner.text;
    }

    // خلط أماكن الإجابات عشوائياً حتى لا تظل الإجابة الصحيحة دائماً هي الأولى
    let preparedQuestion = { ...winner } as any;
    if (preparedQuestion.options && preparedQuestion.options.length > 0) {
      preparedQuestion.options = [...preparedQuestion.options].sort(() => Math.random() - 0.5);
    }

    setSelectedQuestion(preparedQuestion);
    setUserSelectedOptionId(null);
    setUsedFiftyFifty(false);
    setUsedPhoneFriend(false);
    setHiddenOptions([]);
    setShowPhoneFriendToast(false);
    audioLock.current = false;
    
    // تصفير حالات سؤال التوصيل
    setMatchLeft([]);
    setMatchRight([]);
    setActiveMatch({left: null, right: null});
    setCompletedMatches([]);

    spin(5000);
    setTimeout(() => {
      // 3. تحديث القائمة بعد انتهاء الدوران حتى لا تُشل حركة العجلة أثناء اللف
      if (winner && winner.id !== 'empty') {
        setUsedQuestionIds(prev => [...prev, winner.id]);
      }
      
      setShowAnswer(false);
      setPhase('QUESTION_RESULT');
      // 🌟 قراءة زمن السؤال المخصص وتطبيقه على المؤقت (فقط إذا كان هناك سؤال حقيقي)
      if (preparedQuestion.id !== 'empty') {
        const limit = preparedQuestion.timeLimit || 45;
        setQuestionMaxTime(limit);
        setTimeLeft(limit);
        setIsTimerActive(true);
      } else {
        setIsTimerActive(false); // إيقاف المؤقت إذا لم تكن هناك أسئلة لمنع صوت التيك توك
      }
    }, 5000);
    return winner;
  };

  const handleEvaluate = (outcome: 'PASSED' | 'FAILED' | 'RETRY' | 'ABSENT' | 'NONE', shouldRemove: boolean, earnedScore: number = 0) => {
    setIsTimerActive(false);
    
    if (selectedStudent) {
      // تم إضافة 0 كقيمة لـ decisionDurationMs لتمرير النقاط (earnedScore) في مكانها الصحيح (المعامل الخامس)
      stateManager.evaluateItem(selectedStudent.id, outcome, shouldRemove, 0, earnedScore);
    }
    
    // إيقاف أي نغمة سابقة
    audioManager.stopAll();
    
    // تشغيل المؤثر الصوتي فقط للأسئلة المقالية (التي تقيم يدوياً)، 
    // لأن أسئلة الاختيارات قامت بتشغيل الصوت بالفعل عند اختيار الطالب للإجابة.
    if (!userSelectedOptionId) {
      if (outcome === 'PASSED') {
        audioManager.play('correct');
      } else if (outcome === 'FAILED') {
        audioManager.play('wrong');
      }
    }

    // حساب عدد الطلاب المتبقي منطقياً لتجاوز تأخر التحديث
    const currentWheelCount = wheelItems.length;
    const remainingCount = shouldRemove ? currentWheelCount - 1 : currentWheelCount;

    // إزالة الطالب من القائمة فوراً
    if (shouldRemove && selectedStudent) {
      setWheelItems((prev) => prev.filter(item => item.id !== selectedStudent.id));
    }

    // اتخاذ القرار بناءً على العدد الفعلي
    if (remainingCount <= 0) {
      setPhase('SESSION_ENDED');
      audioManager.stopAll();
      audioManager.play('win');
    } else {
      setPhase('STUDENT_WHEEL');
    }

    // إعادة ضبط الحالات في النهاية لتجنب تفريغ البيانات أثناء المعالجة
    setSelectedStudent(null);
    setSelectedQuestion(null);
    setShowAnswer(false);
    setUserSelectedOptionId(null);
    setTimeLeft(45);
  };

  // 🌟 دالة مخصصة لإيقاف المؤقت وتصفية الشاشة والانتقال الفوري لمرحلة إنهاء الجلسة
  const handleEndSession = () => {
    setIsTimerActive(false);

    // 🌟 حفظ نتيجة الطالب وحالته فوراً في النظام قبل إغلاق الشاشة إذا كان قد أجاب على سؤال
    if (selectedStudent && phase === 'QUESTION_RESULT') {
      if (userSelectedOptionId) {
        let isCorrect = false;
        if (selectedQuestion?.type === 'MATCHING' && String(userSelectedOptionId).includes('MATCHING_DONE')) {
          isCorrect = true;
        } else {
          // 💡 الإصلاح هنا: تحويل القيمتين إلى نصوص لضمان عدم فشل المقارنة بسبب نوع البيانات (String vs Number)
          const selectedOption = selectedQuestion?.options?.find(
            (opt: any) => String(opt.id) === String(userSelectedOptionId)
          );
          // 💡 التأكد من قيمة isCorrect سواء كانت منطقية (boolean) أو نصية (string)
          isCorrect = selectedOption?.isCorrect === true || String(selectedOption?.isCorrect).toLowerCase() === 'true';
        }

        if (isCorrect) {
          // تأمين المتغيرات لتجنب أي خطأ حسابي إذا كانت القيم غير معرّفة لحظة الإنهاء
          const maxTime = typeof questionMaxTime !== 'undefined' && questionMaxTime > 0 ? questionMaxTime : 60;
          const currentTimeLeft = typeof timeLeft !== 'undefined' ? timeLeft : 0;
          const speedBonus = Math.max(0, Math.round((currentTimeLeft / maxTime) * 50));
          
          let deduction = 0;
          if (typeof usedPhoneFriend !== 'undefined' && usedPhoneFriend) deduction += 20;
          if (typeof usedFiftyFifty !== 'undefined' && usedFiftyFifty) deduction += 40;
          const totalPoints = (100 - deduction) + speedBonus;
          
          // تم تمرير 0 لمعامل الزمن، وتمرير النقاط في المعامل الخامس
          stateManager.evaluateItem(selectedStudent.id, 'PASSED', true, 0, totalPoints);
        } else {
          stateManager.evaluateItem(selectedStudent.id, 'FAILED', true, 0, 0);
        }
      } else {
        stateManager.evaluateItem(selectedStudent.id, 'FAILED', true, 0, 0);
      }
    }

    setSelectedStudent(null);
    setSelectedQuestion(null);
    setShowAnswer(false);
    setUserSelectedOptionId(null);
    setPhase('SESSION_ENDED');
    audioManager.stopAll(); 
    audioManager.play('win');
  };

  // 🌟 دالة حذف إجابتين (50:50)
  const handleFiftyFifty = () => {
    if (!selectedQuestion || !selectedQuestion.options || usedFiftyFifty) return;
    
    audioManager.stopAll(); // إيقاف أي صوت سابق لمنع التداخل    
    // تصفية الإجابات الخاطئة
    const wrongOptions = selectedQuestion.options.filter((opt: any) => opt.isCorrect !== true && String(opt.isCorrect).toLowerCase() !== 'true');    // خلط الإجابات الخاطئة واختيار اثنتين لإخفائهما
    const optionsToHide = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 2);
    
    setHiddenOptions(optionsToHide.map((opt: any) => opt.id));
    setUsedFiftyFifty(true);
    audioManager.play('fiftyFifty'); // صوت خاص بحذف إجابتين
  };

  // 🌟 دالة الاتصال بصديق
  const handlePhoneFriend = () => {
    if (usedPhoneFriend) return;
    
    audioManager.stopAll(); // إيقاف أي صوت سابق لمنع التداخل    
    setUsedPhoneFriend(true);
    setShowPhoneFriendToast(true);
    
    // إعادة ضبط المؤقت إلى 45 ثانية لتوفير وقت كافٍ
    setTimeLeft(45);
    setQuestionMaxTime(45);
    setIsTimerActive(true);
    
    audioManager.play('phoneFriend'); // صوت خاص بالاتصال بصديق
    
    // إخفاء رسالة التوست الجمالية بعد 4 ثوانٍ
    setTimeout(() => {
      setShowPhoneFriendToast(false);
    }, 15000);
  };

  const prefixes = ['أ', 'ب', 'ج', 'د'];
  // طباعة بيانات السؤال في الكونسول لاكتشاف اسم متغير الصورة
  useEffect(() => {
    if (selectedQuestion) {
      console.log("🔍 بيانات السؤال الحالي:", selectedQuestion);
    }
  }, [selectedQuestion]);

  return (
    <div className="dashboard-layout" style={{ direction: 'rtl' }}>
      
      {/* 🌟 زر التحكم في ملء الشاشة - تصميم "الجوهرة المرنة" الفاخر لألعاب الأطفال */}
      <button
        onClick={toggleFullScreen}
        style={{
          position: 'fixed',
          top: '25px',
          left: '25px',
          zIndex: 9999,
          width: '65px',
          height: '65px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: 'none', // أزلنا الإطار الصلب واعتمدنا على الظلال الداخلية للفخامة
          outline: 'none',
          color: '#fff',
          
          // 1. تدرج لوني حيوي يعطي لمعاناً يشبه ألعاب الجيل الجديد
          background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 50%, #1e3a8a 100%)',
          
          // 2. حركة فيزيائية مرنة (Bouncy) تعطي إحساساً ممتعاً عند الضغط
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          
          // 3. دمج النزول لأسفل مع تصغير الحجم قليلاً لواقعية أكبر
          transform: isFullscreen ? 'translateY(8px) scale(0.92)' : 'translateY(0) scale(1)',
          
          // 4. السر الحقيقي: طبقات الظل المتعددة (إضاءة علوية + عمق + توهج خارجي)
          boxShadow: isFullscreen 
            ? 'inset 0 4px 8px rgba(0, 0, 0, 0.5), inset 0 -4px 6px rgba(255, 255, 255, 0.1), 0 0px 0 #172554, 0 4px 6px rgba(37, 99, 235, 0.3)' // حالة الانضغاط (مجوف)
            : 'inset 0 6px 10px rgba(255, 255, 255, 0.5), inset 0 -4px 6px rgba(0, 0, 0, 0.2), 0 8px 0 #1e3a8a, 0 15px 25px rgba(37, 99, 235, 0.5)', // حالة البروز (لامع)
        }}
        title={isFullscreen ? "تصغير الشاشة" : "تكبير الشاشة"}
      >
        {/* استخدام أيقونات SVG احترافية وناعمة بدلاً من الإيموجي */}
        {isFullscreen ? (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.3s' }}>
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.3s' }}>
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        )}
      </button>

      {/* 🌟 زر الرجوع للخلف العائم للتراجع وتعديل الإعدادات */}
      {phase === 'STUDENT_WHEEL' && (
        <button
          onClick={() => navigate(`/?id=${templateId}`)}
          style={{
            position: 'fixed', bottom: '25px', right: '25px', zIndex: 9999,
            background: '#64748b', color: '#fff', border: '2px solid #475569',
            borderRadius: '16px', padding: '12px 24px', fontSize: '1.2rem', fontWeight: 'bold',
            cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s'
          }}
          title="العودة للصفحة السابقة لتعديل الإعدادات"
        >
          🔙 الرجوع للخلف
        </button>
      )}

      {/* إزالة خاصية onEndSession من الهيدر لكي لا يظهر الزر القديم المكرر */}
      <DashboardHeader />

      <main className="dashboard-main">
        <section className="dashboard-center">
          
          {/* مرحلة عجلة الطلاب */}
          {(phase === 'STUDENT_WHEEL' || phase === 'STUDENT_RESULT') && (
            <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', justifyContent: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
              {/* قائمة الطلاب الجانبية */}
              <div style={{
                width: '380px',
                backgroundColor: '#1e293b',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                color: '#fff',
                maxHeight: '550px',
                overflowY: 'auto',
                border: '3px solid #3b82f6',
                transition: 'all 0.3s ease'
              }}>
                <h3 style={{ textAlign: 'center', color: '#93c5fd', margin: '0 0 15px 0', borderBottom: '2px dashed #475569', paddingBottom: '10px', fontSize: '1.4rem' }}>
                  👥 قائمة الطلاب ({wheelItems.length})
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {wheelItems.map((item, index) => (
                    <li key={item.id} style={{
                      // 🌟 التعديل هنا: إضافة شرط (!isSpinning) لمنع تلوين الاسم أثناء الدوران
                      backgroundColor: (item.id === selectedStudent?.id && !isSpinning) ? '#059669' : '#334155',
                      padding: '12px 15px',
                      borderRadius: '12px',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'background-color 0.3s ease',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      lineHeight: '1.4'
                    }}>
                      <span style={{ color: '#fbbf24', fontSize: '1.1rem', flexShrink: 0 }}>{index + 1}.</span> 
                      <span style={{ flex: 1 }}>{item.displayId}</span>
                    </li>
                  ))}
                  {wheelItems.length === 0 && (
                    <li style={{ textAlign: 'center', color: '#9ca3af', padding: '15px', fontSize: '1.1rem' }}>انتهت الأسماء!</li>
                  )}
                </ul>
                
                {wheelItems.length === 0 && (
                  <button 
                    onClick={handleEndSession}
                    style={{ width: '100%', marginTop: '20px', padding: '15px', fontSize: '1.3rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)', transition: 'all 0.2s', animation: 'fadeIn 0.5s ease-in' }}
                  >
                    🏆 إعلان النتائج النهائية
                  </button>
                )}
              </div>

              {/* حاوية العجلة */}
              <div className="wheel-container" style={{ position: 'relative', minHeight: '550px', flex: 1, transform: 'translateZ(0)' }}>
                <WheelComponent 
                  key="student-wheel"
                  items={wheelItems.map((item, index) => ({ ...item, wheelLabel: `${index + 1}` }))}
                  isSpinning={isSpinning}
                  onSpin={handleSpinStudent}
                  spinButtonText="اختر الطالب 🎲"
                  themeId={sessionSettings?.themeVariant || sessionSettings?.wheelTheme || sessionSettings?.theme || 'cyber'}
                  sound={true}
                />
              </div>
            </div>
          )}
          {/* الطبقة الزجاجية المنبثقة (التوست) للنتيجة تم فصلها لتتوسط الشاشة */}
          {phase === 'STUDENT_RESULT' && selectedStudent && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(6px)',
              zIndex: 99999,
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '20px', 
                padding: '45px 55px', 
                background: 'linear-gradient(145deg, #ffffff, #f8fafc)', 
                borderRadius: '32px', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 4px rgba(255,255,255,0.4)',
                minWidth: '450px',
                maxWidth: '90vw',
                textAlign: 'center'
              }}>
                <div style={{
                  background: '#f1f5f9',
                  padding: '8px 24px',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  fontSize: '1.2rem',
                  color: '#64748b',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: "'Cairo', sans-serif"
                }}>
                  <span>🎉</span> الطالب المختار
                </div>

                <h2 style={{ 
                  color: '#0f172a', 
                  fontSize: '3.5rem', 
                  margin: '10px 0', 
                  fontWeight: '900',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  fontFamily: "'Cairo', sans-serif"
                }}>
                  {selectedStudent.displayId}
                </h2>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', width: '100%', justifyContent: 'center' }}>
                  {/* زر التالي - مجسّم ثلاثي الأبعاد باللون الأزرق الجذاب */}
                  <button 
                    onClick={handleNextToQuestion} 
                    style={{ 
                      flex: 1.2, 
                      whiteSpace: 'nowrap', 
                      padding: '14px 24px', 
                      fontSize: '1.25rem', 
                      cursor: 'pointer', 
                      background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)', 
                      color: '#ffffff', 
                      border: 'none', 
                      borderRadius: '16px', 
                      fontWeight: '800', 
                      boxShadow: '0 6px 0 #1e40af, 0 12px 20px rgba(29, 78, 216, 0.35)', 
                      transform: 'translateY(0)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'translateY(4px)';
                      e.currentTarget.style.boxShadow = '0 2px 0 #1e40af, 0 6px 10px rgba(29, 78, 216, 0.35)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 6px 0 #1e40af, 0 12px 20px rgba(29, 78, 216, 0.35)';
                    }}
                  >
                    التالي: اختيار السؤال ➡️
                  </button>

                  {/* زر الغائب - مجسّم ثلاثي الأبعاد باللون الرمادي المحايد الأنيق */}
                  <button 
                    onClick={() => {
                      handleEvaluate('ABSENT', true);
                      // 🌟 إعادة تدوير العجلة تلقائياً لاختيار بديل فوراً
                      setTimeout(() => {
                        const updatedItems = stateManager.getItems().filter(item => item.presence === 'IN_WHEEL');
                        if (updatedItems.length > 0) {
                          const winner = updatedItems[Math.floor(Math.random() * updatedItems.length)];
                          setSelectedStudent(winner);
                          spin(5000);
                          setTimeout(() => {
                            setPhase('STUDENT_RESULT');
                          }, 5000);
                        }
                      }, 50);
                    }} 
                    style={{ 
                      flex: 1, 
                      whiteSpace: 'nowrap', 
                      padding: '14px 20px', 
                      fontSize: '1.25rem', 
                      cursor: 'pointer', 
                      background: 'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)', 
                      color: '#ffffff', 
                      border: 'none', 
                      borderRadius: '16px', 
                      fontWeight: '800', 
                      boxShadow: '0 6px 0 #475569, 0 12px 20px rgba(100, 116, 139, 0.3)', 
                      transform: 'translateY(0)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'translateY(4px)';
                      e.currentTarget.style.boxShadow = '0 2px 0 #475569, 0 6px 10px rgba(100, 116, 139, 0.3)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 6px 0 #475569, 0 12px 20px rgba(100, 116, 139, 0.3)';
                    }}
                  >
                    تخطي وتدوير 🔄
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* مرحلة عجلة الأسئلة */}
          {phase === 'QUESTION_WHEEL' && (
            <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', justifyContent: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
              {/* قائمة الأسئلة الجانبية */}
              <div style={{
                width: '380px',
                backgroundColor: '#1e293b',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                color: '#fff',
                maxHeight: '550px',
                overflowY: 'auto',
                border: '3px solid #8b5cf6',
                transition: 'all 0.3s ease'
              }}>
                <h3 style={{ textAlign: 'center', color: '#c4b5fd', margin: '0 0 15px 0', borderBottom: '2px dashed #475569', paddingBottom: '10px', fontSize: '1.4rem' }}>
                  ❓ الأسئلة المتبقية ({questionsList.filter(q => !usedQuestionIds.includes(q.id)).length})
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {questionsList.filter(q => !usedQuestionIds.includes(q.id)).map((item, index) => (
                    <li key={item.id} style={{
                      backgroundColor: '#334155',
                      padding: '12px 15px',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      lineHeight: '1.4'
                    }}>
                      <span style={{ color: '#fbbf24', fontSize: '1.1rem', flexShrink: 0 }}>{index + 1}.</span> 
                      <span style={{ flex: 1 }}>{item.displayId}</span>
                    </li>
                  ))}
                  {questionsList.filter(q => !usedQuestionIds.includes(q.id)).length === 0 && (
                    <li style={{ textAlign: 'center', color: '#9ca3af', padding: '15px', fontSize: '1.1rem' }}>لا توجد أسئلة متبقية!</li>
                  )}
                </ul>
                
                {questionsList.filter(q => !usedQuestionIds.includes(q.id)).length === 0 && (
                  <button 
                    onClick={handleEndSession}
                    style={{ width: '100%', marginTop: '20px', padding: '15px', fontSize: '1.3rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)', transition: 'all 0.2s', animation: 'fadeIn 0.5s ease-in' }}
                  >
                    🛑 إنهاء المسابقة والنتائج
                  </button>
                )}
              </div>

              {/* حاوية العجلة */}
              <div className="wheel-container" style={{ position: 'relative', minHeight: '550px', flex: 1, transform: 'translateZ(0)' }}>
                <WheelComponent 
                  key="question-wheel"
                  items={questionsList.filter(q => !usedQuestionIds.includes(q.id)).map((item, index) => ({ ...item, wheelLabel: `س${index + 1}` }))}
                  isSpinning={isSpinning}
                  onSpin={handleSpinQuestion as any}
                  spinButtonText="اسحب السؤال ❓"
                  themeId={sessionSettings?.themeVariant || sessionSettings?.wheelTheme || sessionSettings?.theme || 'cyber'}
                  sound={true}
                />
              </div>
            </div>
          )}

          {/* رسالة انتهاء الأسئلة بدلاً من عرض واجهة السؤال الفارغة */}
          {phase === 'QUESTION_RESULT' && selectedQuestion && selectedQuestion.id === 'empty' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '25px', padding: '50px 30px', backgroundColor: '#111827', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', width: '100%', maxWidth: '900px', margin: '0 auto', color: '#fff', textAlign: 'center' }}>
              <h2 style={{ color: '#fbbf24', fontSize: '2.5rem', fontWeight: 'bold' }}>لا توجد أسئلة متبقية لهذا النشاط!</h2>
              <p style={{ color: '#9ca3af', fontSize: '1.3rem' }}>لقد أجبتم على جميع الأسئلة المتاحة بنجاح.</p>
              <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button 
                  onClick={() => handleEvaluate('NONE', false)}
                  style={{ padding: '15px 30px', fontSize: '1.4rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)', transition: 'all 0.2s' }}
                >
                  🔄 تخطي وعودة للطلاب
                </button>
                <button 
                  onClick={handleEndSession}
                  style={{ padding: '15px 30px', fontSize: '1.4rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)', transition: 'all 0.2s' }}
                >
                  🛑 إنهاء المسابقة والنتائج
                </button>
              </div>
            </div>
          )}

          {/* مرحلة عرض السؤال والاختيارات (نمط من سيربح المليون) */}
          {phase === 'QUESTION_RESULT' && selectedQuestion && selectedQuestion.id !== 'empty' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px', padding: '30px', backgroundColor: '#111827', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', width: '100%', maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
            {/* 🌟 أزرار وسائل المساعدة وتوست الاتصال بصديق */}
              {sessionSettings?.enableLifelines !== false && selectedQuestion.type !== 'MATCHING' && selectedQuestion.options && selectedQuestion.options.length > 2 && (
                <>
                  {showPhoneFriendToast && (
                    <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#3b82f6', color: 'white', padding: '15px 30px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)', zIndex: 100, animation: 'fadeIn 0.3s ease-out', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>⏱️</span> لديك 30 ثانية لتستعين بأحد زملائك في الصف! أسرع يا بطل!
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'center', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <button 
                        onClick={handleFiftyFifty}
                        disabled={usedFiftyFifty || showAnswer || timeLeft === 0 || userSelectedOptionId !== null}
                        style={{ padding: '10px 25px', borderRadius: '25px', backgroundColor: usedFiftyFifty ? '#4b5563' : '#8b5cf6', color: '#fff', border: 'none', cursor: usedFiftyFifty || showAnswer || timeLeft === 0 || userSelectedOptionId !== null ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}
                      >
                        ✂️ حذف إجابتين
                      </button>
                      {!usedFiftyFifty && (
                        <span style={{ fontSize: '0.85rem', color: '#fca5a5', fontWeight: 'bold', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '4px 10px', borderRadius: '12px' }}>
                          ⚠️ خصم 40 نقطة
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <button 
                        onClick={handlePhoneFriend}
                        disabled={usedPhoneFriend || showAnswer || timeLeft === 0 || userSelectedOptionId !== null}
                        style={{ padding: '10px 25px', borderRadius: '25px', backgroundColor: usedPhoneFriend ? '#4b5563' : '#3b82f6', color: '#fff', border: 'none', cursor: usedPhoneFriend || showAnswer || timeLeft === 0 || userSelectedOptionId !== null ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}
                      >
                        📞 الاستعانة بصديق
                      </button>
                      {!usedPhoneFriend && (
                        <span style={{ fontSize: '0.85rem', color: '#fca5a5', fontWeight: 'bold', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '4px 10px', borderRadius: '12px' }}>
                          ⚠️ خصم 20 نقطة
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}  
              {/* 🌟 شريط المؤقت الزمني */}
              <div style={{ width: '100%', marginBottom: '-10px' }}>
                <div 
                  onClick={() => {
                    if (timeLeft > 0 && !showAnswer && !userSelectedOptionId) {
                      setIsTimerActive(!isTimerActive);
                    }
                  }}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '8px', 
                    fontWeight: 'bold', 
                    fontSize: '1.2rem', 
                    color: timeLeft <= 10 ? '#ef4444' : '#34d399', 
                    cursor: (showAnswer || userSelectedOptionId || timeLeft === 0) ? 'default' : 'pointer', 
                    backgroundColor: (!isTimerActive && timeLeft > 0 && timeLeft < questionMaxTime) ? 'rgba(239, 68, 68, 0.15)' : 'transparent', 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    transition: 'all 0.3s ease' 
                  }}
                  title="انقر هنا لإيقاف/تشغيل المؤقت مؤقتاً"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    الزمن المتبقي 
                    {(!isTimerActive && timeLeft > 0 && timeLeft < questionMaxTime) && (
                      <span style={{ fontSize: '0.9rem', backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', animation: 'fadeIn 0.3s' }}>
                        ⏸️ متوقف
                      </span>
                    )}
                  </span>
                  <span>⏳ {timeLeft} ثانية</span>
                </div>
                <div style={{ width: '100%', height: '12px', backgroundColor: '#374151', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(timeLeft / questionMaxTime) * 100}%`, 
                    backgroundColor: timeLeft <= 10 ? '#ef4444' : '#34d399',
                    transition: 'width 1s linear, background-color 0.3s'
                  }} />
                </div>
              </div>

              {/* نص السؤال الرئيسي والصورة إن وجدت */}
              <div style={{ width: '100%', padding: '20px', backgroundColor: '#1f2937', border: '2px solid #f59e0b', borderRadius: '40px', textAlign: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                
                {/* استخدام div بدلاً من h2 مع خاصية dangerouslySetInnerHTML لترجمة أكواد المحرر المتقدم إلى تنسيقات وصور حقيقية */}
                <div 
                  style={{ color: '#fbbf24', textAlign: 'center', fontSize: '1.8rem', margin: 0, fontWeight: 'bold', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', lineHeight: '1.5', width: '100%' }}
                  dangerouslySetInnerHTML={{ __html: selectedQuestion.text }}
                />
                
                {/* عرض الصورة المرفقة مع السؤال */}
                {(selectedQuestion.mediaUrls?.[0] || (selectedQuestion as any).imageUrl || (selectedQuestion as any).mediaUrl || (selectedQuestion as any).image) && (
                  <div style={{ marginTop: '10px', borderRadius: '15px', overflow: 'hidden', border: '2px solid #4b5563', display: 'inline-block', maxWidth: '100%', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                    <img 
                      src={selectedQuestion.mediaUrls?.[0] || (selectedQuestion as any).imageUrl || (selectedQuestion as any).mediaUrl || (selectedQuestion as any).image} 
                      alt="مرفق السؤال" 
                      style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain', display: 'block' }} 
                    />
                  </div>
                )}
              </div>
              
              {/* شبكة خيارات الإجابة والتوصيل التفاعلية */}
              {selectedQuestion.type === 'MATCHING' && matchLeft.length > 0 ? (
                <div style={{ position: 'relative', display: 'flex', width: '100%', justifyContent: 'space-between', marginTop: '15px', backgroundColor: '#1f2937', padding: '25px', borderRadius: '24px', border: '3px solid #374151', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.3)' }}>
                  {/* العمود الأول (أ) */}
                  <div style={{ width: '42%', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 2 }}>
                    <div style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '900', color: '#fbbf24', marginBottom: '5px', textShadow: '0 4px 8px rgba(0,0,0,0.4)', backgroundColor: 'rgba(31, 41, 55, 0.8)', padding: '10px', borderRadius: '15px', border: '2px solid #4b5563' }}>(أ)</div>
                    {matchLeft.map((item, index) => {
                      const isMatched = completedMatches.some(m => (m.leftId || m.id) === item.id);
                      const isSelected = activeMatch.left === item.id;
                      const isError = false; // تم إلغاء الوميض لأن الخط سيُرسم ويبقى
                      const matchData = completedMatches.find(m => (m.leftId || m.id) === item.id);
                      
                      let bgColor = '#374151';
                      let borderColor = '#4b5563';
                      if (isMatched) { bgColor = matchData?.color || '#059669'; borderColor = matchData?.color || '#34d399'; }
                      else if (isError) { bgColor = '#dc2626'; borderColor = '#f87171'; }
                      else if (isSelected) { bgColor = '#3b82f6'; borderColor = '#60a5fa'; }
                      else if (showAnswer) { bgColor = matchColors[index % matchColors.length]; borderColor = matchColors[index % matchColors.length]; }
                      
                      return (
                        <button
                          key={`l-${item.id}`}
                          id={`match-left-${item.id}`}
                          onClick={() => !isMatched && !showAnswer && timeLeft > 0 && setActiveMatch(prev => ({...prev, left: item.id}))}
                          style={{
                            minHeight: '80px', padding: '15px', borderRadius: '16px', border: `3px solid ${borderColor}`,
                            backgroundColor: bgColor, color: '#fff', fontSize: '1.2rem', fontWeight: 'bold',
                            cursor: (isMatched || showAnswer || timeLeft === 0) ? 'default' : 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', 
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: isSelected ? '0 0 20px rgba(59, 130, 246, 0.6)' : '0 6px 8px rgba(0,0,0,0.2)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px'
                          }}
                        >
                          {item.image && <img src={item.image} alt="match" onLoad={() => window.dispatchEvent(new Event('resize'))} style={{ maxHeight: '100px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain', backgroundColor: '#fff', padding: '4px' }} />}
                          {item.text && (
                            <span 
                              className="match-box-content"
                              style={{ width: '100%', overflowWrap: 'break-word', whiteSpace: 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}
                              dangerouslySetInnerHTML={{ __html: item.text }} 
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* طبقة الخطوط السحرية (الرسوم المتحركة) */}
                  <div id="match-svg-container" style={{ position: 'absolute', top: '25px', left: '42%', width: '16%', height: 'calc(100% - 50px)', pointerEvents: 'none', zIndex: 1 }}>
                    <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                      {completedMatches.map(match => {
                        const coords = matchCoordinates[match.id];
                        if (!coords) return null;
                        return (
                          <line 
                            key={`line-${match.id}`}
                            x1="100%" y1={coords.y1}
                            x2="0" y2={coords.y2}
                            stroke={match.color} strokeWidth="6" strokeLinecap="round"
                            style={{ 
                              animation: 'drawMagicLine 0.5s ease-out forwards', 
                              filter: `drop-shadow(0 0 10px ${match.color}) drop-shadow(0 0 20px ${match.color})`
                            }}
                          />
                        );
                      })}
                      {/* إظهار خطوط الإجابة الصحيحة عند كشف الإجابات أو انتهاء الوقت */}
                      {showAnswer && matchLeft.map((lItem) => {
                         if (completedMatches.some(m => (m.leftId || m.id) === lItem.id && m.isCorrect !== false)) return null;
                         const coords = matchCoordinates[`ans-${lItem.id}`];
                         if (!coords) return null;
                         return (
                           <line 
                             key={`ans-line-${lItem.id}`}
                             x1="100%" y1={coords.y1}
                             x2="0" y2={coords.y2}
                             stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeDasharray="12 12"
                             style={{ 
                               animation: 'fadeIn 0.8s ease-out forwards', 
                               opacity: 0.9,
                               filter: 'drop-shadow(0 0 10px #ffffff) drop-shadow(0 0 20px #ffffff)' 
                             }}
                           />
                         )
                      })}
                    </svg>
                  </div>

                  {/* العمود الثاني (ب) */}
                  <div style={{ width: '42%', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 2 }}>
                    <div style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '900', color: '#fbbf24', marginBottom: '5px', textShadow: '0 4px 8px rgba(0,0,0,0.4)', backgroundColor: 'rgba(31, 41, 55, 0.8)', padding: '10px', borderRadius: '15px', border: '2px solid #4b5563' }}>(ب)</div>
                    {matchRight.map((item) => {
                      const isMatched = completedMatches.some(m => (m.rightId || m.id) === item.id);
                      const isSelected = activeMatch.right === item.id;
                      const isError = false; // تم إلغاء الوميض لأن الخط سيُرسم ويبقى
                      const matchData = completedMatches.find(m => (m.rightId || m.id) === item.id);
                      
                      let bgColor = '#374151';
                      let borderColor = '#4b5563';
                      if (isMatched) { bgColor = matchData?.color || '#059669'; borderColor = matchData?.color || '#34d399'; }
                      else if (isError) { bgColor = '#dc2626'; borderColor = '#f87171'; }
                      else if (isSelected) { bgColor = '#3b82f6'; borderColor = '#60a5fa'; }
                      else if (showAnswer) { 
                         const lIndex = matchLeft.findIndex(l => l.id === item.id);
                         bgColor = matchColors[lIndex % matchColors.length]; borderColor = matchColors[lIndex % matchColors.length]; 
                      }
                      
                      return (
                        <button
                          key={`r-${item.id}`}
                          id={`match-right-${item.id}`}
                          onClick={() => !isMatched && !showAnswer && timeLeft > 0 && setActiveMatch(prev => ({...prev, right: item.id}))}
                          style={{
                            minHeight: '80px', padding: '15px', borderRadius: '16px', border: `3px solid ${borderColor}`,
                            backgroundColor: bgColor, color: '#fff', fontSize: '1.2rem', fontWeight: 'bold',
                            cursor: (isMatched || showAnswer || timeLeft === 0) ? 'default' : 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', 
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: isSelected ? '0 0 20px rgba(59, 130, 246, 0.6)' : '0 6px 8px rgba(0,0,0,0.2)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px'
                          }}
                        >
                          {item.image && <img src={item.image} alt="match" onLoad={() => window.dispatchEvent(new Event('resize'))} style={{ maxHeight: '100px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain', backgroundColor: '#fff', padding: '4px' }} />}
                          {item.text && (
                            <span 
                              className="match-box-content"
                              style={{ width: '100%', overflowWrap: 'break-word', whiteSpace: 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}
                              dangerouslySetInnerHTML={{ __html: item.text }} 
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  <style>{`
                    @keyframes drawMagicLine {
                      0% { stroke-dasharray: 0, 2000; opacity: 0; }
                      100% { stroke-dasharray: 2000, 0; opacity: 1; }
                    }
                    .match-box-content img {
                      max-width: 100%;
                      max-height: 100px;
                      border-radius: 8px;
                      object-fit: contain;
                      background-color: #fff;
                      padding: 4px;
                      display: block;
                      margin: 0 auto;
                    }
                  `}</style>
                </div>
              ) : selectedQuestion.options && selectedQuestion.options.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', width: '100%', marginTop: '10px' }}>                  
                {selectedQuestion.options.map((option, index) => {
                    const prefix = prefixes[index] || `${index + 1}`;
                    const isCorrect = option.isCorrect === true || String(option.isCorrect).toLowerCase() === 'true';
                    const isSelectedByStudent = String(userSelectedOptionId) === String(option.id);

                    let bgColor = '#1f2937';
                    let borderColor = '#d97706';
                    let textColor = '#ffffff';
                    let badgeIcon = null;

                    if (showAnswer) {
                      // عندما يضغط المعلم زر "كشف الإجابة الصحيحة"
                      if (isCorrect) {
                        bgColor = '#059669'; // أخضر
                        borderColor = '#34d399';
                        badgeIcon = '✅';
                      } else {
                        bgColor = '#374151'; // رمادي
                        borderColor = '#4b5563';
                        textColor = '#9ca3af';
                      }
                    } else if (isSelectedByStudent) {
                      // عندما يضغط الطالب على إحدى الخيارات بنفسه
                      if (isCorrect) {
                        bgColor = '#059669'; // إشارة خضراء للإجابة الصحيحة
                        borderColor = '#34d399';
                        badgeIcon = '✅ صحيحة!';
                      } else {
                        bgColor = '#dc2626'; // إشارة حمراء للإجابة الخاطئة
                        borderColor = '#f87171';
                        badgeIcon = '❌ خاطئة';
                      }
                    }

                    return (
                      <button 
                        key={option.id || index}
                        onClick={() => {
                          // السماح بالاختيار فقط إذا لم يختر الطالب مسبقاً، ولم تُكشف الإجابة، ولم ينفد الوقت
                          if (!userSelectedOptionId && !showAnswer && timeLeft > 0) {
                            setUserSelectedOptionId(option.id);
                            setIsTimerActive(false); // 🌟 إيقاف المؤقت بمجرد الإجابة
                            
                            audioManager.stopAll(); // إيقاف أي صوت سابق لمنع التداخل
                            
                            // 🌟 تشغيل المؤثر الصوتي بناءً على صحة الإجابة
                            if (isCorrect) {
                              audioManager.play('correct');
                            } else {
                              audioManager.play('wrong');
                            }
                          }
                        }}
                        disabled={!!userSelectedOptionId || showAnswer || timeLeft === 0}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: bgColor,
                          border: `2px solid ${borderColor}`,
                          borderRadius: '30px',
                          padding: '12px 20px',
                          color: textColor,
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          cursor: (userSelectedOptionId || showAnswer || timeLeft === 0) ? 'not-allowed' : 'pointer',
                          textAlign: 'right',
                          boxShadow: (isCorrect && showAnswer) || (isSelectedByStudent && isCorrect)
                            ? '0 0 20px rgba(52, 211, 153, 0.8)' 
                            : (isSelectedByStudent && !isCorrect)
                            ? '0 0 20px rgba(220, 38, 38, 0.8)'
                            : '0 4px 6px rgba(0,0,0,0.2)',
                          transition: 'all 0.3s ease',
                          opacity: hiddenOptions.includes(option.id) ? 0 : (userSelectedOptionId && !isSelectedByStudent && !isCorrect) ? 0.6 : 1,
                          pointerEvents: hiddenOptions.includes(option.id) ? 'none' : 'auto'
                        }}
                      >
                        <span style={{
                          color: (showAnswer && isCorrect) || (isSelectedByStudent && isCorrect) ? '#fff' : '#f59e0b',
                          marginLeft: '12px',
                          fontSize: '1.3rem',
                          fontWeight: '900',
                          borderLeft: '1px solid rgba(255,255,255,0.2)',
                          paddingLeft: '10px',
                          flexShrink: 0
                        }}>
                          {prefix}:
                        </span>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
  {/* عرض النص في حال وجوده */}
  {option.text && (
    <span style={{ textAlign: 'right', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', lineHeight: '1.4', width: '100%' }}>
      {option.text}
    </span>
  )}
  
  {/* عرض الصورة في حال تم تمريرها من الإعدادات */}
  {((option as any).imageUrl || (option as any).image || (option as any).mediaUrl) && (
    <img 
      src={(option as any).imageUrl || (option as any).image || (option as any).mediaUrl} 
      alt={`خيار ${index + 1}`} 
      style={{ 
        maxHeight: '120px', 
        maxWidth: '100%', 
        borderRadius: '8px', 
        objectFit: 'contain', 
        backgroundColor: '#fff', 
        padding: '4px',
        alignSelf: 'center',
        marginTop: '5px'
      }} 
    />
  )}
</div>
                        {badgeIcon && (
                          <span style={{ marginRight: '10px', fontSize: '1.1rem', fontWeight: 'bold', flexShrink: 0 }}>{badgeIcon}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: '#9ca3af', fontSize: '1.1rem', margin: '15px 0' }}>
                  لا توجد اختيارات متعددة لهذا السؤال (سؤال مقالي).
                </div>
              )}

              {/* زر كشف الإجابة الصحيحة */}
              {!showAnswer ? (
                <button 
                  onClick={() => setShowAnswer(true)} 
                  style={{ padding: '12px 30px', fontSize: '1.2rem', cursor: 'pointer', backgroundColor: '#f59e0b', color: '#000', border: 'none', borderRadius: '30px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)', transition: 'transform 0.2s' }}
                >
                  👁️ كشف الإجابة الصحيحة
                </button>
              ) : (
                <div style={{ color: '#34d399', fontSize: '1.2rem', fontWeight: 'bold', backgroundColor: 'rgba(5, 150, 105, 0.2)', padding: '8px 20px', borderRadius: '20px', border: '1px solid #059669' }}>
                  ✨ تم تمييز الإجابة الصحيحة باللون الأخضر
                </div>
              )}

              {/* التقييم التلقائي والتحكم باللعبة */}
              <div style={{ marginTop: '20px', width: '100%' }}>
                {userSelectedOptionId ? (
                  (() => {
                    // التحقق مما إذا كانت الإجابة التي اختارها الطالب صحيحة
                    let isCorrect = false;
                    if (selectedQuestion.type === 'MATCHING' && userSelectedOptionId === 'MATCHING_DONE') {
                      isCorrect = true;
                    } else {
                      const selectedOption = selectedQuestion.options?.find(opt => String(opt.id) === String(userSelectedOptionId));
                      isCorrect = selectedOption?.isCorrect === true || String(selectedOption?.isCorrect).toLowerCase() === 'true';
                    }                    
                    if (isCorrect) {
                      // 🌟 حساب النقاط مع مراعاة الفروق الفردية ووسائل المساعدة
                      const speedBonus = Math.round((timeLeft / questionMaxTime) * 50);
                      let deduction = 0;
                      if (usedPhoneFriend) deduction += 20;
                      if (usedFiftyFifty) deduction += 40;
                      
                      const totalPoints = (100 - deduction) + speedBonus;

                      return (
                        <div style={{ backgroundColor: '#ecfdf5', border: '2px dashed #10b981', borderRadius: '16px', padding: '25px', textAlign: 'center', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)', animation: 'fadeIn 0.5s ease-in' }}>
                          <h3 style={{ color: '#047857', fontSize: '1.8rem', margin: '0 0 10px 0', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                            🎉 الإجابة صحيحة! أحسنت يا( {selectedStudent?.displayId} ) البطل 🌟
                          </h3>
                          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981', marginBottom: '20px' }}>
                            حصلت على: {totalPoints} نقطة! 🏆
                            {deduction > 0 && (
                              <div style={{ fontSize: '1rem', color: '#ef4444', marginTop: '8px', fontWeight: 'normal' }}>
                                (تم خصم {deduction} نقطة لاستخدام وسائل المساعدة)
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => handleEvaluate('PASSED', true, totalPoints)} style={{ padding: '12px 30px', fontSize: '1.3rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(16,185,129,0.4)' }}>
                              متابعة للعجلة ➡️
                            </button>
                            <button onClick={handleEndSession} style={{ padding: '12px 30px', fontSize: '1.3rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(239,68,68,0.4)' }}>
                              🛑 إنهاء المسابقة
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div style={{ backgroundColor: '#fef2f2', border: '2px dashed #ef4444', borderRadius: '16px', padding: '25px', textAlign: 'center', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)', animation: 'fadeIn 0.5s ease-in' }}>
                          <h3 style={{ color: '#b91c1c', fontSize: '1.8rem', margin: '0 0 20px 0', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                            🥀 الإجابة خاطئة.. شكراً لمحاولتك يا ( {selectedStudent?.displayId} )، حظ سعيد المرة القادمة!
                          </h3>
                          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => handleEvaluate('FAILED', true)} style={{ padding: '12px 30px', fontSize: '1.3rem', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(245,158,11,0.4)' }}>
                              التالي (استبعاد للطالب) ➡️
                            </button>
                            <button onClick={handleEndSession} style={{ padding: '12px 30px', fontSize: '1.3rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(239,68,68,0.4)' }}>
                              🛑 إنهاء المسابقة
                            </button>
                          </div>
                        </div>
                      );
                    }
                  })()
                ) : showAnswer && selectedQuestion.options && selectedQuestion.options.length > 0 ? (
                  // معالجة حالة الانحباس: انتهى الوقت أو تم كشف الإجابة ولم يقم الطالب بالاختيار
                  <div style={{ backgroundColor: '#f3f4f6', border: '2px dashed #6b7280', borderRadius: '16px', padding: '25px', textAlign: 'center', boxShadow: '0 8px 20px rgba(107, 114, 128, 0.3)', animation: 'fadeIn 0.5s ease-in' }}>
                    <h3 style={{ color: '#374151', fontSize: '1.8rem', margin: '0 0 20px 0' }}>
                      ⏳ انتهى الوقت أو تم كشف الإجابة ولم يوفق ( {selectedStudent?.displayId} )
                    </h3>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => handleEvaluate('FAILED', true)} style={{ padding: '12px 30px', fontSize: '1.3rem', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(245,158,11,0.4)' }}>
                        التالي (استبعاد للطالب) ➡️
                      </button>
                      <button onClick={handleEndSession} style={{ padding: '12px 30px', fontSize: '1.3rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(239,68,68,0.4)' }}>
                        🛑 إنهاء المسابقة
                      </button>
                    </div>
                  </div>
                ) : (
                  // إظهار لوحة التقييم اليدوية فقط في حال كان السؤال مقالياً (بدون اختيارات) ليتمكن المعلم من التقييم
                  (!selectedQuestion.options || selectedQuestion.options.length === 0) && (
                    <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '15px', color: '#000' }}>
                      <EvaluationPanel />
                    </div>
                  )
                )}
              </div>

            </div>
          )}
          {/* مرحلة انتهاء الجلسة (تظهر فوراً عند الضغط على End Session وتخفي العجلة) */}
          {phase === 'SESSION_ENDED' && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: '60vh', 
              animation: 'fadeIn 0.5s ease-in',
              textAlign: 'center',
              backgroundColor: 'rgba(17, 24, 39, 0.85)',
              borderRadius: '24px',
              padding: '40px',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
            }}>
              <h2 style={{ color: '#ffffff', fontSize: '2.8rem', marginBottom: '20px', fontWeight: 'bold' }}>
                🏁 تم إنهاء الجلسة الموسيقية بنجاح
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '1.4rem', marginBottom: '40px' }}>
                اضغط على الزر أدناه لاستعراض لوحة الشرف وإعلان الفائزين
              </p>
              <button 
                onClick={() => setPhase('LEADERBOARD')}
                style={{ 
                  padding: '22px 55px', 
                  backgroundColor: '#10b981', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '50px', 
                  fontSize: '2.2rem', 
                  fontWeight: '900', 
                  cursor: 'pointer', 
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.6)', 
                  transition: 'all 0.3s ease',
                  transform: 'scale(1)'
                }}
              >
                🏆 إعلان النتائج النهائية
              </button>
            </div>
          )}

          {/* 🌟 واجهة لوحة الشرف (Leaderboard) */}
          {phase === 'LEADERBOARD' && (() => {
            const allStudents = stateManager.getItems() || [];
            
            // 1. في انتظار التألق: الطلاب الذين ما زالوا في العجلة (لم يحن دورهم بعد)
            const notParticipated = allStudents.filter(item => item.presence === 'IN_WHEEL');
            
            // 2. فرسان التميز: الطلاب الذين شاركوا وحصدوا نقاطاً أكبر من الصفر (مرتبين تنازلياً)
            const honorRoll = allStudents
              .filter(item => item.presence !== 'IN_WHEEL' && Number(item.score || 0) > 0)
              .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
            
            // 3. أبطال المحاولة: الطلاب الذين شاركوا ولكن لم يحصلوا على نقاط
            const needsImprovement = allStudents.filter(item => item.presence !== 'IN_WHEEL' && Number(item.score || 0) <= 0);

            return (
              <div style={{ 
                padding: '35px', 
                backgroundColor: '#111827', 
                borderRadius: '24px', 
                color: '#fff', 
                width: '100%', 
                maxWidth: '750px', 
                margin: '0 auto', 
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)', 
                border: '1px solid #1f2937'
              }}>
                <h2 style={{ textAlign: 'center', color: '#fbbf24', fontSize: '2.6rem', fontWeight: '900', marginBottom: '35px', textShadow: '0 2px 10px rgba(251, 191, 36, 0.3)' }}>
                  🏆 النتائج النهائية للمسابقة
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  {/* الفئة الأولى: فرسان التميز */}
                  <div>
                    <h3 style={{ color: '#34d399', borderBottom: '2px solid rgba(52, 211, 153, 0.3)', paddingBottom: '10px', marginBottom: '18px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🌟 لوحة الشرف (فرسان التميز)
                    </h3>
                    {honorRoll.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {honorRoll.map((item, index) => {
                          // إعطاء ألوان تمييز خاصة للمراكز الثلاثة الأولى
                          const isGold = index === 0;
                          const isSilver = index === 1;
                          const isBronze = index === 2;
                          
                          const bgColor = isGold ? 'linear-gradient(135deg, #047857, #065f46)' 
                                        : isSilver ? 'linear-gradient(135deg, #0284c7, #0369a1)' 
                                        : isBronze ? 'linear-gradient(135deg, #d97706, #b45309)' 
                                        : '#1f2937';
                                        
                          const borderColor = isGold ? '#5eead4' : isSilver ? '#38bdf8' : isBronze ? '#fcd34d' : 'transparent';

                          return (
                            <div 
                              key={item.id || index} 
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                background: bgColor, 
                                border: `1px solid ${borderColor}`,
                                padding: '16px 24px', 
                                borderRadius: '16px', 
                                fontSize: isGold ? '1.35rem' : '1.2rem', 
                                fontWeight: 'bold',
                                boxShadow: isGold ? '0 6px 20px rgba(16, 185, 129, 0.3)' : '0 4px 10px rgba(0,0,0,0.2)'
                              }}
                            >
                              <span>
                                {isGold ? '🥇 المركز الأول: ' : isSilver ? '🥈 المركز الثاني: ' : isBronze ? '🥉 المركز الثالث: ' : `${index + 1}. `} 
                                {item.displayId}
                              </span>
                              <span style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '6px 14px', borderRadius: '20px' }}>
                                {item.score} نقطة ✨
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '1.1rem', padding: '10px 0' }}>لا يوجد طلاب في هذه الفئة حتى الآن.</p>
                    )}
                  </div>

                  {/* الفئة الثانية: أبطال المحاولة */}
                  <div>
                    <h3 style={{ color: '#fbbf24', borderBottom: '2px solid rgba(251, 191, 36, 0.3)', paddingBottom: '10px', marginBottom: '18px', fontSize: '1.5rem' }}>
                      🌱 أبطال المحاولة (تحتاج لتطوير)
                    </h3>
                    {needsImprovement.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {needsImprovement.map((item, index) => (
                          <div key={item.id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#374151', padding: '12px 22px', borderRadius: '14px', fontSize: '1.1rem' }}>
                            <span>🎯 {item.displayId}</span>
                            <span style={{ color: '#9ca3af' }}>{item.score || 0} نقطة</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '1.1rem', padding: '10px 0' }}>لا يوجد طلاب في هذه الفئة.</p>
                    )}
                  </div>

                  {/* الفئة الثالثة: لم يشاركوا بعد */}
                  <div>
                    <h3 style={{ color: '#9ca3af', borderBottom: '2px solid rgba(156, 163, 175, 0.3)', paddingBottom: '10px', marginBottom: '18px', fontSize: '1.5rem' }}>
                      ⏳ في انتظار التألق (لم يشاركوا بعد)
                    </h3>
                    {notParticipated.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {notParticipated.map((item, index) => (
                          <span key={item.id || index} style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '8px 18px', borderRadius: '20px', fontSize: '1rem', color: '#d1d5db' }}>
                            {item.displayId}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '1.1rem', padding: '10px 0' }}>جميع الطلاب شاركوا في المسابقة.</p>
                    )}
                  </div>

                </div>

                {/* أزرار التحكم والعمليات */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '45px' }}>
                  <button 
                    onClick={() => setPhase('STUDENT_WHEEL')}
                    style={{ flex: 1, padding: '14px 22px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '1.25rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)', transition: 'transform 0.2s' }}
                  >
                    🎮 استئناف اللعب
                  </button>
                  <button 
                    onClick={() => navigate('/')}
                    style={{ flex: 1, padding: '14px 22px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '1.25rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 6px 16px rgba(220, 38, 38, 0.4)', transition: 'transform 0.2s' }}
                  >
                    🏠 إنهاء والخروج
                  </button>
                </div>
              </div>
            );
          })()}

        </section>
      </main>
    </div>
  );
};