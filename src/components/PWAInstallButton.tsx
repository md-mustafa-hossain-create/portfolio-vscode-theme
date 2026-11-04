import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Codicon } from './OfficialIcons';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'pill' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed or running as standalone PWA, suppress
  if (isInstalled) {
    return null;
  }

  // Chromium / Edge / Android native prompt flow
  if (isInstallable) {
    if (variant === 'pill') {
      return (
        <button
          type="button"
          onClick={install}
          title="Install MUSTAFA.dev as a native app on Windows, Mac, Linux, or Android"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0078D4] hover:bg-[#1084DF] text-white text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer shadow-sm ${className}`}
        >
          <Codicon name="cloud-download" className="!text-[13px]" />
          <span>Install App</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        title="Install MUSTAFA.dev on your device"
        className={`inline-flex items-center gap-1 h-[22px] px-2 rounded-[4px] bg-[#0078D4] hover:bg-[#1084DF] text-white text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${className}`}
      >
        <Codicon name="cloud-download" className="!text-[12px]" />
        <span className="hidden xs:inline">Install</span>
      </button>
    );
  }

  // iOS Safari flow (WebKit requires Add to Home Screen via Share sheet)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="Install on iPhone / iPad (Add to Home Screen)"
          className={`inline-flex items-center gap-1 h-[22px] px-2 rounded-[4px] border border-[#3C3C3C] hover:bg-[#2A2D2E] text-[#CCCCCC] text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${className}`}
        >
          <Codicon name="device-mobile" className="!text-[12px] text-[#4FC1FF]" />
          <span className="hidden xs:inline">Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div
            onClick={() => setShowIOSGuide(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl bg-[#252526] border border-[#3C3C3C] p-5 shadow-2xl text-xs space-y-3.5 text-[#CCCCCC]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#3C3C3C]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0078D4] flex items-center justify-center text-white">
                    <Codicon name="device-mobile" className="!text-[16px]" />
                  </div>
                  <span className="font-semibold text-white text-sm">Install on iPhone / iPad</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded hover:bg-[#3C3C3C] text-[#858585] hover:text-white cursor-pointer"
                >
                  <Codicon name="close" className="!text-[14px]" />
                </button>
              </div>

              <div className="space-y-2 leading-relaxed text-[12px]">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0078D4]/20 border border-[#0078D4] text-[#4FC1FF] font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> button in the Safari toolbar at the bottom of your screen.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0078D4]/20 border border-[#0078D4] text-[#4FC1FF] font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0078D4]/20 border border-[#0078D4] text-[#4FC1FF] font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Open <strong>MUSTAFA.dev</strong> directly from your home screen for full standalone app experience!
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-md bg-[#0078D4] hover:bg-[#1084DF] text-white font-medium text-xs cursor-pointer transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
