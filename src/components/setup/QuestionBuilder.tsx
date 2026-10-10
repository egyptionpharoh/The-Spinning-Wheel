import React, { useState } from 'react';
import { Question, QuestionType, AnswerOption } from '../../core/types/core';

interface QuestionBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
  error?: string;
  currentStudents?: any[]; // استقبال قائمة الطلاب بالاسم الصحيح
  participants?: any[];
}

export const QuestionBuilder: React.FC<QuestionBuilderProps> = ({ questions, onChange, error, currentStudents }) => {
  const [quizType, setQuizType] = useState<QuestionType>('MULTIPLE_CHOICE');
  const [isAdding, setIsAdding] = useState(false);

  // حالات الإدخال المشتركة
  const [questionText, setQuestionText] = useState('');
  const [questionMediaUrl, setQuestionMediaUrl] = useState(''); // حالة إضافة الوسائط

  // حالات اختيار من متعدد (من سيربح المليون)
  const [mcOptions, setMcOptions] = useState(['', '', '', '']);
  const [mcCorrectIndex, setMcCorrectIndex] = useState<number>(0);
  const [mcImages, setMcImages] = useState<string[]>(['', '', '', '']);

  // 🌟 دالة مساعدة لضغط الصور وتصغير حجمها لمنع امتلاء ذاكرة المتصفح (localStorage)
  const compressAndResizeImage = (file: File, callback: (compressedBase64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // تقليص الأبعاد القصوى للصورة لتناسب العرض والسرعة
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // تحويل الصورة إلى JPEG بضغط جودة 70% لحماية الـ localStorage من الانهيار
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        callback(compressedDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleMcImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت.');
      e.target.value = '';
      return;
    }

    compressAndResizeImage(file, (compressedResult) => {
      setMcImages(prev => {
        const newImages = [...prev];
        newImages[index] = compressedResult;
        return newImages;
      });
    });
    e.target.value = '';
  };

  // دالة معالجة صور سؤال التوصيل (العمود أ والعمود ب) مع الضغط التلقائي
  const handlePairImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت.');
      e.target.value = '';
      return;
    }

    compressAndResizeImage(file, (compressedResult) => {
      setMatchingPairs(prev => {
        const newPairs = [...prev];
        if (side === 'left') {
          newPairs[index].leftImage = compressedResult;
        } else {
          newPairs[index].rightImage = compressedResult;
        }
        return newPairs;
      });
    });
    e.target.value = '';
  };

  // حالات صح أو خطأ
  const [tfCorrect, setTfCorrect] = useState<boolean>(true);
  // حالات سؤال التوصيل (العمود أ والعمود ب) مدعوم بالصور 🌟
  const [matchingPairs, setMatchingPairs] = useState<{left: string, leftImage?: string, right: string, rightImage?: string}[]>([
    { left: '', leftImage: '', right: '', rightImage: '' }, 
    { left: '', leftImage: '', right: '', rightImage: '' }, 
    { left: '', leftImage: '', right: '', rightImage: '' }
  ]);

  // حالات أكمل / وبقية الأنواع المباشرة
  const [singleAnswer, setSingleAnswer] = useState('');
  // حالة ربط السؤال بطالب معين
  const [targetItemId, setTargetItemId] = useState<string>('');
  // 🌟 حالة الزمن المخصص للسؤال
  const [timeLimit, setTimeLimit] = useState<number>(30);

  const handleAddClick = () => {
    setIsAdding(true);
    setQuestionText(quizType === 'MATCHING' ? 'قم بتوصيل العبارة في العمود (أ) مع ما يناسبها في العمود (ب)' : '');
    setQuestionMediaUrl('');
    setTimeLimit(30);
    setMcOptions(['', '', '', '']);
    setMcImages(['', '', '', '']);
    setMcCorrectIndex(0);
    setTfCorrect(true);
    setSingleAnswer('');
    setMatchingPairs([
      { left: '', leftImage: '', right: '', rightImage: '' }, 
      { left: '', leftImage: '', right: '', rightImage: '' }
    ]);
    setTargetItemId('');
  };

  const handleSaveQuestion = () => {
    // 🌟 تعيين نص افتراضي ذكي لسؤال التوصيل في حال تركه المعلم فارغاً
    const finalQuestionText = (quizType === 'MATCHING' && !questionText.trim()) 
      ? 'قم بتوصيل العبارة في العمود (أ) مع ما يناسبها في العمود (ب)' 
      : questionText;

    if (!finalQuestionText.trim()) {
      alert('الرجاء إدخال نص السؤال');
      return;
    }

    let options: AnswerOption[] = [];

    if (quizType === 'MULTIPLE_CHOICE') {
      // التحقق الذكي: هل يوجد خيار لا يحتوي على نص ولا يحتوي على صورة؟
      const isInvalid = mcOptions.some((text, index) => {
        const hasText = text && text.trim().length > 0;
        const hasImage = mcImages[index] && mcImages[index].length > 0;
        return !hasText && !hasImage; 
      });

      if (isInvalid) {
        alert('الرجاء إدخال نص أو إرفاق صورة لكل خيار من الخيارات الأربعة.');
        return;
      }

      // بناء الخيارات مع تمرير الصورة بشكل صريح ومضمون
      options = mcOptions.map((text, index) => {
        const option: AnswerOption = {
          id: Math.random().toString(36).substring(2, 9),
          text: text.trim(), // نمرر النص حتى لو كان فارغاً
          isCorrect: index === mcCorrectIndex,
        };
        
        // استخدام any لتخطي قيود واجهة البيانات وإجبار النظام على حفظ الصورة
        if (mcImages[index]) {
          (option as any).imageUrl = mcImages[index];
        }
        
        return option;
      });
    } else if (quizType === 'TRUE_FALSE') {
      options = [
        { id: Math.random().toString(36).substring(2, 9), text: 'صح', isCorrect: tfCorrect === true },
        { id: Math.random().toString(36).substring(2, 9), text: 'خطأ', isCorrect: tfCorrect === false }
      ];
    } else if (quizType === 'MATCHING') {
      // استخلاص الأزواج المكتملة فقط (نص أو صورة في الكلا الجانبين) وتجاهل الحقول الفارغة تلقائياً
      const validPairs = matchingPairs.filter(
        p => (p.left.trim() || p.leftImage) && (p.right.trim() || p.rightImage)
      );

      if (validPairs.length < 2) {
        alert('الرجاء إدخال زوجين من العناصر المكتملة على الأقل لسؤال التوصيل.');
        return;
      }

      options = validPairs.map(p => ({
        id: Math.random().toString(36).substring(2, 9),
        text: JSON.stringify({ left: p.left.trim(), leftImage: p.leftImage, right: p.right.trim(), rightImage: p.rightImage }),
        isCorrect: true 
      }));
    } else {
      if (!singleAnswer.trim()) {
        alert('الرجاء إدخال الإجابة الصحيحة');
        return;
      }
      options = [
        { id: Math.random().toString(36).substring(2, 9), text: singleAnswer, isCorrect: true }
      ];
    }

    const newQuestion: Question = {
      id: Math.random().toString(36).substring(2, 9),
      libraryId: 'local_session_bank',
      text: finalQuestionText, // استخدام النص النهائي (سواء أدخله المعلم أو الافتراضي)
      type: quizType,
      difficulty: 'MEDIUM',
      options,
      ...(targetItemId ? { targetItemId } : {}), 
      ...({ timeLimit } as any), 
      ...(questionMediaUrl ? { mediaUrl: questionMediaUrl } as any : {}) 
    };

    onChange([...questions, newQuestion]);
    setIsAdding(false);
  };

  const handleRemoveQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('عذراً، حجم الصورة كبير جداً! يرجى اختيار صورة بحجم أقل من 5 ميجابايت.');
      e.target.value = '';
      return;
    }

    compressAndResizeImage(file, (compressedResult) => {
      setQuestionMediaUrl(compressedResult);
    });
    e.target.value = '';
  };

  return (
    <div className="setup-card" style={{ marginTop: '1.5rem', direction: 'rtl' }}>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>نوع المسابقة</label>
        <select 
          className="form-input" 
          value={quizType}
          onChange={(e) => {
            const newType = e.target.value as QuestionType;
            setQuizType(newType);
            setQuestionText(newType === 'MATCHING' ? 'قم بتوصيل العبارة في العمود (أ) مع ما يناسبها في العمود (ب)' : '');
            setIsAdding(false);
          }}
          style={{ width: '100%', padding: '10px', fontSize: '1rem', backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '6px', marginBottom: '15px' }}
        >
          <option value="MULTIPLE_CHOICE">من سيربح المليون (اختيار من متعدد)</option>
          <option value="FILL_BLANK">أكمل</option>
          <option value="TRUE_FALSE">صح أو خطأ</option>
          <option value="MATCHING">وصل</option>
          <option value="ORDERING">ترتيب</option>
          <option value="PRACTICAL">بطاقات</option>
          <option value="ESSAY">سؤال مقالي</option>
        </select>

        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>حدد الزمن المخصص للإجابة (بالثواني)</label>
        <input
          type="number"
          min="5"
          max="300"
          className="form-input"
          value={timeLimit}
          onChange={(e) => setTimeLimit(Number(e.target.value))}
          style={{ width: '100%', padding: '10px', backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '6px' }}
        />
      </div>

      {!isAdding ? (
        <button 
          onClick={handleAddClick} 
          style={{ padding: '12px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '1.1rem' }}
        >
          ➕ إضافة سؤال
        </button>
      ) : (
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6', marginTop: '15px', color: '#2c3e50' }}>
          
          {/* القائمة المنسدلة لاختيار الطالب المرتبط بالسؤال */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>تخصيص السؤال لطالب معين (اختياري)</label>
            <select 
              className="form-input"
              value={targetItemId}
              onChange={(e) => setTargetItemId(e.target.value)}
              style={{ width: '100%', padding: '10px', fontSize: '1rem', backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '6px' }}
            >
              <option value="">عشوائي (يُسأل لأي طالب)</option>
              {currentStudents && currentStudents.map(student => (
                <option key={student.id} value={student.id}>
                  {student.displayId || student.text}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              {quizType === 'MATCHING' ? 'نص السؤال (اختياري - يوجد نص افتراضي)' : 'نص السؤال'}
            </label>
            <textarea
                className="form-input"
                value={questionText}
                onChange={(e) => {
                  setQuestionText(e.target.value);
                  e.target.style.height = 'auto'; // إعادة ضبط الارتفاع
                  e.target.style.height = `${e.target.scrollHeight}px`; // التمدد التلقائي
                }}
                placeholder={quizType === 'MATCHING' ? 'قم بتوصيل العبارة في العمود (أ) مع ما يناسبها في العمود (ب)' : 'اكتب سؤالك هنا... (اضغط Enter للنزول لسطر جديد)'}
                style={{ width: '100%', padding: '10px', backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '6px', resize: 'none', overflow: 'hidden', minHeight: '50px', fontFamily: 'inherit' }}
                rows={2}
              />
            
            {/* إخفاء زر الصورة العام في سؤال التوصيل لتقليل الفوضى، وتجميله لبقية الأسئلة */}
            {quizType !== 'MATCHING' && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{ flex: 1, cursor: 'pointer', backgroundColor: '#fdfdfd', border: '1px dashed #3498db', borderRadius: '6px', padding: '10px', textAlign: 'center', color: '#3498db', fontWeight: 'bold', transition: 'all 0.2s' }}>
                    📸 إرفاق صورة للسؤال (اختياري)
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
                
                {questionMediaUrl && (
                  <div style={{ position: 'relative', width: 'fit-content', marginTop: '10px' }}>
                    <img 
                      src={questionMediaUrl} 
                      alt="معاينة" 
                      style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', border: '2px solid #bdc3c7', objectFit: 'contain', backgroundColor: '#fff' }} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        setQuestionMediaUrl('');
                      }}
                    />
                    <button 
                      onClick={() => setQuestionMediaUrl('')} 
                      style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                      title="إزالة الصورة"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

            {/* تم نقل حقل الزمن المخصص للإجابة إلى الأعلى أسفل نوع المسابقة */}

            {quizType === 'MULTIPLE_CHOICE' && (
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>الخيارات (حدد الإجابة الصحيحة)</label>
              {mcOptions.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                  <input 
                    type="radio" 
                    name="correctAnswer" 
                    checked={mcCorrectIndex === idx} 
                    onChange={() => setMcCorrectIndex(idx)} 
                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input 
                        type="text" 
                        id={`mc-option-${idx}`}
                        className="form-input" 
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...mcOptions];
                          newOpts[idx] = e.target.value;
                          setMcOptions(newOpts);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const nextIdx = idx + 1;
                            if (nextIdx < 4) {
                              const nextInput = document.getElementById(`mc-option-${nextIdx}`);
                              nextInput?.focus();
                            }
                          }
                        }}
                        placeholder={`الاختيار ${idx + 1}`}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                      />
                      <label style={{ cursor: 'pointer', backgroundColor: '#ecf0f1', padding: '8px', borderRadius: '6px', border: '1px solid #bdc3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="إرفاق صورة للخيار">
                        📸
                        <input type="file" accept="image/*" onChange={(e) => handleMcImageUpload(e, idx)} style={{ display: 'none' }} />
                      </label>
                    </div>
                    {mcImages[idx] && (
                      <div style={{ position: 'relative', width: 'fit-content' }}>
                        <img src={mcImages[idx]} alt={`خيار ${idx + 1}`} style={{ height: '60px', borderRadius: '4px', border: '1px solid #ccc', objectFit: 'contain' }} />
                        <button onClick={() => { const newImgs = [...mcImages]; newImgs[idx] = ''; setMcImages(newImgs); }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {quizType === 'TRUE_FALSE' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>الإجابة الصحيحة</label>
              <div style={{ display: 'flex', gap: '30px', padding: '10px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '6px' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                  <input type="radio" checked={tfCorrect === true} onChange={() => setTfCorrect(true)} style={{ transform: 'scale(1.2)' }} /> صح
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                  <input type="radio" checked={tfCorrect === false} onChange={() => setTfCorrect(false)} style={{ transform: 'scale(1.2)' }} /> خطأ
                </label>
              </div>
            </div>
          )}

          {quizType === 'MATCHING' && (
            <div style={{ marginBottom: '15px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <label style={{ display: 'block', marginBottom: '15px', fontWeight: 'bold', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>أزواج التوصيل (العمود أ وما يقابله في العمود ب)</label>
              {matchingPairs.map((pair, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'stretch', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #dcdde1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  
                  {/* العمود أ (يمين) */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={pair.left}
                        onChange={(e) => {
                          const newPairs = [...matchingPairs];
                          newPairs[idx].left = e.target.value;
                          setMatchingPairs(newPairs);
                        }}
                        placeholder={`نص عنصر ${idx + 1} (العمود أ)`}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                      />
                      <label style={{ cursor: 'pointer', backgroundColor: '#ecf0f1', padding: '8px', borderRadius: '6px', border: '1px solid #bdc3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="إرفاق صورة">
                        📸
                        <input type="file" accept="image/*" onChange={(e) => handlePairImageUpload(e, idx, 'left')} style={{ display: 'none' }} />
                      </label>
                    </div>
                    {pair.leftImage && (
                      <div style={{ position: 'relative', width: 'fit-content' }}>
                        <img src={pair.leftImage} alt="عمود أ" style={{ height: '60px', borderRadius: '4px', border: '1px solid #ccc', objectFit: 'contain' }} />
                        <button onClick={() => { const n = [...matchingPairs]; n[idx].leftImage = ''; setMatchingPairs(n); }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', color: '#95a5a6' }}>🔗</div>

                  {/* العمود ب (يسار) */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={pair.right}
                        onChange={(e) => {
                          const newPairs = [...matchingPairs];
                          newPairs[idx].right = e.target.value;
                          setMatchingPairs(newPairs);
                        }}
                        placeholder={`نص الإجابة ${idx + 1} (العمود ب)`}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                      />
                      <label style={{ cursor: 'pointer', backgroundColor: '#ecf0f1', padding: '8px', borderRadius: '6px', border: '1px solid #bdc3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="إرفاق صورة">
                        📸
                        <input type="file" accept="image/*" onChange={(e) => handlePairImageUpload(e, idx, 'right')} style={{ display: 'none' }} />
                      </label>
                    </div>
                    {pair.rightImage && (
                      <div style={{ position: 'relative', width: 'fit-content' }}>
                        <img src={pair.rightImage} alt="عمود ب" style={{ height: '60px', borderRadius: '4px', border: '1px solid #ccc', objectFit: 'contain' }} />
                        <button onClick={() => { const n = [...matchingPairs]; n[idx].rightImage = ''; setMatchingPairs(n); }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    )}
                  </div>

                  {matchingPairs.length > 2 && (
                    <button
                      onClick={() => {
                        const newPairs = matchingPairs.filter((_, i) => i !== idx);
                        setMatchingPairs(newPairs);
                      }}
                      style={{ padding: '0 10px', backgroundColor: '#ffeaa7', color: '#d63031', border: '1px solid #fab1a0', borderRadius: '6px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}
                      title="حذف هذا الزوج"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setMatchingPairs([...matchingPairs, { left: '', leftImage: '', right: '', rightImage: '' }])}
                style={{ marginTop: '5px', padding: '10px 15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
              >
                ➕ إضافة زوج آخر
              </button>
            </div>
          )}
          {(quizType === 'FILL_BLANK' || quizType === 'ESSAY' || quizType === 'ORDERING' || quizType === 'PRACTICAL') && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>الإجابة الصحيحة</label>
              <input 
                type="text" 
                className="form-input"
                value={singleAnswer}
                onChange={(e) => setSingleAnswer(e.target.value)}
                placeholder="اكتب الإجابة هنا..."
                style={{ width: '100%', padding: '10px', backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '6px' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
            <button 
              onClick={handleSaveQuestion} 
              style={{ padding: '12px 20px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: 1, fontSize: '1rem' }}
            >
              حفظ السؤال
            </button>
            <button 
              onClick={() => setIsAdding(false)} 
              style={{ padding: '12px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div style={{ marginTop: '25px' }}>
          <h4 style={{ marginBottom: '15px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>الأسئلة المضافة:</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {questions.map((q, index) => (
              <li key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f8f9fa', marginBottom: '10px', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '1.1rem' }}>{index + 1}. {q.text}</strong>
                  <span style={{ fontSize: '0.85rem', color: '#7f8c8d', marginRight: '10px', backgroundColor: '#ecf0f1', padding: '3px 8px', borderRadius: '12px' }}>
                    {q.type === 'MULTIPLE_CHOICE' ? 'من سيربح المليون' : q.type === 'TRUE_FALSE' ? 'صح أو خطأ' : q.type === 'FILL_BLANK' ? 'أكمل' : q.type === 'MATCHING' ? 'وصل' : q.type === 'ORDERING' ? 'ترتيب' : q.type === 'PRACTICAL' ? 'بطاقات' : 'سؤال مباشر'}
                  </span>
                  {/* إظهار شارة مخصصة إذا كان السؤال مرتبطاً بطالب معين */}
                  {q.targetItemId && (
                    <span style={{ fontSize: '0.85rem', color: '#8e44ad', marginRight: '10px', backgroundColor: '#f5eef8', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                      📌 مخصص لـ: {currentStudents?.find(i => i.id === q.targetItemId)?.displayId || currentStudents?.find(i => i.id === q.targetItemId)?.text || 'طالب محدد'}
                    </span>
                  )}
                </div>
                <button onClick={() => handleRemoveQuestion(q.id)} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', padding: '5px 10px' }}>
                  حذف 🗑️
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {error && <p className="form-error" style={{ marginTop: '15px', color: '#e74c3c', fontWeight: 'bold' }}>{error}</p>}
    </div>
  );
};