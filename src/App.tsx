import React, { useState, useEffect, useCallback } from 'react';
import {
  Codicon,
  OfficialVSCodeLogo,
  SetiFileIcon,
  OfficialSkillIcon,
} from './components/OfficialIcons';
import {
  DEVELOPER_PROFILE,
  WORKSPACE_FILES,
  INITIAL_PROJECTS,
  PORTFOLIO_SKILLS,
  EDUCATION_TIMELINE,
  BLOG_POSTS,
  WorkspaceFile,
  PortfolioProject,
} from './data/portfolioData';
import {
  WorkspaceViews,
  GuestbookEntry,
  ContactMessage,
  WorkbenchSettings,
} from './components/WorkspaceViews';
import { TerminalPanel, BottomPanelTab } from './components/TerminalPanel';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { ProjectCaseStudyModal } from './components/ProjectCaseStudyModal';
import { SourceCodeView } from './components/SourceCodeView';

type ActivityViewId = 'explorer' | 'search' | 'scm' | 'debug' | 'extensions';
type EditorViewMode = 'hybrid' | 'code' | 'split';
type MenuId =
  | 'File'
  | 'Edit'
  | 'Selection'
  | 'View'
  | 'Go'
  | 'Run'
  | 'Terminal'
  | 'Help'
  | null;

