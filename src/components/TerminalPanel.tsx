import React, { useState, useRef, useEffect } from 'react';
import { Codicon, SetiFileIcon, OfficialSkillIcon } from './OfficialIcons';
import {
  DEVELOPER_PROFILE,
  WORKSPACE_FILES,
  PortfolioProject,
  PORTFOLIO_SKILLS,
  EDUCATION_TIMELINE,
} from '../data/portfolioData';

export interface TerminalHistoryItem {
  id: string;
  command: string;
  timestamp: string;
  output: React.ReactNode;
}

export type BottomPanelTab = 'problems' | 'output' | 'debug' | 'terminal' | 'ports';

interface TerminalSession {
  id: string;
  name: string;
  shell: 'bash' | 'zsh' | 'node';
  entries: TerminalHistoryItem[];
}

interface PortItem {
  port: number;
  address: string;
  process: string;
  visibility: 'Public' | 'Private';
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
  onTriggerSync: (fromTerminal?: boolean) => Promise<void>;
  onToggleTheme: (target?: 'dark' | 'light') => void;
  theme: 'dark' | 'light';
  projects: PortfolioProject[];
  messages?: Array<{
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: string;
    source: 'form' | 'terminal';
    read: boolean;
  }>;
  syncStats: {
    syncCount: number;
    lastSyncedAt: string;
    totalCommandsExecuted: number;
  };
  syncLogs: string[];
}

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
  onTriggerSync,
  onToggleTheme,
  theme,
  projects,
  messages = [],
  syncStats,
  syncLogs,
}) => {
  const [input, setInput] = useState('');
  const [splitInput, setSplitInput] = useState('');
  const [isSplitTerminal, setIsSplitTerminal] = useState(false);

  // Official VS Code Output channel selector
  const [outputChannel, setOutputChannel] = useState<
    'cloud' | 'vite' | 'git' | 'tsserver' | 'prettier'
  >('cloud');

  // Official Problems filter
  const [problemsFilter, setProblemsFilter] = useState('');

  // Official Ports state
  const [ports, setPorts] = useState<PortItem[]>([
    {
      port: 3000,
      address: DEVELOPER_PROFILE.livePortfolioUrl,
      process: 'tsx server.ts (Express + Vite 8)',
      visibility: 'Public',
    },
  ]);
  const [addingPort, setAddingPort] = useState(false);
  const [newPortNumber, setNewPortNumber] = useState('');

  // Multi-session terminal state
  const [sessions, setSessions] = useState<TerminalSession[]>([
    {
      id: 'term-1',
      name: 'bash',
      shell: 'bash',
      entries: [
        {
          id: 'init-welcome',
          command: 'mustafa-cli --version',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          output: (
            <div className="space-y-1 text-xs leading-relaxed">
              <p className="text-[#4EC9B0] font-semibold">
                Visual Studio Code Integrated Terminal · MUSTAFA.dev v2.4.0 (
                {DEVELOPER_PROFILE.name})
              </p>
              <p className="text-[#9CDCFE]">
                Type <span className="text-[#DCDCAA] font-semibold">help</span> to view all
                portfolio commands, or click any quick command chip. Press{' '}
                <span className="text-[#CE9178]">Tab</span> to auto-complete.
              </p>
            </div>
          ),
        },
      ],
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('term-1');

  const [debugInput, setDebugInput] = useState('');
  const [debugLogs, setDebugLogs] = useState<Array<{ expr: string; result: string }>>([
    {
      expr: 'MUSTAFA_PROFILE.name',
      result: `"${DEVELOPER_PROFILE.name}"`,
    },
    {
      expr: 'MUSTAFA_PROFILE.education',
      result: '{ degree: "BCA", university: "Brainware University", cgpa: 9.09 }',
    },
    {
      expr: 'SELECTED_PROJECTS.map(p => p.title)',
      result: '["StreamPulse", "DevDock", "GeoLearn"]',
    },
  ]);

  const [commandHistory, setCommandHistory] = useState<string[]>([
    'help',
    'whoami',
    'projects',
    'skills',
    'git status',
    'sync',
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    if (scrollContainerRef.current && activeTab === 'terminal') {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [activeSession.entries, isOpen, activeTab, activeSessionId]);

  const handleCreateTerminalSession = () => {
    const num = sessions.length + 1;
    const shells: Array<'bash' | 'zsh' | 'node'> = ['bash', 'zsh', 'node'];
    const shell = shells[(num - 1) % shells.length];
    const newId = `term-${Date.now()}`;
    const newSession: TerminalSession = {
      id: newId,
      name: `${shell} (${num})`,
      shell,
      entries: [
        {
          id: `welcome-${newId}`,
          command: `${shell} --login`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          output: (
            <p className="text-[#4EC9B0] text-xs">
              Spawned new {shell} terminal session #{num} in ~/mustafa-dev-portfolio. Type{' '}
              <span className="text-[#DCDCAA]">help</span> for commands.
            </p>
          ),
        },
      ],
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newId);
    onSelectTab('terminal');
  };

  const handleKillTerminalSession = (idToKill: string) => {
    if (sessions.length <= 1) {
      setIsSplitTerminal(false);
      onToggleOpen();
      return;
    }
    const remaining = sessions.filter((s) => s.id !== idToKill);
    setSessions(remaining);
    if (activeSessionId === idToKill) {
      setActiveSessionId(remaining[remaining.length - 1].id);
    }
  };

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
              <span className="text-[#858585]"> · Endorse project in cloud store</span>
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
              <span className="text-[#DCDCAA] font-semibold">git status</span>
              <span className="text-[#858585]"> · Show branch status &amp; modified files</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">npm run build</span>
              <span className="text-[#858585]"> · Simulate Vite 8 production bundle check</span>
            </div>
            <div>
              <span className="text-[#DCDCAA] font-semibold">inbox</span>
              <span className="text-[#858585]"> · View persisted Contact messages from backend</span>
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

      case 'whoami':
      case 'about': {
        outputNode = (
          <div className="space-y-1 text-xs py-1">
            <p className="text-[#4EC9B0] font-semibold">
              {DEVELOPER_PROFILE.name} — {DEVELOPER_PROFILE.title} ({DEVELOPER_PROFILE.roleSubtitle})
            </p>
            <p className="text-[#CCCCCC]">
              Location: {DEVELOPER_PROFILE.location} · Education: {DEVELOPER_PROFILE.educationShort}
            </p>
            <p className="text-[#858585] max-w-3xl leading-relaxed">
              {DEVELOPER_PROFILE.leadSubtitle}
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
                    href={p.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9CDCFE] hover:underline"
                  >
                    Live Demo ↗
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
              ★ Endorsed {found.title} — cloud star count updated via /api/projects/{found.id}/star.
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
        let currentMessages = messages;
        try {
          const res = await fetch('/api/messages');
          const data = await res.json();
          if (res.ok && Array.isArray(data.messages)) {
            currentMessages = data.messages;
          }
        } catch {
          // Use prop fallback
        }
        const unread = currentMessages.filter((m) => !m.read).length;
        outputNode = (
          <div className="space-y-2 text-xs py-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[#4EC9B0] font-semibold">
                Backend Contact Inbox (/api/messages) — {currentMessages.length} total ({unread} unread)
              </span>
              <button
                type="button"
                onClick={() => onOpenFile('messages-inbox.json')}
                className="text-[#4FC1FF] hover:underline font-mono cursor-pointer"
              >
                Open config/messages-inbox.json ↗
              </button>
            </div>
            {currentMessages.length === 0 ? (
              <p className="text-[#858585]">No contact inquiries stored yet.</p>
            ) : (
              <div className="space-y-1.5">
                {currentMessages.slice(0, 6).map((m) => (
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
                onClick={() => onOpenFile('messages-inbox.json')}
                className="text-[#4EC9B0] hover:underline cursor-pointer"
              >
                View Saved Inbox ({messages.length}) ↗
              </button>
            </div>
          </div>
        );
        break;
      }

      case 'git': {
        if (arg.startsWith('log')) {
          outputNode = (
            <div className="space-y-1 text-xs font-mono text-[#CCCCCC]">
              <p className="text-[#DCDCAA]">commit a8f94e2 (HEAD -&gt; main, origin/main)</p>
              <p>Author: {DEVELOPER_PROFILE.name} &lt;{DEVELOPER_PROFILE.email}&gt;</p>
              <p className="text-[#4EC9B0]">
                feat(workbench): integrate official Devicon multi-color SVGs &amp; VS Code Settings UI
              </p>
            </div>
          );
        } else {
          outputNode = (
            <div className="space-y-0.5 text-xs font-mono text-[#CCCCCC]">
              <p>On branch main</p>
              <p className="text-[#4EC9B0]">
                Your branch is up to date with &apos;origin/main&apos; (Cloud Revision #{syncStats.syncCount}).
              </p>
              <p className="text-[#E2C08D]">
                Modified: src/pages/overview.tsx, src/pages/projects.tsx, src/pages/skills.json
              </p>
            </div>
          );
        }
        break;
      }

      case 'npm':
      case 'vite':
      case 'node': {
        outputNode = (
          <div className="space-y-0.5 text-xs font-mono text-[#4EC9B0]">
            <p>vite v8.3.0 building client + server bundle for production...</p>
            <p className="text-[#CCCCCC]">✓ 48 modules transformed. 0 errors, 0 warnings.</p>
            <p className="text-[#9CDCFE]">
              dist/index.html 0.84 kB │ dist/assets/index.js 184.20 kB (gzip: 56.10 kB)
            </p>
          </div>
        );
        break;
      }

      case 'sync':
      case 'status': {
        await onTriggerSync(true);
        outputNode = (
          <div className="text-xs space-y-0.5 py-1 tabular-nums">
            <p className="text-[#4EC9B0] font-semibold">
              [Cloud Sync] Synchronized workspace state with /api/sync
            </p>
            <p className="text-[#858585]">
              Revision #{syncStats.syncCount + 1} · Commands Run:{' '}
              {syncStats.totalCommandsExecuted + 1}
            </p>
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
        'skills',
        'education',
        'contact',
        'inbox',
        'messages',
        'git status',
        'git log',
        'npm run build',
        'settings',
        'sync',
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

  const handleDebugEval = (e: React.FormEvent) => {
    e.preventDefault();
    const expr = debugInput.trim();
    if (!expr) return;
    let res = 'undefined';
    if (expr.toLowerCase().includes('name')) res = `"${DEVELOPER_PROFILE.name}"`;
    else if (expr.toLowerCase().includes('cgpa')) res = '9.09';
    else if (expr.toLowerCase().includes('email')) res = `"${DEVELOPER_PROFILE.email}"`;
    else if (expr.toLowerCase().includes('project'))
      res = JSON.stringify(projects.map((p) => p.title));
    else if (expr.toLowerCase().includes('skill'))
      res = JSON.stringify(PORTFOLIO_SKILLS.map((s) => s.name));
    else res = `"Evaluated in MUSTAFA.dev runtime: ${expr}"`;

    setDebugLogs((prev) => [...prev, { expr, result: res }]);
    setDebugInput('');
  };

  const handleAddPort = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(newPortNumber, 10);
    if (!num || num < 1 || num > 65535) return;
    if (!ports.some((p) => p.port === num)) {
      setPorts((prev) => [
        ...prev,
        {
          port: num,
          address: `http://localhost:${num}`,
          process: 'Forwarded User Service',
          visibility: 'Private',
        },
      ]);
    }
    setNewPortNumber('');
    setAddingPort(false);
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const panelBg = isDark
    ? 'bg-[#181818] border-[#2B2B2B] text-[#CCCCCC]'
    : 'bg-[#F8F8F8] border-[#E5E5E5] text-[#3B3B3B]';

  const tabs: Array<{ id: BottomPanelTab; label: string; badge?: string }> = [
    { id: 'problems', label: 'PROBLEMS', badge: '0' },
    { id: 'output', label: 'OUTPUT' },
    { id: 'debug', label: 'DEBUG CONSOLE' },
    { id: 'terminal', label: 'TERMINAL' },
    { id: 'ports', label: 'PORTS', badge: String(ports.length) },
  ];

  // Channel-specific output logs
  const channelLogs: Record<typeof outputChannel, string[]> = {
    cloud: syncLogs,
    vite: [
      '[Vite 8.3.0] Dev server running at http://localhost:3000',
      '[Vite] HMR & Express API middleware mounted (/api/portfolio, /api/stream, /api/sync)',
      '[Vite] Optimized dependencies: react, react-dom, @vscode/codicons',
    ],
    git: [
      'git status --porcelain -b',
      '## main...origin/main',
      'M src/pages/overview.tsx',
      'M src/pages/projects.tsx',
      'M src/pages/skills.json',
    ],
    tsserver: [
      '[Info] TypeScript Server 7.0.2 initialized.',
      '[Info] Configured tsconfig.json for /app/applet',
      '[Info] Zero semantic or syntactic errors across 7 workspace modules.',
    ],
    prettier: [
      '["INFO"] Prettier v3.3.3 initialized.',
      '["INFO"] Formatting verified: printWidth=100, singleQuote=true, trailingComma=es5',
    ],
  };

  return (
    <section
      aria-label="VS Code Workbench Bottom Panel"
      className={`border-t ${panelBg} flex flex-col shrink-0 select-none ${
        isExpanded ? 'h-64 sm:h-80 md:h-96' : 'h-40 sm:h-48 md:h-56'
      }`}
    >
      {/* Official VS Code Panel Tab Bar */}
      <div
        className={`flex items-center justify-between gap-2 px-2 sm:px-3 h-8 sm:h-9 border-b ${
          isDark ? 'border-[#2B2B2B] bg-[#181818]' : 'border-[#E5E5E5] bg-[#F8F8F8]'
        } text-[10px] sm:text-[11px] shrink-0`}
      >
        <div className="flex items-center gap-3 sm:gap-5 h-full overflow-x-auto min-w-0">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`h-full inline-flex items-center gap-1 sm:gap-1.5 border-b px-0.5 font-sans tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? isDark
                      ? 'border-[#0078D4] text-white font-medium'
                      : 'border-[#0078D4] text-[#1F1F1F] font-medium'
                    : 'border-transparent text-[#868686] hover:text-[#CCCCCC]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-mono tabular-nums ${
                      active
                        ? 'bg-[#0078D4] text-white'
                        : isDark
                        ? 'bg-[#2B2B2B] text-[#CCCCCC]'
                        : 'bg-[#E5E5E5] text-[#3B3B3B]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Official VS Code Contextual Panel Actions Bar */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* PROBLEMS FILTER INPUT */}
          {activeTab === 'problems' && (
            <input
              type="text"
              value={problemsFilter}
              onChange={(e) => setProblemsFilter(e.target.value)}
              placeholder="Filter (e.g. text, **/*.ts)"
              className="hidden sm:block w-40 md:w-48 px-2 py-0.5 rounded-xs bg-[#3C3C3C] border border-[#3C3C3C] focus:border-[#0078D4] text-[11px] text-white focus:outline-none"
            />
          )}

          {/* OUTPUT CHANNEL SELECTOR DROPDOWN */}
          {activeTab === 'output' && (
            <select
              value={outputChannel}
              onChange={(e) =>
                setOutputChannel(
                  e.target.value as 'cloud' | 'vite' | 'git' | 'tsserver' | 'prettier'
                )
              }
              aria-label="Select Output Channel"
              className="max-w-[130px] sm:max-w-none px-1.5 sm:px-2 py-0.5 rounded-xs bg-[#3C3C3C] border border-[#3C3C3C] text-[10px] sm:text-[11px] text-white focus:border-[#0078D4] focus:outline-none"
            >
              <option value="cloud">MUSTAFA.dev Cloud Sync</option>
              <option value="vite">Vite Build Server</option>
              <option value="git">Git</option>
              <option value="tsserver">TypeScript Language Server</option>
              <option value="prettier">Prettier</option>
            </select>
          )}

          {/* TERMINAL TOOLBAR ACTIONS */}
          {activeTab === 'terminal' && (
            <>
              <div className="hidden lg:flex items-center gap-1 mr-1">
                {['help', 'whoami', 'projects', 'skills', 'inbox', 'git status'].map((qCmd) => (
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

              <div className="flex items-center gap-1 text-[11px] font-mono text-[#CCCCCC] pr-1.5 border-r border-[#2B2B2B]">
                <Codicon name="terminal-bash" className="!text-[14px] text-[#CCCCCC]" />
                <span className="hidden sm:inline">{activeSession.name}</span>
                <button
                  type="button"
                  onClick={handleCreateTerminalSession}
                  title="New Terminal (Ctrl+Shift+`)"
                  className="p-1 rounded hover:bg-[#2A2D2E] text-[#868686] hover:text-white flex items-center cursor-pointer"
                >
                  <Codicon name="add" className="!text-[14px]" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsSplitTerminal((prev) => !prev)}
                  title="Split Terminal (Ctrl+Shift+5)"
                  className={`p-1 rounded flex items-center cursor-pointer ${
                    isSplitTerminal
                      ? 'bg-[#2A2D2E] text-white'
                      : 'text-[#868686] hover:bg-[#2A2D2E] hover:text-white'
                  }`}
                >
                  <Codicon name="split-horizontal" className="!text-[14px]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleKillTerminalSession(activeSession.id)}
                  title="Kill Terminal"
                  className="p-1 rounded hover:bg-[#2A2D2E] text-[#868686] hover:text-white flex items-center cursor-pointer"
                >
                  <Codicon name="trash" className="!text-[14px]" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => appendToActiveSession(null, true)}
                title="Clear Terminal"
                className="p-1 rounded hover:bg-[#2A2D2E] text-[#868686] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              >
                <Codicon name="clear-all" className="!text-[14px]" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onToggleExpand}
            title={isExpanded ? 'Restore Panel Size' : 'Maximize Panel Size'}
            className="p-1 rounded hover:bg-[#2A2D2E] text-[#868686] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
          >
            <Codicon name={isExpanded ? 'chevron-down' : 'chevron-up'} className="!text-[14px]" />
          </button>

          <button
            type="button"
            onClick={onToggleOpen}
            title="Close Panel (Ctrl+`)"
            className="p-1 rounded hover:bg-[#2A2D2E] text-[#868686] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
          >
            <Codicon name="close" className="!text-[14px]" />
          </button>
        </div>
      </div>

      {/* PROBLEMS TAB */}
      {activeTab === 'problems' && (
        <div className="flex-1 overflow-y-auto px-4 py-3 font-sans text-xs space-y-2 select-text">
          <div className="flex items-center gap-2 text-[#CCCCCC]">
            <Codicon name="check" className="text-[#4EC9B0] !text-[14px]" />
            <span>
              No problems have been detected in the workspace
              {problemsFilter ? ` matching "${problemsFilter}"` : ''}.
            </span>
          </div>
        </div>
      )}

      {/* OUTPUT TAB */}
      {activeTab === 'output' && (
        <div className="flex-1 overflow-y-auto px-4 py-2.5 font-mono text-xs space-y-1 select-text tabular-nums">
          {channelLogs[outputChannel].map((log, i) => (
            <div key={i} className="text-[#CCCCCC]">
              {log}
            </div>
          ))}
        </div>
      )}

      {/* DEBUG CONSOLE TAB */}
      {activeTab === 'debug' && (
        <div className="flex-1 flex flex-col overflow-hidden font-mono text-xs select-text">
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
            {debugLogs.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-[#9CDCFE]">
                  <Codicon name="chevron-right" className="!text-[12px] text-[#868686]" />
                  <span>{item.expr}</span>
                </div>
                <div className="pl-5 text-[#CE9178]">{item.result}</div>
              </div>
            ))}
          </div>
          <form
            onSubmit={handleDebugEval}
            className="flex items-center gap-2 px-3 py-1.5 border-t border-[#2B2B2B]"
          >
            <Codicon name="chevron-right" className="!text-[14px] text-[#0078D4]" />
            <input
              type="text"
              value={debugInput}
              onChange={(e) => setDebugInput(e.target.value)}
              placeholder="Evaluate expression in Debug Console (e.g. MUSTAFA_PROFILE.cgpa)..."
              className="flex-1 bg-transparent text-xs focus:outline-none text-[#CCCCCC]"
            />
          </form>
        </div>
      )}

      {/* PORTS TAB */}
      {activeTab === 'ports' && (
        <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs select-text space-y-3">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2B2B2B] text-[#858585]">
                <th className="py-1.5 font-normal">Port</th>
                <th className="py-1.5 font-normal">Forwarded Address</th>
                <th className="py-1.5 font-normal">Running Process</th>
                <th className="py-1.5 font-normal">Visibility</th>
                <th className="py-1.5 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {ports.map((p) => (
                <tr key={p.port} className="border-b border-[#2B2B2B]/50 group">
                  <td className="py-2 text-[#4EC9B0] font-semibold">{p.port}</td>
                  <td className="py-2">
                    <a
                      href={p.address}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4FC1FF] hover:underline inline-flex items-center gap-1.5"
                    >
                      <Codicon name="globe" className="!text-[12px]" />
                      <span>{p.address}</span>
                    </a>
                  </td>
                  <td className="py-2 text-[#CCCCCC]">{p.process}</td>
                  <td className="py-2 text-[#4EC9B0]">{p.visibility}</td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(p.address)}
                      title="Copy Local Address"
                      className="p-1 rounded hover:bg-[#2A2D2E] text-[#858585] hover:text-white cursor-pointer mr-1"
                    >
                      <Codicon name="copy" className="!text-[12px]" />
                    </button>
                    {p.port !== 3000 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPorts((prev) => prev.filter((item) => item.port !== p.port))
                        }
                        title="Stop Forwarding Port"
                        className="p-1 rounded hover:bg-[#2A2D2E] text-[#858585] hover:text-[#F48771] cursor-pointer"
                      >
                        <Codicon name="close" className="!text-[12px]" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {addingPort ? (
            <form onSubmit={handleAddPort} className="flex items-center gap-2 max-w-xs">
              <input
                type="number"
                value={newPortNumber}
                onChange={(e) => setNewPortNumber(e.target.value)}
                placeholder="Port number (e.g. 5173)"
                className="px-2.5 py-1 rounded-xs bg-[#3C3C3C] border border-[#0078D4] text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-xs bg-[#0078D4] text-white text-xs cursor-pointer"
              >
                Forward
              </button>
              <button
                type="button"
                onClick={() => setAddingPort(false)}
                className="px-2 py-1 text-xs text-[#858585] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingPort(true)}
              className="px-3 py-1 rounded-xs bg-[#0078D4] hover:bg-[#1084DF] text-white font-sans text-xs cursor-pointer"
            >
              Forward a Port
            </button>
          )}
        </div>
      )}

      {/* TERMINAL TAB (Supports Split Terminal & Right-Hand Process List like Official VS Code) */}
      {activeTab === 'terminal' && (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Primary Terminal Pane */}
          <div
            ref={scrollContainerRef}
            onClick={() => inputRef.current?.focus()}
            className="flex-1 overflow-y-auto px-2.5 sm:px-4 py-2 font-mono space-y-2 cursor-text select-text min-w-0"
          >
            {/* Mobile & Tablet Quick Command Strip */}
            <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1">
              {['help', 'whoami', 'projects', 'skills', 'inbox', 'git status'].map((qCmd) => (
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
                  <span className="hidden sm:inline text-[#4EC9B0] font-semibold select-none">
                    mustafa@vscode
                  </span>
                  <span className="hidden sm:inline text-[#858585] select-none">:</span>
                  <span className="text-[#569CD6] font-semibold select-none">
                    <span className="hidden sm:inline">~/mustafa-dev-portfolio</span>
                    <span className="sm:hidden">~</span>
                  </span>
                  <span className="text-[#CCCCCC] select-none">$</span>
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
                <div className="pl-2 sm:pl-3 border-l border-[#2B2B2B] overflow-x-auto">
                  {item.output}
                </div>
              </div>
            ))}

            {/* Active Input Prompt */}
            <div className="flex items-center gap-1.5 text-xs pt-0.5 min-w-0">
              <span className="hidden sm:inline text-[#4EC9B0] font-semibold select-none shrink-0">
                mustafa@vscode
              </span>
              <span className="hidden sm:inline text-[#858585] select-none shrink-0">:</span>
              <span className="text-[#569CD6] font-semibold select-none shrink-0">
                <span className="hidden sm:inline">~/mustafa-dev-portfolio</span>
                <span className="sm:hidden">~</span>
              </span>
              <span className="text-[#CCCCCC] select-none shrink-0">$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command (help, inbox, whoami, projects, skills)..."
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

          {/* Optional Second Split Terminal Pane */}
          {isSplitTerminal && (
            <div className="hidden md:flex flex-col w-2/5 border-l border-[#2B2B2B] px-3 py-2 font-mono text-xs justify-between bg-[#141414]/40">
              <div className="space-y-1.5 overflow-y-auto">
                <div className="flex items-center justify-between text-[11px] text-[#858585] border-b border-[#2B2B2B] pb-1">
                  <span>Split Terminal · node ( Vite Watch )</span>
                  <button
                    type="button"
                    onClick={() => setIsSplitTerminal(false)}
                    className="hover:text-white cursor-pointer"
                  >
                    <Codicon name="close" className="!text-[12px]" />
                  </button>
                </div>
                <p className="text-[#4EC9B0]">[Vite] Watching src/pages/* for changes...</p>
                <p className="text-[#CCCCCC]">
                  [SSE] Cloud stream active (Revision #{syncStats.syncCount})
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (splitInput.trim()) {
                    executeCommand(splitInput);
                    setSplitInput('');
                  }
                }}
                className="flex items-center gap-1.5 pt-1 border-t border-[#2B2B2B]"
              >
                <span className="text-[#4EC9B0]">node &gt;</span>
                <input
                  type="text"
                  value={splitInput}
                  onChange={(e) => setSplitInput(e.target.value)}
                  placeholder="Run command in split pane..."
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                />
              </form>
            </div>
          )}

          {/* Official VS Code Right-Side Terminal Session List */}
          <div className="hidden lg:flex flex-col w-36 border-l border-[#2B2B2B] py-1 px-1 text-[11px] font-mono shrink-0">
            {sessions.map((sess) => {
              const isAct = sess.id === activeSession.id;
              return (
                <div
                  key={sess.id}
                  onClick={() => setActiveSessionId(sess.id)}
                  className={`group flex items-center justify-between px-2 py-1 rounded-xs cursor-pointer ${
                    isAct
                      ? 'bg-[#04395E] text-white'
                      : 'text-[#858585] hover:bg-[#2A2D2E] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Codicon name="terminal-bash" className="!text-[12px]" />
                    <span className="truncate">{sess.name}</span>
                  </span>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKillTerminalSession(sess.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-[#F48771]"
                    >
                      <Codicon name="trash" className="!text-[11px]" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
