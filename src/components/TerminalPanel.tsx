import React, { useState, useRef, useEffect } from 'react';
import { Codicon, SetiFileIcon, OfficialSkillIcon, OfficialGeminiLogo } from './OfficialIcons';
import {
  DEVELOPER_PROFILE,
  WORKSPACE_FILES,
  PortfolioProject,
  PORTFOLIO_SKILLS,
  EDUCATION_TIMELINE,
} from '../data/portfolioData';
import { OSPlatform } from '../utils/platform';
import { GeminiChatPanel } from './GeminiChatPanel';
import { askGemini } from '../services/geminiClient';

export interface TerminalHistoryItem {
  id: string;
  command: string;
  timestamp: string;
  output: React.ReactNode;
}

export type BottomPanelTab = 'terminal' | 'gemini';

interface TerminalSession {
  id: string;
  name: string;
  shell: 'bash';
  entries: TerminalHistoryItem[];
}

interface TerminalPanelProps {
  isOpen: boolean;
  isExpanded: boolean;
  activeTab: BottomPanelTab;
  onSelectTab: (tab: BottomPanelTab) => void;
  onToggleOpen: () => void;
  onToggleExpand: () => void;
  onOpenFile: (fileId: string) => void;
  onSelectProject: (project: PortfolioProject) => void;
  onStarProject: (projectId: string) => Promise<void>;
  onToggleTheme: (target?: 'dark' | 'light') => void;
  theme: 'dark' | 'light';
  projects: PortfolioProject[];
  visitorCount?: number;
  messages?: Array<{
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: string;
    source: 'form' | 'terminal';
    read: boolean;
  }>;
  isOwner?: boolean;
  onOwnerSignIn?: () => Promise<void>;
  os?: OSPlatform;
}