export default function App() {
  const [activeFile, setActiveFile] = useState<string>('overview.tsx');
  const [openTabs, setOpenTabs] = useState<string[]>([
    'overview.tsx',
    'projects.tsx',
    'skills.json',
    'education.md',
    'blog.mdx',
    'contact.tsx',
  ]);

  // Custom user-created files (via Ctrl+N or Explorer New File...)
  const [customFiles, setCustomFiles] = useState<Record<string, string>>({});
  const [creatingNewFile, setCreatingNewFile] = useState(false);
  const [newFileNameInput, setNewFileNameInput] = useState('');

  // Workbench Settings (synchronized with Graphical Settings UI Tab `settings`)
  const [settings, setSettings] = useState<WorkbenchSettings>({
    theme: 'dark',
    fontSize: 14,
    minimapEnabled: true,
    breadcrumbsEnabled: true,
    wordWrap: 'on',
    lineNumbers: 'on',
    autoSave: 'afterDelay',
    cursorStyle: 'block',
    cursorBlinking: 'smooth',
  });

  // Navigation History Stack for Official Title Bar Back / Forward Arrows
  const [navHistory, setNavHistory] = useState<string[]>(['overview.tsx']);
  const [navHistoryIdx, setNavHistoryIdx] = useState<number>(0);

  const [activityView, setActivityView] = useState<ActivityViewId>('explorer');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [editorMode, setEditorMode] = useState<EditorViewMode>('hybrid');

  // Official Title Bar Dropdown Menu state
  const [openMenu, setOpenMenu] = useState<MenuId>(null);

  // Interactive Breadcrumb Picker Dropdown state
  const [breadcrumbDropdown, setBreadcrumbDropdown] = useState<'files' | 'symbols' | null>(null);

  // Official Editor Find Widget (Ctrl+F)
  const [findWidgetOpen, setFindWidgetOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findMatchCase, setFindMatchCase] = useState(false);
  const [findWholeWord, setFindWholeWord] = useState(false);

  // Official VS Code Debugger Session State (F5)
  const [isDebugging, setIsDebugging] = useState(false);
  const [watchExpressions, setWatchExpressions] = useState<
    Array<{ expr: string; value: string }>
  >([
    { expr: 'MUSTAFA_PROFILE.cgpa', value: '9.09' },
    { expr: 'SELECTED_PROJECTS.length', value: '3' },
  ]);
  const [addingWatch, setAddingWatch] = useState(false);
  const [newWatchExpr, setNewWatchExpr] = useState('');

  // Explorer collapsible tree sections & official VS Code Explorer state
  const [openEditorsExpanded, setOpenEditorsExpanded] = useState(true);
  const [workspaceTreeExpanded, setWorkspaceTreeExpanded] = useState(true);
  const [srcRootExpanded, setSrcRootExpanded] = useState(true);
  const [srcFolderExpanded, setSrcFolderExpanded] = useState(true);
  const [projectsFolderExpanded, setProjectsFolderExpanded] = useState(true);
  const [componentsFolderExpanded, setComponentsFolderExpanded] = useState(false);
  const [publicFolderExpanded, setPublicFolderExpanded] = useState(false);
  const [configFolderExpanded, setConfigFolderExpanded] = useState(true);
  const [outlineExpanded, setOutlineExpanded] = useState(true);
  const [timelineExpanded, setTimelineExpanded] = useState(true);

  // Explorer Views visibility (... menu in Explorer header)
  const [explorerViewsMenuOpen, setExplorerViewsMenuOpen] = useState(false);
  const [showOpenEditors, setShowOpenEditors] = useState(true);
  const [showOutline, setShowOutline] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);

  // Explorer New Folder & Filter on Type state
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [creatingNewFolder, setCreatingNewFolder] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');
  const [explorerFilterOpen, setExplorerFilterOpen] = useState(false);
  const [explorerFilterQuery, setExplorerFilterQuery] = useState('');

  // Explorer Right-Click Context Menu state
  const [explorerContextMenu, setExplorerContextMenu] = useState<{
    x: number;
    y: number;
    fileId: string;
    filePath: string;
    isCustom?: boolean;
  } | null>(null);

  // Global sidebar Search & Replace state
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalReplaceQuery, setGlobalReplaceQuery] = useState('');
  const [searchReplaceExpanded, setSearchReplaceExpanded] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  // Source Control Staged / Unstaged Changes & Branch
  const [scmMessage, setScmMessage] = useState('');
  const [stagedFiles, setStagedFiles] = useState<string[]>(['overview.tsx']);
  const [gitBranch, setGitBranch] = useState<'main' | 'feat/vscode-ui' | 'release/v2.4.0'>('main');
  const [commitHistory, setCommitHistory] = useState<
    Array<{ hash: string; message: string; time: string }>
  >([
    {
      hash: 'a8f94e2',
      message: 'feat: official Devicon multi-color SVGs & VS Code Settings UI',
      time: 'Just now',
    },
    {
      hash: '7c31b09',
      message: 'feat: integrate StreamPulse, DevDock & GeoLearn case studies',
      time: '2h ago',
    },
  ]);

  // Extensions sidebar search state
  const [extensionSearchQuery, setExtensionSearchQuery] = useState('');

  // Account, Settings, Notifications & About Modal popups
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; title: string; source: string; time: string }>
  >([
    {
      id: 'notif-1',
      title: 'MUSTAFA.dev Cloud Sync connected via SSE (/api/stream).',
      source: 'Cloud Storage Extension',
      time: 'Now',
    },
    {
      id: 'notif-2',
      title: 'All 9 official frontend & tooling extensions activated.',
      source: 'Extensions Marketplace',
      time: '1m ago',
    },
  ]);

  // Bottom Panel state
  const [terminalOpen, setTerminalOpen] = useState<boolean>(true);
  const [terminalExpanded, setTerminalExpanded] = useState<boolean>(false);
  const [activePanelTab, setActivePanelTab] = useState<BottomPanelTab>('terminal');

  // Modals & Quick Open Prefix
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [palettePrefix, setPalettePrefix] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  // Status Bar cursor, indentation, EOL & sync spinner telemetry
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 5, col: 14 });
  const [indentSpaces, setIndentSpaces] = useState<2 | 4>(2);
  const [eolMode, setEolMode] = useState<'LF' | 'CRLF'>('LF');
  const [isSyncingNow, setIsSyncingNow] = useState<boolean>(false);

  // Real-time synchronized state from backend cloud API
  const [projects, setProjects] = useState<PortfolioProject[]>(INITIAL_PROJECTS);
  const [visitorCount, setVisitorCount] = useState<number>(412);
  const [messages, setMessages] = useState<ContactMessage[]>([
    {
      id: 'msg-seed-1',
      name: 'Sourav Mukherjee',
      email: 'sourav.mukherjee@techcorp.in',
      subject: 'Frontend Engineer Role — React & TypeScript',
      message:
        'Hi Mustafa, we reviewed your StreamPulse and DevDock architectures and were impressed by your 9.09 CGPA at Brainware University. Let us connect for a frontend interview!',
      createdAt: '2026-10-24T09:30:00.000Z',
      source: 'form',
      read: false,
    },
  ]);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([
    {
      id: 'gb-1',
      author: 'Arindam Chatterjee',
      role: 'Senior Frontend Engineer · Kolkata',
      comment:
        'Impressive Web Audio API visualizer architecture on StreamPulse — zero frame drops even during route transitions.',
      createdAt: '2026-10-14T10:30:00.000Z',
    },
    {
      id: 'gb-2',
      author: 'Priya Nair',
      role: 'Product Designer · Bengaluru',
      comment:
        'DevDock drag-and-drop workspace feels super snappy on mobile browsers. Clean attention to UI detail!',
      createdAt: '2026-10-21T14:15:00.000Z',
    },
  ]);
  const [syncStats, setSyncStats] = useState({
    syncCount: 128,
    lastSyncedAt: new Date().toISOString(),
    totalCommandsExecuted: 342,
  });
  const [syncLogs, setSyncLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [info] Connected to MUSTAFA.dev Cloud Sync SSE stream (/api/stream)`,
    `[${new Date().toLocaleTimeString()}] [info] Loaded 3 production case studies (StreamPulse, DevDock, GeoLearn) and 9 core stack extensions`,
  ]);

  const theme = settings.theme;
  const minimapVisible = settings.minimapEnabled;

  const persistWorkspaceToCloud = useCallback(
    (
      nextCustomFiles?: Record<string, string>,
      nextCustomFolders?: string[],
      nextSettings?: WorkbenchSettings
    ) => {
      fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(nextCustomFiles ? { customFiles: nextCustomFiles } : {}),
          ...(nextCustomFolders ? { customFolders: nextCustomFolders } : {}),
          ...(nextSettings ? { settings: nextSettings } : {}),
        }),
      }).catch(() => {
        // Offline resilient
      });
    },
    []
  );

  const handleUpdateSettings = useCallback(
    (partial: Partial<WorkbenchSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...partial };
        persistWorkspaceToCloud(undefined, undefined, updated);
        return updated;
      });
    },
    [persistWorkspaceToCloud]
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const appendSyncLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSyncLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 39)]);
  }, []);

  const applyProjectStars = useCallback((starMap: Record<string, number>) => {
    if (!starMap) return;
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        stars: typeof starMap[p.id] === 'number' ? starMap[p.id] : p.stars,
      }))
    );
    setSelectedProject((prev) =>
      prev && typeof starMap[prev.id] === 'number'
        ? { ...prev, stars: starMap[prev.id] }
        : prev
    );
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    fetch('/api/portfolio')
      .then((res) => res.json())
      .then((data) => {
        if (data.projectStars) applyProjectStars(data.projectStars);
        if (typeof data.visitorCount === 'number') setVisitorCount(data.visitorCount);
        if (Array.isArray(data.messages)) setMessages(data.messages);
        if (Array.isArray(data.guestbook)) setGuestbook(data.guestbook);
        if (data.customFiles && typeof data.customFiles === 'object') {
          setCustomFiles(data.customFiles);
        }
        if (Array.isArray(data.customFolders)) {
          setCustomFolders(data.customFolders);
        }
        if (data.settings && typeof data.settings === 'object') {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
        if (typeof data.syncCount === 'number') {
          setSyncStats({
            syncCount: data.syncCount,
            lastSyncedAt: data.lastSyncedAt || new Date().toISOString(),
            totalCommandsExecuted: data.totalCommandsExecuted || 342,
          });
        }
      })
      .catch(() => {
        // Offline resilient fallback
      });

    // Increment visitor counter once per browser session
    try {
      if (!sessionStorage.getItem('mustafa_visited')) {
        sessionStorage.setItem('mustafa_visited', '1');
        fetch('/api/visit', { method: 'POST' })
          .then((r) => r.json())
          .then((d) => {
            if (typeof d.visitorCount === 'number') setVisitorCount(d.visitorCount);
          })
          .catch(() => {});
      }
    } catch {
      // Ignore storage restrictions
    }

    try {
      eventSource = new EventSource('/api/stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.projectStars) applyProjectStars(payload.projectStars);
          if (typeof payload.visitorCount === 'number') setVisitorCount(payload.visitorCount);
          if (Array.isArray(payload.messages)) setMessages(payload.messages);
          if (Array.isArray(payload.guestbook)) setGuestbook(payload.guestbook);
          if (payload.customFiles && typeof payload.customFiles === 'object') {
            setCustomFiles(payload.customFiles);
          }
          if (Array.isArray(payload.customFolders)) {
            setCustomFolders(payload.customFolders);
          }
          if (typeof payload.syncCount === 'number') {
            setSyncStats({
              syncCount: payload.syncCount,
              lastSyncedAt: payload.lastSyncedAt || new Date().toISOString(),
              totalCommandsExecuted: payload.totalCommandsExecuted || 342,
            });
          }
          if (payload.type && payload.type !== 'connected') {
            appendSyncLog(`[SSE] Event "${payload.type}" — Cloud Revision #${payload.syncCount}`);
          }
        } catch {
          // Ignore malformed event
        }
      };
    } catch {
      // Ignore SSE errors
    }

    return () => {
      eventSource?.close();
    };
  }, [applyProjectStars, appendSyncLog]);

  const handleOpenFile = useCallback(
    (fileId: string, pushHistory = true) => {
      setActiveFile(fileId);
      setOpenTabs((prev) => (prev.includes(fileId) ? prev : [...prev, fileId]));
      setMobileDrawerOpen(false);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
      setOpenMenu(null);
      setBreadcrumbDropdown(null);
      if (pushHistory) {
        setNavHistory((prev) => {
          const sliced = prev.slice(0, navHistoryIdx + 1);
          if (sliced[sliced.length - 1] === fileId) return sliced;
          return [...sliced, fileId];
        });
        setNavHistoryIdx((prev) => prev + 1);
      }
    },
    [navHistoryIdx]
  );

  const handleCreateUntitledFile = useCallback(
    (customName?: string) => {
      const count = Object.keys(customFiles).length + 1;
      const fileName = (customName || `Untitled-${count}.tsx`).trim();
      if (!customFiles[fileName]) {
        const nextFiles = {
          ...customFiles,
          [fileName]: `// ${fileName} — Created in MUSTAFA.dev VS Code Workbench\nimport React from 'react';\n\nexport default function CustomModule() {\n  return <div>Hello from ${DEVELOPER_PROFILE.name}'s interactive workspace!</div>;\n}\n`,
        };
        setCustomFiles(nextFiles);
        persistWorkspaceToCloud(nextFiles, undefined, undefined);
      }
      handleOpenFile(fileName);
    },
    [customFiles, handleOpenFile, persistWorkspaceToCloud]
  );

  const handleNavBack = () => {
    if (navHistoryIdx > 0) {
      const targetIdx = navHistoryIdx - 1;
      setNavHistoryIdx(targetIdx);
      handleOpenFile(navHistory[targetIdx], false);
    }
  };

  const handleNavForward = () => {
    if (navHistoryIdx < navHistory.length - 1) {
      const targetIdx = navHistoryIdx + 1;
      setNavHistoryIdx(targetIdx);
      handleOpenFile(navHistory[targetIdx], false);
    }
  };

  const handleCloseTab = (e: React.MouseEvent | null, fileId: string) => {
    e?.stopPropagation();
    if (openTabs.length <= 1) return;
    const nextTabs = openTabs.filter((t) => t !== fileId);
    setOpenTabs(nextTabs);
    if (activeFile === fileId) {
      setActiveFile(nextTabs[nextTabs.length - 1]);
    }
  };

  const handleActivityClick = (view: ActivityViewId) => {
    if (activityView === view && sidebarOpen) {
      setSidebarOpen(false);
      setMobileDrawerOpen(false);
    } else {
      setActivityView(view);
      setSidebarOpen(true);
    }
  };

  const handleCollapseAllExplorer = () => {
    setSrcRootExpanded(false);
    setSrcFolderExpanded(false);
    setProjectsFolderExpanded(false);
    setComponentsFolderExpanded(false);
    setPublicFolderExpanded(false);
    setConfigFolderExpanded(false);
  };

  const handleCreateCustomFolder = useCallback(
    (folderNameRaw: string) => {
      const clean = folderNameRaw.trim().replace(/^\/+|\/+$/g, '');
      if (!clean) return;
      setCustomFolders((prev) => {
        const next = prev.includes(clean) ? prev : [...prev, clean];
        persistWorkspaceToCloud(undefined, next, undefined);
        return next;
      });
      appendSyncLog(`[Explorer] Created folder "src/${clean}"`);
    },
    [appendSyncLog, persistWorkspaceToCloud]
  );

  const handleStarProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/star`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.projectStars) {
        applyProjectStars(data.projectStars);
        appendSyncLog(`[Git/Cloud] Endorsed project "${projectId}"`);
      }
    } catch {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, stars: p.stars + 1 } : p))
      );
    }
  };

  const handleTriggerSync = async (fromTerminal = false) => {
    setIsSyncingNow(true);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromTerminal }),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncStats({
          syncCount: data.syncCount,
          lastSyncedAt: data.lastSyncedAt,
          totalCommandsExecuted: data.totalCommandsExecuted,
        });
        appendSyncLog(`[Sync] Synchronized workspace state — Revision #${data.syncCount}`);
      }
    } catch {
      setSyncStats((prev) => ({
        ...prev,
        syncCount: prev.syncCount + 1,
        lastSyncedAt: new Date().toISOString(),
      }));
    } finally {
      setTimeout(() => setIsSyncingNow(false), 500);
    }
  };

  const handleToggleTheme = (desired?: 'dark' | 'light') => {
    if (desired) {
      handleUpdateSettings({ theme: desired });
    } else {
      handleUpdateSettings({ theme: theme === 'dark' ? 'light' : 'dark' });
    }
  };

  const openQuickPick = (prefix = '') => {
    setPalettePrefix(prefix);
    setCommandPaletteOpen(true);
    setOpenMenu(null);
  };

  // Global VS Code keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        openQuickPick('> ');
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setActivityView('explorer');
        setSidebarOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        openQuickPick('');
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        openQuickPick('@');
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        openQuickPick(':');
      } else if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        handleOpenFile('settings');
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFindWidgetOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault();
        setTerminalOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setEditorMode((prev) => (prev === 'split' ? 'hybrid' : 'split'));
      } else if (e.key === 'F5') {
        e.preventDefault();
        setIsDebugging((prev) => !prev);
      } else if (e.altKey && ['1', '2', '3', '4', '5', '6', '7', '8'].includes(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        if (WORKSPACE_FILES[index]) {
          handleOpenFile(WORKSPACE_FILES[index].id);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleOpenFile]);

  // Resolve metadata for active tab (supports built-in files, Settings UI, Extension tabs, and Custom files)
  const getTabMeta = (fileId: string): WorkspaceFile => {
    const found = WORKSPACE_FILES.find((f) => f.id === fileId);
    if (found) return found;
    if (fileId === 'settings') {
      return {
        id: 'settings',
        name: 'Settings',
        path: 'User/Settings',
        folder: 'workbench',
        language: 'Settings UI',
        extension: 'json',
        navLabel: 'Settings',
        shortcut: 'Ctrl+,',
        description: 'Visual Studio Code Graphical Settings Editor',
      };
    }
    if (fileId.startsWith('extension:')) {
      const skId = fileId.replace('extension:', '');
      const sk = PORTFOLIO_SKILLS.find((s) => s.id === skId);
      return {
        id: fileId,
        name: `Extension: ${sk ? sk.name : skId}`,
        path: `extensions/mustafa.${skId}`,
        folder: 'workbench',
        language: 'Extension',
        extension: 'json',
        navLabel: sk ? sk.name : 'Extension',
        shortcut: 'Ctrl+Shift+X',
        description: sk ? sk.desc : 'VS Code Extension Details',
      };
    }
    return {
      id: fileId,
      name: fileId,
      path: `src/pages/${fileId}`,
      folder: 'src/pages',
      language: 'TypeScript React',
      extension: 'tsx',
      navLabel: fileId,
      shortcut: 'Ctrl+N',
      description: 'User created file buffer',
    };
  };

  const currentFileMeta = getTabMeta(activeFile);
  const isDark = theme === 'dark';

  // Compute global search results when in Search view
  const searchResults = React.useMemo(() => {
    const rawQ = globalSearchQuery.trim();
    if (!rawQ) return [];
    const q = matchCase ? rawQ : rawQ.toLowerCase();
    const matchesText = (source: string) => {
      try {
        if (useRegex) {
          const rx = new RegExp(rawQ, matchCase ? '' : 'i');
          return rx.test(source);
        }
        const target = matchCase ? source : source.toLowerCase();
        if (matchWholeWord) {
          const regex = new RegExp(
            `\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
            matchCase ? '' : 'i'
          );
          return regex.test(source);
        }
        return target.includes(q);
      } catch {
        return false;
      }
    };

    const results: Array<{
      id: string;
      fileId: string;
      fileName: string;
      line: number;
      snippet: string;
    }> = [];

    if (
      matchesText(DEVELOPER_PROFILE.name) ||
      matchesText(DEVELOPER_PROFILE.bioHeadline) ||
      matchesText(DEVELOPER_PROFILE.location)
    ) {
      results.push({
        id: 'res-overview',
        fileId: 'overview.tsx',
        fileName: 'src/pages/overview.tsx',
        line: 8,
        snippet: `${DEVELOPER_PROFILE.name} — ${DEVELOPER_PROFILE.educationShort}`,
      });
    }

    projects.forEach((p, idx) => {
      if (
        matchesText(p.title) ||
        matchesText(p.description) ||
        p.tags.some((t) => matchesText(t))
      ) {
        results.push({
          id: `res-proj-${p.id}`,
          fileId: 'projects.tsx',
          fileName: 'src/pages/projects.tsx',
          line: (idx + 1) * 14,
          snippet: `${p.title} (${p.category}): ${p.description}`,
        });
      }
    });

    PORTFOLIO_SKILLS.forEach((s, idx) => {
      if (matchesText(s.name) || matchesText(s.desc) || matchesText(s.category)) {
        results.push({
          id: `res-skill-${s.id}`,
          fileId: 'skills.json',
          fileName: 'src/pages/skills.json',
          line: (idx + 1) * 6,
          snippet: `"${s.name}": "${s.desc}"`,
        });
      }
    });

    EDUCATION_TIMELINE.forEach((e, idx) => {
      if (matchesText(e.institution) || matchesText(e.degree) || matchesText(e.location)) {
        results.push({
          id: `res-edu-${e.id}`,
          fileId: 'education.md',
          fileName: 'src/pages/education.md',
          line: (idx + 1) * 5,
          snippet: `${e.degree} — ${e.institution} (${e.year})`,
        });
      }
    });

    if (matchesText(BLOG_POSTS[0].title) || matchesText(BLOG_POSTS[0].content)) {
      results.push({
        id: 'res-blog',
        fileId: 'blog.mdx',
        fileName: 'src/pages/blog.mdx',
        line: 1,
        snippet: BLOG_POSTS[0].title,
      });
    }

    return results;
  }, [globalSearchQuery, matchCase, matchWholeWord, useRegex, projects]);

  const filteredExtensions = PORTFOLIO_SKILLS.filter((sk) => {
    const q = extensionSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      sk.name.toLowerCase().includes(q) ||
      sk.desc.toLowerCase().includes(q) ||
      sk.category.toLowerCase().includes(q)
    );
  });

  const chromeBg = isDark ? 'bg-[#181818] text-[#CCCCCC]' : 'bg-[#F8F8F8] text-[#3B3B3B]';
  const editorBg = isDark ? 'bg-[#1F1F1F] text-[#CCCCCC]' : 'bg-white text-[#1F1F1F]';
  const borderCol = isDark ? 'border-[#2B2B2B]' : 'border-[#E5E5E5]';

  // Official VS Code Menu Bar definitions with checkmarks and real actions
  const menuDefinitions: Record<
    Exclude<MenuId, null>,
    Array<{
      label: string;
      shortcut?: string;
      checked?: boolean;
      dividerAfter?: boolean;
      action: () => void;
    }>
  > = {
    File: [
      {
        label: 'New Text File',
        shortcut: 'Ctrl+N',
        action: () => {
          handleCreateUntitledFile();
          setOpenMenu(null);
        },
      },
      {
        label: 'Open File...',
        shortcut: 'Ctrl+P',
        dividerAfter: true,
        action: () => openQuickPick(''),
      },
      {
        label: 'Open Overview (overview.tsx)',
        shortcut: 'Alt+1',
        action: () => handleOpenFile('overview.tsx'),
      },
      {
        label: 'Open Projects (projects.tsx)',
        shortcut: 'Alt+2',
        action: () => handleOpenFile('projects.tsx'),
      },
      {
        label: 'Open Stack (skills.json)',
        shortcut: 'Alt+3',
        action: () => handleOpenFile('skills.json'),
      },
      {
        label: 'Open Academics (education.md)',
        shortcut: 'Alt+4',
        action: () => handleOpenFile('education.md'),
      },
      {
        label: 'Open Articles (blog.mdx)',
        shortcut: 'Alt+5',
        action: () => handleOpenFile('blog.mdx'),
      },
      {
        label: 'Open Contact (contact.tsx)',
        shortcut: 'Alt+6',
        dividerAfter: true,
        action: () => handleOpenFile('contact.tsx'),
      },
      {
        label: 'Preferences: Settings',
        shortcut: 'Ctrl+,',
        action: () => handleOpenFile('settings'),
      },
      {
        label: 'Preferences: Extensions',
        shortcut: 'Ctrl+Shift+X',
        dividerAfter: true,
        action: () => {
          setActivityView('extensions');
          setSidebarOpen(true);
          setOpenMenu(null);
        },
      },
      {
        label: 'Save & Sync Cloud State',
        shortcut: 'Ctrl+S',
        action: () => {
          handleTriggerSync(false);
          setOpenMenu(null);
        },
      },
      {
        label: 'Auto Save',
        checked: settings.autoSave === 'afterDelay',
        dividerAfter: true,
        action: () => {
          handleUpdateSettings({
            autoSave: settings.autoSave === 'afterDelay' ? 'off' : 'afterDelay',
          });
          setOpenMenu(null);
        },
      },
      {
        label: 'Close Editor',
        shortcut: 'Ctrl+W',
        action: () => {
          handleCloseTab(null, activeFile);
          setOpenMenu(null);
        },
      },
    ],
    Edit: [
      {
        label: 'Find in Active File',
        shortcut: 'Ctrl+F',
        action: () => {
          setFindWidgetOpen(true);
          setOpenMenu(null);
        },
      },
      {
        label: 'Find in Files (Workspace)',
        shortcut: 'Ctrl+Shift+F',
        dividerAfter: true,
        action: () => {
          setActivityView('search');
          setSidebarOpen(true);
          setOpenMenu(null);
        },
      },
      {
        label: 'Replace in Files',
        shortcut: 'Ctrl+Shift+H',
        dividerAfter: true,
        action: () => {
          setActivityView('search');
          setSearchReplaceExpanded(true);
          setSidebarOpen(true);
          setOpenMenu(null);
        },
      },
      {
        label: 'Copy Developer Email',
        shortcut: 'Ctrl+C',
        action: () => {
          navigator.clipboard?.writeText(DEVELOPER_PROFILE.email);
          setOpenMenu(null);
        },
      },
    ],
    Selection: [
      {
        label: 'Select All Projects',
        action: () => handleOpenFile('projects.tsx'),
      },
      {
        label: 'Inspect StreamPulse Case Study',
        action: () => {
          setSelectedProject(projects[0]);
          setOpenMenu(null);
        },
      },
      {
        label: 'Switch Editor to Raw Code Buffer',
        action: () => {
          setEditorMode('code');
          setOpenMenu(null);
        },
      },
    ],
    View: [
      {
        label: 'Command Palette...',
        shortcut: 'Ctrl+Shift+P',
        dividerAfter: true,
        action: () => openQuickPick('> '),
      },
      {
        label: 'Explorer',
        shortcut: 'Ctrl+Shift+E',
        checked: activityView === 'explorer' && sidebarOpen,
        action: () => {
          setActivityView('explorer');
          setSidebarOpen(true);
          setOpenMenu(null);
        },
      },
      {
        label: 'Search',
        shortcut: 'Ctrl+Shift+F',
        checked: activityView === 'search' && sidebarOpen,
        action: () => {
          setActivityView('search');
          setSidebarOpen(true);
          setOpenMenu(null);
        },
      },
      {
        label: 'Source Control',
        shortcut: 'Ctrl+Shift+G',
        checked: activityView === 'scm' && sidebarOpen,
        action: () => {
          setActivityView('scm');
          setSidebarOpen(true);
          setOpenMenu(null);
        },
      },
      {
        label: 'Run and Debug',
        shortcut: 'Ctrl+Shift+D',
        checked: activityView === 'debug' && sidebarOpen,
        action: () => {
          setActivityView('debug');
          setSidebarOpen(true);
          setOpenMenu(null);
        },
      },
      {
        label: 'Extensions',
        shortcut: 'Ctrl+Shift+X',
        checked: activityView === 'extensions' && sidebarOpen,
        dividerAfter: true,
        action: () => {
          setActivityView('extensions');
          setSidebarOpen(true);
          setOpenMenu(null);
        },
      },
      {
        label: 'Appearance: Show Primary Side Bar',
        shortcut: 'Ctrl+B',
        checked: sidebarOpen,
        action: () => {
          setSidebarOpen((prev) => !prev);
          setOpenMenu(null);
        },
      },
      {
        label: 'Appearance: Show Bottom Panel',
        shortcut: 'Ctrl+`',
        checked: terminalOpen,
        action: () => {
          setTerminalOpen((prev) => !prev);
          setOpenMenu(null);
        },
      },
      {
        label: 'Appearance: Show Minimap',
        shortcut: 'Alt+M',
        checked: settings.minimapEnabled,
        action: () => {
          handleUpdateSettings({ minimapEnabled: !settings.minimapEnabled });
          setOpenMenu(null);
        },
      },
      {
        label: 'Appearance: Show Breadcrumbs',
        checked: settings.breadcrumbsEnabled,
        dividerAfter: true,
        action: () => {
          handleUpdateSettings({ breadcrumbsEnabled: !settings.breadcrumbsEnabled });
          setOpenMenu(null);
        },
      },
      {
        label: 'Editor Layout: Split Editor Right',
        shortcut: 'Ctrl+\\',
        checked: editorMode === 'split',
        action: () => {
          setEditorMode((prev) => (prev === 'split' ? 'hybrid' : 'split'));
          setOpenMenu(null);
        },
      },
      {
        label: 'Word Wrap',
        shortcut: 'Alt+Z',
        checked: settings.wordWrap === 'on',
        action: () => {
          handleUpdateSettings({
            wordWrap: settings.wordWrap === 'on' ? 'off' : 'on',
          });
          setOpenMenu(null);
        },
      },
    ],
    Go: [
      {
        label: 'Back',
        shortcut: 'Alt+Left',
        action: () => {
          handleNavBack();
          setOpenMenu(null);
        },
      },
      {
        label: 'Forward',
        shortcut: 'Alt+Right',
        dividerAfter: true,
        action: () => {
          handleNavForward();
          setOpenMenu(null);
        },
      },
      {
        label: 'Go to File...',
        shortcut: 'Ctrl+P',
        action: () => openQuickPick(''),
      },
      {
        label: 'Go to Symbol in Workspace...',
        shortcut: 'Ctrl+Shift+O',
        action: () => openQuickPick('@'),
      },
      {
        label: 'Go to Line/Column...',
        shortcut: 'Ctrl+G',
        action: () => openQuickPick(':'),
      },
    ],
    Run: [
      {
        label: isDebugging ? 'Stop Debugging' : 'Start Debugging',
        shortcut: 'F5',
        action: () => {
          setIsDebugging((prev) => !prev);
          setActivityView('debug');
          setSidebarOpen(true);
          setTerminalOpen(true);
          setActivePanelTab('debug');
          setOpenMenu(null);
        },
      },
      {
        label: 'Run Without Debugging',
        shortcut: 'Ctrl+F5',
        action: () => {
          setTerminalOpen(true);
          setActivePanelTab('terminal');
          setOpenMenu(null);
        },
      },
    ],
    Terminal: [
      {
        label: 'New Terminal',
        shortcut: 'Ctrl+`',
        action: () => {
          setTerminalOpen(true);
          setActivePanelTab('terminal');
          setOpenMenu(null);
        },
      },
      {
        label: 'Show Output Panel',
        action: () => {
          setTerminalOpen(true);
          setActivePanelTab('output');
          setOpenMenu(null);
        },
      },
      {
        label: 'Show Problems Panel',
        action: () => {
          setTerminalOpen(true);
          setActivePanelTab('problems');
          setOpenMenu(null);
        },
      },
      {
        label: 'Show Forwarded Ports',
        action: () => {
          setTerminalOpen(true);
          setActivePanelTab('ports');
          setOpenMenu(null);
        },
      },
    ],
    Help: [
      {
        label: 'Welcome / Portfolio Overview',
        action: () => handleOpenFile('overview.tsx'),
      },
      {
        label: 'Show All Commands',
        shortcut: 'Ctrl+Shift+P',
        action: () => openQuickPick('> '),
      },
      {
        label: 'Switch Color Theme (Dark / Light)',
        shortcut: 'Alt+T',
        dividerAfter: true,
        action: () => {
          handleToggleTheme();
          setOpenMenu(null);
        },
      },
      {
        label: 'About Visual Studio Code Portfolio',
        action: () => {
          setAboutModalOpen(true);
          setOpenMenu(null);
        },
      },
    ],
  };

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col select-none ${chromeBg}`}>
      {/* 1. OFFICIAL VS CODE TITLE BAR & COMMAND CENTER */}
      <header
        className={`h-[35px] flex items-center justify-between px-2.5 border-b ${borderCol} ${chromeBg} text-[12px] shrink-0 relative z-40`}
      >
        {/* Left: Official VS Code Ribbon Logo + Menu Bar */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="px-1 flex items-center shrink-0">
            <OfficialVSCodeLogo className="w-4 h-4" />
          </div>

          {/* Official Menu Bar with Working Dropdowns & Checkmarks */}
          <nav
            aria-label="VS Code Menu Bar"
            className="hidden md:flex items-center gap-0.5 relative"
          >
            {(
              ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'] as Array<
                Exclude<MenuId, null>
              >
            ).map((menuName) => {
              const isMenuOpen = openMenu === menuName;
              return (
                <div key={menuName} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenu(isMenuOpen ? null : menuName)}
                    onMouseEnter={() => {
                      if (openMenu !== null) setOpenMenu(menuName);
                    }}
                    className={`px-2 py-0.5 rounded text-[12px] cursor-pointer whitespace-nowrap shrink-0 ${
                      isMenuOpen
                        ? 'bg-[#2A2D2E] text-white'
                        : 'text-[#CCCCCC] hover:bg-[#2A2D2E]'
                    }`}
                  >
                    {menuName}
                  </button>

                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpenMenu(null)}
                      />
                      <div className="absolute left-0 top-7 w-72 rounded-md border border-[#454545] bg-[#252526] text-[#CCCCCC] shadow-[0_8px_24px_rgba(0,0,0,0.65)] py-1 z-50 text-xs">
                        {menuDefinitions[menuName].map((item) => (
                          <React.Fragment key={item.label}>
                            <button
                              type="button"
                              onClick={item.action}
                              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <span className="w-3.5 flex items-center justify-center">
                                  {item.checked && (
                                    <Codicon name="check" className="!text-[12px]" />
                                  )}
                                </span>
                                <span>{item.label}</span>
                              </span>
                              {item.shortcut && (
                                <span className="font-mono text-[10px] text-[#858585]">
                                  {item.shortcut}
                                </span>
                              )}
                            </button>
                            {item.dividerAfter && (
                              <div className="my-1 border-t border-[#3C3C3C]" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Center: Official Navigation Arrows + Command Center Search Bar */}
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleNavBack}
              disabled={navHistoryIdx <= 0}
              title="Go Back (Alt+Left)"
              className="p-1 rounded hover:bg-[#2A2D2E] disabled:opacity-35 text-[#CCCCCC] flex items-center justify-center cursor-pointer"
            >
              <Codicon name="arrow-left" className="!text-[14px]" />
            </button>
            <button
              type="button"
              onClick={handleNavForward}
              disabled={navHistoryIdx >= navHistory.length - 1}
              title="Go Forward (Alt+Right)"
              className="p-1 rounded hover:bg-[#2A2D2E] disabled:opacity-35 text-[#CCCCCC] flex items-center justify-center cursor-pointer"
            >
              <Codicon name="arrow-right" className="!text-[14px]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => openQuickPick('')}
            title="Search files by name (Ctrl+P) or run commands (Ctrl+Shift+P)"
            className={`flex items-center justify-center gap-1.5 sm:gap-2 w-36 sm:w-64 md:w-80 lg:w-96 h-[22px] px-2 sm:px-3 rounded-[5px] border ${
              isDark
                ? 'bg-[#252526] hover:bg-[#2A2D2E] border-[#3C3C3C] text-[#CCCCCC]'
                : 'bg-[#ECECEC] hover:bg-[#E0E0E0] border-[#D0D0D0] text-[#3B3B3B]'
            } text-[11px] transition-colors cursor-pointer shrink-0`}
          >
            <Codicon name="search" className="!text-[12px] text-[#868686] shrink-0" />
            <span className="truncate">mustafa-dev-portfolio</span>
          </button>
        </div>

        {/* Right: Official VS Code Layout Controls & Window Chrome Buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            title="Toggle Primary Side Bar (Ctrl+B)"
            className="p-1 rounded hover:bg-[#2A2D2E] text-[#CCCCCC] flex items-center justify-center cursor-pointer"
          >
            <Codicon
              name={sidebarOpen ? 'layout-sidebar-left' : 'layout-sidebar-left-off'}
              className="!text-[15px]"
            />
          </button>

          <button
            type="button"
            onClick={() => setTerminalOpen((prev) => !prev)}
            title="Toggle Panel (Ctrl+`)"
            className="p-1 rounded hover:bg-[#2A2D2E] text-[#CCCCCC] flex items-center justify-center cursor-pointer"
          >
            <Codicon
              name={terminalOpen ? 'layout-panel' : 'layout-panel-off'}
              className="!text-[15px]"
            />
          </button>

          <button
            type="button"
            onClick={() =>
              handleUpdateSettings({ minimapEnabled: !settings.minimapEnabled })
            }
            title="Toggle Code Minimap (Alt+M)"
            className="p-1 rounded hover:bg-[#2A2D2E] text-[#CCCCCC] flex items-center justify-center cursor-pointer"
          >
            <Codicon
              name={minimapVisible ? 'layout-sidebar-right' : 'layout-sidebar-right-off'}
              className="!text-[15px]"
            />
          </button>

          {/* Window Minimize / Restore / Close Glyphs */}
          <div className="hidden xl:flex items-center ml-2 border-l border-[#2B2B2B] pl-1 text-[#868686]">
            <button
              type="button"
              onClick={() => setTerminalExpanded(false)}
              title="Minimize Panel"
              className="px-2 py-1 hover:bg-[#2A2D2E] hover:text-white flex items-center justify-center cursor-pointer"
            >
              <Codicon name="chrome-minimize" className="!text-[13px]" />
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              title="Restore Layout"
              className="px-2 py-1 hover:bg-[#2A2D2E] hover:text-white flex items-center justify-center cursor-pointer"
            >
              <Codicon name="chrome-restore" className="!text-[13px]" />
            </button>
            <button
              type="button"
              onClick={() => handleOpenFile('overview.tsx')}
              title="Reset to Overview"
              className="px-2 py-1 hover:bg-[#E81123] hover:text-white flex items-center justify-center cursor-pointer"
            >
              <Codicon name="chrome-close" className="!text-[13px]" />
            </button>
          </div>
        </div>
      </header>

      {/* OFFICIAL FLOATING VS CODE DEBUG TOOLBAR (VISIBLE WHEN DEBUGGING F5 IS ACTIVE) */}
      {isDebugging && (
        <div className="fixed top-[38px] left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2.5 py-1 rounded-xs bg-[#252526] border border-[#454545] shadow-xl">
          <Codicon name="gripper" className="!text-[14px] text-[#858585] mr-1 cursor-move" />
          <button
            type="button"
            onClick={() => appendSyncLog('[Debugger] Continued execution')}
            title="Continue (F5)"
            className="p-1 rounded hover:bg-[#2A2D2E] text-[#75BEFF] flex items-center cursor-pointer"
          >
            <Codicon name="debug-continue" className="!text-[15px]" />
          </button>
          <button
            type="button"
            onClick={() =>
              setCursorPos((prev) => ({ line: Math.min(42, prev.line + 1), col: 1 }))
            }
            title="Step Over (F10)"
            className="p-1 rounded hover:bg-[#2A2D2E] text-[#75BEFF] flex items-center cursor-pointer"
          >
            <Codicon name="debug-step-over" className="!text-[15px]" />
          </button>
          <button
            type="button"
            onClick={() =>
              setCursorPos((prev) => ({ line: Math.min(42, prev.line + 1), col: 4 }))
            }
            title="Step Into (F11)"
            className="p-1 rounded hover:bg-[#2A2D2E] text-[#75BEFF] flex items-center cursor-pointer"
          >
            <Codicon name="debug-step-into" className="!text-[15px]" />
          </button>
          <button
            type="button"
            onClick={() => handleTriggerSync(false)}
            title="Restart (Ctrl+Shift+F5)"
            className="p-1 rounded hover:bg-[#2A2D2E] text-[#89D185] flex items-center cursor-pointer"
          >
            <Codicon name="debug-restart" className="!text-[15px]" />
          </button>
          <button
            type="button"
            onClick={() => setIsDebugging(false)}
            title="Stop (Shift+F5)"
            className="p-1 rounded hover:bg-[#2A2D2E] text-[#F48771] flex items-center cursor-pointer"
          >
            <Codicon name="debug-stop" className="!text-[15px]" />
          </button>
        </div>
      )}

      {/* 2. MAIN WORKBENCH BODY (Activity Bar + Primary Side Bar + Editor Group & Panel) */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Far-Left Activity Bar using Official @vscode/codicons */}
        <aside
          aria-label="VS Code Activity Bar"
          className={`w-10 sm:w-12 flex flex-col items-center justify-between py-0.5 border-r ${borderCol} ${chromeBg} shrink-0 z-30`}
        >
          {/* Top 5 Official Activity Icons */}
          <div className="flex flex-col items-center w-full">
            {(
              [
                {
                  id: 'explorer',
                  icon: 'files',
                  title: 'Explorer (Ctrl+Shift+E)',
                  badge:
                    messages.filter((m) => !m.read).length > 0
                      ? String(messages.filter((m) => !m.read).length)
                      : undefined,
                },
                { id: 'search', icon: 'search', title: 'Search (Ctrl+Shift+F)' },
                {
                  id: 'scm',
                  icon: 'source-control',
                  title: 'Source Control (Ctrl+Shift+G)',
                  badge: String(projects.length),
                },
                { id: 'debug', icon: 'debug-alt', title: 'Run and Debug (Ctrl+Shift+D)' },
                {
                  id: 'extensions',
                  icon: 'extensions',
                  title: 'Extensions (Ctrl+Shift+X)',
                  badge: String(PORTFOLIO_SKILLS.length),
                },
              ] as Array<{
                id: ActivityViewId;
                icon: string;
                title: string;
                badge?: string;
              }>
            ).map((item) => {
              const active = activityView === item.id && sidebarOpen;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleActivityClick(item.id)}
                  title={item.title}
                  className={`relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center transition-colors cursor-pointer ${
                    active
                      ? isDark
                        ? 'text-white'
                        : 'text-[#1F1F1F]'
                      : 'text-[#868686] hover:text-[#D7D7D7]'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#0078D4]" />
                  )}
                  <Codicon name={item.icon} className="!text-[20px] sm:!text-[24px]" />
                  {item.badge && (
                    <span className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 px-1 min-w-[15px] h-3.5 sm:min-w-[16px] sm:h-4 rounded-full bg-[#0078D4] text-white text-[9px] font-sans font-semibold flex items-center justify-center tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Official Account & Manage Gear Icons */}
          <div className="flex flex-col items-center w-full relative">
            <button
              type="button"
              onClick={() => {
                setAccountMenuOpen((prev) => !prev);
                setSettingsMenuOpen(false);
              }}
              title={`Accounts — ${DEVELOPER_PROFILE.name}`}
              className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-[#868686] hover:text-[#D7D7D7] transition-colors cursor-pointer"
            >
              <Codicon name="account" className="!text-[20px] sm:!text-[24px]" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSettingsMenuOpen((prev) => !prev);
                setAccountMenuOpen(false);
              }}
              title="Manage / Settings (Ctrl+,)"
              className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-[#868686] hover:text-[#D7D7D7] transition-colors cursor-pointer"
            >
              <Codicon name="settings-gear" className="!text-[20px] sm:!text-[24px]" />
            </button>

            {/* Account Context Menu */}
            {accountMenuOpen && (
              <div onClick={() => setAccountMenuOpen(false)} className="fixed inset-0 z-40">
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-12 bottom-12 w-64 rounded-md border border-[#454545] bg-[#252526] text-[#CCCCCC] shadow-xl py-1 text-xs z-50"
                >
                  <div className="px-3 py-1.5 border-b border-[#3C3C3C]">
                    <div className="font-semibold text-white">
                      {DEVELOPER_PROFILE.name} (GitHub)
                    </div>
                    <div className="text-[11px] text-[#858585]">{DEVELOPER_PROFILE.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenFile('overview.tsx');
                      setAccountMenuOpen(false);
                    }}
                    className="w-full px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                  >
                    Open Developer Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleTriggerSync(false);
                      setAccountMenuOpen(false);
                    }}
                    className="w-full px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                  >
                    Settings Sync is On (Rev #{syncStats.syncCount})
                  </button>
                </div>
              </div>
            )}

            {/* Settings Gear Context Menu */}
            {settingsMenuOpen && (
              <div onClick={() => setSettingsMenuOpen(false)} className="fixed inset-0 z-40">
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-12 bottom-2 w-64 rounded-md border border-[#454545] bg-[#252526] text-[#CCCCCC] shadow-xl py-1 text-xs z-50"
                >
                  <button
                    type="button"
                    onClick={() => {
                      openQuickPick('> ');
                      setSettingsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                  >
                    <span>Command Palette...</span>
                    <span className="font-mono text-[10px] text-[#858585]">Ctrl+Shift+P</span>
                  </button>
                  <div className="my-1 border-t border-[#3C3C3C]" />
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenFile('settings');
                      setSettingsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                  >
                    <span>Settings</span>
                    <span className="font-mono text-[10px] text-[#858585]">Ctrl+,</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActivityView('extensions');
                      setSidebarOpen(true);
                      setSettingsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                  >
                    <span>Extensions</span>
                    <span className="font-mono text-[10px] text-[#858585]">Ctrl+Shift+X</span>
                  </button>
                  <div className="my-1 border-t border-[#3C3C3C]" />
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleTheme();
                      setSettingsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                  >
                    <span>Themes: {isDark ? 'Dark Modern' : 'Light Modern'}</span>
                    <span className="font-mono text-[10px] text-[#858585]">Alt+T</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Slide-Over Backdrop when Primary Side Bar is open on < md screens */}
        {(sidebarOpen || mobileDrawerOpen) && (
          <div
            onClick={() => {
              setSidebarOpen(false);
              setMobileDrawerOpen(false);
            }}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
          />
        )}

        {/* Primary Side Bar (Overlay drawer on < 768px mobile, docked inline on >= 768px tablet/laptop/desktop) */}
        <aside
          aria-label="VS Code Primary Side Bar"
          className={`${
            sidebarOpen || mobileDrawerOpen
              ? 'fixed top-[35px] bottom-[22px] left-10 sm:left-12 z-40 w-64 shadow-2xl flex md:static md:shadow-none md:w-56 lg:w-64'
              : 'hidden'
          } flex-col border-r ${borderCol} ${chromeBg} shrink-0`}
        >
          {/* Side Bar View Title Header with Official Action Icons */}
          <div className="h-[35px] px-4 flex items-center justify-between text-[11px] font-sans tracking-wide uppercase text-[#BBBBBB] shrink-0 relative">
            <span className="truncate font-semibold">
              {activityView === 'explorer' && 'EXPLORER'}
              {activityView === 'search' && 'SEARCH'}
              {activityView === 'scm' && 'SOURCE CONTROL'}
              {activityView === 'debug' && 'RUN AND DEBUG'}
              {activityView === 'extensions' && 'EXTENSIONS'}
            </span>
            <div className="flex items-center gap-0.5 relative">
              {activityView === 'explorer' && (
                <button
                  type="button"
                  onClick={() => {
                    setExplorerFilterOpen((prev) => {
                      if (prev) setExplorerFilterQuery('');
                      return !prev;
                    });
                  }}
                  title="Filter on Type in Explorer"
                  className={`p-1 rounded hover:bg-[#2A2D2E] cursor-pointer flex items-center ${
                    explorerFilterOpen ? 'bg-[#04395E] text-white' : 'text-[#CCCCCC]'
                  }`}
                >
                  <Codicon name="filter" className="!text-[14px]" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (activityView === 'explorer') {
                    setExplorerViewsMenuOpen((prev) => !prev);
                  } else {
                    openQuickPick('> ');
                  }
                }}
                title="Views and More Actions..."
                className="p-1 rounded hover:bg-[#2A2D2E] text-[#CCCCCC] flex items-center cursor-pointer"
              >
                <Codicon name="ellipsis" className="!text-[14px]" />
              </button>

              {/* Official VS Code Explorer Views Visibility Menu (...) */}
              {activityView === 'explorer' && explorerViewsMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setExplorerViewsMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-7 w-52 rounded-md border border-[#454545] bg-[#252526] text-[#CCCCCC] shadow-xl py-1 z-50 text-xs normal-case tracking-normal font-normal">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOpenEditors((prev) => !prev);
                        setExplorerViewsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                    >
                      <span className="w-3.5 flex items-center justify-center">
                        {showOpenEditors && <Codicon name="check" className="!text-[12px]" />}
                      </span>
                      <span>Open Editors</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWorkspaceTreeExpanded((prev) => !prev);
                        setExplorerViewsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                    >
                      <span className="w-3.5 flex items-center justify-center">
                        {workspaceTreeExpanded && (
                          <Codicon name="check" className="!text-[12px]" />
                        )}
                      </span>
                      <span>Folders (mustafa-dev-portfolio)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOutline((prev) => !prev);
                        setExplorerViewsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                    >
                      <span className="w-3.5 flex items-center justify-center">
                        {showOutline && <Codicon name="check" className="!text-[12px]" />}
                      </span>
                      <span>Outline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTimeline((prev) => !prev);
                        setExplorerViewsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                    >
                      <span className="w-3.5 flex items-center justify-center">
                        {showTimeline && <Codicon name="check" className="!text-[12px]" />}
                      </span>
                      <span>Timeline</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* VIEW 1: OFFICIAL VS CODE EXPLORER */}
          {activityView === 'explorer' && (
            <div className="flex-1 overflow-y-auto text-[13px] select-none relative">
              {/* Optional Filter on Type Input Box inside Explorer */}
              {explorerFilterOpen && (
                <div className="px-2.5 py-1.5 border-b border-[#2B2B2B] bg-[#181818] flex items-center gap-1.5">
                  <Codicon name="filter" className="!text-[12px] text-[#0078D4] shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={explorerFilterQuery}
                    onChange={(e) => setExplorerFilterQuery(e.target.value)}
                    placeholder="Filter files & pages by name..."
                    className="w-full bg-[#252526] border border-[#0078D4] rounded-xs px-2 py-0.5 text-[11px] text-white focus:outline-none"
                  />
                  {explorerFilterQuery && (
                    <button
                      type="button"
                      onClick={() => setExplorerFilterQuery('')}
                      title="Clear Filter"
                      className="text-[#858585] hover:text-white cursor-pointer flex items-center"
                    >
                      <Codicon name="close" className="!text-[12px]" />
                    </button>
                  )}
                </div>
              )}

              {/* Section 1: OPEN EDITORS */}
              {showOpenEditors && (
                <div>
                  <div className="group flex items-center justify-between pr-2 hover:bg-[#2A2D2E]">
                    <button
                      type="button"
                      onClick={() => setOpenEditorsExpanded((prev) => !prev)}
                      className="flex-1 flex items-center gap-1 px-1.5 py-1 font-bold text-[11px] uppercase tracking-wide cursor-pointer text-left"
                    >
                      <Codicon
                        name={openEditorsExpanded ? 'chevron-down' : 'chevron-right'}
                        className="!text-[14px]"
                      />
                      <span>OPEN EDITORS</span>
                    </button>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleCreateUntitledFile()}
                        title="New Untitled Text File (Ctrl+N)"
                        className="p-0.5 rounded hover:bg-[#3C3C3C] text-[#858585] hover:text-white cursor-pointer flex items-center"
                      >
                        <Codicon name="new-file" className="!text-[13px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerSync(false)}
                        title="Save All (Ctrl+K S)"
                        className="p-0.5 rounded hover:bg-[#3C3C3C] text-[#858585] hover:text-white cursor-pointer flex items-center"
                      >
                        <Codicon name="save-all" className="!text-[13px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenTabs([activeFile])}
                        title="Close Other Editors"
                        className="p-0.5 rounded hover:bg-[#3C3C3C] text-[#858585] hover:text-white cursor-pointer flex items-center"
                      >
                        <Codicon name="close-all" className="!text-[13px]" />
                      </button>
                    </div>
                  </div>

                  {openEditorsExpanded && (
                    <div className="py-0.5">
                      {openTabs.map((tabId) => {
                        const file = getTabMeta(tabId);
                        const active = activeFile === tabId;
                        return (
                          <div
                            key={tabId}
                            onClick={() => handleOpenFile(tabId)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setExplorerContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                fileId: tabId,
                                filePath: file.path,
                                isCustom: Boolean(customFiles[tabId]),
                              });
                            }}
                            className={`group flex items-center justify-between pl-2 pr-2 py-0.5 cursor-pointer text-[13px] ${
                              active
                                ? 'bg-[#04395E] text-white outline-1 -outline-offset-1 outline-[#0078D4]'
                                : 'hover:bg-[#2A2D2E] text-[#CCCCCC]'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 truncate min-w-0">
                              <button
                                type="button"
                                onClick={(e) => handleCloseTab(e, tabId)}
                                title="Close (Ctrl+W)"
                                className={`w-4 h-4 flex items-center justify-center rounded hover:bg-[#3C3C3C] shrink-0 ${
                                  openTabs.length > 1
                                    ? 'opacity-0 group-hover:opacity-100'
                                    : 'opacity-0 pointer-events-none'
                                } ${active ? 'opacity-100 text-white' : 'text-[#CCCCCC]'}`}
                              >
                                <Codicon name="close" className="!text-[12px]" />
                              </button>
                              <SetiFileIcon
                                fileId={file.id}
                                extension={file.extension}
                                className="w-4 h-4 shrink-0"
                              />
                              <span className="truncate">{file.name}</span>
                              <span className="text-[11px] text-[#858585] truncate ml-1">
                                {file.folder}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFile(tabId);
                                setEditorMode('split');
                              }}
                              title="Split Editor Right"
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#3C3C3C] text-[#CCCCCC] hover:text-white flex items-center shrink-0"
                            >
                              <Codicon name="split-horizontal" className="!text-[12px]" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Section 2: WORKSPACE ROOT FOLDER (MUSTAFA-DEV-PORTFOLIO) */}
              <div>
                <div className="group flex items-center justify-between pr-1.5 border-t border-[#2B2B2B] hover:bg-[#2A2D2E]">
                  <button
                    type="button"
                    onClick={() => setWorkspaceTreeExpanded((prev) => !prev)}
                    className="flex-1 flex items-center gap-1 px-1.5 py-1 font-bold text-[11px] uppercase tracking-wide cursor-pointer text-left min-w-0"
                  >
                    <Codicon
                      name={workspaceTreeExpanded ? 'chevron-down' : 'chevron-right'}
                      className="!text-[14px] shrink-0"
                    />
                    <span className="truncate">MUSTAFA-DEV-PORTFOLIO</span>
                  </button>

                  {/* Official 4 VS Code Explorer Header Action Icons */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWorkspaceTreeExpanded(true);
                        setSrcRootExpanded(true);
                        setSrcFolderExpanded(true);
                        setCreatingNewFile(true);
                        setCreatingNewFolder(false);
                      }}
                      title="New File..."
                      className="p-1 rounded hover:bg-[#3C3C3C] text-[#CCCCCC] hover:text-white cursor-pointer flex items-center"
                    >
                      <Codicon name="new-file" className="!text-[14px]" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWorkspaceTreeExpanded(true);
                        setSrcRootExpanded(true);
                        setCreatingNewFolder(true);
                        setCreatingNewFile(false);
                      }}
                      title="New Folder..."
                      className="p-1 rounded hover:bg-[#3C3C3C] text-[#CCCCCC] hover:text-white cursor-pointer flex items-center"
                    >
                      <Codicon name="new-folder" className="!text-[14px]" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerSync(false);
                      }}
                      title="Refresh Explorer"
                      className="p-1 rounded hover:bg-[#3C3C3C] text-[#CCCCCC] hover:text-white cursor-pointer flex items-center"
                    >
                      <Codicon name="refresh" className="!text-[14px]" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCollapseAllExplorer();
                      }}
                      title="Collapse Folders in Explorer"
                      className="p-1 rounded hover:bg-[#3C3C3C] text-[#CCCCCC] hover:text-white cursor-pointer flex items-center"
                    >
                      <Codicon name="collapse-all" className="!text-[14px]" />
                    </button>
                  </div>
                </div>

                {workspaceTreeExpanded && (
                  <div className="py-0.5">
                    {/* ROOT FOLDER 1: src */}
                    <button
                      type="button"
                      onClick={() => setSrcRootExpanded((prev) => !prev)}
                      className="w-full flex items-center gap-1.5 pl-3 pr-2 py-0.5 hover:bg-[#2A2D2E] text-left cursor-pointer text-[13px] text-[#CCCCCC]"
                    >
                      <Codicon
                        name={srcRootExpanded ? 'chevron-down' : 'chevron-right'}
                        className="!text-[14px] text-[#CCCCCC] shrink-0"
                      />
                      <Codicon
                        name={srcRootExpanded ? 'folder-opened' : 'folder'}
                        className="!text-[14px] text-[#DCB67A] shrink-0"
                      />
                      <span className="truncate font-medium">src</span>
                    </button>

                    {srcRootExpanded && (
                      <div className="ml-[19px] border-l border-[#2B2B2B]">
                        {/* Inline New Folder Creator inside src/ */}
                        {creatingNewFolder && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (newFolderNameInput.trim()) {
                                handleCreateCustomFolder(newFolderNameInput.trim());
                              }
                              setNewFolderNameInput('');
                              setCreatingNewFolder(false);
                            }}
                            className="flex items-center gap-1.5 pl-3 pr-2 py-0.5"
                          >
                            <Codicon
                              name="folder"
                              className="!text-[14px] text-[#DCB67A] shrink-0"
                            />
                            <input
                              type="text"
                              autoFocus
                              value={newFolderNameInput}
                              onChange={(e) => setNewFolderNameInput(e.target.value)}
                              onBlur={() => setCreatingNewFolder(false)}
                              placeholder="folder-name"
                              className="w-full px-1.5 py-0.5 bg-[#3C3C3C] border border-[#0078D4] text-xs text-white focus:outline-none"
                            />
                          </form>
                        )}

                        {/* SUBFOLDER 1A: src/pages (All Website Pages) */}
                        <button
                          type="button"
                          onClick={() => setSrcFolderExpanded((prev) => !prev)}
                          className="w-full flex items-center justify-between pl-2.5 pr-2 py-0.5 hover:bg-[#2A2D2E] text-left cursor-pointer text-[13px] text-[#CCCCCC]"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Codicon
                              name={srcFolderExpanded ? 'chevron-down' : 'chevron-right'}
                              className="!text-[14px] text-[#CCCCCC] shrink-0"
                            />
                            <Codicon
                              name={srcFolderExpanded ? 'folder-opened' : 'folder'}
                              className="!text-[14px] text-[#519ABA] shrink-0"
                            />
                            <span className="truncate">pages</span>
                          </span>
                          <span className="text-[10px] text-[#858585] font-mono">
                            {WORKSPACE_FILES.filter((f) => f.folder === 'src/pages').length +
                              Object.keys(customFiles).length}
                          </span>
                        </button>

                        {srcFolderExpanded && (
                          <div className="ml-[17px] border-l border-[#2B2B2B]">
                            {/* Inline New File Creator Row (Official VS Code Explorer Behavior) */}
                            {creatingNewFile && (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  if (newFileNameInput.trim()) {
                                    handleCreateUntitledFile(newFileNameInput.trim());
                                  }
                                  setNewFileNameInput('');
                                  setCreatingNewFile(false);
                                }}
                                className="flex items-center gap-1.5 pl-3 pr-2 py-0.5"
                              >
                                <SetiFileIcon extension="tsx" className="w-4 h-4 shrink-0" />
                                <input
                                  type="text"
                                  autoFocus
                                  value={newFileNameInput}
                                  onChange={(e) => setNewFileNameInput(e.target.value)}
                                  onBlur={() => setCreatingNewFile(false)}
                                  placeholder="new-page.tsx"
                                  className="w-full px-1.5 py-0.5 bg-[#3C3C3C] border border-[#0078D4] text-xs text-white focus:outline-none"
                                />
                              </form>
                            )}

                            {/* Website Pages inside src/pages/ */}
                            {WORKSPACE_FILES.filter((f) => f.folder === 'src/pages')
                              .filter((f) => {
                                const q = explorerFilterQuery.toLowerCase().trim();
                                if (!q) return true;
                                return (
                                  f.name.toLowerCase().includes(q) ||
                                  f.navLabel.toLowerCase().includes(q)
                                );
                              })
                              .map((file) => {
                                const active = activeFile === file.id;
                                return (
                                  <div
                                    key={file.id}
                                    onClick={() => handleOpenFile(file.id)}
                                    onDoubleClick={() => {
                                      handleOpenFile(file.id);
                                      setEditorMode('hybrid');
                                    }}
                                    onContextMenu={(e) => {
                                      e.preventDefault();
                                      setExplorerContextMenu({
                                        x: e.clientX,
                                        y: e.clientY,
                                        fileId: file.id,
                                        filePath: file.path,
                                      });
                                    }}
                                    title={`${file.path} — ${file.navLabel} Page (${file.description})`}
                                    className={`group w-full flex items-center justify-between pl-3 pr-2 py-0.5 text-left cursor-pointer text-[13px] ${
                                      active
                                        ? 'bg-[#04395E] text-white outline-1 -outline-offset-1 outline-[#0078D4]'
                                        : 'hover:bg-[#2A2D2E] text-[#CCCCCC]'
                                    }`}
                                  >
                                    <span className="flex items-center gap-1.5 truncate min-w-0">
                                      <SetiFileIcon
                                        fileId={file.id}
                                        extension={file.extension}
                                        className="w-4 h-4 shrink-0"
                                      />
                                      <span className="truncate">{file.name}</span>
                                      <span
                                        className={`text-[10px] truncate ml-1 ${
                                          active ? 'text-[#A6D2FF]' : 'text-[#6E6E6E]'
                                        }`}
                                      >
                                        {file.navLabel}
                                      </span>
                                    </span>
                                    <span className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenFile(file.id);
                                          setEditorMode('split');
                                        }}
                                        title="Open to the Side (Split Editor Right)"
                                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#3C3C3C] text-[#CCCCCC] hover:text-white flex items-center"
                                      >
                                        <Codicon
                                          name="split-horizontal"
                                          className="!text-[12px]"
                                        />
                                      </button>
                                      <span
                                        className="text-[11px] font-mono text-[#E2C08D]"
                                        title="Modified in working tree"
                                      >
                                        M
                                      </span>
                                    </span>
                                  </div>
                                );
                              })}

                            {/* Custom user-created files in src/pages */}
                            {Object.keys(customFiles)
                              .filter((cFile) => {
                                const q = explorerFilterQuery.toLowerCase().trim();
                                if (!q) return true;
                                return cFile.toLowerCase().includes(q);
                              })
                              .map((cFile) => {
                                const active = activeFile === cFile;
                                return (
                                  <div
                                    key={cFile}
                                    onClick={() => handleOpenFile(cFile)}
                                    onContextMenu={(e) => {
                                      e.preventDefault();
                                      setExplorerContextMenu({
                                        x: e.clientX,
                                        y: e.clientY,
                                        fileId: cFile,
                                        filePath: `src/pages/${cFile}`,
                                        isCustom: true,
                                      });
                                    }}
                                    className={`group w-full flex items-center justify-between pl-3 pr-2 py-0.5 text-left cursor-pointer text-[13px] ${
                                      active
                                        ? 'bg-[#04395E] text-white outline-1 -outline-offset-1 outline-[#0078D4]'
                                        : 'hover:bg-[#2A2D2E] text-[#CCCCCC]'
                                    }`}
                                  >
                                    <span className="flex items-center gap-1.5 truncate min-w-0">
                                      <SetiFileIcon extension="tsx" className="w-4 h-4 shrink-0" />
                                      <span className="truncate">{cFile}</span>
                                    </span>
                                    <span
                                      className="text-[11px] font-mono text-[#73C991]"
                                      title="Untracked new file"
                                    >
                                      U
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        )}

                        {/* SUBFOLDER 1B: src/projects (Individual Case Study Pages) */}
                        <button
                          type="button"
                          onClick={() => setProjectsFolderExpanded((prev) => !prev)}
                          className="w-full flex items-center justify-between pl-2.5 pr-2 py-0.5 hover:bg-[#2A2D2E] text-left cursor-pointer text-[13px] text-[#CCCCCC]"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Codicon
                              name={projectsFolderExpanded ? 'chevron-down' : 'chevron-right'}
                              className="!text-[14px] text-[#CCCCCC] shrink-0"
                            />
                            <Codicon
                              name={projectsFolderExpanded ? 'folder-opened' : 'folder'}
                              className="!text-[14px] text-[#C09553] shrink-0"
                            />
                            <span className="truncate">projects</span>
                          </span>
                          <span className="text-[10px] text-[#858585] font-mono">
                            {projects.length}
                          </span>
                        </button>

                        {projectsFolderExpanded && (
                          <div className="ml-[17px] border-l border-[#2B2B2B]">
                            {projects
                              .filter((proj) => {
                                const q = explorerFilterQuery.toLowerCase().trim();
                                if (!q) return true;
                                return (
                                  proj.title.toLowerCase().includes(q) ||
                                  proj.category.toLowerCase().includes(q)
                                );
                              })
                              .map((proj, idx) => {
                                const projFileName = `${proj.title.replace(/\s+/g, '')}.tsx`;
                                const isProjActive =
                                  activeFile === 'projects.tsx' &&
                                  selectedProject?.id === proj.id;
                                return (
                                  <div
                                    key={proj.id}
                                    onClick={() => {
                                      handleOpenFile('projects.tsx');
                                      setCursorPos({ line: 10 + idx * 12, col: 1 });
                                      setSelectedProject(proj);
                                    }}
                                    title={`Open ${proj.title} (${proj.category}) Case Study`}
                                    className={`group w-full flex items-center justify-between pl-3 pr-2 py-0.5 text-left cursor-pointer text-[13px] ${
                                      isProjActive
                                        ? 'bg-[#04395E] text-white outline-1 -outline-offset-1 outline-[#0078D4]'
                                        : 'hover:bg-[#2A2D2E] text-[#CCCCCC]'
                                    }`}
                                  >
                                    <span className="flex items-center gap-1.5 truncate min-w-0">
                                      <SetiFileIcon extension="tsx" className="w-4 h-4 shrink-0" />
                                      <span className="truncate">{projFileName}</span>
                                    </span>
                                    <span className="text-[10px] text-[#858585] font-mono shrink-0">
                                      ★{proj.stars}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        )}

                        {/* SUBFOLDER 1C: src/components (Interactive Section Components) */}
                        <button
                          type="button"
                          onClick={() => setComponentsFolderExpanded((prev) => !prev)}
                          className="w-full flex items-center justify-between pl-2.5 pr-2 py-0.5 hover:bg-[#2A2D2E] text-left cursor-pointer text-[13px] text-[#CCCCCC]"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Codicon
                              name={componentsFolderExpanded ? 'chevron-down' : 'chevron-right'}
                              className="!text-[14px] text-[#CCCCCC] shrink-0"
                            />
                            <Codicon
                              name={componentsFolderExpanded ? 'folder-opened' : 'folder'}
                              className="!text-[14px] text-[#89D185] shrink-0"
                            />
                            <span className="truncate">components</span>
                          </span>
                          <span className="text-[10px] text-[#858585] font-mono">4</span>
                        </button>

                        {componentsFolderExpanded && (
                          <div className="ml-[17px] border-l border-[#2B2B2B]">
                            {[
                              {
                                name: 'HeroProfileCard.tsx',
                                targetFile: 'overview.tsx',
                                line: 12,
                              },
                              {
                                name: 'SkillsMarketplace.tsx',
                                targetFile: 'skills.json',
                                line: 5,
                              },
                              {
                                name: 'AcademicTimeline.tsx',
                                targetFile: 'education.md',
                                line: 3,
                              },
                              {
                                name: 'GuestbookCloud.tsx',
                                targetFile: 'contact.tsx',
                                line: 30,
                              },
                            ]
                              .filter((comp) => {
                                const q = explorerFilterQuery.toLowerCase().trim();
                                if (!q) return true;
                                return comp.name.toLowerCase().includes(q);
                              })
                              .map((comp) => (
                                <button
                                  key={comp.name}
                                  type="button"
                                  onClick={() => {
                                    handleOpenFile(comp.targetFile);
                                    setCursorPos({ line: comp.line, col: 1 });
                                  }}
                                  className="w-full flex items-center justify-between pl-3 pr-2 py-0.5 hover:bg-[#2A2D2E] text-left cursor-pointer text-[13px] text-[#CCCCCC]"
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <SetiFileIcon extension="tsx" className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{comp.name}</span>
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}

                        {/* User-created custom folders inside src/ */}
                        {customFolders.map((folderName) => (
                          <div
                            key={folderName}
                            className="w-full flex items-center gap-1.5 pl-2.5 pr-2 py-0.5 hover:bg-[#2A2D2E] text-left text-[13px] text-[#CCCCCC]"
                          >
                            <Codicon
                              name="chevron-right"
                              className="!text-[14px] text-[#CCCCCC] shrink-0"
                            />
                            <Codicon
                              name="folder"
                              className="!text-[14px] text-[#DCB67A] shrink-0"
                            />
                            <span className="truncate">{folderName}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ROOT FOLDER 2: public (Static Assets & Resume) */}
                    <button
                      type="button"
                      onClick={() => setPublicFolderExpanded((prev) => !prev)}
                      className="w-full flex items-center gap-1.5 pl-3 pr-2 py-0.5 hover:bg-[#2A2D2E] text-left cursor-pointer text-[13px] text-[#CCCCCC]"
                    >
                      <Codicon
                        name={publicFolderExpanded ? 'chevron-down' : 'chevron-right'}
                        className="!text-[14px] text-[#CCCCCC] shrink-0"
                      />
                      <Codicon
                        name={publicFolderExpanded ? 'folder-opened' : 'folder'}
                        className="!text-[14px] text-[#75BEFF] shrink-0"
                      />
                      <span className="truncate font-medium">public</span>
                    </button>

                    {publicFolderExpanded && (
                      <div className="ml-[19px] border-l border-[#2B2B2B]">
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenFile('overview.tsx');
                            setCursorPos({ line: 12, col: 1 });
                          }}
                          className="w-full flex items-center justify-between pl-3 pr-2 py-0.5 hover:bg-[#2A2D2E] text-left cursor-pointer text-[13px] text-[#CCCCCC]"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Codicon
                              name="file-media"
                              className="!text-[14px] text-[#B180D7] shrink-0"
                            />
                            <span className="truncate">profile.webp</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenFile('education.md');
                            setCursorPos({ line: 3, col: 1 });
                          }}
                          className="w-full flex items-center justify-between pl-3 pr-2 py-0.5 hover:bg-[#2A2D2E] text-left cursor-pointer text-[13px] text-[#CCCCCC]"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Codicon
                              name="file-pdf"
                              className="!text-[14px] text-[#F14C4C] shrink-0"
                            />
                            <span className="truncate">Mustafa_Hossain_Resume.pdf</span>
                          </span>
                        </button>
                      </div>
                    )}

                    {/* ROOT FOLDER 3: config (Workspace Configuration & Settings) */}
                    <button
                      type="button"
                      onClick={() => setConfigFolderExpanded((prev) => !prev)}
                      className="w-full flex items-center gap-1.5 pl-3 pr-2 py-0.5 hover:bg-[#2A2D2E] text-left cursor-pointer text-[13px] text-[#CCCCCC]"
                    >
                      <Codicon
                        name={configFolderExpanded ? 'chevron-down' : 'chevron-right'}
                        className="!text-[14px] text-[#CCCCCC] shrink-0"
                      />
                      <Codicon
                        name={configFolderExpanded ? 'folder-opened' : 'folder'}
                        className="!text-[14px] text-[#B180D7] shrink-0"
                      />
                      <span className="truncate font-medium">config</span>
                    </button>

                    {configFolderExpanded && (
                      <div className="ml-[19px] border-l border-[#2B2B2B]">
                        {WORKSPACE_FILES.filter((f) => f.folder === 'config')
                          .filter((f) => {
                            const q = explorerFilterQuery.toLowerCase().trim();
                            if (!q) return true;
                            return f.name.toLowerCase().includes(q);
                          })
                          .map((file) => {
                            const active = activeFile === file.id;
                            const unreadCount =
                              file.id === 'messages-inbox.json'
                                ? messages.filter((m) => !m.read).length
                                : 0;
                            return (
                              <div
                                key={file.id}
                                onClick={() => handleOpenFile(file.id)}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  setExplorerContextMenu({
                                    x: e.clientX,
                                    y: e.clientY,
                                    fileId: file.id,
                                    filePath: file.path,
                                  });
                                }}
                                className={`group w-full flex items-center justify-between pl-3 pr-2 py-0.5 text-left cursor-pointer text-[13px] ${
                                  active
                                    ? 'bg-[#04395E] text-white outline-1 -outline-offset-1 outline-[#0078D4]'
                                    : 'hover:bg-[#2A2D2E] text-[#CCCCCC]'
                                }`}
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <SetiFileIcon
                                    fileId={file.id}
                                    extension={file.extension}
                                    className="w-4 h-4 shrink-0"
                                  />
                                  <span className="truncate">{file.name}</span>
                                </span>
                                <span className="flex items-center gap-1 shrink-0">
                                  {unreadCount > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-[#0078D4] text-white text-[10px] font-mono">
                                      {unreadCount}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenFile(file.id);
                                      setEditorMode('split');
                                    }}
                                    title="Open to the Side (Split Editor Right)"
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#3C3C3C] text-[#CCCCCC] hover:text-white flex items-center"
                                  >
                                    <Codicon name="split-horizontal" className="!text-[12px]" />
                                  </button>
                                </span>
                              </div>
                            );
                          })}

                        {/* Official VS Code settings.json inside config/ */}
                        <div
                          onClick={() => handleOpenFile('settings')}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setExplorerContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              fileId: 'settings',
                              filePath: 'config/settings.json',
                            });
                          }}
                          className={`group w-full flex items-center justify-between pl-3 pr-2 py-0.5 text-left cursor-pointer text-[13px] ${
                            activeFile === 'settings'
                              ? 'bg-[#04395E] text-white outline-1 -outline-offset-1 outline-[#0078D4]'
                              : 'hover:bg-[#2A2D2E] text-[#CCCCCC]'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <SetiFileIcon extension="json" className="w-4 h-4 shrink-0" />
                            <span className="truncate">settings.json</span>
                          </span>
                          <span className="text-[10px] text-[#858585]">Settings</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 3: OUTLINE with Interactive Symbol Jumping */}
              {showOutline && (
                <div>
                  <button
                    type="button"
                    onClick={() => setOutlineExpanded((prev) => !prev)}
                    className="w-full flex items-center gap-1 px-1.5 py-1 font-bold text-[11px] uppercase tracking-wide border-t border-[#2B2B2B] hover:bg-[#2A2D2E] cursor-pointer"
                  >
                    <Codicon
                      name={outlineExpanded ? 'chevron-down' : 'chevron-right'}
                      className="!text-[14px]"
                    />
                    <span>OUTLINE</span>
                  </button>

                  {outlineExpanded && (
                    <div className="py-1 pl-3 pr-2 space-y-0.5 text-[12px] text-[#CCCCCC]">
                      {(
                        currentFileMeta.symbols || [
                          { name: currentFileMeta.name, kind: 'method' as const, line: 1 },
                        ]
                      ).map((sym) => (
                        <button
                          key={sym.name}
                          type="button"
                          onClick={() => setCursorPos({ line: sym.line, col: 1 })}
                          className="w-full flex items-center justify-between px-2 py-0.5 rounded hover:bg-[#2A2D2E] text-left cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Codicon
                              name={`symbol-${sym.kind}`}
                              className={`!text-[14px] ${
                                sym.kind === 'method'
                                  ? 'text-[#B180D7]'
                                  : sym.kind === 'constant'
                                  ? 'text-[#4FC1FF]'
                                  : 'text-[#75BEFF]'
                              }`}
                            />
                            <span className="truncate">{sym.name}</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#858585]">:{sym.line}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Section 4: TIMELINE */}
              {showTimeline && (
                <div>
                  <button
                    type="button"
                    onClick={() => setTimelineExpanded((prev) => !prev)}
                    className="w-full flex items-center gap-1 px-1.5 py-1 font-bold text-[11px] uppercase tracking-wide border-t border-[#2B2B2B] hover:bg-[#2A2D2E] cursor-pointer"
                  >
                    <Codicon
                      name={timelineExpanded ? 'chevron-down' : 'chevron-right'}
                      className="!text-[14px]"
                    />
                    <span>TIMELINE</span>
                  </button>
                  {timelineExpanded && (
                    <div className="py-1 pl-4 pr-2 space-y-1 text-[11px] text-[#CCCCCC]">
                      {commitHistory.map((c) => (
                        <button
                          key={c.hash}
                          type="button"
                          onClick={() => {
                            setTerminalOpen(true);
                            setActivePanelTab('output');
                          }}
                          className="w-full flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-[#2A2D2E] text-left cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Codicon name="git-commit" className="!text-[13px] text-[#0078D4]" />
                            <span className="truncate">{c.message}</span>
                          </span>
                          <span className="text-[10px] text-[#858585] shrink-0 ml-1">{c.time}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Official VS Code Explorer Right-Click Context Menu */}
              {explorerContextMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setExplorerContextMenu(null)}
                  />
                  <div
                    style={{
                      top: Math.min(explorerContextMenu.y, window.innerHeight - 190),
                      left: Math.min(explorerContextMenu.x, window.innerWidth - 220),
                    }}
                    className="fixed w-56 rounded-md border border-[#454545] bg-[#252526] text-[#CCCCCC] shadow-[0_8px_24px_rgba(0,0,0,0.65)] py-1 z-50 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenFile(explorerContextMenu.fileId);
                        setExplorerContextMenu(null);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                    >
                      <span>Open Page / Editor</span>
                      <span className="font-mono text-[10px] text-[#858585]">Enter</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenFile(explorerContextMenu.fileId);
                        setEditorMode('split');
                        setExplorerContextMenu(null);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                    >
                      <span>Open to the Side</span>
                      <span className="font-mono text-[10px] text-[#858585]">Ctrl+Enter</span>
                    </button>
                    <div className="my-1 border-t border-[#3C3C3C]" />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `/workspace/mustafa-dev-portfolio/${explorerContextMenu.filePath}`
                        );
                        appendSyncLog(
                          `[Clipboard] Copied path: /workspace/mustafa-dev-portfolio/${explorerContextMenu.filePath}`
                        );
                        setExplorerContextMenu(null);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                    >
                      <span>Copy Path</span>
                      <span className="font-mono text-[10px] text-[#858585]">Shift+Alt+C</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(explorerContextMenu.filePath);
                        appendSyncLog(
                          `[Clipboard] Copied relative path: ${explorerContextMenu.filePath}`
                        );
                        setExplorerContextMenu(null);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                    >
                      <span>Copy Relative Path</span>
                    </button>
                    {explorerContextMenu.isCustom && (
                      <>
                        <div className="my-1 border-t border-[#3C3C3C]" />
                        <button
                          type="button"
                          onClick={() => {
                            const target = explorerContextMenu.fileId;
                            setCustomFiles((prev) => {
                              const copy = { ...prev };
                              delete copy[target];
                              persistWorkspaceToCloud(copy, undefined, undefined);
                              return copy;
                            });
                            handleCloseTab(null, target);
                            setExplorerContextMenu(null);
                          }}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#E81123] hover:text-white text-[#F48771] text-left cursor-pointer"
                        >
                          <span>Delete Permanently</span>
                          <span className="font-mono text-[10px]">Del</span>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* VIEW 2: GLOBAL WORKSPACE SEARCH & REPLACE */}
          {activityView === 'search' && (
            <div className="flex-1 flex flex-col p-2.5 space-y-2.5 overflow-y-auto text-xs">
              <div className="flex items-start gap-1">
                <button
                  type="button"
                  onClick={() => setSearchReplaceExpanded((prev) => !prev)}
                  title="Toggle Replace"
                  className="p-1 mt-0.5 rounded hover:bg-[#2A2D2E] text-[#CCCCCC] cursor-pointer"
                >
                  <Codicon
                    name={searchReplaceExpanded ? 'chevron-down' : 'chevron-right'}
                    className="!text-[13px]"
                  />
                </button>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center bg-[#3C3C3C] border border-[#0078D4] rounded-xs px-1.5 py-1">
                    <input
                      type="text"
                      value={globalSearchQuery}
                      onChange={(e) => setGlobalSearchQuery(e.target.value)}
                      placeholder="Search"
                      className="flex-1 bg-transparent text-xs text-white placeholder-[#A0A0A0] focus:outline-none"
                    />
                    <div className="flex items-center gap-0.5 shrink-0 font-mono text-[11px]">
                      <button
                        type="button"
                        onClick={() => setMatchCase((p) => !p)}
                        title="Match Case (Alt+C)"
                        className={`px-1 rounded cursor-pointer ${
                          matchCase
                            ? 'bg-[#0078D4] text-white'
                            : 'text-[#CCCCCC] hover:bg-[#4E4E4E]'
                        }`}
                      >
                        Aa
                      </button>
                      <button
                        type="button"
                        onClick={() => setMatchWholeWord((p) => !p)}
                        title="Match Whole Word (Alt+W)"
                        className={`px-1 rounded cursor-pointer ${
                          matchWholeWord
                            ? 'bg-[#0078D4] text-white'
                            : 'text-[#CCCCCC] hover:bg-[#4E4E4E]'
                        }`}
                      >
                        ab
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseRegex((p) => !p)}
                        title="Use Regular Expression (Alt+R)"
                        className={`px-1 rounded cursor-pointer ${
                          useRegex
                            ? 'bg-[#0078D4] text-white'
                            : 'text-[#CCCCCC] hover:bg-[#4E4E4E]'
                        }`}
                      >
                        .*
                      </button>
                    </div>
                  </div>

                  {searchReplaceExpanded && (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={globalReplaceQuery}
                        onChange={(e) => setGlobalReplaceQuery(e.target.value)}
                        placeholder="Replace"
                        className="flex-1 px-1.5 py-1 rounded-xs bg-[#3C3C3C] border border-[#3C3C3C] focus:border-[#0078D4] text-xs text-white placeholder-[#A0A0A0] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          appendSyncLog(
                            `[Search] Replaced occurrences of "${globalSearchQuery}" with "${globalReplaceQuery}"`
                          );
                          setGlobalReplaceQuery('');
                        }}
                        title="Replace All (Ctrl+Alt+Enter)"
                        className="p-1 rounded bg-[#2B2B2B] hover:bg-[#3C3C3C] text-[#CCCCCC] cursor-pointer"
                      >
                        <Codicon name="replace-all" className="!text-[13px]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {globalSearchQuery.trim() === '' ? (
                <div className="text-[#858585] leading-relaxed px-1">
                  Search across all files (try <strong className="text-[#CCCCCC]">React</strong>,{' '}
                  <strong className="text-[#CCCCCC]">StreamPulse</strong>, or{' '}
                  <strong className="text-[#CCCCCC]">Brainware</strong>).
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-[#858585] px-1">
                  No results found for &quot;{globalSearchQuery}&quot;.
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-[#858585] px-1">
                    {searchResults.length} results in {searchResults.length} files
                  </div>
                  {searchResults.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleOpenFile(res.fileId)}
                      className="w-full text-left p-2 rounded hover:bg-[#2A2D2E] space-y-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[12px] font-medium text-white">
                        <span className="truncate">{res.fileName}</span>
                        <span className="text-[10px] font-mono text-[#858585]">:{res.line}</span>
                      </div>
                      <div className="text-[11px] font-mono text-[#CCCCCC] line-clamp-2 pl-2 border-l border-[#0078D4]">
                        {res.snippet}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: SOURCE CONTROL (GIT STAGING, COMMITTING & CLOUD SYNC) */}
          {activityView === 'scm' && (
            <div className="flex-1 flex flex-col p-2.5 space-y-3 overflow-y-auto text-xs">
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={scmMessage}
                  onChange={(e) => setScmMessage(e.target.value)}
                  placeholder={`Message (Ctrl+Enter to commit on "${gitBranch}")`}
                  className="w-full px-2 py-1.5 rounded-xs bg-[#3C3C3C] border border-[#3C3C3C] focus:border-[#0078D4] text-xs text-white placeholder-[#A0A0A0] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const msg =
                      scmMessage.trim() || `chore: sync workspace revision #${syncStats.syncCount + 1}`;
                    setCommitHistory((prev) => [
                      {
                        hash: Math.random().toString(16).slice(2, 9),
                        message: msg,
                        time: 'Just now',
                      },
                      ...prev,
                    ]);
                    handleTriggerSync(false);
                    setScmMessage('');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xs bg-[#0078D4] hover:bg-[#1084DF] text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  <Codicon name="check" className="!text-[13px]" />
                  <span>Commit &amp; Sync (#{syncStats.syncCount})</span>
                </button>
              </div>

              {/* Staged Changes */}
              {stagedFiles.length > 0 && (
                <div className="space-y-1 border-t border-[#2B2B2B] pt-2">
                  <div className="text-[11px] font-bold uppercase text-[#BBBBBB] px-1">
                    STAGED CHANGES ({stagedFiles.length})
                  </div>
                  {stagedFiles.map((fId) => (
                    <div
                      key={fId}
                      onClick={() => handleOpenFile(fId)}
                      className="group flex items-center justify-between px-2 py-1 rounded hover:bg-[#2A2D2E] cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <SetiFileIcon fileId={fId} extension="tsx" className="w-4 h-4 shrink-0" />
                        <span className="truncate">{fId}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStagedFiles((prev) => prev.filter((item) => item !== fId));
                          }}
                          title="Unstage Changes"
                          className="opacity-0 group-hover:opacity-100 hover:text-white"
                        >
                          <Codicon name="remove" className="!text-[12px]" />
                        </button>
                        <span className="font-mono text-[11px] text-[#73C991]">A</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Working Tree Changes */}
              <div className="space-y-1 border-t border-[#2B2B2B] pt-2">
                <div className="text-[11px] font-bold uppercase text-[#BBBBBB] px-1">
                  CHANGES (3 PRODUCTION APPS)
                </div>
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProject(proj)}
                    className="group w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#2A2D2E] text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <SetiFileIcon extension="tsx" className="w-4 h-4 shrink-0" />
                      <span className="truncate">{proj.title}.tsx</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const fname = `${proj.title}.tsx`;
                          if (!stagedFiles.includes(fname)) {
                            setStagedFiles((prev) => [...prev, fname]);
                          }
                        }}
                        title="Stage Changes"
                        className="opacity-0 group-hover:opacity-100 hover:text-white"
                      >
                        <Codicon name="add" className="!text-[12px]" />
                      </button>
                      <span className="text-[#DCDCAA]">★{proj.stars}</span>
                      <span className="text-[#E2C08D]">M</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 4: RUN AND DEBUG (VARIABLES, WATCH, CALL STACK & BREAKPOINTS) */}
          {activityView === 'debug' && (
            <div className="flex-1 flex flex-col p-2.5 space-y-3 overflow-y-auto text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsDebugging(true);
                    setTerminalOpen(true);
                    setActivePanelTab('debug');
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#0078D4] hover:bg-[#1084DF] text-white font-medium text-xs w-full cursor-pointer"
                >
                  <Codicon name="debug-start" className="!text-[14px] text-[#89D185]" />
                  <span>{isDebugging ? 'Debugging Active (F5)' : 'Launch Portfolio (Chrome)'}</span>
                </button>
              </div>

              <div className="space-y-1 border-t border-[#2B2B2B] pt-2 font-mono text-[11px]">
                <div className="font-sans font-bold uppercase text-[#BBBBBB] pb-1">VARIABLES</div>
                <div>
                  <span className="text-[#9CDCFE]">developer</span>:{' '}
                  <span className="text-[#CE9178]">&quot;{DEVELOPER_PROFILE.name}&quot;</span>
                </div>
                <div>
                  <span className="text-[#9CDCFE]">bcaCgpa</span>:{' '}
                  <span className="text-[#B5CEA8]">9.09</span>
                </div>
                <div>
                  <span className="text-[#9CDCFE]">activeEditor</span>:{' '}
                  <span className="text-[#CE9178]">&quot;{activeFile}&quot;</span>
                </div>
                <div>
                  <span className="text-[#9CDCFE]">cloudRevisions</span>:{' '}
                  <span className="text-[#B5CEA8]">{syncStats.syncCount}</span>
                </div>
              </div>

              {/* WATCH EXPRESSIONS */}
              <div className="space-y-1 border-t border-[#2B2B2B] pt-2 font-mono text-[11px]">
                <div className="flex items-center justify-between font-sans font-bold uppercase text-[#BBBBBB] pb-1">
                  <span>WATCH</span>
                  <button
                    type="button"
                    onClick={() => setAddingWatch(true)}
                    title="Add Expression"
                    className="hover:text-white cursor-pointer"
                  >
                    <Codicon name="add" className="!text-[13px]" />
                  </button>
                </div>
                {watchExpressions.map((w, idx) => (
                  <div key={idx} className="truncate">
                    <span className="text-[#9CDCFE]">{w.expr}</span>:{' '}
                    <span className="text-[#4EC9B0]">{w.value}</span>
                  </div>
                ))}
                {addingWatch && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newWatchExpr.trim()) {
                        setWatchExpressions((prev) => [
                          ...prev,
                          { expr: newWatchExpr.trim(), value: '"Evaluated: OK"' },
                        ]);
                      }
                      setNewWatchExpr('');
                      setAddingWatch(false);
                    }}
                  >
                    <input
                      type="text"
                      autoFocus
                      value={newWatchExpr}
                      onChange={(e) => setNewWatchExpr(e.target.value)}
                      onBlur={() => setAddingWatch(false)}
                      placeholder="Expression to watch..."
                      className="w-full px-1.5 py-0.5 bg-[#3C3C3C] border border-[#0078D4] text-white text-[11px] focus:outline-none"
                    />
                  </form>
                )}
              </div>

              <div className="space-y-1 border-t border-[#2B2B2B] pt-2 font-mono text-[11px]">
                <div className="font-sans font-bold uppercase text-[#BBBBBB] pb-1">CALL STACK</div>
                <div className="flex items-center gap-1.5 text-[#CCCCCC]">
                  <Codicon name="debug-stackframe" className="!text-[13px] text-[#DCDCAA]" />
                  <span className="truncate">
                    {currentFileMeta.name}:{cursorPos.line}:{cursorPos.col}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: EXTENSIONS (OFFICIAL DEVICON MULTI-COLOR SVGS + MARKETPLACE SEARCH) */}
          {activityView === 'extensions' && (
            <div className="flex-1 flex flex-col overflow-hidden p-2 space-y-2 text-xs">
              <div className="flex items-center bg-[#3C3C3C] border border-[#0078D4] rounded-xs px-2 py-1">
                <input
                  type="text"
                  value={extensionSearchQuery}
                  onChange={(e) => setExtensionSearchQuery(e.target.value)}
                  placeholder="Search Extensions in Marketplace"
                  className="flex-1 bg-transparent text-xs text-white placeholder-[#A0A0A0] focus:outline-none"
                />
                <Codicon name="filter" className="!text-[13px] text-[#CCCCCC]" />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                <div className="px-1 py-1 text-[11px] font-bold uppercase text-[#BBBBBB]">
                  INSTALLED ({filteredExtensions.length})
                </div>
                {filteredExtensions.map((skill) => {
                  const isActiveExt = activeFile === `extension:${skill.id}`;
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => handleOpenFile(`extension:${skill.id}`)}
                      className={`w-full text-left p-2 rounded flex items-start gap-2.5 cursor-pointer ${
                        isActiveExt ? 'bg-[#04395E] text-white' : 'hover:bg-[#2A2D2E]'
                      }`}
                    >
                      <div className="p-1.5 rounded bg-[#252526] border border-[#2B2B2B] shrink-0 mt-0.5 flex items-center justify-center">
                        <OfficialSkillIcon skillId={skill.id} className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-white truncate">{skill.name}</span>
                          <span className="text-[10px] font-mono text-[#858585]">
                            {skill.version}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#858585] truncate">{skill.desc}</div>
                        <div className="flex items-center justify-between gap-1 text-[10px] text-[#4FC1FF] mt-0.5">
                          <span className="inline-flex items-center gap-1 truncate">
                            <Codicon
                              name="verified-filled"
                              className="!text-[11px] text-[#0078D4]"
                            />
                            <span className="truncate">{DEVELOPER_PROFILE.name}</span>
                          </span>
                          <Codicon name="settings-gear" className="!text-[12px] text-[#858585]" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* 3. EDITOR GROUP (Connected Tab Strip + Interactive Breadcrumbs + Find Widget + Editor Canvas + Minimap + Bottom Panel) */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Official VS Code Editor Group Header & Connected Tabs */}
          <div
            className={`h-[35px] flex items-center justify-between border-b ${borderCol} ${chromeBg} shrink-0`}
          >
            {/* Connected File Tabs with Official Seti File Icons */}
            <div className="flex items-center h-full overflow-x-auto">
              {openTabs.map((tabId) => {
                const tabFile = getTabMeta(tabId);
                const active = activeFile === tabId;
                return (
                  <div
                    key={tabId}
                    onClick={() => handleOpenFile(tabId)}
                    role="tab"
                    aria-selected={active}
                    className={`group h-full inline-flex items-center gap-2 px-3 border-r ${borderCol} text-[13px] cursor-pointer transition-none whitespace-nowrap shrink-0 relative ${
                      active
                        ? isDark
                          ? 'bg-[#1F1F1F] text-white'
                          : 'bg-white text-[#1F1F1F]'
                        : isDark
                        ? 'bg-[#181818] text-[#868686] hover:bg-[#1F1F1F]/60 hover:text-[#CCCCCC]'
                        : 'bg-[#F8F8F8] text-[#616161] hover:bg-white'
                    }`}
                  >
                    {/* VS Code Blue Active Tab Top Indicator */}
                    {active && (
                      <span className="absolute top-0 left-0 right-0 h-[1px] bg-[#0078D4]" />
                    )}
                    <SetiFileIcon
                      fileId={tabFile.id}
                      extension={tabFile.extension}
                      className="w-4 h-4 shrink-0"
                    />
                    <span>{tabFile.name}</span>
                    {openTabs.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleCloseTab(e, tabId)}
                        aria-label={`Close ${tabFile.name}`}
                        className={`ml-1 p-0.5 rounded hover:bg-[#2A2D2E] flex items-center justify-center ${
                          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Codicon name="close" className="!text-[13px]" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Official VS Code Editor Actions Toolbar on the Right of Tab Bar */}
            <div className="flex items-center gap-1 px-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditorMode('hybrid')}
                title="Open Hybrid Preview (Code Gutter + Interactive Cards)"
                className={`p-1 rounded flex items-center justify-center cursor-pointer ${
                  editorMode === 'hybrid'
                    ? 'bg-[#2A2D2E] text-white'
                    : 'text-[#868686] hover:bg-[#2A2D2E] hover:text-white'
                }`}
              >
                <Codicon name="open-preview" className="!text-[15px]" />
              </button>

              <button
                type="button"
                onClick={() => setEditorMode('code')}
                title="View Raw Source Code"
                className={`p-1 rounded flex items-center justify-center cursor-pointer ${
                  editorMode === 'code'
                    ? 'bg-[#2A2D2E] text-white'
                    : 'text-[#868686] hover:bg-[#2A2D2E] hover:text-white'
                }`}
              >
                <Codicon name="code" className="!text-[15px]" />
              </button>

              <button
                type="button"
                onClick={() => setEditorMode((prev) => (prev === 'split' ? 'hybrid' : 'split'))}
                title="Split Editor Right (Ctrl+\)"
                className={`p-1 rounded flex items-center justify-center cursor-pointer ${
                  editorMode === 'split'
                    ? 'bg-[#2A2D2E] text-white'
                    : 'text-[#868686] hover:bg-[#2A2D2E] hover:text-white'
                }`}
              >
                <Codicon name="split-horizontal" className="!text-[15px]" />
              </button>

              <button
                type="button"
                onClick={() => openQuickPick('> ')}
                title="More Actions..."
                className="p-1 rounded text-[#868686] hover:bg-[#2A2D2E] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <Codicon name="ellipsis" className="!text-[15px]" />
              </button>
            </div>
          </div>

          {/* Official VS Code 22px Interactive Breadcrumbs Bar (Toggleable via Settings/View menu) */}
          {settings.breadcrumbsEnabled && (
            <div
              className={`h-[22px] px-2 sm:px-4 flex items-center justify-between border-b ${borderCol} ${editorBg} text-[11px] sm:text-[12px] font-sans text-[#868686] shrink-0 relative z-20`}
            >
              <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap min-w-0">
                <button
                  type="button"
                  onClick={() =>
                    setBreadcrumbDropdown((prev) => (prev === 'files' ? null : 'files'))
                  }
                  className="hidden sm:inline hover:bg-[#2A2D2E] hover:text-[#CCCCCC] px-1 rounded cursor-pointer shrink-0"
                >
                  mustafa-dev-portfolio
                </button>
                <Codicon
                  name="chevron-right"
                  className="hidden sm:inline !text-[13px] text-[#868686] shrink-0"
                />
                <button
                  type="button"
                  onClick={() =>
                    setBreadcrumbDropdown((prev) => (prev === 'files' ? null : 'files'))
                  }
                  className="hover:bg-[#2A2D2E] hover:text-[#CCCCCC] px-1 rounded cursor-pointer shrink-0"
                >
                  {currentFileMeta.folder.replace('/', ' › ')}
                </button>
                <Codicon name="chevron-right" className="!text-[13px] text-[#868686] shrink-0" />
                <button
                  type="button"
                  onClick={() =>
                    setBreadcrumbDropdown((prev) => (prev === 'files' ? null : 'files'))
                  }
                  className="inline-flex items-center gap-1.5 text-[#CCCCCC] hover:bg-[#2A2D2E] px-1.5 rounded cursor-pointer shrink-0"
                >
                  <SetiFileIcon
                    fileId={currentFileMeta.id}
                    extension={currentFileMeta.extension}
                    className="w-3.5 h-3.5 shrink-0"
                  />
                  <span>{currentFileMeta.name}</span>
                </button>
                <Codicon name="chevron-right" className="!text-[13px] text-[#868686] shrink-0" />
                <button
                  type="button"
                  onClick={() =>
                    setBreadcrumbDropdown((prev) => (prev === 'symbols' ? null : 'symbols'))
                  }
                  className="inline-flex items-center gap-1 text-[#CCCCCC] hover:bg-[#2A2D2E] px-1.5 rounded cursor-pointer shrink-0"
                >
                  <Codicon name="symbol-method" className="!text-[13px] text-[#B180D7]" />
                  <span>
                    {currentFileMeta.symbols?.[0]?.name || `${currentFileMeta.navLabel}Module`}
                  </span>
                </button>
              </div>

              {/* Breadcrumb Sibling File Picker Dropdown */}
              {breadcrumbDropdown === 'files' && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setBreadcrumbDropdown(null)}
                  />
                  <div className="absolute left-2 sm:left-24 top-[22px] w-64 max-w-[calc(100vw-3.5rem)] rounded-md border border-[#454545] bg-[#252526] text-[#CCCCCC] shadow-xl py-1 z-40 text-xs">
                    {WORKSPACE_FILES.map((wf) => (
                      <button
                        key={wf.id}
                        type="button"
                        onClick={() => handleOpenFile(wf.id)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer ${
                          wf.id === activeFile ? 'bg-[#04395E] text-white' : ''
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <SetiFileIcon
                            fileId={wf.id}
                            extension={wf.extension}
                            className="w-4 h-4 shrink-0"
                          />
                          <span className="truncate">{wf.name}</span>
                        </span>
                        <span className="font-mono text-[10px] text-[#858585] shrink-0">
                          {wf.shortcut}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Breadcrumb Symbol Picker Dropdown */}
              {breadcrumbDropdown === 'symbols' && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setBreadcrumbDropdown(null)}
                  />
                  <div className="absolute left-2 sm:left-64 top-[22px] w-64 max-w-[calc(100vw-3.5rem)] rounded-md border border-[#454545] bg-[#252526] text-[#CCCCCC] shadow-xl py-1 z-40 text-xs">
                    {(
                      currentFileMeta.symbols || [
                        { name: 'defaultExport', kind: 'method' as const, line: 1 },
                      ]
                    ).map((sym) => (
                      <button
                        key={sym.name}
                        type="button"
                        onClick={() => {
                          setCursorPos({ line: sym.line, col: 1 });
                          setBreadcrumbDropdown(null);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Codicon
                            name={`symbol-${sym.kind}`}
                            className="!text-[14px] text-[#B180D7]"
                          />
                          <span className="truncate">{sym.name}</span>
                        </span>
                        <span className="font-mono text-[10px] text-[#858585]">
                          Ln {sym.line}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* OFFICIAL FLOATING TOP-RIGHT EDITOR FIND WIDGET (Ctrl+F) */}
          {findWidgetOpen && (
            <div className="absolute right-2 sm:right-8 top-[60px] z-30 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xs bg-[#252526] border border-[#454545] shadow-xl text-xs max-w-[calc(100vw-3.5rem)]">
              <div className="flex items-center bg-[#3C3C3C] border border-[#0078D4] rounded-xs px-2 py-0.5">
                <input
                  type="text"
                  autoFocus
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  placeholder="Find"
                  className="w-40 bg-transparent text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setFindMatchCase((p) => !p)}
                  title="Match Case"
                  className={`px-1 rounded text-[11px] font-mono cursor-pointer ${
                    findMatchCase ? 'bg-[#0078D4] text-white' : 'text-[#CCCCCC]'
                  }`}
                >
                  Aa
                </button>
                <button
                  type="button"
                  onClick={() => setFindWholeWord((p) => !p)}
                  title="Match Whole Word"
                  className={`px-1 rounded text-[11px] font-mono cursor-pointer ${
                    findWholeWord ? 'bg-[#0078D4] text-white' : 'text-[#CCCCCC]'
                  }`}
                >
                  ab
                </button>
              </div>
              <span className="text-[11px] font-mono text-[#858585] px-1">
                {findQuery.trim() ? '1 of 3' : 'No results'}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCursorPos((p) => ({ line: Math.max(1, p.line - 2), col: 1 }))
                }
                title="Previous Match (Shift+Enter)"
                className="p-1 rounded hover:bg-[#2A2D2E] text-[#CCCCCC] cursor-pointer"
              >
                <Codicon name="arrow-up" className="!text-[13px]" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCursorPos((p) => ({ line: Math.min(42, p.line + 2), col: 1 }))
                }
                title="Next Match (Enter)"
                className="p-1 rounded hover:bg-[#2A2D2E] text-[#CCCCCC] cursor-pointer"
              >
                <Codicon name="arrow-down" className="!text-[13px]" />
              </button>
              <button
                type="button"
                onClick={() => setFindWidgetOpen(false)}
                title="Close (Escape)"
                className="p-1 rounded hover:bg-[#2A2D2E] text-[#CCCCCC] cursor-pointer"
              >
                <Codicon name="close" className="!text-[13px]" />
              </button>
            </div>
          )}

          {/* Main Editor Surface + Right-Hand VS Code Minimap */}
          <div className={`flex-1 min-h-0 flex ${editorBg} select-text`}>
            <main className="flex-1 min-w-0 min-h-0 flex">
              {editorMode === 'code' && (
                <div className="flex-1 overflow-y-auto">
                  <SourceCodeView
                    activeFile={activeFile}
                    projects={projects}
                    messages={messages}
                    theme={theme}
                    customFiles={customFiles}
                    cursorPos={cursorPos}
                    cursorStyle={settings.cursorStyle}
                    cursorBlinking={settings.cursorBlinking}
                    onCursorChange={(line, col) => setCursorPos({ line, col })}
                  />
                </div>
              )}

              {editorMode === 'hybrid' && (
                <div className="flex-1 overflow-y-auto">
                  <WorkspaceViews
                    activeFile={activeFile}
                    theme={theme}
                    projects={projects}
                    guestbook={guestbook}
                    messages={messages}
                    visitorCount={visitorCount}
                    syncStats={syncStats}
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    customFiles={customFiles}
                    onUpdateCustomFile={(id, val) => {
                      setCustomFiles((prev) => {
                        const updated = { ...prev, [id]: val };
                        persistWorkspaceToCloud(updated, undefined, undefined);
                        return updated;
                      });
                    }}
                    cursorPos={cursorPos}
                    onOpenFile={handleOpenFile}
                    onSelectProject={(proj) => setSelectedProject(proj)}
                    onStarProject={handleStarProject}
                    onOpenTerminal={() => {
                      setTerminalOpen(true);
                      setActivePanelTab('terminal');
                    }}
                    onTriggerSync={() => handleTriggerSync(false)}
                    onGuestbookAdded={(entries) => setGuestbook(entries)}
                    onMessagesUpdated={(msgs) => setMessages(msgs)}
                    onCursorChange={(line, col) => setCursorPos({ line, col })}
                  />
                </div>
              )}

              {editorMode === 'split' && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-[#2B2B2B]">
                  {/* Left Editor Group (Group 1: Interactive Workspace View) */}
                  <div className="min-w-0 overflow-y-auto min-h-0">
                    <WorkspaceViews
                      activeFile={activeFile}
                      theme={theme}
                      projects={projects}
                      guestbook={guestbook}
                      messages={messages}
                      visitorCount={visitorCount}
                      syncStats={syncStats}
                      settings={settings}
                      onUpdateSettings={handleUpdateSettings}
                      customFiles={customFiles}
                      onUpdateCustomFile={(id, val) => {
                        setCustomFiles((prev) => {
                          const updated = { ...prev, [id]: val };
                          persistWorkspaceToCloud(updated, undefined, undefined);
                          return updated;
                        });
                      }}
                      cursorPos={cursorPos}
                      onOpenFile={handleOpenFile}
                      onSelectProject={(proj) => setSelectedProject(proj)}
                      onStarProject={handleStarProject}
                      onOpenTerminal={() => {
                        setTerminalOpen(true);
                        setActivePanelTab('terminal');
                      }}
                      onTriggerSync={() => handleTriggerSync(false)}
                      onGuestbookAdded={(entries) => setGuestbook(entries)}
                      onMessagesUpdated={(msgs) => setMessages(msgs)}
                      onCursorChange={(line, col) => setCursorPos({ line, col })}
                    />
                  </div>

                  {/* Right Split Editor Group (Group 2: Side-by-Side Source Buffer with Close Split Button) */}
                  <div className="min-w-0 flex flex-col min-h-0">
                    <div
                      className={`h-8 shrink-0 flex items-center justify-between px-3 border-b ${borderCol} ${
                        isDark ? 'bg-[#181818]' : 'bg-[#F3F3F3]'
                      } text-xs select-none`}
                    >
                      <span className="flex items-center gap-1.5 truncate font-medium text-white">
                        <SetiFileIcon
                          fileId={currentFileMeta.id}
                          extension={currentFileMeta.extension}
                          className="w-3.5 h-3.5 shrink-0"
                        />
                        <span className="truncate">{currentFileMeta.name}</span>
                        <span className="text-[10px] text-[#858585]">(Group 2)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditorMode('hybrid')}
                        title="Close Split Editor Group (Ctrl+\)"
                        className="p-1 rounded hover:bg-[#2A2D2E] text-[#CCCCCC] cursor-pointer"
                      >
                        <Codicon name="close" className="!text-[12px]" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0">
                      <SourceCodeView
                        activeFile={activeFile}
                        projects={projects}
                        messages={messages}
                        theme={theme}
                        customFiles={customFiles}
                        cursorPos={cursorPos}
                        cursorStyle={settings.cursorStyle}
                        cursorBlinking={settings.cursorBlinking}
                        onCursorChange={(line, col) => setCursorPos({ line, col })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </main>

            {/* Official Right-Hand VS Code Minimap */}
            {minimapVisible && (
              <div
                aria-hidden="true"
                className={`hidden md:flex flex-col w-14 border-l ${borderCol} ${editorBg} py-2 px-1.5 select-none shrink-0 relative overflow-hidden`}
              >
                {/* Minimap Active Viewport Highlight Slider */}
                <div className="absolute top-2 left-0 right-0 h-20 bg-[#797979]/20 border-y border-[#797979]/30 pointer-events-none" />
                <div className="space-y-1 opacity-55">
                  {Array.from({ length: 34 }, (_, idx) => {
                    const widths = ['w-8', 'w-10', 'w-6', 'w-11', 'w-7', 'w-9', 'w-5'];
                    const colors = [
                      'bg-[#569CD6]',
                      'bg-[#4EC9B0]',
                      'bg-[#CE9178]',
                      'bg-[#9CDCFE]',
                      'bg-[#6A9955]',
                      'bg-[#C586C0]',
                    ];
                    return (
                      <div key={idx} className="flex items-center gap-1">
                        <span
                          className={`h-[2px] rounded-xs ${widths[idx % widths.length]} ${
                            colors[idx % colors.length]
                          }`}
                        />
                        {idx % 3 === 0 && (
                          <span className="h-[2px] w-3 rounded-xs bg-[#DCDCAA]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Docked Official VS Code Bottom Panel */}
          <TerminalPanel
            isOpen={terminalOpen}
            isExpanded={terminalExpanded}
            activeTab={activePanelTab}
            onSelectTab={(tab) => setActivePanelTab(tab)}
            onToggleOpen={() => setTerminalOpen((prev) => !prev)}
            onToggleExpand={() => setTerminalExpanded((prev) => !prev)}
            onOpenFile={handleOpenFile}
            onSelectProject={(proj) => setSelectedProject(proj)}
            onStarProject={handleStarProject}
            onTriggerSync={handleTriggerSync}
            onToggleTheme={handleToggleTheme}
            theme={theme}
            projects={projects}
            messages={messages}
            syncStats={syncStats}
            syncLogs={syncLogs}
          />
        </div>
      </div>

      {/* OFFICIAL BOTTOM-RIGHT VS CODE NOTIFICATIONS TOAST CENTER */}
      {notificationsOpen && (
        <div className="fixed right-3 bottom-7 z-50 w-80 rounded-md border border-[#454545] bg-[#252526] text-[#CCCCCC] shadow-2xl overflow-hidden text-xs">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#181818] border-b border-[#2B2B2B] font-semibold text-[11px] uppercase tracking-wide">
            <span>
              {notifications.length > 0
                ? `NOTIFICATIONS (${notifications.length})`
                : 'NO NEW NOTIFICATIONS'}
            </span>
            <div className="flex items-center gap-1.5">
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => setNotifications([])}
                  title="Clear All Notifications"
                  className="p-0.5 rounded hover:bg-[#2A2D2E] text-[#CCCCCC] cursor-pointer"
                >
                  <Codicon name="clear-all" className="!text-[13px]" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                title="Hide Notifications"
                className="p-0.5 rounded hover:bg-[#2A2D2E] text-[#CCCCCC] cursor-pointer"
              >
                <Codicon name="chevron-down" className="!text-[13px]" />
              </button>
            </div>
          </div>
          <div className="divide-y divide-[#2B2B2B] max-h-60 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className="p-3 space-y-1">
                <div className="flex items-start gap-2">
                  <Codicon name="info" className="!text-[14px] text-[#0078D4] mt-0.5" />
                  <p className="text-white leading-snug">{n.title}</p>
                </div>
                <div className="flex items-center justify-between pl-5 text-[10px] text-[#858585]">
                  <span>Source: {n.source}</span>
                  <span>{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OFFICIAL HELP > ABOUT VISUAL STUDIO CODE MODAL DIALOG */}
      {aboutModalOpen && (
        <div
          onClick={() => setAboutModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-md border border-[#454545] bg-[#252526] text-[#CCCCCC] shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center gap-3">
              <OfficialVSCodeLogo className="w-10 h-10 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-white">
                  Visual Studio Code — MUSTAFA.dev
                </h2>
                <p className="text-[#858585]">Developer Portfolio Workbench Edition</p>
              </div>
            </div>
            <div className="space-y-1 font-mono text-[11px] bg-[#181818] p-3 rounded border border-[#2B2B2B]">
              <div>Version: 1.95.3 (Dark Modern)</div>
              <div>Developer: {DEVELOPER_PROFILE.name}</div>
              <div>Degree: BCA · Brainware University (9.09 / 10 CGPA)</div>
              <div>Stack: React 19.0.1 · Tailwind CSS 4.3 · Vite 8.3</div>
              <div>Cloud Engine: Express + SSE Real-Time Sync</div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `VS Code MUSTAFA.dev — ${DEVELOPER_PROFILE.name} (${DEVELOPER_PROFILE.email})`
                  );
                  setAboutModalOpen(false);
                }}
                className="px-3 py-1 rounded bg-[#313131] hover:bg-[#3C3C3C] text-white cursor-pointer"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => setAboutModalOpen(false)}
                className="px-4 py-1 rounded bg-[#0078D4] hover:bg-[#1084DF] text-white font-medium cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. OFFICIAL VS CODE 22PX BOTTOM STATUS BAR (TURNS #CC6633 ORANGE WHEN DEBUGGING F5) */}
      <footer
        aria-label="VS Code Status Bar"
        className={`h-[22px] flex items-center justify-between pr-2.5 border-t ${borderCol} ${
          isDebugging ? 'bg-[#CC6633] text-white' : chromeBg
        } text-[11px] font-sans shrink-0`}
      >
        {/* Left Status Bar Items */}
        <div className="flex items-center gap-2 h-full min-w-0">
          {/* Official Remote Indicator Button */}
          <button
            type="button"
            onClick={() => openQuickPick('> ')}
            title="Connected to Remote Portfolio Workspace"
            className="h-full px-2.5 bg-[#0078D4] hover:bg-[#1084DF] text-white flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Codicon name="remote" className="!text-[13px]" />
            <span className="hidden sm:inline font-medium">MUSTAFA.dev</span>
          </button>

          {/* Git Branch Selector */}
          <button
            type="button"
            onClick={() => {
              const branches: Array<typeof gitBranch> = [
                'main',
                'feat/vscode-ui',
                'release/v2.4.0',
              ];
              const next = branches[(branches.indexOf(gitBranch) + 1) % branches.length];
              setGitBranch(next);
            }}
            title="Checkout Git Branch (Click to switch branch)"
            className="h-full flex items-center gap-1 hover:bg-[#2A2D2E] px-1.5 cursor-pointer shrink-0"
          >
            <Codicon name="source-control" className="!text-[12px]" />
            <span>{gitBranch}*</span>
          </button>

          {/* Cloud Sync with Official Spinning Codicon */}
          <button
            type="button"
            onClick={() => handleTriggerSync(false)}
            title="Synchronize Changes"
            className="h-full flex items-center gap-1 hover:bg-[#2A2D2E] px-1.5 cursor-pointer tabular-nums shrink-0"
          >
            <Codicon name="sync" spin={isSyncingNow} className="!text-[12px]" />
            <span>{syncStats.syncCount}</span>
          </button>

          {/* Errors & Warnings */}
          <button
            type="button"
            onClick={() => {
              setTerminalOpen(true);
              setActivePanelTab('problems');
            }}
            title="No Problems Detected — Click to open Problems view"
            className="hidden sm:flex items-center gap-2 h-full hover:bg-[#2A2D2E] px-1.5 cursor-pointer tabular-nums shrink-0"
          >
            <span className="flex items-center gap-1">
              <Codicon name="error" className="!text-[12px]" />0
            </span>
            <span className="flex items-center gap-1">
              <Codicon name="warning" className="!text-[12px]" />0
            </span>
          </button>
          {/* Inbox Status Bar Shortcut */}
          <button
            type="button"
            onClick={() => handleOpenFile('messages-inbox.json')}
            title="Open Contact Messages Inbox (config/messages-inbox.json)"
            className="h-full flex items-center gap-1 hover:bg-[#2A2D2E] px-1.5 cursor-pointer tabular-nums shrink-0"
          >
            <Codicon name="mail" className="!text-[12px] text-[#4EC9B0]" />
            <span className="hidden xs:inline">Inbox</span>
            <span>({messages.length})</span>
          </button>
        </div>

        {/* Right Status Bar Items (All Interactive like Official VS Code) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 h-full shrink-0 text-[11px] tabular-nums">
          <button
            type="button"
            onClick={() => openQuickPick(':')}
            title="Go to Line/Column (Ctrl+G)"
            className="hover:bg-[#2A2D2E] px-1 sm:px-1.5 py-0.5 cursor-pointer"
          >
            Ln {cursorPos.line}, Col {cursorPos.col}
          </button>
          <button
            type="button"
            onClick={() => setIndentSpaces((prev) => (prev === 2 ? 4 : 2))}
            title="Select Indentation"
            className="hidden lg:inline hover:bg-[#2A2D2E] px-1.5 py-0.5 cursor-pointer"
          >
            Spaces: {indentSpaces}
          </button>
          <button
            type="button"
            onClick={() => handleOpenFile('settings')}
            title="Select Encoding"
            className="hidden md:inline hover:bg-[#2A2D2E] px-1.5 py-0.5 cursor-pointer"
          >
            UTF-8
          </button>
          <button
            type="button"
            onClick={() => setEolMode((prev) => (prev === 'LF' ? 'CRLF' : 'LF'))}
            title="Select End of Line Sequence"
            className="hidden lg:inline hover:bg-[#2A2D2E] px-1.5 py-0.5 cursor-pointer"
          >
            {eolMode}
          </button>
          <button
            type="button"
            onClick={() => openQuickPick('')}
            title="Select Language Mode"
            className="hidden sm:inline hover:bg-[#2A2D2E] px-1.5 py-0.5 cursor-pointer"
          >
            {currentFileMeta.language}
          </button>
          <button
            type="button"
            onClick={() => {
              setTerminalOpen(true);
              setActivePanelTab('output');
            }}
            title="Prettier Code Formatter"
            className="hidden md:flex items-center gap-1 hover:bg-[#2A2D2E] px-1.5 py-0.5 cursor-pointer"
          >
            <Codicon name="check-all" className="!text-[13px]" />
            <span>Prettier</span>
          </button>
          <button
            type="button"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            title="Notifications"
            className="hover:bg-[#2A2D2E] px-1 py-0.5 flex items-center cursor-pointer"
          >
            <Codicon
              name={notifications.length > 0 ? 'bell-dot' : 'bell'}
              className="!text-[12px]"
            />
          </button>
        </div>
      </footer>

      {/* Command Palette / Quick Open Modal */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        initialPrefix={palettePrefix}
        activeFile={activeFile}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectFile={handleOpenFile}
        onSelectProject={(proj) => setSelectedProject(proj)}
        onToggleTerminal={() => setTerminalOpen((prev) => !prev)}
        onToggleTheme={() => handleToggleTheme()}
        onTriggerSync={() => handleTriggerSync(false)}
        onToggleSplitEditor={() =>
          setEditorMode((prev) => (prev === 'split' ? 'hybrid' : 'split'))
        }
        onToggleMinimap={() =>
          handleUpdateSettings({ minimapEnabled: !settings.minimapEnabled })
        }
        onGoToLine={(line, col) => setCursorPos({ line, col })}
        onCreateNewFile={() => handleCreateUntitledFile()}
        projects={projects}
        theme={theme}
      />

      {/* Project Case Study Modal */}
      <ProjectCaseStudyModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onStar={handleStarProject}
      />
    </div>
  );
}
