import React from 'react';
import { Codicon } from './OfficialIcons';
import { OSPlatform, OS_META, detectNativeOS } from '../utils/platform';

interface OSSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOS: OSPlatform;
  onSelectOS: (os: OSPlatform, isAuto: boolean) => void;
  isAutoDetect: boolean;
  theme: 'dark' | 'light';
}

export const OSSwitcherModal: React.FC<OSSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentOS,
  onSelectOS,
  isAutoDetect,
  theme,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const nativeOS = detectNativeOS();

  const platforms: Array<{ id: OSPlatform; label: string; iconEmoji: string; badge: string }> = [
    { id: 'macos', label: 'macOS (Apple)', iconEmoji: '🍎', badge: 'Sonoma / Sequoia' },
    { id: 'windows', label: 'Windows 11 (Microsoft)', iconEmoji: '🪟', badge: 'Fluent UI' },
    { id: 'linux', label: 'Linux (Ubuntu)', iconEmoji: '🐧', badge: 'GNOME Shell' },
    { id: 'android', label: 'Android (Google)', iconEmoji: '🤖', badge: 'Material Touch' },
    { id: 'ios', label: 'iOS / iPadOS (Apple)', iconEmoji: '📱', badge: 'Touch + Notch' },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-xl border shadow-2xl p-5 text-xs space-y-4 ${
          isDark
            ? 'bg-[#252526] border-[#3C3C3C] text-[#CCCCCC]'
            : 'bg-white border-[#E5E5E5] text-[#1F1F1F]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#3C3C3C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0078D4] flex items-center justify-center text-white">
              <Codicon name="device-desktop" className="!text-[18px]" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1F1F1F]'}`}>
                Operating System Mode
              </h2>
              <p className="text-[11px] text-[#858585]">
                Preview how MUSTAFA.dev adapts across OS platforms
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#3C3C3C] text-[#858585] hover:text-white cursor-pointer"
          >
            <Codicon name="close" className="!text-[14px]" />
          </button>
        </div>

        {/* Auto-Detect Option */}
        <button
          type="button"
          onClick={() => {
            onSelectOS(nativeOS, true);
            onClose();
          }}
          className={`w-full p-3 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-colors ${
            isAutoDetect
              ? 'border-[#0078D4] bg-[#0078D4]/15'
              : isDark
              ? 'border-[#3C3C3C] hover:bg-[#2A2D2E]'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✨</span>
            <div>
              <div className="font-semibold text-white flex items-center gap-2">
                <span>Auto-Detect My Device</span>
                {isAutoDetect && (
                  <span className="px-1.5 py-0.2 rounded bg-[#0078D4] text-white text-[9px] font-mono">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#858585]">
                Detected: {OS_META[nativeOS].name}
              </div>
            </div>
          </div>
          <Codicon name="check" className={`!text-[14px] ${isAutoDetect ? 'text-[#0078D4]' : 'opacity-0'}`} />
        </button>

        {/* Manual Platform Options */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#858585] px-1">
            Manual OS Simulation
          </p>
          {platforms.map((p) => {
            const isSelected = !isAutoDetect && currentOS === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelectOS(p.id, false);
                  onClose();
                }}
                className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-[#0078D4] bg-[#0078D4]/15'
                    : isDark
                    ? 'border-[#3C3C3C] hover:bg-[#2A2D2E]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{p.iconEmoji}</span>
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{p.label}</span>
                      <span className="text-[10px] font-mono text-[#4EC9B0]">({p.badge})</span>
                    </div>
                    <div className="text-[11px] text-[#858585] line-clamp-1">
                      {OS_META[p.id].description}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <Codicon name="check" className="!text-[14px] text-[#0078D4]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-[#0078D4] hover:bg-[#1084DF] text-white font-medium text-xs cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
