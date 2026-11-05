import React from 'react';
import { Codicon } from './OfficialIcons';
import { OSPlatform, OS_META } from '../utils/platform';

interface MobileTouchBarProps {
  activityView: 'explorer' | 'search' | 'extensions';
  sidebarOpen: boolean;
  terminalOpen: boolean;
  onSelectActivity: (view: 'explorer' | 'search' | 'extensions') => void;
  onToggleTerminal: () => void;
  onOpenResume: () => void;
  theme: 'dark' | 'light';
  unreadCount?: number;
}

export const MobileTouchBar: React.FC<MobileTouchBarProps> = ({
  activityView,
  sidebarOpen,
  terminalOpen,
  onSelectActivity,
  onToggleTerminal,
  onOpenResume,
  theme,
  unreadCount = 0,
}) => {
  const isDark = theme === 'dark';

  return (
    <nav
      aria-label="Mobile Touch Action Bar"
      className={`md:hidden flex items-center justify-around px-1 h-12 border-t shrink-0 z-40 transition-colors select-none ${
        isDark ? 'bg-[#181818]/95 border-[#2B2B2B]' : 'bg-[#F8F8F8]/95 border-[#E5E5E5]'
      } backdrop-blur-md`}
      style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
    >
      {/* 1. Files / Explorer */}
      <button
        type="button"
        onClick={() => onSelectActivity('explorer')}
        className={`flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 cursor-pointer transition-colors relative ${
          activityView === 'explorer' && sidebarOpen
            ? 'text-[#0078D4] font-semibold'
            : isDark
            ? 'text-[#858585] hover:text-[#CCCCCC]'
            : 'text-[#616161] hover:text-[#1F1F1F]'
        }`}
      >
        <div className="relative">
          <Codicon name="files" className="!text-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 rounded-full bg-[#0078D4] text-white text-[9px] font-mono flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium tracking-tight mt-0.5">Files</span>
      </button>

      {/* 2. Global Search */}
      <button
        type="button"
        onClick={() => onSelectActivity('search')}
        className={`flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 cursor-pointer transition-colors ${
          activityView === 'search' && sidebarOpen
            ? 'text-[#0078D4] font-semibold'
            : isDark
            ? 'text-[#858585] hover:text-[#CCCCCC]'
            : 'text-[#616161] hover:text-[#1F1F1F]'
        }`}
      >
        <Codicon name="search" className="!text-[18px]" />
        <span className="text-[10px] font-medium tracking-tight mt-0.5">Search</span>
      </button>

      {/* 3. Tech Stack & Extensions */}
      <button
        type="button"
        onClick={() => onSelectActivity('extensions')}
        className={`flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 cursor-pointer transition-colors ${
          activityView === 'extensions' && sidebarOpen
            ? 'text-[#0078D4] font-semibold'
            : isDark
            ? 'text-[#858585] hover:text-[#CCCCCC]'
            : 'text-[#616161] hover:text-[#1F1F1F]'
        }`}
      >
        <Codicon name="extensions" className="!text-[18px]" />
        <span className="text-[10px] font-medium tracking-tight mt-0.5">Stack</span>
      </button>

      {/* 4. Terminal Panel */}
      <button
        type="button"
        onClick={onToggleTerminal}
        className={`flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 cursor-pointer transition-colors ${
          terminalOpen
            ? 'text-[#4EC9B0] font-semibold'
            : isDark
            ? 'text-[#858585] hover:text-[#CCCCCC]'
            : 'text-[#616161] hover:text-[#1F1F1F]'
        }`}
      >
        <Codicon name="terminal" className="!text-[18px]" />
        <span className="text-[10px] font-medium tracking-tight mt-0.5">Terminal</span>
      </button>

      {/* 5. Resume Action */}
      <button
        type="button"
        onClick={onOpenResume}
        className="flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 cursor-pointer transition-colors text-[#0078D4] hover:text-[#1084DF]"
      >
        <Codicon name="file-pdf" className="!text-[18px]" />
        <span className="text-[10px] font-semibold tracking-tight mt-0.5">Resume</span>
      </button>
    </nav>
  );
};
