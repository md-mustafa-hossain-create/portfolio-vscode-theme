import React, { useState, useEffect, useCallback } from 'react';
import {
  Codicon,
  OfficialVSCodeLogo,
  SetiFileIcon,
  OfficialSkillIcon,
  OfficialGeminiLogo,
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
  ContactMessage,
  WorkbenchSettings,
} from './components/WorkspaceViews';
import { TerminalPanel, BottomPanelTab } from './components/TerminalPanel';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { ProjectCaseStudyModal } from './components/ProjectCaseStudyModal';
import { SourceCodeView } from './components/SourceCodeView';
import { GeminiChatPanel } from './components/GeminiChatPanel';
import { PWAInstallButton } from './components/PWAInstallButton';
import { MobileTouchBar } from './components/MobileTouchBar';
import { OSSwitcherModal } from './components/OSSwitcherModal';
import {
  OSPlatform,
  detectNativeOS,
  formatShortcut,
  OS_META,
} from './utils/platform';
import {
  auth,
  onAuthStateChanged,
  User,
  isVerifiedOwnerUser,
  signInAsPortfolioOwner,
  signOutPortfolioOwner,
  subscribeToOwnerMessages,
} from './firebase';

type ActivityViewId = 'explorer' | 'search' | 'extensions' | 'gemini';
type EditorViewMode = 'hybrid' | 'code' | 'split';
type MenuId = 'File' | 'View' | 'Go' | 'Terminal' | 'Help' | null;

