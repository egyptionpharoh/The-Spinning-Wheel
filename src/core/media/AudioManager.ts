// src/core/media/AudioManager.ts

class AudioManager {
  private ctx: AudioContext | null = null;
  // ذاكرة التخزين المؤقت للملفات الصوتية بعد فك تشفيرها
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  // 🌟 دفتر المايسترو: قائمة لتتبع كل العازفين (الأصوات) المتواجدين على المسرح حالياً
  private activeSources: AudioBufferSourceNode[] = [];
  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  /**
   * دالة التحميل المسبق للأصوات الحقيقية
   * @param sounds كائن يحتوي على اسم الصوت ومسار الملف (مثال: { tick: '/assets/audio/tick.ogg' })
   */
  public async preload(sounds: Record<string, string>) {
    this.init();
    if (!this.ctx) return;

    const fetchPromises = Object.entries(sounds).map(async ([name, url]) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
        this.audioBuffers.set(name, audioBuffer);
      } catch (error) {
        console.error(`فشل تحميل الصوت: ${name} من المسار: ${url}`, error);
      }
    });

    // الانتظار حتى يتم جلب وفك تشفير جميع الملفات
    await Promise.all(fetchPromises);
  }

  /**
   * مشغل الأصوات الرئيسي
   * @param name اسم الصوت الذي تم تحميله في الذاكرة
   * @param options خيارات إضافية مثل سرعة التشغيل ومستوى الصوت
   */
  public play(name: string, options?: { playbackRate?: number; volume?: number }) {
    if (!this.ctx) this.init();
    
    const ctx = this.ctx;
    if (!ctx) return;

    // إعادة تشغيل السياق الصوتي إذا كان معلقاً (بسبب سياسات المتصفحات)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // جلب الصوت من الذاكرة
    const buffer = this.audioBuffers.get(name);
    if (!buffer) {
      console.warn(`الصوت [${name}] غير موجود في الذاكرة. تأكد من تحميله عبر دالة preload.`);
      return;
    }

    // إنشاء مشغل الصوت
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();

    source.buffer = buffer;
    
    // تطبيق سرعة التشغيل بشكل حقيقي (يعمل حصرياً مع AudioBuffer)
    if (options?.playbackRate !== undefined) {
      source.playbackRate.value = options.playbackRate;
    }

    // التحكم في مستوى الصوت
    if (options?.volume !== undefined) {
      gainNode.gain.value = options.volume;
    } else {
      gainNode.gain.value = 1; // المستوى الافتراضي
    }

    // ربط العقد الصوتية ببعضها وإرسالها للمخرج
    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 🌟 تسجيل العازف في دفتر المايسترو بمجرد بدء العزف
    this.activeSources.push(source);

    // 🌟 شطب اسم العازف من الدفتر تلقائياً بمجرد انتهائه من مقطوعته
    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    };

    // تشغيل الصوت فوراً
    source.start(0);
  }

  /**
   * 🌟 عصا المايسترو: إيقاف جميع العازفين النشطين فوراً
   */
  public stopAll() {
    this.activeSources.forEach(source => {
      try {
        source.stop(); // أمر التوقف الإجباري
      } catch (e) {
        // يتم تجاهل الخطأ تحسباً لو كان العازف قد توقف بالفعل من تلقاء نفسه
      }
    });
    this.activeSources = []; // تفريغ الدفتر بعد طرد الجميع
  }

  /**
   * تنظيف الذاكرة المؤقتة للأصوات   * يُفضل استدعاؤها فقط عند تدمير التطبيق بالكامل أو تغيير مساحة العمل جذرياً
   */
  public clearCache() {
    this.stopAll(); // 🌟 إيقاف العزف قبل إغلاق المسرح
    this.audioBuffers.clear();
  }
}

// تصدير نسخة واحدة (Singleton)
export const audioManager = new AudioManager();