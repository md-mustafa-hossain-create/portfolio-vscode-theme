import React, { useState, useEffect, useRef } from 'react';
import { Codicon, SetiFileIcon, OfficialSkillIcon } from './OfficialIcons';
import {
  WORKSPACE_FILES,
  PortfolioProject,
  PORTFOLIO_SKILLS,
} from '../data/portfolioData';

interface CommandPaletteModalProps {
  isOpen: boolean;
  initialPrefix?: string;
  activeFile: string;
  onClose: () => void;
  onSelectFile: (fileId: string) => void;
  onSelectProject: (project: PortfolioProject) => void;
  onToggleTerminal: () => void;
  onToggleTheme: () => void;
  onTriggerSync: () => void;
  onToggleSplitEditor: () => void;
  onToggleMinimap: () => void;
  onGoToLine: (line: number, col: number) => void;
  onCreateNewFile: () => void;
  projects: PortfolioProject[];
  theme: 'dark' | 'light';
}

interface PaletteAction {
  id: string;
  title: string;
  subtitle: string;
  shortcut?: string;
  category: 'Files' | 'Commands' | 'Symbols' | 'Extensions' | 'Help';
  icon: React.ReactNode;
  onExecute: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  initialPrefix = '',
  activeFile,
  onClose,
  onSelectFile,
  onSelectProject,
  onToggleTerminal,
  onToggleTheme,
  onTriggerSync,
  onToggleSplitEditor,
  onToggleMinimap,
  onGoToLine,
  onCreateNewFile,
  projects,
  theme,
}) => {
  const [query, setQuery] = useState(initialPrefix);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialPrefix);
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 20);
    }
  }, [isOpen, initialPrefix]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const trimmed = query.trim();
  const isCommandMode = trimmed.startsWith('>');
  const isSymbolMode = trimmed.startsWith('@');
  const isLineMode = trimmed.startsWith(':');
  const isHelpMode = trimmed.startsWith('?');

  const activeFileMeta =
    WORKSPACE_FILES.find((f) => f.id === activeFile) || WORKSPACE_FILES[0];

  // Build dynamic actions depending on official VS Code Quick Open prefix
  let actions: PaletteAction[] = [];

  if (isHelpMode) {
    actions = [
      {
        id: 'help-files',
        title: '... Go to File',
        subtitle: 'Type part of a file name to open it in the editor',
        shortcut: 'Ctrl+P',
        category: 'Help',
        icon: <Codicon name="files" className="text-[#4FC1FF]" />,
        onExecute: () => setQuery(''),
      },
      {
        id: 'help-cmds',
        title: '> Show and Run Commands',
        subtitle: 'Type > to execute VS Code workbench commands',
        shortcut: 'Ctrl+Shift+P',
        category: 'Help',
        icon: <Codicon name="terminal" className="text-[#4EC9B0]" />,
        onExecute: () => setQuery('> '),
      },
      {
        id: 'help-symbols',
        title: '@ Go to Symbol in Editor',
        subtitle: `Jump to functions, constants, or properties in ${activeFileMeta.name}`,
        shortcut: 'Ctrl+Shift+O',
        category: 'Help',
        icon: <Codicon name="symbol-method" className="text-[#B180D7]" />,
        onExecute: () => setQuery('@'),
      },
      {
        id: 'help-line',
        title: ': Go to Line/Column',
        subtitle: 'Type :line[:column] (e.g. :18:4) to jump cursor position',
        shortcut: 'Ctrl+G',
        category: 'Help',
        icon: <Codicon name="list-ordered" className="text-[#DCDCAA]" />,
        onExecute: () => setQuery(':'),
      },
    ];
  } else if (isLineMode) {
    const rawCoords = trimmed.slice(1).trim();
    const [linePart, colPart] = rawCoords.split(':');
    const parsedLine = Math.max(1, Math.min(42, parseInt(linePart || '1', 10) || 1));
    const parsedCol = Math.max(1, parseInt(colPart || '1', 10) || 1);

    actions = [
      {
        id: 'goto-line-exec',
        title: `Go to line ${parsedLine} and character ${parsedCol} in ${activeFileMeta.name}`,
        subtitle: 'Press Enter to jump editor cursor position',
        shortcut: 'Enter',
        category: 'Commands',
        icon: <Codicon name="arrow-right" className="text-[#0078D4]" />,
        onExecute: () => {
          onGoToLine(parsedLine, parsedCol);
          onClose();
        },
      },
    ];
  } else if (isSymbolMode) {
    const symFilter = trimmed.slice(1).toLowerCase().trim();
    const symbols = activeFileMeta.symbols || [
      { name: 'defaultExport', kind: 'method' as const, line: 1 },
    ];
    actions = symbols
      .filter((s) => !symFilter || s.name.toLowerCase().includes(symFilter))
      .map((s) => ({
        id: `sym-${s.name}`,
        title: s.name,
        subtitle: `${activeFileMeta.name} · Ln ${s.line}`,
        shortcut: `:${s.line}`,
        category: 'Symbols',
        icon: (
          <Codicon
            name={`symbol-${s.kind}`}
            className={
              s.kind === 'method'
                ? 'text-[#B180D7]'
                : s.kind === 'constant'
                ? 'text-[#4FC1FF]'
                : 'text-[#75BEFF]'
            }
          />
        ),
        onExecute: () => {
          onGoToLine(s.line, 1);
          onClose();
        },
      }));
  } else {
    const allItems: PaletteAction[] = [
      ...WORKSPACE_FILES.map((file) => ({
        id: `file-${file.id}`,
        title: file.name,
        subtitle: file.path,
        shortcut: file.shortcut,
        category: 'Files' as const,
        icon: (
          <SetiFileIcon
            fileId={file.id}
            extension={file.extension}
            className="w-4 h-4 shrink-0"
          />
        ),
        onExecute: () => {
          onSelectFile(file.id);
          onClose();
        },
      })),
      {
        id: 'cmd-inbox',
        title: '> Inbox: Open Contact Messages Inbox',
        subtitle: 'View and manage incoming contact inquiries stored in the cloud backend',
        shortcut: 'Alt+8',
        category: 'Commands',
        icon: <Codicon name="mail" className="text-[#4EC9B0]" />,
        onExecute: () => {
          onSelectFile('messages-inbox.json');
          onClose();
        },
      },
      {
        id: 'cmd-settings-ui',
        title: '> Preferences: Open Settings (UI)',
        subtitle: 'Configure color theme, font size, minimap, breadcrumbs & word wrap',
        shortcut: 'Ctrl+,',
        category: 'Commands',
        icon: <Codicon name="settings-gear" className="text-[#75BEFF]" />,
        onExecute: () => {
          onSelectFile('settings');
          onClose();
        },
      },
      {
        id: 'cmd-new-file',
        title: '> File: New Untitled Text File',
        subtitle: 'Create an interactive editable scratchpad tab in the editor',
        shortcut: 'Ctrl+N',
        category: 'Commands',
        icon: <Codicon name="new-file" className="text-[#4EC9B0]" />,
        onExecute: () => {
          onCreateNewFile();
          onClose();
        },
      },
      ...projects.map((proj) => ({
        id: `proj-${proj.id}`,
        title: `> Inspect Case Study: ${proj.title}`,
        subtitle: `${proj.category} · ${proj.tags.join(' · ')}`,
        shortcut: 'Enter',
        category: 'Commands' as const,
        icon: <Codicon name="repo" className="text-[#4EC9B0]" />,
        onExecute: () => {
          onSelectProject(proj);
          onClose();
        },
      })),
      ...PORTFOLIO_SKILLS.map((sk) => ({
        id: `ext-${sk.id}`,
        title: `> Extensions: Inspect ${sk.name} (${sk.version})`,
        subtitle: `${sk.publisher} · ${sk.desc}`,
        category: 'Extensions' as const,
        icon: <OfficialSkillIcon skillId={sk.id} className="w-4 h-4" />,
        onExecute: () => {
          onSelectFile(`extension:${sk.id}`);
          onClose();
        },
      })),
      {
        id: 'act-split',
        title: '> View: Split Editor Right (Code + Interactive Preview)',
        subtitle: 'Show syntax-highlighted code alongside interactive preview',
        shortcut: 'Ctrl+\\',
        category: 'Commands',
        icon: <Codicon name="split-horizontal" className="text-[#DCDCAA]" />,
        onExecute: () => {
          onToggleSplitEditor();
          onClose();
        },
      },
      {
        id: 'act-minimap',
        title: '> View: Toggle Minimap',
        subtitle: 'Show or hide the scaled code overview scrollbar on the right of the editor',
        shortcut: 'Alt+M',
        category: 'Commands',
        icon: <Codicon name="layout-sidebar-right" className="text-[#4FC1FF]" />,
        onExecute: () => {
          onToggleMinimap();
          onClose();
        },
      },
      {
        id: 'act-terminal',
        title: '> View: Toggle Terminal',
        subtitle: 'Open or hide the bottom VS Code integrated terminal panel',
        shortcut: 'Ctrl+`',
        category: 'Commands',
        icon: <Codicon name="terminal" className="text-[#CE9178]" />,
        onExecute: () => {
          onToggleTerminal();
          onClose();
        },
      },
      {
        id: 'act-theme',
        title: `> Preferences: Color Theme (${
          theme === 'dark' ? 'Switch to Light Modern' : 'Switch to Dark Modern'
        })`,
        subtitle: 'Toggle between VS Code Dark Modern (#181818) and Light Modern (#F8F8F8)',
        shortcut: 'Alt+T',
        category: 'Commands',
        icon: <Codicon name="symbol-color" className="text-[#0078D4]" />,
        onExecute: () => {
          onToggleTheme();
          onClose();
        },
      },
      {
        id: 'act-sync',
        title: '> Git: Sync / Synchronize Cloud Portfolio State',
        subtitle: 'Trigger real-time state sync with backend storage API',
        shortcut: 'Alt+S',
        category: 'Commands',
        icon: <Codicon name="sync" className="text-[#4EC9B0]" />,
        onExecute: () => {
          onTriggerSync();
          onClose();
        },
      },
    ];

    const cleanQ = trimmed.replace(/^>\s*/, '').toLowerCase();
    actions = allItems.filter((item) => {
      if (isCommandMode && item.category === 'Files') return false;
      if (!cleanQ) return true;
      return (
        item.title.toLowerCase().includes(cleanQ) ||
        item.subtitle.toLowerCase().includes(cleanQ) ||
        item.category.toLowerCase().includes(cleanQ)
      );
    });
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (actions.length > 0 ? (prev + 1) % actions.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        actions.length > 0 ? (prev - 1 + actions.length) % actions.length : 0
      );
    } else if (e.key === 'Enter' && actions[selectedIndex]) {
      e.preventDefault();
      actions[selectedIndex].onExecute();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="VS Code Command Center Quick Open"
      className="fixed inset-0 z-50 flex items-start justify-center pt-9 px-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-md border border-[#454545] bg-[#252526] text-[#CCCCCC] shadow-[0_8px_32px_rgba(0,0,0,0.65)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="p-2 border-b border-[#2B2B2B] space-y-1.5">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files by name, or type > for commands, @ for symbols, : for line"
            className="w-full px-2.5 py-1.5 rounded-xs bg-[#3C3C3C] border border-[#0078D4] text-xs text-white placeholder-[#A0A0A0] focus:outline-none font-sans"
          />

          {/* Official VS Code Command Center Quick Mode Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-[#858585]">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQuery('')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  !isCommandMode && !isSymbolMode && !isLineMode && !isHelpMode
                    ? 'bg-[#04395E] text-white'
                    : 'hover:bg-[#2A2D2E] text-[#CCCCCC]'
                }`}
              >
                Files
              </button>
              <button
                type="button"
                onClick={() => setQuery('> ')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  isCommandMode
                    ? 'bg-[#04395E] text-white'
                    : 'hover:bg-[#2A2D2E] text-[#CCCCCC]'
                }`}
              >
                &gt; Commands
              </button>
              <button
                type="button"
                onClick={() => setQuery('@')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  isSymbolMode
                    ? 'bg-[#04395E] text-white'
                    : 'hover:bg-[#2A2D2E] text-[#CCCCCC]'
                }`}
              >
                @ Symbols
              </button>
              <button
                type="button"
                onClick={() => setQuery(':')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  isLineMode
                    ? 'bg-[#04395E] text-white'
                    : 'hover:bg-[#2A2D2E] text-[#CCCCCC]'
                }`}
              >
                : Go to Line
              </button>
              <button
                type="button"
                onClick={() => setQuery('?')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  isHelpMode
                    ? 'bg-[#04395E] text-white'
                    : 'hover:bg-[#2A2D2E] text-[#CCCCCC]'
                }`}
              >
                ? Help
              </button>
            </div>
            <span className="font-mono text-[10px]">Esc to close</span>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto py-1">
          {actions.length === 0 ? (
            <div className="py-6 px-4 text-xs text-[#858585]">
              No matching results. Type <span className="text-white font-mono">?</span> for help.
            </div>
          ) : (
            actions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={item.onExecute}
                  className={`w-full flex items-center justify-between gap-4 px-3 py-1.5 text-left text-xs transition-none cursor-pointer ${
                    isSelected ? 'bg-[#04395E] text-white' : 'text-[#CCCCCC] hover:bg-[#2A2D2E]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0 flex items-center justify-center">{item.icon}</div>
                    <div className="min-w-0 flex items-baseline gap-2 truncate">
                      <span className="font-medium truncate">{item.title}</span>
                      <span
                        className={`text-[11px] truncate ${
                          isSelected ? 'text-[#9CDCFE]' : 'text-[#858585]'
                        }`}
                      >
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  {item.shortcut && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                        isSelected ? 'bg-[#0078D4] text-white' : 'bg-[#333333] text-[#CCCCCC]'
                      }`}
                    >
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