function getOrCreateVisitorId(): string {
  const storageKey = 'mustafa_unique_visitor_id';
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing && existing.trim().length >= 8) {
      return existing.trim();
    }
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `vis-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(storageKey, generated);
    return generated;
  } catch {
    return 'fallback-browser-visitor';
  }
}

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
  const [recruiterTourDismissed, setRecruiterTourDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mustafa_recruiter_tour_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // Cross-Platform OS & Touch State (Windows, macOS, Linux, Android, iOS)
  const [activeOS, setActiveOS] = useState<OSPlatform>(() => {
    try {
      const saved = localStorage.getItem('mustafa_os_override') as OSPlatform;
      if (saved && ['macos', 'windows', 'linux', 'android', 'ios'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return detectNativeOS();
  });
  const [isAutoOS, setIsAutoOS] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('mustafa_os_override');
    } catch {
      return true;
    }
  });
  const [osModalOpen, setOSModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const handleSelectOS = (selected: OSPlatform, isAuto: boolean) => {
    setActiveOS(selected);
    setIsAutoOS(isAuto);
    try {
      if (isAuto) {
        localStorage.removeItem('mustafa_os_override');
      } else {
        localStorage.setItem('mustafa_os_override', selected);
      }
    } catch {
      // storage error
    }
  };

  // Official Title Bar Dropdown Menu state
  const [openMenu, setOpenMenu] = useState<MenuId>(null);

  // Official Editor Find Widget (Ctrl+F)
  const [findWidgetOpen, setFindWidgetOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findMatchCase, setFindMatchCase] = useState(false);
  const [findWholeWord, setFindWholeWord] = useState(false);

  // Explorer collapsible tree sections
  const [workspaceTreeExpanded, setWorkspaceTreeExpanded] = useState(true);
  const [srcRootExpanded, setSrcRootExpanded] = useState(true);
  const [srcFolderExpanded, setSrcFolderExpanded] = useState(true);
  const [projectsFolderExpanded, setProjectsFolderExpanded] = useState(true);
  const [configFolderExpanded, setConfigFolderExpanded] = useState(true);

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

  // Global sidebar Search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  // Extensions sidebar search state
  const [extensionSearchQuery, setExtensionSearchQuery] = useState('');

  // Settings & About Modal popups
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  // Bottom Panel state
  const [terminalOpen, setTerminalOpen] = useState<boolean>(true);
  const [terminalExpanded, setTerminalExpanded] = useState<boolean>(false);
  const [activePanelTab, setActivePanelTab] = useState<BottomPanelTab>('terminal');

  // Modals & Quick Open Prefix
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [palettePrefix, setPalettePrefix] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  // Editor cursor position
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 5, col: 14 });

  // Real-time synchronized state from backend API & Owner-Only Firebase Firestore
  const [projects, setProjects] = useState<PortfolioProject[]>(INITIAL_PROJECTS);
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const isOwner = isVerifiedOwnerUser(currentUser);

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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileDrawerOpen(false);
      }
    };
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('resize', handleResize);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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

  // Track Firebase Authentication state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
      if (!isVerifiedOwnerUser(user)) {
        setMessages([]);
      }
    });
    return () => unsubAuth();
  }, []);

  // Only subscribe to Firestore /messages when the verified website owner is authenticated
  useEffect(() => {
    if (!authReady || !isOwner) {
      setMessages([]);
      return;
    }
    const unsubMessages = subscribeToOwnerMessages((firestoreMsgs) => {
      setMessages(firestoreMsgs);
    });
    return () => unsubMessages();
  }, [authReady, isOwner]);

  const handleOwnerSignIn = useCallback(async () => {
    try {
      await signInAsPortfolioOwner();
    } catch {
      // Popup closed by user
    }
  }, []);

  const handleOwnerSignOut = useCallback(async () => {
    try {
      await signOutPortfolioOwner();
      setMessages([]);
    } catch {
      // Ignore signout error
    }
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    const visitorId = getOrCreateVisitorId();

    fetch('/api/portfolio')
      .then((res) => res.json())
      .then((data) => {
        if (data.projectStars) applyProjectStars(data.projectStars);
        if (typeof data.visitorCount === 'number') setVisitorCount(data.visitorCount);
        if (data.customFiles && typeof data.customFiles === 'object') {
          setCustomFiles(data.customFiles);
        }
        if (Array.isArray(data.customFolders)) {
          setCustomFolders(data.customFolders);
        }
        if (data.settings && typeof data.settings === 'object') {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch(() => {
        // Offline resilient fallback
      });

    // Register unique visitor with persistent client visitorId (deduplicated on server)
    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.visitorCount === 'number') setVisitorCount(d.visitorCount);
      })
      .catch(() => {});

    try {
      eventSource = new EventSource('/api/stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.projectStars) applyProjectStars(payload.projectStars);
          if (typeof payload.visitorCount === 'number') setVisitorCount(payload.visitorCount);
          if (payload.customFiles && typeof payload.customFiles === 'object') {
            setCustomFiles(payload.customFiles);
          }
          if (Array.isArray(payload.customFolders)) {
            setCustomFolders(payload.customFolders);
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
  }, [applyProjectStars]);

  const handleOpenFile = useCallback(
    (fileId: string, pushHistory = true) => {
      setActiveFile(fileId);
      setOpenTabs((prev) => (prev.includes(fileId) ? prev : [...prev, fileId]));
      setMobileDrawerOpen(false);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
      setOpenMenu(null);
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
    },
    [persistWorkspaceToCloud]
  );

  const handleStarProject = async (projectId: string) => {
    try {
      const visitorId = getOrCreateVisitorId();
      const res = await fetch(`/api/projects/${projectId}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      });
      const data = await res.json();
      if (res.ok && data.projectStars) {
        applyProjectStars(data.projectStars);
      }
    } catch {
      // Offline resilient fallback
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
      } else if (e.altKey && ['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
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
        snippet: `${DEVELOPER_PROFILE.name} — ${DEVELOPER_PROFILE.title} (${DEVELOPER_PROFILE.roleSubtitle})`,
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
        label: 'Open Owner Inbox (messages-inbox.json)',
        shortcut: 'Alt+7',
        dividerAfter: true,
        action: () => handleOpenFile('messages-inbox.json'),
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
        label: 'Appearance: Show Terminal Panel',
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
    Terminal: [
      {
        label: terminalOpen ? 'Hide Terminal Panel' : 'Open Terminal Panel',
        shortcut: 'Ctrl+`',
        action: () => {
          setTerminalOpen((prev) => !prev);
          setActivePanelTab('terminal');
          setOpenMenu(null);
        },
      },
      {
        label: terminalExpanded ? 'Restore Terminal Panel Height' : 'Maximize Terminal Panel',
        action: () => {
          setTerminalOpen(true);
          setTerminalExpanded((prev) => !prev);
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
    <div className={`h-screen-dynamic w-screen overflow-hidden flex flex-col select-none ${chromeBg} safe-top safe-left safe-right relative`}>
      {/* 1. CROSS-PLATFORM VS CODE TITLE BAR (Supports macOS, Windows 11, Linux, Android, iOS) */}
      <header
        className={`h-9 md:h-[35px] flex items-center justify-between px-2 sm:px-2.5 border-b ${borderCol} ${chromeBg} text-[12px] shrink-0 relative z-40`}
      >
        {/* Left: macOS Traffic Lights OR Windows/Linux/Mobile Brand Logo */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* macOS Classic Window Traffic Lights */}
          {activeOS === 'macos' && (
            <div className="flex items-center gap-2 pr-1.5 group select-none">
              <button
                type="button"
                onClick={() => handleCloseTab(null, activeFile)}
                title="Close Window / Tab (⌘W)"
                className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] hover:opacity-80 flex items-center justify-center cursor-pointer text-[8px] text-black/60 group-hover:text-black"
              >
                <span className="opacity-0 group-hover:opacity-100">✕</span>
              </button>
              <button
                type="button"
                onClick={() => setTerminalOpen((prev) => !prev)}
                title="Minimize Panel (⌘M)"
                className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] hover:opacity-80 flex items-center justify-center cursor-pointer text-[8px] text-black/60 group-hover:text-black"
              >
                <span className="opacity-0 group-hover:opacity-100">−</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode((prev) => (prev === 'split' ? 'hybrid' : 'split'))}
                title="Zoom / Split Editor (⌘F)"
                className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] hover:opacity-80 flex items-center justify-center cursor-pointer text-[8px] text-black/60 group-hover:text-black"
              >
                <span className="opacity-0 group-hover:opacity-100">+</span>
              </button>
            </div>
          )}

          {/* Android & iOS Mobile Drawer Hamburger Toggle */}
          {(activeOS === 'android' || activeOS === 'ios') && (
            <button
              type="button"
              onClick={() => {
                setSidebarOpen((prev) => !prev);
                setMobileDrawerOpen((prev) => !prev);
              }}
              title="Toggle Navigation Menu"
              className="p-1 rounded hover:bg-[#2A2D2E] text-[#CCCCCC] cursor-pointer md:hidden mr-0.5"
            >
              <Codicon name="menu" className="!text-[16px]" />
            </button>
          )}

          {/* Official VS Code Ribbon Logo */}
          <div className="px-1 flex items-center shrink-0">
            <OfficialVSCodeLogo className="w-4 h-4" />
          </div>

          {/* Official Menu Bar with Working Dropdowns & Checkmarks (Hidden on narrow mobile screens) */}
          <nav
            aria-label="VS Code Menu Bar"
            className="hidden md:flex items-center gap-0.5 relative"
          >
            {(
              ['File', 'View', 'Go', 'Terminal', 'Help'] as Array<
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
                                  {formatShortcut(item.shortcut, activeOS)}
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

        {/* Center: Navigation History Arrows + Command Center Quick Open Search Bar */}
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleNavBack}
              disabled={navHistoryIdx <= 0}
              title={`Go Back (${formatShortcut('Alt+Left', activeOS)})`}
              className="p-1 rounded hover:bg-[#2A2D2E] disabled:opacity-35 text-[#CCCCCC] flex items-center justify-center cursor-pointer"
            >
              <Codicon name="arrow-left" className="!text-[14px]" />
            </button>
            <button
              type="button"
              onClick={handleNavForward}
              disabled={navHistoryIdx >= navHistory.length - 1}
              title={`Go Forward (${formatShortcut('Alt+Right', activeOS)})`}
              className="p-1 rounded hover:bg-[#2A2D2E] disabled:opacity-35 text-[#CCCCCC] flex items-center justify-center cursor-pointer"
            >
              <Codicon name="arrow-right" className="!text-[14px]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => openQuickPick('')}
            title={`Search files by name (${formatShortcut('Ctrl+P', activeOS)}) or run commands (${formatShortcut('Ctrl+Shift+P', activeOS)})`}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 w-32 xs:w-44 sm:w-64 md:w-80 lg:w-96 h-[22px] px-2 sm:px-3 rounded-[5px] border ${
              isDark
                ? 'bg-[#252526] hover:bg-[#2A2D2E] border-[#3C3C3C] text-[#CCCCCC]'
                : 'bg-[#ECECEC] hover:bg-[#E0E0E0] border-[#D0D0D0] text-[#3B3B3B]'
            } text-[11px] transition-colors cursor-pointer shrink-0`}
          >
            <Codicon name="search" className="!text-[12px] text-[#868686] shrink-0" />
            <span className="truncate">mustafa-dev-portfolio</span>
          </button>
        </div>

        {/* Right: OS Switcher, PWA Install, Resume PDF, and Window Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Interactive OS Switcher Pill */}
          <button
            type="button"
            onClick={() => setOSModalOpen(true)}
            title={`Active OS: ${OS_META[activeOS].name} (${isAutoOS ? 'Auto-Detected' : 'Manual'}). Click to switch layout!`}
            className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-[4px] border border-[#3C3C3C] hover:bg-[#2A2D2E] text-[11px] font-mono text-[#CCCCCC] transition-colors cursor-pointer shrink-0"
          >
            <span className="text-xs">
              {activeOS === 'macos' && '🍎'}
              {activeOS === 'windows' && '🪟'}
              {activeOS === 'linux' && '🐧'}
              {activeOS === 'android' && '🤖'}
              {activeOS === 'ios' && '📱'}
            </span>
            <span className="hidden sm:inline font-medium">{OS_META[activeOS].name}</span>
            <Codicon name="chevron-down" className="!text-[10px] text-[#858585]" />
          </button>

          {/* In-App PWA Install Action */}
          <PWAInstallButton />

          {/* Resume PDF Action Button */}
          <a
            href={DEVELOPER_PROFILE.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Download / View MD Mustafa Hossain's Resume (PDF)"
            className="hidden sm:inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-[4px] bg-[#0078D4] hover:bg-[#1084DF] text-white text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Codicon name="file-pdf" className="!text-[12px]" />
            <span>Resume</span>
          </a>

          {/* Sidebar Toggle Action */}
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            title={`Toggle Primary Side Bar (${formatShortcut('Ctrl+B', activeOS)})`}
            className="p-1 rounded hover:bg-[#2A2D2E] text-[#CCCCCC] flex items-center justify-center cursor-pointer"
          >
            <Codicon
              name={sidebarOpen ? 'layout-sidebar-left' : 'layout-sidebar-left-off'}
              className="!text-[15px]"
            />
          </button>

          {/* Terminal Toggle Action */}
          <button
            type="button"
            onClick={() => setTerminalOpen((prev) => !prev)}
            title={`Toggle Terminal Panel (${formatShortcut('Ctrl+`', activeOS)})`}
            className="p-1 rounded hover:bg-[#2A2D2E] text-[#CCCCCC] flex items-center justify-center cursor-pointer"
          >
            <Codicon
              name={terminalOpen ? 'layout-panel' : 'layout-panel-off'}
              className="!text-[15px]"
            />
          </button>

          {/* Windows 11 Fluent Window Controls */}
          {activeOS === 'windows' && (
            <div className="hidden sm:flex items-center ml-1 border-l border-[#3C3C3C] pl-1">
              <button
                type="button"
                onClick={() => setTerminalOpen((prev) => !prev)}
                title="Minimize Terminal"
                className="w-7 h-[22px] flex items-center justify-center hover:bg-[#2A2D2E] text-[#CCCCCC] cursor-pointer text-xs"
              >
                <span>−</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode((prev) => (prev === 'split' ? 'hybrid' : 'split'))}
                title="Maximize / Restore Split Editor"
                className="w-7 h-[22px] flex items-center justify-center hover:bg-[#2A2D2E] text-[#CCCCCC] cursor-pointer text-xs"
              >
                <span>□</span>
              </button>
              <button
                type="button"
                onClick={() => handleCloseTab(null, activeFile)}
                title="Close Tab"
                className="w-7 h-[22px] flex items-center justify-center hover:bg-[#E81123] hover:text-white text-[#CCCCCC] cursor-pointer text-xs"
              >
                <span>✕</span>
              </button>
            </div>
          )}

          {/* Linux GNOME Rounded Controls */}
          {activeOS === 'linux' && (
            <div className="hidden sm:flex items-center gap-1 ml-1 border-l border-[#3C3C3C] pl-1.5 select-none">
              <button
                type="button"
                onClick={() => setTerminalOpen((prev) => !prev)}
                title="Minimize"
                className="w-4 h-4 rounded-full bg-[#3C3C3C] hover:bg-[#4C4C4C] text-white flex items-center justify-center text-[10px] cursor-pointer font-bold"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setEditorMode((prev) => (prev === 'split' ? 'hybrid' : 'split'))}
                title="Maximize / Restore"
                className="w-4 h-4 rounded-full bg-[#3C3C3C] hover:bg-[#4C4C4C] text-white flex items-center justify-center text-[10px] cursor-pointer font-bold"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleCloseTab(null, activeFile)}
                title="Close"
                className="w-4 h-4 rounded-full bg-[#E95420] hover:bg-[#D84918] text-white flex items-center justify-center text-[10px] cursor-pointer font-bold"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </header>

      {/* RECRUITER & HR QUICK TOUR STRIP (Non-intrusive 1-click evaluation shortcuts) */}
      {!recruiterTourDismissed && (
        <div
          className={`h-9 px-2 sm:px-4 border-b ${borderCol} ${
            isDark ? 'bg-[#181818]' : 'bg-[#F0F0F0]'
          } flex items-center justify-between gap-2 sm:gap-3 text-xs shrink-0 z-20`}
        >
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar min-w-0">
            <span className="text-[11px] font-mono text-[#4EC9B0] shrink-0 font-medium hidden xs:inline">
              Recruiter Quick Tour:
            </span>

            <a
              href={DEVELOPER_PROFILE.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#0078D4] hover:bg-[#1084DF] text-white text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors"
            >
              <Codicon name="file-pdf" className="!text-[12px]" />
              <span>View Resume (PDF)</span>
            </a>

            <PWAInstallButton variant="pill" />

            <button
              type="button"
              onClick={() => handleOpenFile('projects.tsx')}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded border ${
                isDark ? 'border-[#3C3C3C] hover:bg-[#2A2D2E] text-[#CCCCCC]' : 'border-slate-300 hover:bg-white text-slate-800'
              } text-[11px] font-mono whitespace-nowrap shrink-0 transition-colors cursor-pointer`}
            >
              <Codicon name="repo" className="!text-[12px] text-[#4FC1FF]" />
              <span>Projects (3)</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenFile('education.md')}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded border ${
                isDark ? 'border-[#3C3C3C] hover:bg-[#2A2D2E] text-[#CCCCCC]' : 'border-slate-300 hover:bg-white text-slate-800'
              } text-[11px] font-mono whitespace-nowrap shrink-0 transition-colors cursor-pointer`}
            >
              <Codicon name="mortar-board" className="!text-[12px] text-[#4EC9B0]" />
              <span>Academics</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenFile('contact.tsx')}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded border ${
                isDark ? 'border-[#3C3C3C] hover:bg-[#2A2D2E] text-[#CCCCCC]' : 'border-slate-300 hover:bg-white text-slate-800'
              } text-[11px] font-mono whitespace-nowrap shrink-0 transition-colors cursor-pointer`}
            >
              <Codicon name="mail" className="!text-[12px] text-[#CE9178]" />
              <span>Get in Touch</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setRecruiterTourDismissed(true);
              try {
                localStorage.setItem('mustafa_recruiter_tour_dismissed', 'true');
              } catch {
                // ignore storage error
              }
            }}
            title="Dismiss Quick Tour"
            className="p-1 rounded hover:bg-[#2A2D2E] text-[#858585] hover:text-white cursor-pointer shrink-0"
          >
            <Codicon name="close" className="!text-[13px]" />
          </button>
        </div>
      )}

      {/* 2. MAIN WORKBENCH BODY (Activity Bar + Primary Side Bar + Editor Group & Panel) */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Far-Left Activity Bar using Official @vscode/codicons (44px min width on mobile, 48px on sm+) */}
        <aside
          aria-label="VS Code Activity Bar"
          className={`w-11 sm:w-12 flex flex-col items-center justify-between py-0.5 border-r ${borderCol} ${chromeBg} shrink-0 z-30`}
        >
          {/* Top 3 Core Official Activity Icons */}
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
                { id: 'search', icon: 'search', title: 'Search Portfolio (Ctrl+Shift+F)' },
                {
                  id: 'extensions',
                  icon: 'extensions',
                  title: 'Tech Stack & Extensions (Ctrl+Shift+X)',
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
                  className={`relative w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer ${
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
                  <Codicon name={item.icon} className="!text-[22px] sm:!text-[24px]" />
                  {item.badge && (
                    <span className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 px-1 min-w-[16px] h-4 rounded-full bg-[#0078D4] text-white text-[9px] font-sans font-semibold flex items-center justify-center tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Official Google Gemini AI Assistant Icon directly under Extensions */}
            <button
              type="button"
              onClick={() => handleActivityClick('gemini')}
              title="Gemini AI Assistant"
              className={`relative w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] flex items-center justify-center transition-opacity cursor-pointer ${
                activityView === 'gemini' && sidebarOpen
                  ? 'opacity-100'
                  : 'opacity-85 hover:opacity-100'
              }`}
            >
              {activityView === 'gemini' && sidebarOpen && (
                <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#0078D4]" />
              )}
              <OfficialGeminiLogo className="w-[22px] h-[22px] sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Bottom Official Theme & Settings Icons */}
          <div className="flex flex-col items-center w-full relative">
            <button
              type="button"
              onClick={() => handleToggleTheme()}
              title={`Switch to ${isDark ? 'Light Modern' : 'Dark Modern'} Theme (Alt+T)`}
              className="relative w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#868686] hover:text-[#D7D7D7] transition-colors cursor-pointer"
            >
              <Codicon name={isDark ? 'color-mode' : 'lightbulb'} className="!text-[20px] sm:!text-[22px]" />
            </button>

            <button
              type="button"
              onClick={() => setSettingsMenuOpen((prev) => !prev)}
              title="Manage / Settings (Ctrl+,)"
              className="relative w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#868686] hover:text-[#D7D7D7] transition-colors cursor-pointer"
            >
              <Codicon name="settings-gear" className="!text-[22px] sm:!text-[24px]" />
            </button>

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
              ? `fixed top-[35px] bottom-[22px] left-11 sm:left-12 z-40 w-[min(20rem,calc(100vw-2.75rem))] sm:w-72 shadow-2xl flex md:static md:shadow-none ${
                  activityView === 'gemini' ? 'md:w-72 lg:w-80' : 'md:w-56 lg:w-64'
                }`
              : 'hidden'
          } flex-col border-r ${borderCol} ${chromeBg} shrink-0`}
        >
          {/* Side Bar View Title Header with Official Action Icons (44px min height on mobile, 35px on md+) */}
          <div className="h-11 md:h-[35px] pl-4 pr-1 md:px-4 flex items-center justify-between text-[11px] font-sans tracking-wide uppercase text-[#BBBBBB] shrink-0 relative">
            <span className="truncate font-semibold">
              {activityView === 'explorer' && 'EXPLORER'}
              {activityView === 'search' && 'SEARCH'}
              {activityView === 'extensions' && 'EXTENSIONS'}
              {activityView === 'gemini' && 'GEMINI AI ASSISTANT'}
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
                  title="Filter Files by Name"
                  className={`min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 p-2.5 md:p-1 rounded hover:bg-[#2A2D2E] cursor-pointer flex items-center justify-center ${
                    explorerFilterOpen ? 'bg-[#04395E] text-white' : 'text-[#CCCCCC]'
                  }`}
                >
                  <Codicon name="filter" className="!text-[14px]" />
                </button>
              )}
            </div>
          </div>

          {/* VIEW 1: OFFICIAL VS CODE EXPLORER */}
          {activityView === 'explorer' && (
            <div className="flex-1 overflow-y-auto text-[13px] select-none relative">
              {/* Optional Filter on Type Input Box inside Explorer */}
              {explorerFilterOpen && (
                <div className="px-2.5 py-1.5 border-b border-[#2B2B2B] bg-[#181818] flex items-center gap-1.5 min-h-[44px] md:min-h-0">
                  <Codicon name="filter" className="!text-[12px] text-[#0078D4] shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={explorerFilterQuery}
                    onChange={(e) => setExplorerFilterQuery(e.target.value)}
                    placeholder="Filter files & pages by name..."
                    className="w-full bg-[#252526] border border-[#0078D4] rounded-xs px-2 py-1 md:py-0.5 text-[12px] md:text-[11px] text-white focus:outline-none"
                  />
                  {explorerFilterQuery && (
                    <button
                      type="button"
                      onClick={() => setExplorerFilterQuery('')}
                      title="Clear Filter"
                      className="min-w-[36px] min-h-[36px] md:min-w-0 md:min-h-0 text-[#858585] hover:text-white cursor-pointer flex items-center justify-center"
                    >
                      <Codicon name="close" className="!text-[12px]" />
                    </button>
                  )}
                </div>
              )}

              {/* WORKSPACE ROOT FOLDER (MUSTAFA-DEV-PORTFOLIO) */}
              <div>
                <div className="group flex items-center justify-between pr-1 md:pr-1.5 border-t border-[#2B2B2B] hover:bg-[#2A2D2E] min-h-[44px] md:min-h-0">
                  <button
                    type="button"
                    onClick={() => setWorkspaceTreeExpanded((prev) => !prev)}
                    className="flex-1 min-h-[44px] md:min-h-0 flex items-center gap-1 px-1.5 py-2 md:py-1 font-bold text-[11px] uppercase tracking-wide cursor-pointer text-left min-w-0"
                  >
                    <Codicon
                      name={workspaceTreeExpanded ? 'chevron-down' : 'chevron-right'}
                      className="!text-[14px] shrink-0"
                    />
                    <span className="truncate">MUSTAFA-DEV-PORTFOLIO</span>
                  </button>

                  {/* Clean Explorer Collapse Action Icon */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCollapseAllExplorer();
                      }}
                      title="Collapse Folders in Explorer"
                      className="min-w-[38px] min-h-[44px] md:min-w-0 md:min-h-0 p-2 md:p-1 rounded hover:bg-[#3C3C3C] text-[#CCCCCC] hover:text-white cursor-pointer flex items-center justify-center"
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
                      className="w-full min-h-[44px] md:min-h-0 flex items-center gap-1.5 pl-3 pr-2 py-2 md:py-0.5 hover:bg-[#2A2D2E] text-left cursor-pointer text-[13px] text-[#CCCCCC]"
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
                            className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 md:py-0.5 min-h-[44px] md:min-h-0"
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
                              className="w-full px-1.5 py-1 md:py-0.5 bg-[#3C3C3C] border border-[#0078D4] text-xs text-white focus:outline-none"
                            />
                          </form>
                        )}

                        {/* SUBFOLDER 1A: src/pages (All Website Pages) */}
                        <button
                          type="button"
                          onClick={() => setSrcFolderExpanded((prev) => !prev)}
                          className="w-full min-h-[44px] md:min-h-0 flex items-center justify-between pl-2.5 pr-2 py-2 md:py-0.5 hover:bg-[#2A2D2E] text-left cursor-pointer text-[13px] text-[#CCCCCC]"
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
                                className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 md:py-0.5 min-h-[44px] md:min-h-0"
                              >
                                <SetiFileIcon extension="tsx" className="w-4 h-4 shrink-0" />
                                <input
                                  type="text"
                                  autoFocus
                                  value={newFileNameInput}
                                  onChange={(e) => setNewFileNameInput(e.target.value)}
                                  onBlur={() => setCreatingNewFile(false)}
                                  placeholder="new-page.tsx"
                                  className="w-full px-1.5 py-1 md:py-0.5 bg-[#3C3C3C] border border-[#0078D4] text-xs text-white focus:outline-none"
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
                                    className={`group w-full min-h-[44px] md:min-h-0 flex items-center justify-between pl-3 pr-2 py-2 md:py-0.5 text-left cursor-pointer text-[13px] ${
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
                                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 w-7 h-7 md:w-auto md:h-auto p-1 md:p-0.5 rounded hover:bg-[#3C3C3C] text-[#CCCCCC] hover:text-white flex items-center justify-center"
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
                                    className={`group w-full min-h-[44px] md:min-h-0 flex items-center justify-between pl-3 pr-2 py-2 md:py-0.5 text-left cursor-pointer text-[13px] ${
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
                          className="w-full min-h-[44px] md:min-h-0 flex items-center justify-between pl-2.5 pr-2 py-2 md:py-0.5 hover:bg-[#2A2D2E] text-left cursor-pointer text-[13px] text-[#CCCCCC]"
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
                                    className={`group w-full min-h-[44px] md:min-h-0 flex items-center justify-between pl-3 pr-2 py-2 md:py-0.5 text-left cursor-pointer text-[13px] ${
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

                        {/* User-created custom folders inside src/ */}
                        {customFolders.map((folderName) => (
                          <div
                            key={folderName}
                            className="w-full min-h-[44px] md:min-h-0 flex items-center gap-1.5 pl-2.5 pr-2 py-2 md:py-0.5 hover:bg-[#2A2D2E] text-left text-[13px] text-[#CCCCCC]"
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

                    {/* ROOT FOLDER 2: config (Workspace Configuration & Settings) */}
                    <button
                      type="button"
                      onClick={() => setConfigFolderExpanded((prev) => !prev)}
                      className="w-full min-h-[44px] md:min-h-0 flex items-center gap-1.5 pl-3 pr-2 py-2 md:py-0.5 hover:bg-[#2A2D2E] text-left cursor-pointer text-[13px] text-[#CCCCCC]"
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
                              isOwner && file.id === 'messages-inbox.json'
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
                                className={`group w-full min-h-[44px] md:min-h-0 flex items-center justify-between pl-3 pr-2 py-2 md:py-0.5 text-left cursor-pointer text-[13px] ${
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
                                  {file.id === 'messages-inbox.json' && !isOwner && (
                                    <Codicon
                                      name="lock"
                                      className="!text-[11px] text-[#858585]"
                                      title="Private Owner Inbox — Restricted to MD Mustafa Hossain"
                                    />
                                  )}
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
                                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 w-7 h-7 md:w-auto md:h-auto p-1 md:p-0.5 rounded hover:bg-[#3C3C3C] text-[#CCCCCC] hover:text-white flex items-center justify-center"
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
                          className={`group w-full min-h-[44px] md:min-h-0 flex items-center justify-between pl-3 pr-2 py-2 md:py-0.5 text-left cursor-pointer text-[13px] ${
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
                      className="w-full min-h-[44px] md:min-h-0 flex items-center justify-between px-3 py-2.5 md:py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
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
                      className="w-full min-h-[44px] md:min-h-0 flex items-center justify-between px-3 py-2.5 md:py-1.5 hover:bg-[#04395E] hover:text-white text-left cursor-pointer"
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

          {/* VIEW 2: GLOBAL WORKSPACE SEARCH */}
          {activityView === 'search' && (
            <div className="flex-1 flex flex-col p-2.5 space-y-2.5 overflow-y-auto text-xs">
              <div className="flex items-center bg-[#3C3C3C] border border-[#0078D4] rounded-xs px-1.5 py-1">
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  placeholder="Search portfolio files..."
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

          {/* VIEW 3: EXTENSIONS (OFFICIAL DEVICON MULTI-COLOR SVGS + MARKETPLACE SEARCH) */}
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
                        <OfficialSkillIcon skillId={skill.id} className="w-6 h-6" theme={theme} />
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

          {/* VIEW 4: GEMINI AI CHAT INTERFACE */}
          {activityView === 'gemini' && (
            <GeminiChatPanel onOpenFile={handleOpenFile} theme={theme} />
          )}
        </aside>

        {/* 3. EDITOR GROUP (Connected Tab Strip + Interactive Breadcrumbs + Find Widget + Editor Canvas + Minimap + Bottom Panel) */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Official VS Code Editor Group Header & Connected Tabs (44px height on mobile for touch targets, 35px on desktop) */}
          <div
            className={`h-11 md:h-[35px] flex items-center justify-between border-b ${borderCol} ${chromeBg} shrink-0 overflow-hidden`}
          >
            {/* Connected File Tabs with Official Seti File Icons */}
            <div className="flex items-center h-full overflow-x-auto overflow-y-hidden no-scrollbar min-w-0">
              {openTabs.map((tabId) => {
                const tabFile = getTabMeta(tabId);
                const active = activeFile === tabId;
                return (
                  <div
                    key={tabId}
                    onClick={() => handleOpenFile(tabId)}
                    role="tab"
                    aria-selected={active}
                    className={`group h-full inline-flex items-center gap-2 px-3.5 md:px-3 border-r ${borderCol} text-[13px] cursor-pointer transition-none whitespace-nowrap shrink-0 relative ${
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
                      <span className="absolute top-0 left-0 right-0 h-[2px] md:h-[1px] bg-[#0078D4]" />
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
                        className={`ml-0.5 md:ml-1 -mr-1.5 md:mr-0 min-w-[32px] min-h-[32px] md:min-w-0 md:min-h-0 p-1.5 md:p-0.5 rounded hover:bg-[#2A2D2E] flex items-center justify-center ${
                          active ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
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
            <div className="flex items-center gap-1 px-1.5 md:px-2 shrink-0">
              <div className="flex items-center rounded bg-[#252526] p-0.5 border border-[#2B2B2B]">
                <button
                  type="button"
                  onClick={() => setEditorMode('hybrid')}
                  title="Visual Portfolio Preview"
                  className={`min-h-[32px] md:min-h-0 px-2.5 py-1 rounded-xs text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                    editorMode === 'hybrid'
                      ? 'bg-[#0078D4] text-white'
                      : 'text-[#868686] hover:text-white'
                  }`}
                >
                  <Codicon name="open-preview" className="!text-[13px]" />
                  <span className="hidden sm:inline">Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditorMode('code')}
                  title="View Raw Source Code"
                  className={`min-h-[32px] md:min-h-0 px-2.5 py-1 rounded-xs text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                    editorMode === 'code'
                      ? 'bg-[#0078D4] text-white'
                      : 'text-[#868686] hover:text-white'
                  }`}
                >
                  <Codicon name="code" className="!text-[13px]" />
                  <span className="hidden sm:inline">Code</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setEditorMode((prev) => (prev === 'split' ? 'hybrid' : 'split'))}
                title="Split Editor Right (Ctrl+\)"
                className={`min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0 p-2 md:p-1.5 rounded flex items-center justify-center cursor-pointer ${
                  editorMode === 'split'
                    ? 'bg-[#0078D4] text-white'
                    : 'text-[#868686] hover:bg-[#2A2D2E] hover:text-white'
                }`}
              >
                <Codicon name="split-horizontal" className="!text-[15px]" />
              </button>
            </div>
          </div>

          {/* Clean VS Code 22px Path Breadcrumbs Bar */}
          {settings.breadcrumbsEnabled && (
            <div
              className={`h-[22px] px-2 sm:px-4 flex items-center justify-between border-b ${borderCol} ${editorBg} text-[11px] sm:text-[12px] font-sans text-[#868686] shrink-0`}
            >
              <div className="flex items-center gap-1 overflow-x-auto overflow-y-hidden no-scrollbar whitespace-nowrap min-w-0">
                <span className="hidden sm:inline px-1 shrink-0">mustafa-dev-portfolio</span>
                <Codicon
                  name="chevron-right"
                  className="hidden sm:inline !text-[13px] text-[#868686] shrink-0"
                />
                <span className="px-1 shrink-0">
                  {currentFileMeta.folder.replace('/', ' › ')}
                </span>
                <Codicon name="chevron-right" className="!text-[13px] text-[#868686] shrink-0" />
                <span className="inline-flex items-center gap-1.5 text-[#CCCCCC] px-1 shrink-0">
                  <SetiFileIcon
                    fileId={currentFileMeta.id}
                    extension={currentFileMeta.extension}
                    className="w-3.5 h-3.5 shrink-0"
                  />
                  <span>{currentFileMeta.name}</span>
                </span>
              </div>
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
                    isOwner={isOwner}
                  />
                </div>
              )}

              {editorMode === 'hybrid' && (
                <div className="flex-1 overflow-y-auto">
                  <WorkspaceViews
                    activeFile={activeFile}
                    theme={theme}
                    projects={projects}
                    messages={messages}
                    visitorCount={visitorCount}
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
                    onCursorChange={(line, col) => setCursorPos({ line, col })}
                    isOwner={isOwner}
                    currentUserEmail={currentUser?.email || null}
                    onOwnerSignIn={handleOwnerSignIn}
                    onOwnerSignOut={handleOwnerSignOut}
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
                      messages={messages}
                      visitorCount={visitorCount}
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
                      onCursorChange={(line, col) => setCursorPos({ line, col })}
                      isOwner={isOwner}
                      currentUserEmail={currentUser?.email || null}
                      onOwnerSignIn={handleOwnerSignIn}
                      onOwnerSignOut={handleOwnerSignOut}
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
                        isOwner={isOwner}
                      />
                    </div>
                  </div>
                </div>
              )}
            </main>

            {/* Official Right-Hand VS Code Minimap (Only shown in Code or Split view so visual Preview stays uncluttered) */}
            {minimapVisible && (editorMode === 'code' || editorMode === 'split') && (
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
            onToggleTheme={handleToggleTheme}
            theme={theme}
            projects={projects}
            visitorCount={visitorCount}
            messages={messages}
            isOwner={isOwner}
            onOwnerSignIn={handleOwnerSignIn}
            os={activeOS}
          />
        </div>
      </div>

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
              <div>Developer: {DEVELOPER_PROFILE.name}</div>
              <div>Role: {DEVELOPER_PROFILE.title} ({DEVELOPER_PROFILE.roleSubtitle})</div>
              <div>Stack: React 19 · Tailwind CSS v4 · Firebase Firestore</div>
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

      {/* 4. CLEAN, PROFESSIONAL VS CODE 22PX BOTTOM STATUS BAR */}
      <footer
        aria-label="VS Code Status Bar"
        className={`h-[22px] flex items-center justify-between pr-2.5 border-t ${borderCol} ${chromeBg} text-[11px] font-sans shrink-0`}
      >
        {/* Left Status Bar Items */}
        <div className="flex items-center gap-2 h-full min-w-0">
          {/* Official Brand Indicator Button */}
          <button
            type="button"
            onClick={() => handleOpenFile('overview.tsx')}
            title="MUSTAFA.dev — MD Mustafa Hossain Portfolio"
            className="h-full px-2.5 bg-[#0078D4] hover:bg-[#1084DF] text-white flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Codicon name="code" className="!text-[13px]" />
            <span className="font-medium">MUSTAFA.dev</span>
          </button>

          {/* Inbox Status Bar Shortcut (Strictly Owner-Only) */}
          <button
            type="button"
            onClick={() => handleOpenFile('messages-inbox.json')}
            title={
              isOwner
                ? 'Open Verified Owner Inbox (config/messages-inbox.json)'
                : 'Owner Inbox (Restricted — Sign in as Owner to view)'
            }
            className="h-full flex items-center gap-1 hover:bg-[#2A2D2E] px-2 cursor-pointer tabular-nums shrink-0"
          >
            <Codicon
              name={isOwner ? 'mail' : 'lock'}
              className={`!text-[12px] ${isOwner ? 'text-[#4EC9B0]' : 'text-[#858585]'}`}
            />
            <span>{isOwner ? `Owner Inbox (${messages.length})` : 'Owner Inbox'}</span>
          </button>
        </div>

        {/* Right Status Bar Items */}
        <div className="flex items-center gap-2 h-full shrink-0 text-[11px] tabular-nums">
          <span className="hidden md:flex items-center h-full px-2 text-[#858585]">
            UTF-8
          </span>

          <span className="hidden sm:flex items-center h-full px-2 text-[#CCCCCC]">
            {currentFileMeta.language}
          </span>

          <button
            type="button"
            onClick={() => setTerminalOpen((prev) => !prev)}
            title="Toggle Interactive Terminal (Ctrl+`)"
            className="h-full flex items-center gap-1 hover:bg-[#2A2D2E] px-2 cursor-pointer"
          >
            <Codicon name="terminal" className="!text-[12px]" />
            <span>Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleTheme()}
            title="Switch Dark / Light Theme (Alt+T)"
            className="h-full flex items-center gap-1 hover:bg-[#2A2D2E] px-2 cursor-pointer"
          >
            <Codicon name="color-mode" className="!text-[12px]" />
            <span className="hidden xs:inline">{isDark ? 'Dark Modern' : 'Light Modern'}</span>
          </button>

          {/* OS Platform Switcher in Status Bar */}
          <button
            type="button"
            onClick={() => setOSModalOpen(true)}
            title={`Active OS: ${OS_META[activeOS].name} (${isAutoOS ? 'Auto' : 'Manual'}). Click to change`}
            className="h-full flex items-center gap-1 hover:bg-[#2A2D2E] px-2 cursor-pointer font-mono text-[10px] text-[#4FC1FF]"
          >
            <span>
              {activeOS === 'macos' && '🍎 Mac'}
              {activeOS === 'windows' && '🪟 Win'}
              {activeOS === 'linux' && '🐧 Linux'}
              {activeOS === 'android' && '🤖 Android'}
              {activeOS === 'ios' && '📱 iOS'}
            </span>
          </button>
        </div>
      </footer>

      {/* 5. DEDICATED MOBILE TOUCH BOTTOM BAR (One-thumb navigation for smartphones & tablets) */}
      <MobileTouchBar
        activityView={activityView}
        sidebarOpen={sidebarOpen}
        terminalOpen={terminalOpen}
        onSelectActivity={(view) => handleActivityClick(view)}
        onToggleTerminal={() => setTerminalOpen((prev) => !prev)}
        onOpenResume={() => window.open(DEVELOPER_PROFILE.resumeUrl, '_blank')}
        currentOS={activeOS}
        onOpenOSSwitcher={() => setOSModalOpen(true)}
        theme={theme}
        unreadCount={isOwner ? messages.filter((m) => !m.read).length : 0}
      />

      {/* Cross-Platform OS Switcher Modal (macOS, Windows 11, Linux Ubuntu, Android, iOS) */}
      <OSSwitcherModal
        isOpen={osModalOpen}
        onClose={() => setOSModalOpen(false)}
        currentOS={activeOS}
        onSelectOS={handleSelectOS}
        isAutoDetect={isAutoOS}
        theme={theme}
      />

      {/* Non-intrusive Offline Connectivity Indicator */}
      {!isOnline && (
        <div className="fixed bottom-14 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white shadow-xl">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Offline Mode — Cached data is being used.</span>
        </div>
      )}

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
