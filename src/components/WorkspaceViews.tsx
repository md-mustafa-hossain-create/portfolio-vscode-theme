import React, { useState } from 'react';
import { Codicon, OfficialSkillIcon } from './OfficialIcons';
import {
  DEVELOPER_PROFILE,
  PortfolioProject,
  PORTFOLIO_SKILLS,
  EDUCATION_TIMELINE,
  BLOG_POSTS,
} from '../data/portfolioData';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: string;
  source: 'form' | 'terminal';
  read: boolean;
}

export interface GuestbookEntry {
  id: string;
  author: string;
  role: string;
  comment: string;
  createdAt: string;
}

export interface WorkbenchSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  minimapEnabled: boolean;
  breadcrumbsEnabled: boolean;
  wordWrap: 'on' | 'off';
  lineNumbers: 'on' | 'off';
  autoSave: 'afterDelay' | 'off';
  cursorStyle: 'block' | 'line' | 'underline';
  cursorBlinking: 'smooth' | 'blink' | 'solid';
}

interface WorkspaceViewsProps {
  activeFile: string;
  theme: 'dark' | 'light';
  projects: PortfolioProject[];
  guestbook: GuestbookEntry[];
  messages?: ContactMessage[];
  visitorCount?: number;
  syncStats: {
    syncCount: number;
    lastSyncedAt: string;
    totalCommandsExecuted: number;
  };
  settings: WorkbenchSettings;
  onUpdateSettings: (partial: Partial<WorkbenchSettings>) => void;
  cursorPos?: { line: number; col: number };
  customFiles: Record<string, string>;
  onUpdateCustomFile: (fileId: string, content: string) => void;
  onOpenFile: (fileId: string) => void;
  onSelectProject: (project: PortfolioProject) => void;
  onStarProject: (projectId: string) => Promise<void>;
  onOpenTerminal: () => void;
  onTriggerSync: () => Promise<void>;
  onGuestbookAdded: (entries: GuestbookEntry[]) => void;
  onMessagesUpdated?: (messages: ContactMessage[]) => void;
  onCursorChange?: (line: number, col: number) => void;
}

