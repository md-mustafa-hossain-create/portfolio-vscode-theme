export type OSPlatform = 'macos' | 'windows' | 'linux' | 'android' | 'ios';

export type ScreenCategory = 'phone' | 'tablet' | 'desktop' | 'ultrawide';

export interface PlatformInfo {
  os: OSPlatform;
  isTouch: boolean;
  screenCategory: ScreenCategory;
  isApple: boolean;
  isMobile: boolean;
  isStandalone: boolean;
}

export function detectNativeOS(): OSPlatform {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'windows';
  }

  const ua = (navigator.userAgent || '').toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();

  if (/iphone|ipad|ipod/.test(ua) || (platform.includes('mac') && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  if (/macintosh|mac os x|macintel/.test(ua) || platform.includes('mac')) {
    return 'macos';
  }
  if (/linux|x11/.test(ua) || platform.includes('linux')) {
    return 'linux';
  }
  return 'windows';
}

export function detectScreenCategory(width: number): ScreenCategory {
  if (width < 640) return 'phone';
  if (width < 1024) return 'tablet';
  if (width < 1600) return 'desktop';
  return 'ultrawide';
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

export function isPWAStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export const OS_META: Record<
  OSPlatform,
  {
    name: string;
    icon: string;
    titlebarStyle: 'mac-traffic' | 'win-controls' | 'linux-controls' | 'mobile-header';
    shellPrompt: string;
    description: string;
  }
> = {
  macos: {
    name: 'macOS',
    icon: 'apple',
    titlebarStyle: 'mac-traffic',
    shellPrompt: 'mustafa@macbook-pro mustafa-dev-portfolio %',
    description: 'Apple macOS with left-side traffic light controls and Command shortcuts',
  },
  windows: {
    name: 'Windows 11',
    icon: 'windows',
    titlebarStyle: 'win-controls',
    shellPrompt: 'PS C:\\Users\\Mustafa\\mustafa-dev-portfolio>',
    description: 'Microsoft Windows 11 with right-side fluent window controls',
  },
  linux: {
    name: 'Linux (Ubuntu)',
    icon: 'linux',
    titlebarStyle: 'linux-controls',
    shellPrompt: 'mustafa@ubuntu-laptop:~/mustafa-dev-portfolio$',
    description: 'Ubuntu / GNOME Linux with rounded header and shell prompt',
  },
  android: {
    name: 'Android',
    icon: 'android',
    titlebarStyle: 'mobile-header',
    shellPrompt: 'root@pixel-android:/workspace #',
    description: 'Google Android with Material touch actions and bottom thumb bar',
  },
  ios: {
    name: 'iOS / iPadOS',
    icon: 'iphone',
    titlebarStyle: 'mobile-header',
    shellPrompt: 'mustafa@iphone-pro:~/mustafa-dev $',
    description: 'Apple iOS with safe-area notch layout and translucent bar',
  },
};

export function formatShortcut(cmd: string, os: OSPlatform): string {
  if (os === 'macos' || os === 'ios') {
    return cmd
      .replace(/Ctrl\+/g, '⌘')
      .replace(/Alt\+/g, '⌥')
      .replace(/Shift\+/g, '⇧');
  }
  return cmd;
}
