export interface WheelTheme {
  id: string;
  name: string;
  colors: {
    slices: string[];
    text?: string;
  };
  scene: {
    perspective: string;
    tiltStopped: string;
    tiltSpinning: string;
    dropShadow: string;
  };
  ring: {
    background: string;
    boxShadow: string;
    border: string;
  };
  center: {
    background: string;
    boxShadow: string;
    border: string;
    hasPulse?: boolean;
  };
  pointer: {
    baseColor: string;
    topColor: string;
    dropShadow: string;
    hasBounce?: boolean;
  };
  stand: {
    background: string;
    boxShadow: string;
  };
  effects: {
    hasMotionBlur?: boolean;
    hasGlassDome?: boolean;
    hasShockwave?: boolean;
  };
  neon: {
    count: number;
    idleClass?: string;
    spinClass?: string;
  };
}

// لواجهة التوافق مع الكود القديم إن وجد
export interface ThemeConfig {
  id: string;
  name: string;
  colors: string[];
  outerBorder: string;
  centerColor: string;
  pointerColor: string;
  textColor: string;
  shadow: string;
}

export const wheelThemes: Record<string, WheelTheme> = {
  cyber: {
    id: 'cyber',
    name: 'سايبر نيون (مظلم)',
    colors: {
      slices: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'],
      text: '#ffffff'
    },
    scene: {
      perspective: '1000px',
      tiltStopped: 'rotateX(12deg) rotateY(0deg)',
      tiltSpinning: 'rotateX(22deg) rotateY(4deg)',
      dropShadow: 'drop-shadow(0 20px 30px rgba(59, 130, 246, 0.4))'
    },
    ring: {
      background: 'linear-gradient(145deg, #1f2937, #111827)',
      boxShadow: '0 0 25px rgba(59, 130, 246, 0.6), inset 0 0 15px rgba(0,0,0,0.8)',
      border: '4px solid #3b82f6'
    },
    center: {
      background: 'radial-gradient(circle, #3b82f6 0%, #1f2937 100%)',
      boxShadow: '0 0 20px #3b82f6',
      border: '3px solid #60a5fa',
      hasPulse: true
    },
    pointer: {
      baseColor: '#fbbf24',
      topColor: '#f59e0b',
      dropShadow: 'drop-shadow(0 0 8px #fbbf24)',
      hasBounce: true
    },
    stand: {
      background: 'linear-gradient(to bottom, #374151, #111827)',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.8)'
    },
    effects: {
      hasMotionBlur: true,
      hasGlassDome: true,
      hasShockwave: true
    },
    neon: {
      count: 12,
      idleClass: 'bulb-idle',
      spinClass: 'bulb-spin'
    }
  },
  classic: {
    id: 'classic',
    name: 'كلاسيكي ملون (أساسي)',
    colors: {
      slices: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'],
      text: '#ffffff'
    },
    scene: {
      perspective: '1000px',
      tiltStopped: 'rotateX(5deg) rotateY(0deg)',
      tiltSpinning: 'rotateX(15deg) rotateY(0deg)',
      dropShadow: 'drop-shadow(0 15px 20px rgba(0, 0, 0, 0.3))'
    },
    ring: {
      background: 'linear-gradient(145deg, #ffffff, #e2e8f0)',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(0,0,0,0.1)',
      border: '6px solid #cbd5e1'
    },
    center: {
      background: 'radial-gradient(circle, #ffffff 0%, #cbd5e1 100%)',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
      border: '4px solid #94a3b8',
      hasPulse: false
    },
    pointer: {
      baseColor: '#1e293b',
      topColor: '#0f172a',
      dropShadow: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))',
      hasBounce: true
    },
    stand: {
      background: 'linear-gradient(to bottom, #94a3b8, #475569)',
      boxShadow: '0 8px 15px rgba(0, 0, 0, 0.3)'
    },
    effects: {
      hasMotionBlur: true,
      hasGlassDome: false,
      hasShockwave: false
    },
    neon: {
      count: 8,
      idleClass: 'bulb-idle',
      spinClass: 'bulb-spin'
    }
  },
  emerald: {
    id: 'emerald',
    name: 'زمردي ملكي (أخضر)',
    colors: {
      slices: ['#059669', '#10b981', '#34d399', '#047857', '#065f46', '#022c22'],
      text: '#ffffff'
    },
    scene: {
      perspective: '1000px',
      tiltStopped: 'rotateX(10deg) rotateY(0deg)',
      tiltSpinning: 'rotateX(20deg) rotateY(2deg)',
      dropShadow: 'drop-shadow(0 15px 25px rgba(5, 150, 105, 0.4))'
    },
    ring: {
      background: 'linear-gradient(145deg, #064e3b, #022c22)',
      boxShadow: '0 0 25px rgba(16, 185, 129, 0.5), inset 0 0 15px rgba(0,0,0,0.9)',
      border: '5px solid #10b981'
    },
    center: {
      background: 'radial-gradient(circle, #10b981 0%, #022c22 100%)',
      boxShadow: '0 0 15px #10b981',
      border: '3px solid #34d399',
      hasPulse: true
    },
    pointer: {
      baseColor: '#fbbf24',
      topColor: '#f59e0b',
      dropShadow: 'drop-shadow(0 0 10px #fbbf24)',
      hasBounce: true
    },
    stand: {
      background: 'linear-gradient(to bottom, #065f46, #022c22)',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.7)'
    },
    effects: {
      hasMotionBlur: true,
      hasGlassDome: true,
      hasShockwave: true
    },
    neon: {
      count: 10,
      idleClass: 'bulb-idle',
      spinClass: 'bulb-spin'
    }
  },
  pinky: {
    id: 'pinky',
    name: 'الوردي اللطيف',
    colors: {
      slices: ['#ff9a9e', '#fecfef', '#ffc3a0', '#ffafbd', '#ffc371', '#ff9a9e'],
      text: '#5d4037'
    },
    scene: {
      perspective: '1000px',
      tiltStopped: 'rotateX(8deg) rotateY(0deg)',
      tiltSpinning: 'rotateX(18deg) rotateY(-2deg)',
      dropShadow: 'drop-shadow(0 15px 20px rgba(255, 117, 140, 0.3))'
    },
    ring: {
      background: 'linear-gradient(145deg, #fff0f5, #ffe4e1)',
      boxShadow: '0 10px 25px rgba(255, 117, 140, 0.3), inset 0 0 10px rgba(255,182,193,0.5)',
      border: '5px solid #ff758c'
    },
    center: {
      background: 'radial-gradient(circle, #ffffff 0%, #ffc3a0 100%)',
      boxShadow: '0 0 12px #ff758c',
      border: '3px solid #ff9a9e',
      hasPulse: false
    },
    pointer: {
      baseColor: '#ff758c',
      topColor: '#ff4e50',
      dropShadow: 'drop-shadow(0 4px 8px rgba(255, 117, 140, 0.5))',
      hasBounce: true
    },
    stand: {
      background: 'linear-gradient(to bottom, #ffafbd, #ffc3a0)',
      boxShadow: '0 8px 15px rgba(255, 117, 140, 0.3)'
    },
    effects: {
      hasMotionBlur: true,
      hasGlassDome: true,
      hasShockwave: false
    },
    neon: {
      count: 8,
      idleClass: 'bulb-idle',
      spinClass: 'bulb-spin'
    }
  },
  neon_glow: {
    id: 'neon_glow',
    name: 'نيون مضيء (حماسي)',
    colors: {
      slices: ['#FF00FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000', '#FF00FF'],
      text: '#000000'
    },
    scene: {
      perspective: '1000px',
      tiltStopped: 'rotateX(15deg) rotateY(0deg)',
      tiltSpinning: 'rotateX(25deg) rotateY(5deg)',
      dropShadow: 'drop-shadow(0 0 30px #FF00FF)'
    },
    ring: {
      background: 'linear-gradient(145deg, #111, #000)',
      boxShadow: '0 0 25px #00FFFF, inset 0 0 20px #FF00FF',
      border: '4px solid #FFFFFF'
    },
    center: {
      background: 'radial-gradient(circle, #00FFFF 0%, #000000 100%)',
      boxShadow: '0 0 25px #00FFFF',
      border: '3px solid #FF00FF',
      hasPulse: true
    },
    pointer: {
      baseColor: '#00FFFF',
      topColor: '#FF00FF',
      dropShadow: 'drop-shadow(0 0 12px #00FFFF)',
      hasBounce: true
    },
    stand: {
      background: 'linear-gradient(to bottom, #222, #000)',
      boxShadow: '0 10px 25px rgba(255, 0, 255, 0.4)'
    },
    effects: {
      hasMotionBlur: true,
      hasGlassDome: true,
      hasShockwave: true
    },
    neon: {
      count: 14,
      idleClass: 'bulb-idle',
      spinClass: 'bulb-spin'
    }
  },
  sunset: {
    id: 'sunset',
    name: 'غروب الشمس (دافئ)',
    colors: {
      slices: ['#FF4E50', '#F9D423', '#FF8E53', '#F6D365', '#FDA085', '#F76B1C'],
      text: '#3E2723'
    },
    scene: {
      perspective: '1000px',
      tiltStopped: 'rotateX(10deg) rotateY(0deg)',
      tiltSpinning: 'rotateX(20deg) rotateY(-3deg)',
      dropShadow: 'drop-shadow(0 15px 25px rgba(255, 78, 80, 0.4))'
    },
    ring: {
      background: 'linear-gradient(145deg, #FFF3E0, #FFE0B2)',
      boxShadow: '0 10px 25px rgba(255, 78, 80, 0.3), inset 0 0 10px rgba(247,107,28,0.3)',
      border: '5px solid #FF4E50'
    },
    center: {
      background: 'radial-gradient(circle, #FFF3E0 0%, #FF8E53 100%)',
      boxShadow: '0 0 15px #FF4E50',
      border: '3px solid #F9D423',
      hasPulse: false
    },
    pointer: {
      baseColor: '#D32F2F',
      topColor: '#FF4E50',
      dropShadow: 'drop-shadow(0 4px 8px rgba(211, 47, 47, 0.5))',
      hasBounce: true
    },
    stand: {
      background: 'linear-gradient(to bottom, #F76B1C, #D32F2F)',
      boxShadow: '0 8px 18px rgba(255, 78, 80, 0.4)'
    },
    effects: {
      hasMotionBlur: true,
      hasGlassDome: true,
      hasShockwave: true
    },
    neon: {
      count: 10,
      idleClass: 'bulb-idle',
      spinClass: 'bulb-spin'
    }
  },
  ocean: {
    id: 'ocean',
    name: 'أعماق المحيط (أزرق)',
    colors: {
      slices: ['#2E3192', '#1BFFFF', '#009245', '#FCEE21', '#00A8C5', '#0288D1'],
      text: '#ffffff'
    },
    scene: {
      perspective: '1000px',
      tiltStopped: 'rotateX(10deg) rotateY(0deg)',
      tiltSpinning: 'rotateX(20deg) rotateY(3deg)',
      dropShadow: 'drop-shadow(0 15px 25px rgba(1, 87, 155, 0.4))'
    },
    ring: {
      background: 'linear-gradient(145deg, #01579B, #002171)',
      boxShadow: '0 0 25px rgba(27, 255, 255, 0.5), inset 0 0 15px rgba(0,0,0,0.8)',
      border: '4px solid #1BFFFF'
    },
    center: {
      background: 'radial-gradient(circle, #E1F5FE 0%, #0288D1 100%)',
      boxShadow: '0 0 15px #1BFFFF',
      border: '3px solid #00A8C5',
      hasPulse: true
    },
    pointer: {
      baseColor: '#FF6F00',
      topColor: '#FF8F00',
      dropShadow: 'drop-shadow(0 0 8px #FF6F00)',
      hasBounce: true
    },
    stand: {
      background: 'linear-gradient(to bottom, #0288D1, #002171)',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.7)'
    },
    effects: {
      hasMotionBlur: true,
      hasGlassDome: true,
      hasShockwave: true
    },
    neon: {
      count: 12,
      idleClass: 'bulb-idle',
      spinClass: 'bulb-spin'
    }
  },
  space: {
    id: 'space',
    name: 'الفضاء الكوني (Galaxy Glow)',
    colors: {
      slices: ['#0f172a', '#581c87', '#1e1b4b', '#312e81', '#4c1d95', '#0284c7'],
      text: '#ffffff'
    },
    scene: {
      perspective: '1000px',
      tiltStopped: 'rotateX(15deg) rotateY(0deg)',
      tiltSpinning: 'rotateX(25deg) rotateY(4deg)',
      dropShadow: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.5))'
    },
    ring: {
      background: 'linear-gradient(145deg, #0f172a, #020617)',
      boxShadow: '0 0 30px #a855f7, inset 0 0 20px #38bdf8',
      border: '4px solid #c084fc'
    },
    center: {
      background: 'radial-gradient(circle, #a855f7 0%, #0f172a 100%)',
      boxShadow: '0 0 25px #a855f7',
      border: '3px solid #e879f9',
      hasPulse: true
    },
    pointer: {
      baseColor: '#38bdf8',
      topColor: '#c084fc',
      dropShadow: 'drop-shadow(0 0 12px #38bdf8)',
      hasBounce: true
    },
    stand: {
      background: 'linear-gradient(to bottom, #1e1b4b, #020617)',
      boxShadow: '0 10px 30px rgba(168, 85, 247, 0.4)'
    },
    effects: {
      hasMotionBlur: true,
      hasGlassDome: true,
      hasShockwave: true
    },
    neon: {
      count: 16,
      idleClass: 'bulb-space-idle',
      spinClass: 'bulb-space-spin'
    }
  },
  vintage: {
    id: 'vintage',
    name: 'الكنز القديم (Vintage Wood)',
    colors: {
      slices: ['#78350f', '#92400e', '#b45309', '#d97706', '#451a03', '#7c2d12'],
      text: '#fef3c7'
    },
    scene: {
      perspective: '1000px',
      tiltStopped: 'rotateX(8deg) rotateY(0deg)',
      tiltSpinning: 'rotateX(16deg) rotateY(-2deg)',
      dropShadow: 'drop-shadow(0 15px 25px rgba(69, 26, 3, 0.6))'
    },
    ring: {
      background: 'linear-gradient(145deg, #451a03, #292524)',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6), inset 0 0 15px rgba(0,0,0,0.8)',
      border: '6px solid #d97706'
    },
    center: {
      background: 'radial-gradient(circle, #f59e0b 0%, #451a03 100%)',
      boxShadow: '0 0 15px #d97706',
      border: '4px solid #b45309',
      hasPulse: false
    },
    pointer: {
      baseColor: '#f59e0b',
      topColor: '#78350f',
      dropShadow: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))',
      hasBounce: true
    },
    stand: {
      background: 'linear-gradient(to bottom, #78350f, #292524)',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.8)'
    },
    effects: {
      hasMotionBlur: true,
      hasGlassDome: false,
      hasShockwave: false
    },
    neon: {
      count: 12,
      idleClass: 'bulb-gold-idle',
      spinClass: 'bulb-gold-idle'
    }
  },
  retro: {
    id: 'retro',
    name: 'ريترو آركيد (Retro Arcade 80s)',
    colors: {
      slices: ['#ff007f', '#00f0ff', '#ffb700', '#00ff66', '#7000ff', '#ff0055'],
      text: '#ffffff'
    },
    scene: {
      perspective: '1000px',
      tiltStopped: 'rotateX(14deg) rotateY(0deg)',
      tiltSpinning: 'rotateX(24deg) rotateY(4deg)',
      dropShadow: 'drop-shadow(0 0 30px rgba(255, 0, 127, 0.5))'
    },
    ring: {
      background: 'linear-gradient(145deg, #18181b, #09090b)',
      boxShadow: '0 0 25px #ff007f, inset 0 0 20px #00f0ff',
      border: '4px solid #00f0ff'
    },
    center: {
      background: 'radial-gradient(circle, #ff007f 0%, #18181b 100%)',
      boxShadow: '0 0 20px #ff007f',
      border: '3px solid #ffb700',
      hasPulse: true
    },
    pointer: {
      baseColor: '#ffb700',
      topColor: '#ff007f',
      dropShadow: 'drop-shadow(0 0 10px #ffb700)',
      hasBounce: true
    },
    stand: {
      background: 'linear-gradient(to bottom, #27272a, #09090b)',
      boxShadow: '0 10px 25px rgba(255, 0, 127, 0.4)'
    },
    effects: {
      hasMotionBlur: true,
      hasGlassDome: true,
      hasShockwave: true
    },
    neon: {
      count: 12,
      idleClass: 'bulb-retro-idle',
      spinClass: 'bulb-retro-spin'
    }
  },
  crystal: {
    id: 'crystal',
    name: 'الكريستال والماس (Prism Crystal)',
    colors: {
      slices: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#f472b6', '#c084fc', '#a7f3d0'],
      text: '#0f172a'
    },
    scene: {
      perspective: '1000px',
      tiltStopped: 'rotateX(10deg) rotateY(0deg)',
      tiltSpinning: 'rotateX(20deg) rotateY(-2deg)',
      dropShadow: 'drop-shadow(0 15px 30px rgba(56, 189, 248, 0.4))'
    },
    ring: {
      background: 'linear-gradient(145deg, #ffffff, #f0f9ff)',
      boxShadow: '0 10px 30px rgba(56, 189, 248, 0.4), inset 0 0 20px rgba(255,255,255,0.9)',
      border: '5px solid #7dd3fc'
    },
    center: {
      background: 'radial-gradient(circle, #ffffff 0%, #bae6fd 100%)',
      boxShadow: '0 0 20px #38bdf8',
      border: '3px solid #ffffff',
      hasPulse: true
    },
    pointer: {
      baseColor: '#f472b6',
      topColor: '#c084fc',
      dropShadow: 'drop-shadow(0 0 10px #f472b6)',
      hasBounce: true
    },
    stand: {
      background: 'linear-gradient(to bottom, #bae6fd, #0284c7)',
      boxShadow: '0 8px 20px rgba(56, 189, 248, 0.3)'
    },
    effects: {
      hasMotionBlur: true,
      hasGlassDome: true,
      hasShockwave: true
    },
    neon: {
      count: 12,
      idleClass: 'bulb-crystal-idle',
      spinClass: 'bulb-crystal-spin'
    }
  }
};

// الأسماء المستعارة (Aliases)
wheelThemes['nature'] = wheelThemes['emerald'];
wheelThemes['candy'] = wheelThemes['pinky'];
wheelThemes['gold'] = wheelThemes['classic'];
wheelThemes['system'] = wheelThemes['cyber'];

// لتوفير التوافق مع أي جزء قديم في الكود يستخدم الاسم بالحروف الكبيرة
export const WHEEL_THEMES = wheelThemes as unknown as Record<string, ThemeConfig>;