export const WorkspaceViews: React.FC<WorkspaceViewsProps> = ({
  activeFile,
  theme,
  projects,
  guestbook,
  messages = [],
  visitorCount = 284,
  syncStats,
  settings,
  onUpdateSettings,
  cursorPos = { line: 5, col: 14 },
  customFiles,
  onUpdateCustomFile,
  onOpenFile,
  onSelectProject,
  onStarProject,
  onOpenTerminal,
  onTriggerSync,
  onGuestbookAdded,
  onMessagesUpdated,
  onCursorChange,
}) => {
  const isDark = theme === 'dark';

  // Collapsible JSDoc header fold state
  const [headerFolded, setHeaderFolded] = useState(false);

  // Portrait image fallback state
  const [avatarSrc, setAvatarSrc] = useState(DEVELOPER_PROFILE.avatarUrl);
  const [avatarFailedAll, setAvatarFailedAll] = useState(false);

  // Project thumbnail fallback tracker
  const [failedProjectImgs, setFailedProjectImgs] = useState<Record<string, boolean>>({});

  // Blog cover fallback tracker
  const [blogImgFailed, setBlogImgFailed] = useState(false);

  // Skills filter & search state
  const [skillCategory, setSkillCategory] = useState<
    'All' | 'Frontend Core' | 'UI & Architecture' | 'Backend & Tooling'
  >('All');
  const [skillSearch, setSkillSearch] = useState('');

  // Settings UI search & scope state
  const [settingsSearch, setSettingsSearch] = useState('');
  const [settingsScope, setSettingsScope] = useState<'user' | 'workspace'>('user');
  const [settingsSection, setSettingsSection] = useState<string>('Commonly Used');

  // Extension detail sub-tab state
  const [extSubTab, setExtSubTab] = useState<'details' | 'features' | 'changelog'>('details');
  const [disabledExtensions, setDisabledExtensions] = useState<Record<string, boolean>>({});

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>(
    'idle'
  );
  const [contactErrorText, setContactErrorText] = useState('');

  // Guestbook form state
  const [gbAuthor, setGbAuthor] = useState('');
  const [gbRole, setGbRole] = useState('');
  const [gbComment, setGbComment] = useState('');
  const [gbSubmitting, setGbSubmitting] = useState(false);

  const handleAvatarError = () => {
    if (avatarSrc !== DEVELOPER_PROFILE.fallbackAvatarUrl) {
      setAvatarSrc(DEVELOPER_PROFILE.fallbackAvatarUrl);
    } else {
      setAvatarFailedAll(true);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactStatus === 'sending') return;

    setContactStatus('sending');
    setContactErrorText('');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          message: contactMessage.trim(),
          source: 'form',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setContactStatus('error');
        setContactErrorText(data.error || 'Please check all fields and try again.');
        return;
      }
      setContactStatus('success');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      if (Array.isArray(data.messages)) {
        onMessagesUpdated?.(data.messages);
      }
    } catch {
      setContactStatus('error');
      setContactErrorText('Unable to reach cloud synchronization service. Please try again.');
    }
  };

  const handleToggleMessageRead = async (msgId: string, currentRead: boolean) => {
    try {
      const res = await fetch(`/api/messages/${msgId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: !currentRead }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) {
        onMessagesUpdated?.(data.messages);
      }
    } catch {
      // Ignore network error
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      const res = await fetch(`/api/messages/${msgId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) {
        onMessagesUpdated?.(data.messages);
      }
    } catch {
      // Ignore network error
    }
  };

  const handleGuestbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gbSubmitting || !gbAuthor.trim() || !gbComment.trim()) return;
    setGbSubmitting(true);
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: gbAuthor.trim(),
          role: gbRole.trim() || 'Developer Peer',
          comment: gbComment.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.guestbook)) {
        onGuestbookAdded(data.guestbook);
        setGbAuthor('');
        setGbRole('');
        setGbComment('');
      }
    } finally {
      setGbSubmitting(false);
    }
  };

  const cardSurface = isDark
    ? 'bg-[#252526] border-[#2B2B2B] text-[#CCCCCC]'
    : 'bg-[#F8F8F8] border-[#E5E5E5] text-[#1F1F1F]';
  const mutedText = isDark ? 'text-[#858585]' : 'text-[#616161]';
  const headingText = isDark ? 'text-white' : 'text-[#1F1F1F]';
  const borderClass = isDark ? 'border-[#2B2B2B]' : 'border-[#E5E5E5]';

  const caretBlinkClass =
    settings.cursorBlinking === 'blink'
      ? 'vscode-caret-stick-blink'
      : settings.cursorBlinking === 'solid'
      ? 'vscode-caret-stick-solid'
      : '';

  // Helper wrapper that renders unified horizontal rows of (Gutter Line Number + Code Line) so Line N's gutter number is ALWAYS 100% aligned with Code Line N, plus explicit blinking white stick caret
  const renderHybridEditorCanvas = (
    moduleComment: string,
    exportSignature: React.ReactNode,
    codeLensActions: Array<{ label: string; onClick: () => void }>,
    interactiveContent: React.ReactNode
  ) => {
    const activeLine = Math.max(1, Math.min(8, cursorPos.line));
    const activeCol = Math.max(1, cursorPos.col);
    const activeLineHighlighterClass = isDark
      ? 'vscode-active-line-dark'
      : 'vscode-active-line-light';

    const jsdocLines = [
      { lineNum: 1, text: '/**' },
      { lineNum: 2, text: ` * ${moduleComment}` },
      { lineNum: 3, text: ` * @author ${DEVELOPER_PROFILE.name} <${DEVELOPER_PROFILE.email}>` },
      { lineNum: 4, text: ' */' },
    ];

    const renderGutterCell = (lineNum: number, showFoldToggle = false) => {
      if (settings.lineNumbers !== 'on') return null;
      const isCurrentLine = activeLine === lineNum;
      return (
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            onCursorChange?.(lineNum, 1);
          }}
          title={`Line ${lineNum}`}
          className={`w-8 sm:w-12 md:w-14 shrink-0 flex items-center justify-end gap-1 sm:gap-1.5 pr-1 sm:pr-2 pl-1 sm:pl-2 select-none font-mono text-[11px] sm:text-xs tabular-nums cursor-pointer border-r ${
            isDark
              ? 'border-[#2B2B2B]/60'
              : 'border-[#E5E5E5]'
          } ${
            isCurrentLine
              ? isDark
                ? 'text-white font-semibold'
                : 'text-[#1F1F1F] font-semibold'
              : 'text-[#6E7681] hover:text-[#CCCCCC]'
          }`}
        >
          <span className="w-4 sm:w-5 text-right">{lineNum}</span>
          <span className="w-2.5 sm:w-3 flex items-center justify-center">
            {showFoldToggle && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setHeaderFolded((prev) => !prev);
                }}
                className="text-[#858585] hover:text-white flex items-center"
              >
                <Codicon
                  name={headerFolded ? 'chevron-right' : 'chevron-down'}
                  className="!text-[11px] sm:!text-[12px]"
                />
              </button>
            )}
          </span>
        </div>
      );
    };

    const renderUnifiedTextRow = (
      lineNum: number,
      text: string,
      colorClass: string,
      showFoldToggle = false
    ) => {
      const isCurrentLine = activeLine === lineNum;
      const chars = text.split('');
      const clampedCol = isCurrentLine ? Math.max(1, Math.min(chars.length + 1, activeCol)) : -1;

      return (
        <div
          key={lineNum}
          onMouseDown={() => onCursorChange?.(lineNum, chars.length + 1)}
          className={`flex items-stretch min-h-[26px] leading-[26px] font-mono text-xs sm:text-[13px] ${
            isCurrentLine ? activeLineHighlighterClass : 'hover:bg-white/[0.03]'
          }`}
        >
          {renderGutterCell(lineNum, showFoldToggle)}
          <div
            className={`flex-1 pl-2.5 sm:pl-4 pr-2.5 sm:pr-4 cursor-text whitespace-pre-wrap break-words ${colorClass}`}
          >
            {chars.map((ch, idx) => {
              const colNum = idx + 1;
              const isCursorBefore = isCurrentLine && clampedCol === colNum;
              return (
                <React.Fragment key={idx}>
                  {isCursorBefore && (
                    <span
                      key={`caret-${lineNum}-${clampedCol}`}
                      className={`vscode-caret-stick ${caretBlinkClass}`}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickedRightHalf = e.clientX - rect.left > rect.width / 2;
                      const targetCol = clickedRightHalf ? colNum + 1 : colNum;
                      onCursorChange?.(lineNum, targetCol);
                    }}
                  >
                    {ch}
                  </span>
                </React.Fragment>
              );
            })}
            {isCurrentLine && clampedCol > chars.length && (
              <span
                key={`caret-eol-${lineNum}-${clampedCol}`}
                className={`vscode-caret-stick ${caretBlinkClass}`}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      );
    };

    // Recursively wrap syntax-highlighted React nodes into character-clickable spans with exact left/right half detection
    const renderUnifiedSignatureRow = (node: React.ReactNode, lineNum: number) => {
      const isCurrentLine = activeLine === lineNum;
      let colTracker = 0;

      const transformNode = (child: React.ReactNode): React.ReactNode => {
        if (typeof child === 'string' || typeof child === 'number') {
          const str = String(child);
          return str.split('').map((ch, i) => {
            colTracker += 1;
            const thisCol = colTracker;
            const isCursorBefore = isCurrentLine && activeCol === thisCol;
            return (
              <React.Fragment key={`${thisCol}-${i}`}>
                {isCursorBefore && (
                  <span
                    key={`caret-${lineNum}-${activeCol}`}
                    className={`vscode-caret-stick ${caretBlinkClass}`}
                    aria-hidden="true"
                  />
                )}
                <span
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickedRightHalf = e.clientX - rect.left > rect.width / 2;
                    const targetCol = clickedRightHalf ? thisCol + 1 : thisCol;
                    onCursorChange?.(lineNum, targetCol);
                  }}
                >
                  {ch}
                </span>
              </React.Fragment>
            );
          });
        }
        if (Array.isArray(child)) {
          return child.map((c, idx) => <React.Fragment key={idx}>{transformNode(c)}</React.Fragment>);
        }
        if (React.isValidElement(child)) {
          const elementProps = child.props as { children?: React.ReactNode };
          return React.cloneElement(child, undefined, transformNode(elementProps.children));
        }
        return child;
      };

      const transformedChildren = transformNode(node);
      const endCol = colTracker + 1;
      const isCursorAtEnd = isCurrentLine && (activeCol >= endCol || activeCol < 1);

      return (
        <div
          onMouseDown={() => onCursorChange?.(lineNum, endCol)}
          className={`flex items-stretch min-h-[28px] leading-[28px] font-mono text-xs sm:text-[13px] ${
            isCurrentLine ? activeLineHighlighterClass : 'hover:bg-white/[0.03]'
          }`}
        >
          {renderGutterCell(lineNum)}
          <div className="flex-1 pl-2.5 sm:pl-4 pr-2.5 sm:pr-4 cursor-text whitespace-pre-wrap break-words">
            <span>{transformedChildren}</span>
            {isCursorAtEnd && (
              <span
                key={`caret-eol-${lineNum}-${activeCol}`}
                className={`vscode-caret-stick ${caretBlinkClass}`}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      );
    };

    const handleHybridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        onCursorChange?.(Math.min(8, activeLine + 1), activeCol);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onCursorChange?.(Math.max(1, activeLine - 1), activeCol);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onCursorChange?.(activeLine, activeCol + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onCursorChange?.(activeLine, Math.max(1, activeCol - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        onCursorChange?.(activeLine, 1);
      }
    };

    return (
      <div
        tabIndex={0}
        onKeyDown={handleHybridKeyDown}
        className={`flex flex-col min-h-full font-sans focus:outline-none py-3 ${
          settings.wordWrap === 'off' ? 'overflow-x-auto' : ''
        }`}
        style={{ fontSize: `${settings.fontSize}px` }}
      >
        {/* Unnumbered CodeLens Bar Row (keeps gutter column aligned without shifting line numbers) */}
        <div className="flex items-stretch font-mono text-[10px] sm:text-[11px] text-[#858585]">
          {settings.lineNumbers === 'on' && (
            <div
              className={`w-8 sm:w-12 md:w-14 shrink-0 border-r select-none ${
                isDark ? 'border-[#2B2B2B]/60' : 'border-[#E5E5E5]'
              }`}
            />
          )}
          <div className="flex-1 pl-2.5 sm:pl-4 pr-3 sm:pr-6 py-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {codeLensActions.map((act, idx) => (
              <React.Fragment key={act.label}>
                {idx > 0 && <span>|</span>}
                <button
                  type="button"
                  onClick={act.onClick}
                  className="hover:text-[#0078D4] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {idx === 0 && <Codicon name="play" className="!text-[11px] text-[#4EC9B0]" />}
                  <span>{act.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Unified Code Lines 1-4 (JSDoc Comment) — Each line's gutter number is in the exact same row */}
        {!headerFolded ? (
          jsdocLines.map((l, idx) =>
            renderUnifiedTextRow(l.lineNum, l.text, 'text-[#6A9955]', idx === 0)
          )
        ) : (
          renderUnifiedTextRow(1, '/** ... */', 'text-[#6A9955]', true)
        )}

        {/* Unified Code Line 5 (Export Signature) */}
        {renderUnifiedSignatureRow(exportSignature, 5)}

        {/* Unified Code Line 6 (Inline Preview Comment) */}
        {renderUnifiedTextRow(
          6,
          '  // Interactive Visual Component Canvas Mounted Below',
          'text-[#6A9955]'
        )}

        {/* Interactive Component Canvas Region with Continuous Gutter Border */}
        <div className="flex items-stretch">
          {settings.lineNumbers === 'on' && (
            <div
              className={`w-8 sm:w-12 md:w-14 shrink-0 border-r select-none ${
                isDark ? 'border-[#2B2B2B]/60' : 'border-[#E5E5E5]'
              }`}
            />
          )}
          <div className="flex-1 min-w-0 px-2.5 sm:px-5 lg:px-8 py-4 sm:py-5 space-y-6 sm:space-y-10">
            {interactiveContent}
          </div>
        </div>

        {/* Unified Code Line 7 (Closing Brace) */}
        {renderUnifiedTextRow(7, '};', 'text-[#DCDCAA]')}

        {/* Unified Code Line 8 (Default Export) */}
        {renderUnifiedTextRow(8, 'export default MUSTAFA_PORTFOLIO_MODULE;', 'text-[#C586C0]')}
      </div>
    );
  };

  // SPECIAL OFFICIAL VS CODE VIEW A: GRAPHICAL SETTINGS EDITOR (Ctrl+,)
  if (activeFile === 'settings') {
    const settingItems = [
      {
        id: 'editor.cursorStyle',
        category: 'Commonly Used',
        title: 'Editor: Cursor Style',
        description:
          'Controls the cursor style in the editor (official VS Code #0078D4 block cursor).',
        control: (
          <select
            value={settings.cursorStyle}
            onChange={(e) =>
              onUpdateSettings({
                cursorStyle: e.target.value as 'block' | 'line' | 'underline',
              })
            }
            className={`px-2.5 py-1 rounded-xs border text-xs font-sans focus:border-[#0078D4] focus:outline-none ${
              isDark
                ? 'bg-[#3C3C3C] border-[#3C3C3C] text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <option value="block">block (#0078D4 Official Block Cursor)</option>
            <option value="line">line</option>
            <option value="underline">underline</option>
          </select>
        ),
      },
      {
        id: 'editor.cursorBlinking',
        category: 'Commonly Used',
        title: 'Editor: Cursor Blinking',
        description: 'Control the cursor animation style in the editor.',
        control: (
          <select
            value={settings.cursorBlinking}
            onChange={(e) =>
              onUpdateSettings({
                cursorBlinking: e.target.value as 'smooth' | 'blink' | 'solid',
              })
            }
            className={`px-2.5 py-1 rounded-xs border text-xs font-sans focus:border-[#0078D4] focus:outline-none ${
              isDark
                ? 'bg-[#3C3C3C] border-[#3C3C3C] text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <option value="smooth">smooth (Smooth Fade Animation)</option>
            <option value="blink">blink</option>
            <option value="solid">solid</option>
          </select>
        ),
      },
      {
        id: 'workbench.colorTheme',
        category: 'Commonly Used',
        title: 'Workbench: Color Theme',
        description: 'Specifies the color theme used in the workbench.',
        control: (
          <select
            value={settings.theme}
            onChange={(e) =>
              onUpdateSettings({ theme: e.target.value as 'dark' | 'light' })
            }
            className={`px-2.5 py-1 rounded-xs border text-xs font-sans focus:border-[#0078D4] focus:outline-none ${
              isDark
                ? 'bg-[#3C3C3C] border-[#3C3C3C] text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <option value="dark">Dark Modern (Default Dark)</option>
            <option value="light">Light Modern (Default Light)</option>
          </select>
        ),
      },
      {
        id: 'editor.fontSize',
        category: 'Commonly Used',
        title: 'Editor: Font Size',
        description: 'Controls the font size in pixels inside the editor canvas.',
        control: (
          <input
            type="number"
            min={11}
            max={20}
            value={settings.fontSize}
            onChange={(e) =>
              onUpdateSettings({
                fontSize: Math.min(20, Math.max(11, Number(e.target.value) || 14)),
              })
            }
            className={`w-24 px-2.5 py-1 rounded-xs border text-xs font-mono focus:border-[#0078D4] focus:outline-none ${
              isDark
                ? 'bg-[#3C3C3C] border-[#3C3C3C] text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          />
        ),
      },
      {
        id: 'files.autoSave',
        category: 'Commonly Used',
        title: 'Files: Auto Save',
        description: 'Controls auto save of editors that have unsaved changes.',
        control: (
          <select
            value={settings.autoSave}
            onChange={(e) =>
              onUpdateSettings({ autoSave: e.target.value as 'afterDelay' | 'off' })
            }
            className={`px-2.5 py-1 rounded-xs border text-xs font-sans focus:border-[#0078D4] focus:outline-none ${
              isDark
                ? 'bg-[#3C3C3C] border-[#3C3C3C] text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <option value="afterDelay">afterDelay</option>
            <option value="off">off</option>
          </select>
        ),
      },
      {
        id: 'editor.minimap.enabled',
        category: 'Text Editor',
        title: 'Editor › Minimap: Enabled',
        description: 'Controls whether the minimap is shown on the right side of the editor.',
        control: (
          <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={settings.minimapEnabled}
              onChange={(e) => onUpdateSettings({ minimapEnabled: e.target.checked })}
              className="accent-[#0078D4] w-4 h-4 rounded-xs cursor-pointer"
            />
            <span>Render scaled code overview scrollbar</span>
          </label>
        ),
      },
      {
        id: 'breadcrumbs.enabled',
        category: 'Workbench',
        title: 'Breadcrumbs: Enabled',
        description: 'Enable/disable navigation breadcrumbs at the top of the editor.',
        control: (
          <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={settings.breadcrumbsEnabled}
              onChange={(e) => onUpdateSettings({ breadcrumbsEnabled: e.target.checked })}
              className="accent-[#0078D4] w-4 h-4 rounded-xs cursor-pointer"
            />
            <span>Enable symbol and file path breadcrumbs</span>
          </label>
        ),
      },
      {
        id: 'editor.wordWrap',
        category: 'Text Editor',
        title: 'Editor: Word Wrap',
        description: 'Controls how lines should wrap in the editor.',
        control: (
          <select
            value={settings.wordWrap}
            onChange={(e) =>
              onUpdateSettings({ wordWrap: e.target.value as 'on' | 'off' })
            }
            className={`px-2.5 py-1 rounded-xs border text-xs font-sans focus:border-[#0078D4] focus:outline-none ${
              isDark
                ? 'bg-[#3C3C3C] border-[#3C3C3C] text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <option value="on">on</option>
            <option value="off">off</option>
          </select>
        ),
      },
      {
        id: 'editor.lineNumbers',
        category: 'Text Editor',
        title: 'Editor: Line Numbers',
        description: 'Controls the display of line numbers and breakpoint gutter.',
        control: (
          <select
            value={settings.lineNumbers}
            onChange={(e) =>
              onUpdateSettings({ lineNumbers: e.target.value as 'on' | 'off' })
            }
            className={`px-2.5 py-1 rounded-xs border text-xs font-sans focus:border-[#0078D4] focus:outline-none ${
              isDark
                ? 'bg-[#3C3C3C] border-[#3C3C3C] text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <option value="on">on</option>
            <option value="off">off</option>
          </select>
        ),
      },
    ];

    const filteredSettings = settingItems.filter((item) => {
      const q = settingsSearch.toLowerCase().trim();
      const matchesSection =
        settingsSection === 'Commonly Used' || item.category === settingsSection;
      if (!q) return matchesSection;
      return (
        item.title.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });

    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 font-sans">
        {/* Official VS Code Search Settings Input */}
        <div className="space-y-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xs border ${
              isDark
                ? 'bg-[#3C3C3C] border-[#0078D4] text-white'
                : 'bg-white border-[#0078D4] text-slate-900'
            }`}
          >
            <Codicon name="search" className="!text-[14px] text-[#858585]" />
            <input
              type="text"
              value={settingsSearch}
              onChange={(e) => setSettingsSearch(e.target.value)}
              placeholder="Search settings (e.g. cursorStyle, cursorBlinking, theme, minimap)..."
              className="flex-1 bg-transparent text-xs focus:outline-none"
            />
            <span className="text-[11px] font-mono text-[#858585]">
              {filteredSettings.length} settings
            </span>
          </div>

          {/* Official User / Workspace Scope Tabs */}
          <div className={`flex items-center justify-between border-b ${borderClass}`}>
            <div className="flex items-center gap-6 text-xs">
              {(['user', 'workspace'] as const).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setSettingsScope(sc)}
                  className={`pb-2 capitalize border-b-2 transition-colors cursor-pointer ${
                    settingsScope === sc
                      ? 'border-[#0078D4] text-white font-semibold'
                      : 'border-transparent text-[#858585] hover:text-[#CCCCCC]'
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onOpenFile('package.json')}
              className="text-xs font-mono text-[#4FC1FF] hover:underline flex items-center gap-1 pb-2 cursor-pointer"
            >
              <Codicon name="json" className="!text-[13px]" />
              <span>Open Settings (JSON)</span>
            </button>
          </div>
        </div>

        {/* Left Category Tree + Right Settings Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-3 space-y-1 text-xs">
            {['Commonly Used', 'Text Editor', 'Workbench'].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSettingsSection(sec)}
                className={`w-full text-left px-3 py-1.5 rounded-xs cursor-pointer ${
                  settingsSection === sec
                    ? 'bg-[#04395E] text-white font-semibold'
                    : 'text-[#858585] hover:bg-[#2A2D2E] hover:text-white'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          <div className="md:col-span-9 space-y-6">
            {filteredSettings.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xs border ${cardSurface} space-y-2 hover:border-[#0078D4]/60`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${headingText}`}>{item.title}</span>
                  <span className="text-[11px] font-mono text-[#858585]">{item.id}</span>
                </div>
                <p className={`text-xs ${mutedText}`}>{item.description}</p>
                <div className="pt-1">{item.control}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SPECIAL OFFICIAL VS CODE VIEW B: EXTENSION MARKETPLACE DETAILS TAB (extension:<id>)
  if (activeFile.startsWith('extension:')) {
    const skillId = activeFile.replace('extension:', '');
    const skill =
      PORTFOLIO_SKILLS.find((s) => s.id === skillId) || PORTFOLIO_SKILLS[0];
    const isDisabled = Boolean(disabledExtensions[skill.id]);

    return (
      <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6 font-sans">
        {/* Top Official VS Code Extension Header */}
        <div className={`flex flex-col sm:flex-row items-start gap-6 pb-6 border-b ${borderClass}`}>
          <div className="w-24 h-24 rounded-md bg-[#252526] border border-[#3C3C3C] p-4 flex items-center justify-center shrink-0">
            <OfficialSkillIcon skillId={skill.id} className="w-16 h-16" />
          </div>

          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className={`text-2xl font-bold ${headingText}`}>{skill.name}</h1>
              <span className="px-2 py-0.5 rounded bg-[#2B2B2B] text-xs font-mono text-[#CCCCCC]">
                {skill.version}
              </span>
              {isDisabled && (
                <span className="px-2 py-0.5 rounded bg-[#3A1E1E] text-[#F48771] text-xs font-mono">
                  Disabled
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#CCCCCC]">
              <span className="inline-flex items-center gap-1 text-[#4FC1FF] font-medium">
                <Codicon name="verified-filled" className="!text-[14px] text-[#0078D4]" />
                <span>{skill.publisher}</span>
              </span>
              <span>|</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Codicon name="cloud-download" className="!text-[13px]" />
                <span>{skill.downloads} installs</span>
              </span>
              <span>|</span>
              <span className="inline-flex items-center gap-1 text-[#DCDCAA] tabular-nums">
                <span>★★★★★ ({skill.rating})</span>
              </span>
            </div>

            <p className={`text-xs sm:text-sm ${mutedText}`}>{skill.desc}</p>

            {/* Official VS Code Disable / Uninstall / Inspect Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  setDisabledExtensions((prev) => ({
                    ...prev,
                    [skill.id]: !prev[skill.id],
                  }))
                }
                className="px-3 py-1 rounded-xs bg-[#0078D4] hover:bg-[#1084DF] text-white text-xs font-medium cursor-pointer"
              >
                {isDisabled ? 'Enable' : 'Disable'}
              </button>
              <button
                type="button"
                onClick={() => onOpenFile('skills.json')}
                className="px-3 py-1 rounded-xs bg-[#313131] hover:bg-[#3C3C3C] border border-[#3C3C3C] text-white text-xs font-medium cursor-pointer"
              >
                View in skills.json
              </button>
              <button
                type="button"
                onClick={() => onOpenFile('projects.tsx')}
                className="px-3 py-1 rounded-xs bg-[#313131] hover:bg-[#3C3C3C] border border-[#3C3C3C] text-[#4EC9B0] text-xs font-mono cursor-pointer"
              >
                Used in {skill.projectsUsed.length} Production Apps
              </button>
            </div>
          </div>
        </div>

        {/* Official Extension Sub-Tabs: Details | Feature Contributions | Changelog */}
        <div className={`flex items-center gap-6 border-b ${borderClass} text-xs`}>
          {(
            [
              { id: 'details', label: 'Details' },
              { id: 'features', label: 'Feature Contributions' },
              { id: 'changelog', label: 'Changelog' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setExtSubTab(t.id)}
              className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                extSubTab === t.id
                  ? 'border-[#0078D4] text-white font-semibold'
                  : 'border-transparent text-[#858585] hover:text-[#CCCCCC]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {extSubTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-8 rounded-md border ${cardSurface} p-6 space-y-4`}>
              <h2 className={`text-lg font-bold ${headingText}`}>
                {skill.name} — Production Engineering Integration
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed">
                {DEVELOPER_PROFILE.name} utilizes <strong>{skill.name}</strong> ({skill.experience})
                across production applications including{' '}
                <strong className="text-[#4EC9B0]">{skill.projectsUsed.join(', ')}</strong>.
              </p>
              <div className="space-y-1.5">
                <p className="text-xs font-mono text-[#858585]">Implementation Pattern:</p>
                <pre className="p-3 rounded bg-[#141414] border border-[#2B2B2B] text-xs font-mono text-[#9CDCFE] overflow-x-auto">
                  <code>{skill.codeExample}</code>
                </pre>
              </div>
            </div>

            <div className={`lg:col-span-4 rounded-md border ${cardSurface} p-5 space-y-3 text-xs`}>
              <h3 className={`font-bold uppercase tracking-wide ${headingText}`}>
                Marketplace Metadata
              </h3>
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className={mutedText}>Identifier</span>
                  <span className="text-[#CE9178]">mustafa.{skill.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className={mutedText}>Category</span>
                  <span className="text-[#4EC9B0]">{skill.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className={mutedText}>Version</span>
                  <span>{skill.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className={mutedText}>Last Released</span>
                  <span>2026-10</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {extSubTab === 'features' && (
          <div className={`rounded-md border ${cardSurface} p-5 space-y-3 text-xs font-mono`}>
            <p className="text-[#4EC9B0] font-semibold">
              Contributes configuration &amp; commands to MUSTAFA.dev workspace:
            </p>
            <ul className="space-y-1.5 text-[#CCCCCC]">
              <li>• mustafa.{skill.id}.enableProductionOptimizations: true</li>
              <li>• mustafa.{skill.id}.verifiedProjects: [{skill.projectsUsed.join(', ')}]</li>
            </ul>
          </div>
        )}

        {extSubTab === 'changelog' && (
          <div className={`rounded-md border ${cardSurface} p-5 space-y-2 text-xs font-mono`}>
            <p className="text-white font-semibold">{skill.version} — October 2026</p>
            <p className={mutedText}>
              • Verified production deployment in {skill.projectsUsed.join(', ')}.
            </p>
          </div>
        )}
      </div>
    );
  }

  // SPECIAL OFFICIAL VS CODE VIEW C: USER-CREATED CUSTOM / UNTITLED FILES (Ctrl+N or New File...)
  if (customFiles[activeFile] !== undefined) {
    const content = customFiles[activeFile];
    const lines = content.split('\n');
    const syncCaretPosition = (target: HTMLTextAreaElement) => {
      const pos = target.selectionStart || 0;
      const before = target.value.slice(0, pos);
      const splitBefore = before.split('\n');
      const currentLn = splitBefore.length;
      const currentCol = splitBefore[splitBefore.length - 1].length + 1;
      onCursorChange?.(currentLn, currentCol);
    };

    return (
      <div className="h-full flex flex-col font-mono text-xs">
        <div
          className={`flex items-center justify-between px-4 py-1.5 border-b ${borderClass} bg-[#181818] text-[11px] text-[#858585]`}
        >
          <div className="flex items-center gap-3">
            <span>
              Interactive Scratchpad Buffer ·{' '}
              <strong className="text-[#4EC9B0]">{activeFile}</strong> ({lines.length} lines)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onTriggerSync()}
            className="px-2.5 py-0.5 rounded bg-[#0078D4] text-white cursor-pointer"
          >
            Save to Cloud (Ctrl+S)
          </button>
        </div>
        <div className="flex-1 flex min-h-[420px]">
          <div className="w-12 py-3 pr-3 text-right select-none text-[#6E7681] border-r border-[#2B2B2B] bg-[#1F1F1F]">
            {lines.map((_, i) => {
              const ln = i + 1;
              const isAct = cursorPos.line === ln;
              return (
                <div
                  key={i}
                  className={`leading-6 px-1 ${
                    isAct ? 'text-white font-semibold bg-[#0078D4]/15' : ''
                  }`}
                >
                  {ln}
                </div>
              );
            })}
          </div>
          <textarea
            value={content}
            onChange={(e) => {
              onUpdateCustomFile(activeFile, e.target.value);
              syncCaretPosition(e.target);
            }}
            onClick={(e) => syncCaretPosition(e.currentTarget)}
            onKeyUp={(e) => syncCaretPosition(e.currentTarget)}
            aria-label={`Editor for ${activeFile}`}
            style={{ caretColor: '#0078D4' }}
            className="flex-1 p-3 bg-transparent text-[#CCCCCC] font-mono text-xs leading-6 focus:outline-none resize-none"
          />
        </div>
      </div>
    );
  }

  // 1. OVERVIEW.TSX VIEW
  if (activeFile === 'overview.tsx') {
    return renderHybridEditorCanvas(
      'Developer Profile & Engineering Overview — MD Mustafa Hossain (BCA, Brainware University)',
      <>
        <span className="text-[#C586C0]">export default</span>{' '}
        <span className="text-[#569CD6]">function</span>{' '}
        <span className="text-[#DCDCAA]">MustafaPortfolioOverview</span>
        <span className="text-[#CCCCCC]">() &#123;</span>
      </>,
      [
        { label: 'Run whoami in Terminal', onClick: onOpenTerminal },
        { label: 'Inspect 3 Projects', onClick: () => onOpenFile('projects.tsx') },
        { label: 'View Tech Stack (9)', onClick: () => onOpenFile('skills.json') },
        { label: 'Send Direct Message', onClick: () => onOpenFile('contact.tsx') },
      ],
      <div className="space-y-10">
        {/* 2-Column Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column */}
          <div
            className={`lg:col-span-7 rounded-md border ${cardSurface} p-6 sm:p-8 flex flex-col justify-between space-y-6`}
          >
            <div className="space-y-4">
              <div className={`flex flex-wrap items-center gap-2 text-xs font-mono ${mutedText}`}>
                <span className="text-[#4EC9B0] font-semibold">
                  {DEVELOPER_PROFILE.availability}
                </span>
                <span aria-hidden="true">·</span>
                <span>{DEVELOPER_PROFILE.location}</span>
              </div>

              <h1
                className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08] [text-wrap:balance] ${headingText}`}
              >
                Hi, I&apos;m {DEVELOPER_PROFILE.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-base sm:text-lg font-mono">
                <span className="text-[#4FC1FF] font-semibold">{DEVELOPER_PROFILE.title}</span>
                <span className={mutedText}>/</span>
                <span className="text-[#CE9178]">{DEVELOPER_PROFILE.roleSubtitle}</span>
              </div>

              <p className={`text-sm sm:text-base leading-relaxed max-w-2xl ${mutedText}`}>
                {DEVELOPER_PROFILE.leadSubtitle}
              </p>

              {/* Official Brand Skill Logos Bar right inside Hero */}
              <div className="pt-1 flex flex-wrap items-center gap-3">
                {PORTFOLIO_SKILLS.map((sk) => (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() => onOpenFile(`extension:${sk.id}`)}
                    title={`${sk.name} — Click to open VS Code Extension Details`}
                    className="p-2 rounded bg-[#181818] border border-[#2B2B2B] hover:border-[#0078D4] transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <OfficialSkillIcon skillId={sk.id} className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onOpenFile('projects.tsx')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#0078D4] hover:bg-[#1084DF] text-white font-medium text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>See Selected Work</span>
                <Codicon name="arrow-right" className="!text-[13px]" />
              </button>

              <button
                type="button"
                onClick={() => onOpenFile('contact.tsx')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded border ${
                  isDark
                    ? 'border-[#3C3C3C] bg-[#313131] hover:bg-[#3C3C3C] text-white'
                    : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-900'
                } font-medium text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer`}
              >
                <span>Start a Conversation</span>
              </button>

              <a
                href={DEVELOPER_PROFILE.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded border ${borderClass} hover:border-[#0078D4] text-xs font-mono transition-colors whitespace-nowrap shrink-0`}
              >
                <Codicon name="cloud-download" className="!text-[14px] text-[#4FC1FF]" />
                <span>Resume.pdf</span>
              </a>

              <button
                type="button"
                onClick={onOpenTerminal}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded border ${borderClass} hover:border-[#0078D4] text-[#4EC9B0] font-mono text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer`}
              >
                <Codicon name="terminal" className="!text-[14px]" />
                <span>Terminal (Ctrl+`)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Matching Height Portrait Container */}
          <div className="lg:col-span-5 flex flex-col">
            <div
              className={`rounded-md border ${cardSurface} p-4 h-full flex flex-col justify-between`}
            >
              <div className="relative w-full aspect-[4/3] lg:h-full rounded overflow-hidden bg-[#141414]">
                {!avatarFailedAll ? (
                  <img
                    src={avatarSrc}
                    alt={DEVELOPER_PROFILE.name}
                    referrerPolicy="no-referrer"
                    onError={handleAvatarError}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#141414] p-8 text-center">
                    <span className="text-3xl font-bold text-[#0078D4] font-display">MH</span>
                    <p className="text-sm font-semibold text-white mt-2">
                      {DEVELOPER_PROFILE.name}
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`grid grid-cols-2 gap-4 pt-3 mt-3 border-t ${borderClass} text-xs font-mono`}
              >
                <div>
                  <p className={mutedText}>location</p>
                  <p className={`font-semibold mt-0.5 ${headingText}`}>Murshidabad, India</p>
                </div>
                <div>
                  <p className={mutedText}>education</p>
                  <p className="font-semibold mt-0.5 tabular-nums text-[#4EC9B0]">
                    BCA · 9.09 / 10
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column KPI Benchmark Strip (2x2 on mobile, 4-col on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {DEVELOPER_PROFILE.kpiMetrics.map((metric) => (
            <div key={metric.label} className={`rounded-md border ${cardSurface} p-3 sm:p-4 space-y-1`}>
              <p className={`text-[11px] sm:text-xs font-mono truncate ${mutedText}`}>{metric.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-[#4EC9B0] font-mono tabular-nums">
                {metric.value}
              </p>
              <p className={`text-[11px] sm:text-xs ${mutedText}`}>{metric.context}</p>
            </div>
          ))}
        </div>

        {/* About Me & Quick Properties Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className={`lg:col-span-7 rounded-md border ${cardSurface} p-6 space-y-4`}>
            <div className="space-y-1">
              <p className="text-xs font-mono text-[#569CD6]">01. About Me</p>
              <h2 className={`text-xl sm:text-2xl font-bold [text-wrap:balance] ${headingText}`}>
                {DEVELOPER_PROFILE.bioHeadline}
              </h2>
            </div>

            <div className="space-y-3 text-sm leading-relaxed">
              {DEVELOPER_PROFILE.bioParagraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div
              className={`p-4 rounded bg-[#181818] border ${borderClass} text-xs font-mono text-[#CE9178]`}
            >
              &ldquo;{DEVELOPER_PROFILE.quote}&rdquo;
            </div>
          </div>

          <div
            className={`lg:col-span-5 rounded-md border ${cardSurface} divide-y ${borderClass}`}
          >
            <div className="p-5 space-y-1">
              <p className={`text-xs font-mono ${mutedText}`}>degree</p>
              <p className={`text-sm font-bold ${headingText}`}>
                Bachelor of Computer Applications (BCA)
              </p>
              <p className="text-xs text-[#4EC9B0] font-mono">
                Brainware University, West Bengal · 9.09 / 10 CGPA
              </p>
            </div>
            <div className="p-5 space-y-1">
              <p className={`text-xs font-mono ${mutedText}`}>targetRoles</p>
              <p className={`text-sm font-bold ${headingText}`}>
                Frontend Developer Internships &amp; React Roles
              </p>
              <p className={`text-xs ${mutedText}`}>
                React JS · Tailwind CSS · Clean UI Engineering
              </p>
            </div>
            <div className="p-5 space-y-2.5">
              <p className={`text-xs font-mono ${mutedText}`}>externalLinks</p>
              <div className="flex flex-wrap gap-4 text-xs font-mono">
                {DEVELOPER_PROFILE.socials.map((soc) => (
                  <a
                    key={soc.name}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4FC1FF] hover:underline inline-flex items-center gap-1"
                  >
                    <span>{soc.name}</span>
                    <Codicon name="link-external" className="!text-[11px]" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. PROJECTS.TSX VIEW
  if (activeFile === 'projects.tsx') {
    return renderHybridEditorCanvas(
      'Selected Frontend Engineering Case Studies — StreamPulse, DevDock & GeoLearn',
      <>
        <span className="text-[#C586C0]">export const</span>{' '}
        <span className="text-[#4FC1FF]">SELECTED_PROJECTS</span>
        <span className="text-[#CCCCCC]">: </span>
        <span className="text-[#4EC9B0]">PortfolioProject</span>
        <span className="text-[#CCCCCC]">[] = [</span>
      </>,
      [
        { label: 'Inspect StreamPulse', onClick: () => onSelectProject(projects[0]) },
        { label: 'Inspect DevDock', onClick: () => onSelectProject(projects[1]) },
        { label: 'Inspect GeoLearn', onClick: () => onSelectProject(projects[2]) },
      ],
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {projects.map((proj, index) => {
            const imgFailed = Boolean(failedProjectImgs[proj.id]);
            return (
              <article
                key={proj.id}
                onClick={() => onSelectProject(proj)}
                className={`rounded-md border ${cardSurface} hover:border-[#0078D4] overflow-hidden flex flex-col justify-between transition-colors cursor-pointer group`}
              >
                <div>
                  <div className="relative w-full aspect-video bg-[#141414] overflow-hidden border-b border-[#2B2B2B]">
                    {!imgFailed ? (
                      <img
                        src={proj.image}
                        alt={proj.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedProjectImgs((prev) => ({ ...prev, [proj.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#141414] p-6 text-center">
                        <Codicon name="code" className="!text-[28px] text-[#0078D4] mb-2" />
                        <span className="text-sm font-bold text-white">{proj.title}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div
                      className={`flex flex-wrap items-center gap-2 text-xs font-mono ${mutedText}`}
                    >
                      <span className="text-[#569CD6] tabular-nums">0{index + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span>{proj.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{proj.year}</span>
                    </div>

                    <div className="space-y-1.5">
                      <h2
                        className={`text-lg font-bold group-hover:text-[#4FC1FF] transition-colors ${headingText}`}
                      >
                        {proj.title}
                      </h2>
                      <p className="text-xs leading-relaxed">{proj.description}</p>
                    </div>

                    <div className="text-[11px] font-mono text-[#CE9178] pt-1">
                      {proj.tags.join(' · ')}
                    </div>
                  </div>
                </div>

                <div className={`p-5 pt-3.5 border-t ${borderClass} space-y-3`}>
                  <div className="grid grid-cols-3 gap-2 text-left">
                    {proj.metrics.map((m) => (
                      <div key={m.label}>
                        <p className={`text-[10px] truncate ${mutedText}`}>{m.label}</p>
                        <p className="text-xs font-bold text-[#4EC9B0] font-mono tabular-nums mt-0.5">
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div
                    className="flex items-center justify-between gap-2 pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onStarProject(proj.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border ${borderClass} hover:border-[#0078D4] text-xs font-mono tabular-nums transition-colors cursor-pointer`}
                    >
                      <Codicon name="star-full" className="!text-[12px] text-[#DCDCAA]" />
                      <span>{proj.stars}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <a
                        href={proj.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border ${borderClass} hover:bg-[#2A2D2E] text-xs font-mono transition-colors`}
                      >
                        <Codicon name="source-control" className="!text-[12px]" />
                        <span>Repo</span>
                      </a>
                      <a
                        href={proj.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0078D4] hover:bg-[#1084DF] text-white text-xs font-mono transition-colors"
                      >
                        <span>Demo</span>
                        <Codicon name="link-external" className="!text-[12px]" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. SKILLS.JSON VIEW (WITH OFFICIAL MULTI-COLOR DEVICON LOGOS)
  if (activeFile === 'skills.json') {
    const categories: Array<
      'All' | 'Frontend Core' | 'UI & Architecture' | 'Backend & Tooling'
    > = ['All', 'Frontend Core', 'UI & Architecture', 'Backend & Tooling'];

    const filteredSkills = PORTFOLIO_SKILLS.filter((skill) => {
      const matchesCat = skillCategory === 'All' || skill.category === skillCategory;
      const q = skillSearch.toLowerCase().trim();
      const matchesQuery =
        !q ||
        skill.name.toLowerCase().includes(q) ||
        skill.desc.toLowerCase().includes(q) ||
        skill.projectsUsed.some((p) => p.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });

    return renderHybridEditorCanvas(
      'Core Frontend Stack & Developer Tooling Configuration (skills.json)',
      <>
        <span className="text-[#9CDCFE]">&quot;stack&quot;</span>
        <span className="text-[#CCCCCC]">: &#123;</span>
      </>,
      categories.map((c) => ({
        label: `Filter: ${c}`,
        onClick: () => setSkillCategory(c),
      })),
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded bg-[#181818] border border-[#2B2B2B]">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSkillCategory(cat)}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                  skillCategory === cat
                    ? 'bg-[#0078D4] text-white font-semibold'
                    : 'text-[#858585] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded border ${cardSurface} w-full sm:w-72`}
          >
            <Codicon name="search" className="!text-[13px] text-[#858585]" />
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Search skills or projects..."
              className="w-full bg-transparent text-xs font-mono focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill, idx) => (
            <div
              key={skill.id}
              onClick={() => onOpenFile(`extension:${skill.id}`)}
              title={`Click to open ${skill.name} VS Code Extension Marketplace Details`}
              className={`rounded-md border ${cardSurface} hover:border-[#0078D4] p-5 flex flex-col justify-between space-y-4 cursor-pointer transition-colors group`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-md bg-[#181818] border border-[#2B2B2B] flex items-center justify-center shrink-0">
                      <OfficialSkillIcon skillId={skill.id} className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2
                          className={`text-base font-bold group-hover:text-[#4FC1FF] transition-colors ${headingText}`}
                        >
                          {skill.name}
                        </h2>
                        <Codicon
                          name="verified-filled"
                          className="!text-[12px] text-[#0078D4]"
                          title="Verified Official Stack"
                        />
                      </div>
                      <p className={`text-xs ${mutedText}`}>{skill.desc}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#569CD6] tabular-nums">
                    {skill.version}
                  </span>
                </div>

                <pre className="p-2.5 rounded bg-[#141414] border border-[#2B2B2B] text-[11px] font-mono text-[#9CDCFE] overflow-x-auto">
                  <code>{skill.codeExample}</code>
                </pre>
              </div>

              <div
                className={`pt-2.5 border-t ${borderClass} flex items-center justify-between text-xs font-mono ${mutedText}`}
              >
                <span className="truncate">
                  projects: <span className="text-[#CE9178]">{skill.projectsUsed.join(' · ')}</span>
                </span>
                <span className="text-[#0078D4] group-hover:underline shrink-0 ml-2">
                  Extension ↗
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. EDUCATION.MD VIEW
  if (activeFile === 'education.md') {
    return renderHybridEditorCanvas(
      'Academic Credentials & Computer Applications Foundation (education.md)',
      <>
        <span className="text-[#569CD6] font-bold">
          # Academic Timeline — {DEVELOPER_PROFILE.name}
        </span>
      </>,
      [
        { label: 'Run education in Terminal', onClick: onOpenTerminal },
        { label: 'Open Overview', onClick: () => onOpenFile('overview.tsx') },
      ],
      <div className="space-y-4 max-w-4xl">
        {EDUCATION_TIMELINE.map((item, idx) => (
          <div key={item.id} className={`rounded-md border ${cardSurface} p-6 space-y-3`}>
            <div className={`flex flex-wrap items-center gap-2 text-xs font-mono ${mutedText}`}>
              <span className="text-[#569CD6] font-semibold tabular-nums">
                0{idx + 1} · {item.year}
              </span>
              <span aria-hidden="true">·</span>
              <span>{item.location}</span>
              {item.score && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#4EC9B0] font-semibold tabular-nums">{item.score}</span>
                </>
              )}
            </div>

            <div>
              <h2 className={`text-lg sm:text-xl font-bold ${headingText}`}>{item.degree}</h2>
              <p className="text-xs font-mono text-[#CE9178] mt-0.5">{item.institution}</p>
            </div>

            <ul className="space-y-1.5 text-sm leading-relaxed pt-1">
              {item.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#0078D4] font-mono select-none">-</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  // 5. BLOG.MDX VIEW
  if (activeFile === 'blog.mdx') {
    const article = BLOG_POSTS[0];
    return renderHybridEditorCanvas(
      `Technical Article — ${article.title}`,
      <>
        <span className="text-[#C586C0]">export const</span>{' '}
        <span className="text-[#4FC1FF]">frontmatter</span> = &#123;{' '}
        <span className="text-[#9CDCFE]">date</span>:{' '}
        <span className="text-[#CE9178]">&quot;{article.date}&quot;</span>,{' '}
        <span className="text-[#9CDCFE]">readTime</span>:{' '}
        <span className="text-[#CE9178]">&quot;{article.readTime}&quot;</span> &#125;;
      </>,
      [
        { label: 'View Projects Discussed', onClick: () => onOpenFile('projects.tsx') },
        { label: 'Inspect Stack', onClick: () => onOpenFile('skills.json') },
      ],
      <article className="max-w-4xl space-y-6">
        <div className={`rounded-md border ${cardSurface} p-6 space-y-4`}>
          <div className={`flex flex-wrap items-center gap-2 text-xs font-mono ${mutedText}`}>
            <span className="text-[#4EC9B0]">{article.category}</span>
            <span aria-hidden="true">·</span>
            <span>{article.date}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{article.readTime}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#CE9178]">{article.tags.join(' · ')}</span>
          </div>

          <h1 className={`text-2xl sm:text-3xl font-bold [text-wrap:balance] ${headingText}`}>
            {article.title}
          </h1>

          <p className="text-sm leading-relaxed">{article.summary}</p>

          <div className="relative w-full aspect-video rounded overflow-hidden border border-[#2B2B2B] bg-[#141414]">
            {!blogImgFailed ? (
              <img
                src={article.coverImage}
                alt={article.title}
                referrerPolicy="no-referrer"
                onError={() => setBlogImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#141414] p-8 text-center">
                <p className="text-lg font-bold text-white">{article.title}</p>
                <p className="text-xs text-[#858585] mt-1">{article.date}</p>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2 text-sm leading-relaxed">
            {article.content.split('\n\n').map((block, idx) => {
              if (block.startsWith('## ')) {
                return (
                  <h2 key={idx} className={`text-lg sm:text-xl font-bold pt-3 ${headingText}`}>
                    {block.replace('## ', '')}
                  </h2>
                );
              }
              if (block.startsWith('### ')) {
                const lines = block.split('\n');
                const subheading = lines[0].replace('### ', '');
                const items = lines.slice(1);
                return (
                  <div key={idx} className="space-y-2 pt-1">
                    <h3 className="text-base font-semibold text-[#4FC1FF]">{subheading}</h3>
                    <ul className="space-y-1.5">
                      {items.map((line, lIdx) => (
                        <li key={lIdx}>{line.replace(/^- /, '• ')}</li>
                      ))}
                    </ul>
                  </div>
                );
              }
              return <p key={idx}>{block}</p>;
            })}
          </div>
        </div>
      </article>
    );
  }

  // 6. CONTACT.TSX VIEW
  if (activeFile === 'contact.tsx') {
    return renderHybridEditorCanvas(
      'Direct Contact Dispatch & Synchronized Developer Guestbook (contact.tsx)',
      <>
        <span className="text-[#C586C0]">export async function</span>{' '}
        <span className="text-[#DCDCAA]">dispatchDirectMessage</span>
        <span className="text-[#CCCCCC]">(payload: </span>
        <span className="text-[#4EC9B0]">ContactPayload</span>
        <span className="text-[#CCCCCC]">) &#123;</span>
      </>,
      [
        { label: 'Sync Cloud Guestbook', onClick: () => onTriggerSync() },
        { label: 'Open Terminal', onClick: onOpenTerminal },
      ],
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Direct Contact Form */}
        <div className={`lg:col-span-7 rounded-md border ${cardSurface} p-6`}>
          <h2 className={`text-lg font-bold mb-1 ${headingText}`}>
            Have a Frontend Problem to Solve?
          </h2>
          <p className={`text-xs mb-5 ${mutedText}`}>
            Open to frontend internships, entry-level React roles, and product collaborations.
          </p>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="contact-name" className="block text-xs font-mono text-[#9CDCFE]">
                name: string *
              </label>
              <input
                id="contact-name"
                type="text"
                required
                maxLength={100}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Enter your name"
                className={`w-full px-3 py-2 rounded border ${
                  isDark
                    ? 'bg-[#3C3C3C] border-[#2B2B2B] text-white focus:border-[#0078D4]'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-[#0078D4]'
                } text-xs font-mono focus:outline-none`}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="contact-email" className="block text-xs font-mono text-[#9CDCFE]">
                email: string *
              </label>
              <input
                id="contact-email"
                type="email"
                required
                maxLength={254}
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full px-3 py-2 rounded border ${
                  isDark
                    ? 'bg-[#3C3C3C] border-[#2B2B2B] text-white focus:border-[#0078D4]'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-[#0078D4]'
                } text-xs font-mono focus:outline-none`}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="contact-msg" className="block text-xs font-mono text-[#9CDCFE]">
                message: string *
              </label>
              <textarea
                id="contact-msg"
                rows={4}
                required
                maxLength={5000}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Hi Mustafa, I would like to talk about..."
                className={`w-full px-3 py-2 rounded border ${
                  isDark
                    ? 'bg-[#3C3C3C] border-[#2B2B2B] text-white focus:border-[#0078D4]'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-[#0078D4]'
                } text-xs font-mono focus:outline-none resize-none`}
              />
            </div>

            {contactStatus === 'success' && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded bg-[#1E3A2F] border border-[#4EC9B0]/40 text-[#4EC9B0] text-xs font-mono">
                <span className="flex items-center gap-2">
                  <Codicon name="check" className="!text-[14px]" />
                  <span>Message delivered and persisted to backend inbox.</span>
                </span>
                <button
                  type="button"
                  onClick={() => onOpenFile('messages-inbox.json')}
                  className="px-2.5 py-1 rounded bg-[#0078D4] text-white hover:bg-[#1084DF] cursor-pointer"
                >
                  Open Inbox (messages-inbox.json)
                </button>
              </div>
            )}

            {contactStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 rounded bg-[#3A1E1E] border border-[#F48771]/40 text-[#F48771] text-xs font-mono">
                <Codicon name="error" className="!text-[14px]" />
                <span>{contactErrorText}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={contactStatus === 'sending'}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded bg-[#0078D4] hover:bg-[#1084DF] disabled:opacity-50 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              <Codicon name="send" className="!text-[13px]" />
              <span>{contactStatus === 'sending' ? 'Sending...' : 'Send Message'}</span>
            </button>
          </form>
        </div>

        {/* Right: Direct Channels & Synchronized Peer Guestbook */}
        <div className="lg:col-span-5 space-y-5">
          <div className={`rounded-md border ${cardSurface} p-5 space-y-3`}>
            <h3 className={`text-sm font-bold font-mono ${headingText}`}>Direct Endpoints</h3>
            <div className="space-y-2 text-xs font-mono">
              <a
                href={`mailto:${DEVELOPER_PROFILE.email}`}
                className="flex items-center justify-between py-1.5 border-b border-[#2B2B2B] text-[#4FC1FF] hover:underline"
              >
                <span className="flex items-center gap-2">
                  <Codicon name="mail" className="!text-[13px]" />
                  <span>{DEVELOPER_PROFILE.email}</span>
                </span>
                <Codicon name="link-external" className="!text-[12px]" />
              </a>
              {DEVELOPER_PROFILE.socials.map((soc) => (
                <a
                  key={soc.name}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-1 hover:text-[#4FC1FF] transition-colors"
                >
                  <span>{soc.name}</span>
                  <span className={mutedText}>{soc.handle} ↗</span>
                </a>
              ))}
            </div>
          </div>

          <div className={`rounded-md border ${cardSurface} p-5 space-y-3`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold font-mono ${headingText}`}>
                Cloud Peer Guestbook
              </h3>
              <button
                type="button"
                onClick={() => onTriggerSync()}
                className="inline-flex items-center gap-1 text-xs font-mono text-[#4EC9B0] hover:underline cursor-pointer"
              >
                <Codicon name="sync" className="!text-[12px]" />
                <span>Sync #{syncStats.syncCount}</span>
              </button>
            </div>

            <form onSubmit={handleGuestbookSubmit} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={gbAuthor}
                  onChange={(e) => setGbAuthor(e.target.value)}
                  placeholder="Your Name"
                  className={`px-2.5 py-1.5 rounded border ${
                    isDark
                      ? 'bg-[#3C3C3C] border-[#2B2B2B] text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  } text-xs font-mono focus:outline-none`}
                />
                <input
                  type="text"
                  value={gbRole}
                  onChange={(e) => setGbRole(e.target.value)}
                  placeholder="Role / City"
                  className={`px-2.5 py-1.5 rounded border ${
                    isDark
                      ? 'bg-[#3C3C3C] border-[#2B2B2B] text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  } text-xs font-mono focus:outline-none`}
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={gbComment}
                  onChange={(e) => setGbComment(e.target.value)}
                  placeholder="Add developer note..."
                  className={`flex-1 px-2.5 py-1.5 rounded border ${
                    isDark
                      ? 'bg-[#3C3C3C] border-[#2B2B2B] text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  } text-xs font-mono focus:outline-none`}
                />
                <button
                  type="submit"
                  disabled={gbSubmitting}
                  className="px-3 py-1.5 rounded bg-[#0078D4] hover:bg-[#1084DF] text-white font-mono text-xs shrink-0 cursor-pointer"
                >
                  Commit
                </button>
              </div>
            </form>

            <div className={`divide-y ${borderClass} max-h-52 overflow-y-auto pt-1`}>
              {guestbook.map((entry) => (
                <div key={entry.id} className="py-2.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-semibold text-[#4FC1FF]">{entry.author}</span>
                    <span className={`text-[10px] ${mutedText}`}>{entry.role}</span>
                  </div>
                  <p className="leading-relaxed">{entry.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 7. MESSAGES-INBOX.JSON VIEW (Persisted Contact Form & Terminal Inquiries)
  if (activeFile === 'messages-inbox.json') {
    const unreadCount = messages.filter((m) => !m.read).length;
    return renderHybridEditorCanvas(
      'Persisted Contact Inquiries & Recruiter Messages Inbox (config/messages-inbox.json)',
      <>
        <span className="text-[#9CDCFE]">&quot;incomingMessages&quot;</span>:{' '}
        <span className="text-[#CCCCCC]">[</span>{' '}
        <span className="text-[#6A9955]">
          // {messages.length} total ({unreadCount} unread) · Visitor Sessions: {visitorCount}
        </span>
      </>,
      [
        { label: 'Compose New Message (contact.tsx)', onClick: () => onOpenFile('contact.tsx') },
        { label: 'Query via Terminal (`inbox`)', onClick: onOpenTerminal },
        { label: 'Sync Backend Store', onClick: () => onTriggerSync() },
      ],
      <div className="max-w-4xl space-y-6">
        {/* Top Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className={`rounded-md border ${cardSurface} p-4 space-y-1`}>
            <p className={mutedText}>totalMessages</p>
            <p className="text-2xl font-bold text-[#4EC9B0] tabular-nums">{messages.length}</p>
            <p className={mutedText}>Persisted in .data/portfolio-cloud-store.json</p>
          </div>
          <div className={`rounded-md border ${cardSurface} p-4 space-y-1`}>
            <p className={mutedText}>unreadInquiries</p>
            <p className="text-2xl font-bold text-[#4FC1FF] tabular-nums">{unreadCount}</p>
            <p className={mutedText}>Real-time SSE notifications enabled</p>
          </div>
          <div className={`rounded-md border ${cardSurface} p-4 space-y-1`}>
            <p className={mutedText}>portfolioVisitors</p>
            <p className="text-2xl font-bold text-[#DCDCAA] tabular-nums">{visitorCount}</p>
            <p className={mutedText}>Cloud Sync Revision #{syncStats.syncCount}</p>
          </div>
        </div>

        {/* Message Cards */}
        {messages.length === 0 ? (
          <div className={`rounded-md border ${cardSurface} p-8 text-center space-y-3`}>
            <Codicon name="mail" className="!text-[28px] text-[#858585]" />
            <p className={`text-sm font-semibold ${headingText}`}>No messages in inbox</p>
            <p className={`text-xs ${mutedText}`}>
              Messages submitted via contact.tsx or the terminal contact command appear here automatically.
            </p>
            <button
              type="button"
              onClick={() => onOpenFile('contact.tsx')}
              className="px-4 py-1.5 rounded bg-[#0078D4] hover:bg-[#1084DF] text-white text-xs font-medium cursor-pointer"
            >
              Send a Test Message
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-md border ${cardSurface} p-5 space-y-3 transition-colors ${
                  !msg.read ? 'border-[#0078D4]' : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <Codicon
                      name={msg.read ? 'mail-read' : 'mail'}
                      className={`!text-[14px] ${msg.read ? 'text-[#858585]' : 'text-[#4FC1FF]'}`}
                    />
                    <span className={`font-bold ${headingText}`}>{msg.name}</span>
                    <span className={mutedText}>&lt;{msg.email}&gt;</span>
                    {!msg.read && (
                      <span className="text-[11px] text-[#4EC9B0] font-semibold">· UNREAD</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className={mutedText}>
                      {new Date(msg.createdAt).toLocaleString()} · via {msg.source}
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                <div className={`flex flex-wrap items-center gap-3 pt-2 border-t ${borderClass} text-xs font-mono`}>
                  <a
                    href={`mailto:${msg.email}?subject=Re: Portfolio Inquiry (${DEVELOPER_PROFILE.name})`}
                    className="inline-flex items-center gap-1.5 text-[#4FC1FF] hover:underline"
                  >
                    <Codicon name="reply" className="!text-[12px]" />
                    <span>Reply via Email</span>
                  </a>
                  <span className={mutedText}>·</span>
                  <button
                    type="button"
                    onClick={() => handleToggleMessageRead(msg.id, msg.read)}
                    className="inline-flex items-center gap-1 text-[#CCCCCC] hover:text-white cursor-pointer"
                  >
                    <Codicon name="check" className="!text-[12px]" />
                    <span>{msg.read ? 'Mark as Unread' : 'Mark as Read'}</span>
                  </button>
                  <span className={mutedText}>·</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="inline-flex items-center gap-1 text-[#F48771] hover:underline cursor-pointer"
                  >
                    <Codicon name="trash" className="!text-[12px]" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 8. PACKAGE.JSON VIEW
  return renderHybridEditorCanvas(
    'Workspace Manifest & Dependency Configuration (package.json)',
    <>
      <span className="text-[#9CDCFE]">&quot;name&quot;</span>:{' '}
      <span className="text-[#CE9178]">&quot;mustafa-dev-portfolio&quot;</span>,
    </>,
    [
      { label: 'Run npm scripts in Terminal', onClick: onOpenTerminal },
      { label: 'Open Graphical Settings (Ctrl+,)', onClick: () => onOpenFile('settings') },
      { label: 'Open Messages Inbox', onClick: () => onOpenFile('messages-inbox.json') },
    ],
    <div className="max-w-3xl space-y-4">
      <div className={`rounded-md border ${cardSurface} p-6 font-mono text-xs space-y-2`}>
        <div>
          <span className="text-[#9CDCFE]">&quot;author&quot;</span>:{' '}
          <span className="text-[#CE9178]">&quot;{DEVELOPER_PROFILE.name}&quot;</span>,
        </div>
        <div>
          <span className="text-[#9CDCFE]">&quot;email&quot;</span>:{' '}
          <span className="text-[#CE9178]">&quot;{DEVELOPER_PROFILE.email}&quot;</span>,
        </div>
        <div>
          <span className="text-[#9CDCFE]">&quot;education&quot;</span>:{' '}
          <span className="text-[#CE9178]">&quot;{DEVELOPER_PROFILE.educationShort}&quot;</span>,
        </div>
        <div>
          <span className="text-[#9CDCFE]">&quot;scripts&quot;</span>: &#123;
          <div className="pl-4 space-y-1 py-1">
            <div>
              <span className="text-[#9CDCFE]">&quot;dev&quot;</span>:{' '}
              <span className="text-[#CE9178]">&quot;tsx server.ts&quot;</span>,
            </div>
            <div>
              <span className="text-[#9CDCFE]">&quot;build&quot;</span>:{' '}
              <span className="text-[#CE9178]">&quot;vite build&quot;</span>,
            </div>
            <div>
              <span className="text-[#9CDCFE]">&quot;sync&quot;</span>:{' '}
              <span className="text-[#CE9178]">&quot;curl -X POST /api/sync&quot;</span>
            </div>
          </div>
          &#125;,
        </div>
        <div>
          <span className="text-[#9CDCFE]">&quot;dependencies&quot;</span>: &#123;
          <div className="pl-4 space-y-1 py-1">
            <div>
              <span className="text-[#9CDCFE]">&quot;@vscode/codicons&quot;</span>:{' '}
              <span className="text-[#B5CEA8]">&quot;^0.0.36&quot;</span>,
            </div>
            <div>
              <span className="text-[#9CDCFE]">&quot;react&quot;</span>:{' '}
              <span className="text-[#B5CEA8]">&quot;^19.0.1&quot;</span>,
            </div>
            <div>
              <span className="text-[#9CDCFE]">&quot;tailwindcss&quot;</span>:{' '}
              <span className="text-[#B5CEA8]">&quot;^4.3.3&quot;</span>,
            </div>
            <div>
              <span className="text-[#9CDCFE]">&quot;express&quot;</span>:{' '}
              <span className="text-[#B5CEA8]">&quot;^5.1.0&quot;</span>
            </div>
          </div>
          &#125;
        </div>
      </div>
    </div>
  );
};