const QUICK_COMMANDS = [
  'help',
  'gemini',
  'whoami',
  'projects',
  'skills',
  'education',
  'visitors',
  'contact',
  'inbox',
] as const;

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  isOpen,
  isExpanded,
  activeTab,
  onSelectTab,
  onToggleOpen,
  onToggleExpand,
  onOpenFile,
  onSelectProject,
  onStarProject,
  onToggleTheme,
  theme,
  projects,
  visitorCount = 0,
  messages = [],
  isOwner = false,
  onOwnerSignIn,
  os = 'windows',
}) => {
  const [input, setInput] = useState('');

  const [sessions, setSessions] = useState<TerminalSession[]>([
    {
      id: 'term-1',
      name: 'bash',
      shell: 'bash',
      entries: [
        {
          id: 'init-welcome',
          command: 'mustafa-cli --info',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          output: (
            <div className="space-y-1.5 text-xs leading-relaxed">
              <p className="text-[#4EC9B0] font-semibold">
                Visual Studio Code Integrated Terminal · MUSTAFA.dev ({DEVELOPER_PROFILE.name})
              </p>
              <p className="text-[#9CDCFE]">
                Type <span className="text-[#DCDCAA] font-semibold">help</span> to view all commands.
                The <span className="text-[#0078D4] font-semibold">Gemini AI Agent</span> is now integrated directly into this terminal!
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => onSelectTab('gemini')}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0078D4]/20 hover:bg-[#0078D4]/30 border border-[#0078D4]/40 text-[#4FC1FF] cursor-pointer transition-colors"
                >
                  <OfficialGeminiLogo className="w-3.5 h-3.5" />
                  <span>Switch to Gemini Agent Chat Tab</span>
                </button>
                <span className="text-[#858585]">or run</span>
                <code className="text-[#DCDCAA] bg-[#252526] px-1.5 py-0.5 rounded">gemini &lt;question&gt;</code>
              </div>
            </div>
          ),
        },
      ],
    },
  ]);

  const [commandHistory, setCommandHistory] = useState<string[]>([
    'help',
    'whoami',
    'projects',
    'skills',
    'education',
    'visitors',
    'contact',
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // VS Code authentic draggable terminal resizer state
  const [panelHeight, setPanelHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vscode_terminal_height');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 120 && val <= 850) return val;
      }
      return window.innerHeight < 700 ? 190 : 240;
    }
    return 240;
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(240);
  const currentHeightRef = useRef<number>(panelHeight);

  // Keep currentHeightRef in sync
  useEffect(() => {
    currentHeightRef.current = panelHeight;
  }, [panelHeight]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Start resize drag handler (mouse and touch)
  const handleStartResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartYRef.current = clientY;
    startHeightRef.current = currentHeightRef.current;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = dragStartYRef.current - clientY; // dragging UP increases height
      const minHeight = 120;
      const maxHeight = Math.max(260, window.innerHeight - 100);
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, minHeight), maxHeight);
      currentHeightRef.current = newHeight;
      setPanelHeight(newHeight);
      try {
        localStorage.setItem('vscode_terminal_height', newHeight.toString());
      } catch {
        // ignore
      }
    };

    const handleEnd = () => {
      setIsResizing(false);
      try {
        localStorage.setItem('vscode_terminal_height', currentHeightRef.current.toString());
      } catch {
        // ignore
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isResizing]);

  const activeSession = sessions[0];

  useEffect(() => {
    if (scrollContainerRef.current && activeTab === 'terminal') {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [activeSession.entries, isOpen, activeTab]);

  const appendToActiveSession = (entry: TerminalHistoryItem | null, clear = false) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSession.id) return s;
        if (clear) return { ...s, entries: [] };
        return entry ? { ...s, entries: [...s.entries, entry] } : s;
      })
    );
  };

  const executeCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setCommandHistory((prev) => [trimmed, ...prev.slice(0, 49)]);
    setHistoryIndex(-1);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    if (cmd === 'clear' || cmd === 'cls') {
      appendToActiveSession(null, true);
      setInput('');
      return;
    }

    let outputNode: React.ReactNode = null;

    switch (cmd) {
      case 'help': {
        outputNode = (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs py-1">
            <div>
              <span className="text-[#DCDCAA] font-semibold">gemini &lt;query&gt;</span>
              <span className="text-[#858585]"> · Ask Gemini AI Agent directly in terminal</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">whoami</span>
              <span className="text-[#858585]"> · Display developer bio &amp; BCA CGPA</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">ls</span>
              <span className="text-[#858585]"> · List workspace files &amp; shortcuts</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">open &lt;file&gt;</span>
              <span className="text-[#858585]"> · Open file or settings (e.g. open skills.json)</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">projects</span>
              <span className="text-[#858585]"> · List StreamPulse, DevDock &amp; GeoLearn</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">project &lt;id&gt;</span>
              <span className="text-[#858585]"> · Launch case study inspector modal</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">star &lt;id&gt;</span>
              <span className="text-[#858585]"> · Endorse a portfolio project</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">skills</span>
              <span className="text-[#858585]"> · Output categorized React &amp; UI stack</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">education</span>
              <span className="text-[#858585]"> · Print Brainware University &amp; school timeline</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">visitors</span>
              <span className="text-[#858585]"> · Show live deduplicated unique visitor count</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">contact</span>
              <span className="text-[#858585]"> · Show direct email &amp; social profiles</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">inbox</span>
              <span className="text-[#858585]"> · View private Contact messages (Owner Only)</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">theme</span>
              <span className="text-[#858585]"> · Toggle Dark Modern / Light Modern theme</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">settings</span>
              <span className="text-[#858585]"> · Open VS Code Graphical Settings Editor</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">clear</span>
              <span className="text-[#858585]"> · Clear terminal buffer</span>
            </div>
          </div>
        );
        break;
      }

      case 'gemini':
      case 'ask':
      case 'chat':
      case 'agent': {
        if (!arg) {
          // If no query provided, switch to the dedicated visual Gemini agent tab
          onSelectTab('gemini');
          outputNode = (
            <div className="space-y-1 text-xs py-1">
              <p className="text-[#4EC9B0] flex items-center gap-1.5 font-semibold">
                <OfficialGeminiLogo className="w-3.5 h-3.5" />
                <span>Opened Gemini AI Agent Tab</span>
              </p>
              <p className="text-[#858585]">
                Switched terminal view to full visual chat with typewriter streaming and reasoning thoughts.
                You can also query directly inline: <code className="text-[#DCDCAA]">gemini Tell me about Mustafa's projects</code>
              </p>
            </div>
          );
        } else {
          // Query directly inline within the terminal shell
          const pendingEntryId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          
          // Initial thinking indicator entry
          appendToActiveSession({
            id: pendingEntryId,
            command: trimmed,
            timestamp,
            output: (
              <div className="flex items-center gap-2 py-1 text-xs text-[#0078D4] animate-pulse">
                <OfficialGeminiLogo className="w-3.5 h-3.5 animate-spin" />
                <span>Gemini AI Agent is thinking &amp; retrieving portfolio context...</span>
              </div>
            ),
          });
          setInput('');

          try {
            const res = await askGemini(arg);
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== activeSession.id) return s;
                return {
                  ...s,
                  entries: s.entries.map((entry) => {
                    if (entry.id !== pendingEntryId) return entry;
                    return {
                      ...entry,
                      output: (
                        <div className="space-y-2 text-xs py-1 leading-relaxed">
                          {res.thoughts && res.thoughts.length > 0 && (
                            <details className="text-[11px] bg-[#1E1E1E]/50 border border-[#2B2B2B] rounded p-2">
                              <summary className="cursor-pointer text-[#858585] hover:text-[#CCCCCC] flex items-center gap-1 font-mono">
                                <span>Thinking Process ({res.thoughts.length} steps)</span>
                              </summary>
                              <ul className="mt-1.5 space-y-1 list-disc list-inside text-[#858585]">
                                {res.thoughts.map((t, i) => (
                                  <li key={i}>{t}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                          <div className="text-[#CCCCCC] whitespace-pre-wrap font-sans">
                            {res.reply}
                          </div>
                          <div className="flex items-center gap-2 pt-1 border-t border-[#2B2B2B] text-[10px] text-[#858585]">
                            <OfficialGeminiLogo className="w-3 h-3 text-[#0078D4]" />
                            <span>Model: {res.model}</span>
                            <span>·</span>
                            <button
                              type="button"
                              onClick={() => onSelectTab('gemini')}
                              className="text-[#0078D4] hover:underline cursor-pointer"
                            >
                              Open in Gemini Agent Tab ↗
                            </button>
                          </div>
                        </div>
                      ),
                    };
                  }),
                };
              })
            );
          } catch (err) {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== activeSession.id) return s;
                return {
                  ...s,
                  entries: s.entries.map((entry) => {
                    if (entry.id !== pendingEntryId) return entry;
                    return {
                      ...entry,
                      output: (
                        <p className="text-[#F48771] text-xs">
                          Gemini Agent Error: {err instanceof Error ? err.message : 'Failed to query Gemini API'}
                        </p>
                      ),
                    };
                  }),
                };
              })
            );
          }
          return;
        }
        break;
      }

      case 'whoami':
      case 'about': {
        outputNode = (
          <div className="space-y-1 text-xs py-1">
            <p className="text-[#4EC9B0] font-semibold">
              {DEVELOPER_PROFILE.name} — {DEVELOPER_PROFILE.title} ({DEVELOPER_PROFILE.roleSubtitle})
            </p>
            <p className="text-[#CCCCCC]">
              Location: {DEVELOPER_PROFILE.location} · Status: {DEVELOPER_PROFILE.availability}
            </p>
            <p className="text-[#858585] max-w-3xl leading-relaxed">
              {DEVELOPER_PROFILE.leadSubtitle}
            </p>
          </div>
        );
        break;
      }

      case 'visitors':
      case 'visitor': {
        outputNode = (
          <div className="space-y-1 text-xs py-1 font-mono">
            <p className="text-[#4EC9B0] font-semibold">
              Unique Portfolio Visitors: {visitorCount}
            </p>
            <p className="text-[#858585]">
              Deduplicated in real time per unique browser/device via SHA-256 fingerprint.
            </p>
          </div>
        );
        break;
      }

      case 'ls':
      case 'dir':
      case 'files': {
        outputNode = (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-xs py-1">
            {WORKSPACE_FILES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onOpenFile(f.id)}
                className="text-left hover:underline text-[#4FC1FF] flex items-center gap-2 cursor-pointer"
              >
                <SetiFileIcon
                  fileId={f.id}
                  extension={f.extension}
                  className="w-3.5 h-3.5 shrink-0"
                />
                <span className="font-mono">{f.path}</span>
                <span className="text-[#858585]">({f.shortcut})</span>
              </button>
            ))}
          </div>
        );
        break;
      }

      case 'settings': {
        onOpenFile('settings');
        outputNode = (
          <p className="text-[#4EC9B0] text-xs">
            Opened Visual Studio Code Graphical Settings Editor (Ctrl+,).
          </p>
        );
        break;
      }

      case 'open':
      case 'code':
      case 'cat': {
        const target = arg.toLowerCase().trim();
        if (target === 'settings') {
          onOpenFile('settings');
          outputNode = <p className="text-[#4EC9B0] text-xs">Opened Settings UI.</p>;
          break;
        }
        const matched = WORKSPACE_FILES.find(
          (f) =>
            f.id.toLowerCase() === target ||
            f.name.toLowerCase().startsWith(target) ||
            f.navLabel.toLowerCase() === target
        );
        if (!matched) {
          outputNode = (
            <p className="text-[#F48771] text-xs">
              File not found: &quot;{arg}&quot;. Available:{' '}
              {WORKSPACE_FILES.map((f) => f.name).join(', ')}
            </p>
          );
        } else {
          onOpenFile(matched.id);
          outputNode = (
            <p className="text-[#4EC9B0] text-xs">
              Opened editor tab <span className="font-semibold">{matched.path}</span>
            </p>
          );
        }
        break;
      }

      case 'projects': {
        outputNode = (
          <div className="space-y-2 text-xs py-1">
            {projects.map((p, idx) => (
              <div
                key={p.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#2B2B2B] pb-1.5"
              >
                <div>
                  <span className="text-[#4EC9B0] font-semibold">
                    0{idx + 1}. {p.title}
                  </span>
                  <span className="text-[#858585]">
                    {' '}
                    · {p.category} · ★ {p.stars}
                  </span>
                  <p className="text-[#CCCCCC] mt-0.5">{p.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectProject(p)}
                    className="text-[#0078D4] hover:underline font-medium cursor-pointer"
                  >
                    Inspect Case Study
                  </button>
                  <a
                    href={p.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9CDCFE] hover:underline"
                  >
                    GitHub Repo ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        );
        break;
      }

      case 'project': {
        const targetId = arg.toLowerCase().trim();
        const found = projects.find(
          (p) => p.id.toLowerCase() === targetId || p.title.toLowerCase() === targetId
        );
        if (!found) {
          outputNode = (
            <p className="text-[#F48771] text-xs">
              Usage: <span className="text-[#DCDCAA]">project streampulse</span> |{' '}
              <span className="text-[#DCDCAA]">project devdock</span> |{' '}
              <span className="text-[#DCDCAA]">project geolearn</span>
            </p>
          );
        } else {
          onSelectProject(found);
          outputNode = (
            <p className="text-[#4EC9B0] text-xs">
              Opened case study inspector for <span className="font-semibold">{found.title}</span>.
            </p>
          );
        }
        break;
      }

      case 'star': {
        const targetId = arg.toLowerCase().trim();
        const found = projects.find(
          (p) => p.id.toLowerCase() === targetId || p.title.toLowerCase() === targetId
        );
        if (!found) {
          outputNode = (
            <p className="text-[#F48771] text-xs">
              Usage: <span className="text-[#DCDCAA]">star streampulse</span> |{' '}
              <span className="text-[#DCDCAA]">star devdock</span> |{' '}
              <span className="text-[#DCDCAA]">star geolearn</span>
            </p>
          );
        } else {
          await onStarProject(found.id);
          outputNode = (
            <p className="text-[#4EC9B0] text-xs">
              ★ Updated your unique visitor endorsement for {found.title}.
            </p>
          );
        }
        break;
      }

      case 'skills':
      case 'stack': {
        outputNode = (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs py-1">
            {PORTFOLIO_SKILLS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onOpenFile(`extension:${s.id}`)}
                className="flex items-center gap-2 text-left hover:bg-[#2A2D2E] p-1 rounded cursor-pointer"
              >
                <OfficialSkillIcon skillId={s.id} className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  <span className="text-[#4EC9B0] font-semibold">{s.name}</span>
                  <span className="text-[#858585]"> · {s.version}</span>
                </span>
              </button>
            ))}
          </div>
        );
        break;
      }

      case 'education': {
        outputNode = (
          <div className="space-y-1 text-xs py-1">
            {EDUCATION_TIMELINE.map((e) => (
              <div key={e.id}>
                <span className="text-[#DCDCAA] font-semibold">{e.year}</span>
                <span className="text-[#CCCCCC]"> · {e.degree}</span>
                <span className="text-[#858585]">
                  {' '}
                  · {e.institution} ({e.location})
                </span>
                {e.score && <span className="text-[#4EC9B0]"> · {e.score}</span>}
              </div>
            ))}
          </div>
        );
        break;
      }

      case 'inbox':
      case 'messages': {
        if (!isOwner) {
          outputNode = (
            <div className="space-y-1.5 text-xs py-1">
              <p className="text-[#F48771] font-semibold">
                [403 Access Denied] Private Owner Inbox is restricted to {DEVELOPER_PROFILE.name} (
                {DEVELOPER_PROFILE.email}).
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOwnerSignIn?.()}
                  className="px-2.5 py-1 rounded bg-[#0078D4] hover:bg-[#1084DF] text-white font-sans text-xs cursor-pointer"
                >
                  Sign in with Google (Owner Only)
                </button>
                <button
                  type="button"
                  onClick={() => onOpenFile('contact.tsx')}
                  className="text-[#4FC1FF] hover:underline cursor-pointer"
                >
                  Open Public Contact Form (contact.tsx) ↗
                </button>
              </div>
            </div>
          );
          break;
        }
        const unread = messages.filter((m) => !m.read).length;
        outputNode = (
          <div className="space-y-2 text-xs py-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[#4EC9B0] font-semibold">
                Verified Owner Inbox (Firestore /messages) — {messages.length} total ({unread} unread)
              </span>
              <button
                type="button"
                onClick={() => onOpenFile('messages-inbox.json')}
                className="text-[#4FC1FF] hover:underline font-mono cursor-pointer"
              >
                Open config/messages-inbox.json ↗
              </button>
            </div>
            {messages.length === 0 ? (
              <p className="text-[#858585]">No contact inquiries stored yet.</p>
            ) : (
              <div className="space-y-1.5">
                {messages.slice(0, 6).map((m) => (
                  <div
                    key={m.id}
                    className="p-2 rounded bg-[#1F1F1F] border border-[#2B2B2B] space-y-0.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-white font-semibold">
                        {m.name} <span className="text-[#858585] font-normal">&lt;{m.email}&gt;</span>
                      </span>
                      <span className="text-[10px] text-[#858585] tabular-nums">
                        {new Date(m.createdAt).toLocaleString()} · {m.read ? 'READ' : 'UNREAD'}
                      </span>
                    </div>
                    <p className="text-[#CCCCCC]">{m.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        break;
      }

      case 'contact':
      case 'socials': {
        outputNode = (
          <div className="space-y-1 text-xs py-1">
            <p className="text-[#CCCCCC]">
              Email:{' '}
              <a
                href={`mailto:${DEVELOPER_PROFILE.email}`}
                className="text-[#4FC1FF] hover:underline"
              >
                {DEVELOPER_PROFILE.email}
              </a>
            </p>
            <div className="flex flex-wrap gap-4 pt-0.5">
              {DEVELOPER_PROFILE.socials.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9CDCFE] hover:underline"
                >
                  {s.name} ({s.handle})
                </a>
              ))}
              <button
                type="button"
                onClick={() => onOpenFile('contact.tsx')}
                className="text-[#4EC9B0] hover:underline cursor-pointer"
              >
                Open Contact Form (contact.tsx) ↗
              </button>
            </div>
          </div>
        );
        break;
      }

      case 'theme': {
        const desired = arg.toLowerCase().trim();
        if (desired === 'light' || desired === 'dark') {
          onToggleTheme(desired);
          outputNode = (
            <p className="text-[#4EC9B0] text-xs">
              Switched VS Code color theme to <span className="font-semibold">{desired} modern</span>.
            </p>
          );
        } else {
          const next = theme === 'dark' ? 'light' : 'dark';
          onToggleTheme(next);
          outputNode = (
            <p className="text-[#4EC9B0] text-xs">
              Toggled VS Code color theme to <span className="font-semibold">{next} modern</span>.
            </p>
          );
        }
        break;
      }

      default: {
        outputNode = (
          <p className="text-[#F48771] text-xs">
            bash: {cmd}: command not found. Type{' '}
            <span className="text-[#DCDCAA] font-semibold">help</span> for available commands.
          </p>
        );
      }
    }

    appendToActiveSession({
      id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      command: trimmed,
      timestamp,
      output: outputNode,
    });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInput(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(commandHistory[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const val = input.trim().toLowerCase();
      const commands = [
        'help',
        'whoami',
        'ls',
        'projects',
        'project streampulse',
        'project devdock',
        'project geolearn',
        'star streampulse',
        'star devdock',
        'star geolearn',
        'skills',
        'education',
        'visitors',
        'contact',
        'inbox',
        'settings',
        'theme',
        'clear',
        'open overview.tsx',
        'open projects.tsx',
        'open skills.json',
        'open education.md',
        'open blog.mdx',
        'open contact.tsx',
        'open messages-inbox.json',
      ];
      const match = commands.find((c) => c.startsWith(val));
      if (match) {
        setInput(match);
      }
    }
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const panelBg = isDark
    ? 'bg-[#181818] border-[#2B2B2B] text-[#CCCCCC]'
    : 'bg-[#F8F8F8] border-[#E5E5E5] text-[#3B3B3B]';

  return (
    <section
      aria-label="VS Code Workbench Interactive Terminal"
      style={{
        height: isExpanded ? '85vh' : `${panelHeight}px`,
        transition: isResizing ? 'none' : 'height 150ms ease-out',
      }}
      className={`border-t ${panelBg} flex flex-col shrink-0 select-none relative ${
        isResizing ? 'cursor-row-resize' : ''
      }`}
    >
      {/* Official VS Code Panel Sash (Draggable Top Resize Handle) */}
      <div
        onMouseDown={handleStartResize}
        onTouchStart={handleStartResize}
        onDoubleClick={onToggleExpand}
        title="Drag up or down to resize terminal · Double-click to maximize / restore"
        className={`group absolute -top-1 left-0 right-0 h-2.5 z-30 cursor-row-resize flex items-center justify-center transition-colors ${
          isResizing ? 'bg-[#0078D4]' : 'hover:bg-[#0078D4]/70 active:bg-[#0078D4]'
        }`}
      >
        {/* Subtle VS Code grab indicator bar visible on hover or dragging */}
        <div
          className={`w-12 h-[3px] rounded-full transition-opacity ${
            isResizing ? 'bg-white opacity-100' : 'bg-[#0078D4] opacity-0 group-hover:opacity-100'
          }`}
        />
      </div>

      {/* Clean Dual-Purpose VS Code Terminal & Gemini Agent Header */}
      <div
        className={`flex items-center justify-between gap-2 px-3 h-8 sm:h-9 border-b ${
          isDark ? 'border-[#2B2B2B] bg-[#181818]' : 'border-[#E5E5E5] bg-[#F8F8F8]'
        } text-[10px] sm:text-[11px] shrink-0`}
      >
        <div className="flex items-center gap-1 sm:gap-2 h-full min-w-0">
          {/* TAB 1: TERMINAL */}
          <button
            type="button"
            onClick={() => onSelectTab('terminal')}
            className={`h-full inline-flex items-center gap-1.5 px-2 font-sans tracking-wide font-medium whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
              activeTab === 'terminal'
                ? isDark
                  ? 'border-[#0078D4] text-white'
                  : 'border-[#0078D4] text-[#1F1F1F]'
                : isDark
                ? 'border-transparent text-[#858585] hover:text-[#CCCCCC]'
                : 'border-transparent text-[#6E7681] hover:text-[#1F1F1F]'
            }`}
          >
            <Codicon
              name="terminal"
              className={`!text-[13px] ${activeTab === 'terminal' ? 'text-[#0078D4]' : ''}`}
            />
            <span>TERMINAL</span>
          </button>

          {/* TAB 2: GEMINI AGENT */}
          <button
            type="button"
            onClick={() => onSelectTab('gemini')}
            className={`h-full inline-flex items-center gap-1.5 px-2 font-sans tracking-wide font-medium whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
              activeTab === 'gemini'
                ? isDark
                  ? 'border-[#0078D4] text-white'
                  : 'border-[#0078D4] text-[#1F1F1F]'
                : isDark
                ? 'border-transparent text-[#858585] hover:text-[#CCCCCC]'
                : 'border-transparent text-[#6E7681] hover:text-[#1F1F1F]'
            }`}
          >
            <OfficialGeminiLogo className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>GEMINI AGENT</span>
            <span className="hidden sm:inline-block px-1 py-0.2 text-[9px] rounded bg-[#0078D4]/20 text-[#4FC1FF] font-mono">
              AI Chat
            </span>
          </button>

          <span className="hidden md:inline text-[#858585] font-mono text-[11px] truncate ml-2">
            {activeTab === 'terminal'
              ? 'mustafa-cli · Interactive Portfolio Shell'
              : 'Gemini 3.1 Flash Lite · Portfolio Reasoning Agent'}
          </span>
        </div>

        {/* Clean Terminal Actions Bar */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {activeTab === 'terminal' && (
            <div className="hidden lg:flex items-center gap-1 mr-1">
              {QUICK_COMMANDS.map((qCmd) => (
                <button
                  key={qCmd}
                  type="button"
                  onClick={() => executeCommand(qCmd)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer whitespace-nowrap ${
                    isDark
                      ? 'bg-[#2B2B2B] hover:bg-[#3C3C3C] text-[#CCCCCC]'
                      : 'bg-[#E5E5E5] hover:bg-[#D5D5D5] text-[#1F1F1F]'
                  }`}
                >
                  {qCmd}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'terminal' && (
            <button
              type="button"
              onClick={() => appendToActiveSession(null, true)}
              title="Clear Terminal"
              className={`p-1 rounded transition-colors cursor-pointer flex items-center justify-center ${
                isDark
                  ? 'hover:bg-[#2A2D2E] text-[#868686] hover:text-white'
                  : 'hover:bg-[#E5E5E5] text-[#555555] hover:text-[#1E1E1E]'
              }`}
            >
              <Codicon name="clear-all" className="!text-[14px]" />
            </button>
          )}

          <button
            type="button"
            onClick={onToggleExpand}
            title={isExpanded ? 'Restore Panel Size' : 'Maximize Panel Size'}
            className={`p-1 rounded transition-colors cursor-pointer flex items-center justify-center ${
              isDark
                ? 'hover:bg-[#2A2D2E] text-[#868686] hover:text-white'
                : 'hover:bg-[#E5E5E5] text-[#555555] hover:text-[#1E1E1E]'
            }`}
          >
            <Codicon name={isExpanded ? 'chevron-down' : 'chevron-up'} className="!text-[14px]" />
          </button>

          <button
            type="button"
            onClick={onToggleOpen}
            title="Close Panel (Ctrl+`)"
            className={`p-1 rounded transition-colors cursor-pointer flex items-center justify-center ${
              isDark
                ? 'hover:bg-[#2A2D2E] text-[#868686] hover:text-white'
                : 'hover:bg-[#E5E5E5] text-[#555555] hover:text-[#1E1E1E]'
            }`}
          >
            <Codicon name="close" className="!text-[14px]" />
          </button>
        </div>
      </div>

      {/* Pane Content: Either Gemini Chat Panel or Standard Shell based on activeTab */}
      {activeTab === 'gemini' ? (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <GeminiChatPanel onOpenFile={onOpenFile} theme={theme} />
        </div>
      ) : (
        /* Primary Interactive Terminal Pane */
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div
            ref={scrollContainerRef}
            onClick={() => inputRef.current?.focus()}
            className="flex-1 overflow-y-auto px-2.5 sm:px-4 py-2 font-mono space-y-2 cursor-text select-text min-w-0"
          >
          {/* Mobile & Tablet Quick Command Strip */}
          <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1">
            {QUICK_COMMANDS.map((qCmd) => (
              <button
                key={qCmd}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  executeCommand(qCmd);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isDark
                    ? 'bg-[#2B2B2B] hover:bg-[#3C3C3C] text-[#CCCCCC]'
                    : 'bg-[#E5E5E5] hover:bg-[#D5D5D5] text-[#1F1F1F]'
                }`}
              >
                {qCmd}
              </button>
            ))}
          </div>

          {activeSession.entries.map((item) => (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs min-w-0">
                {os === 'windows' ? (
                  <span className="text-[#4EC9B0] font-semibold select-none shrink-0">
                    <span className="text-[#569CD6]">PS</span> C:\Users\Mustafa\mustafa-dev-portfolio&gt;
                  </span>
                ) : os === 'macos' ? (
                  <span className="text-[#4EC9B0] font-semibold select-none shrink-0">
                    mustafa@macbook-pro <span className="text-[#569CD6]">mustafa-dev-portfolio</span> %
                  </span>
                ) : os === 'android' ? (
                  <span className="text-[#4EC9B0] font-semibold select-none shrink-0">
                    root@pixel:<span className="text-[#569CD6]">/portfolio</span> #
                  </span>
                ) : os === 'ios' ? (
                  <span className="text-[#4EC9B0] font-semibold select-none shrink-0">
                    mustafa@iphone:<span className="text-[#569CD6]">~/portfolio</span> $
                  </span>
                ) : (
                  <span className="text-[#4EC9B0] font-semibold select-none shrink-0">
                    mustafa@ubuntu:<span className="text-[#569CD6]">~/mustafa-dev-portfolio</span>$
                  </span>
                )}
                <span
                  className={`truncate ${
                    isDark ? 'text-white font-medium' : 'text-black font-medium'
                  }`}
                >
                  {item.command}
                </span>
                <span className="ml-auto text-[10px] text-[#858585] tabular-nums select-none shrink-0">
                  {item.timestamp}
                </span>
              </div>
              <div className={`pl-2 sm:pl-3 border-l overflow-x-auto ${
                isDark ? 'border-[#2B2B2B]' : 'border-[#E0E0E0]'
              }`}>
                {item.output}
              </div>
            </div>
          ))}

          {/* Active Input Prompt */}
          <div className="flex items-center gap-1.5 text-xs pt-0.5 min-w-0">
            {os === 'windows' ? (
              <span className="text-[#4EC9B0] font-semibold select-none shrink-0 text-[11px] sm:text-xs">
                <span className="text-[#569CD6]">PS</span> <span className="hidden sm:inline">C:\Users\Mustafa\mustafa-dev-portfolio&gt;</span><span className="sm:hidden">&gt;</span>
              </span>
            ) : os === 'macos' ? (
              <span className="text-[#4EC9B0] font-semibold select-none shrink-0 text-[11px] sm:text-xs">
                <span className="hidden sm:inline">mustafa@macbook-pro </span><span className="text-[#569CD6]">portfolio</span> %
              </span>
            ) : os === 'android' ? (
              <span className="text-[#4EC9B0] font-semibold select-none shrink-0 text-[11px] sm:text-xs">
                root@pixel:<span className="text-[#569CD6]">/p</span> #
              </span>
            ) : os === 'ios' ? (
              <span className="text-[#4EC9B0] font-semibold select-none shrink-0 text-[11px] sm:text-xs">
                <span className="hidden sm:inline">mustafa@iphone:</span><span className="text-[#569CD6]">~/p</span> $
              </span>
            ) : (
              <span className="text-[#4EC9B0] font-semibold select-none shrink-0 text-[11px] sm:text-xs">
                <span className="hidden sm:inline">mustafa@ubuntu:</span><span className="text-[#569CD6]">~/p</span>$
              </span>
            )}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command (help, whoami, projects, skills, visitors, inbox)..."
              aria-label="Terminal command input"
              className={`flex-1 min-w-0 bg-transparent ${
                isDark ? 'text-white placeholder-[#6E7681]' : 'text-black placeholder-slate-400'
              } focus:outline-none font-mono text-xs`}
            />
            <button
              type="button"
              onClick={() => executeCommand(input)}
              className="px-2 py-0.5 rounded bg-[#0078D4] hover:bg-[#1084DF] text-white font-mono text-[11px] flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
            >
              <span>Run</span>
              <Codicon name="play" className="!text-[11px]" />
            </button>
          </div>
        </div>
      </div>
    )}
  </section>
);
};
