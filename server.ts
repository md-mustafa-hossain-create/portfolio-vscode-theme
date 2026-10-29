import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
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

export interface PersistedWorkbenchSettings {
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

interface CloudStoreData {
  projectStars: Record<string, number>;
  visitorCount: number;
  messages: ContactMessage[];
  guestbook: GuestbookEntry[];
  customFiles: Record<string, string>;
  customFolders: string[];
  settings: Partial<PersistedWorkbenchSettings>;
  syncCount: number;
  lastSyncedAt: string;
  totalCommandsExecuted: number;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'portfolio-cloud-store.json');

const DEFAULT_STORE: CloudStoreData = {
  projectStars: {
    streampulse: 42,
    devdock: 38,
    geolearn: 31,
  },
  visitorCount: 284,
  messages: [
    {
      id: 'msg-seed-1',
      name: 'Rohan Sen · Hiring Lead',
      email: 'rohan.sen@techstudio.in',
      message:
        'Hi Mustafa, we reviewed your StreamPulse and DevDock React architectures and your 9.09 BCA CGPA at Brainware University. Would love to schedule a frontend engineering interview this week.',
      createdAt: '2026-10-28T09:15:00.000Z',
      source: 'form',
      read: false,
    },
  ],
  guestbook: [
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
  ],
  customFiles: {},
  customFolders: [],
  settings: {
    theme: 'dark',
    fontSize: 14,
    minimapEnabled: true,
    breadcrumbsEnabled: true,
    wordWrap: 'on',
    lineNumbers: 'on',
    autoSave: 'afterDelay',
    cursorStyle: 'block',
    cursorBlinking: 'smooth',
  },
  syncCount: 128,
  lastSyncedAt: new Date().toISOString(),
  totalCommandsExecuted: 342,
};

function loadCloudStore(): CloudStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STORE,
        ...parsed,
        projectStars: {
          ...DEFAULT_STORE.projectStars,
          ...(parsed.projectStars || {}),
        },
        visitorCount:
          typeof parsed.visitorCount === 'number'
            ? parsed.visitorCount
            : DEFAULT_STORE.visitorCount,
        messages: Array.isArray(parsed.messages) && parsed.messages.length > 0
          ? parsed.messages.map((m: ContactMessage) => ({
              ...m,
              read: Boolean(m.read),
            }))
          : DEFAULT_STORE.messages,
        guestbook: Array.isArray(parsed.guestbook)
          ? parsed.guestbook
          : DEFAULT_STORE.guestbook,
        customFiles:
          parsed.customFiles && typeof parsed.customFiles === 'object'
            ? parsed.customFiles
            : DEFAULT_STORE.customFiles,
        customFolders: Array.isArray(parsed.customFolders)
          ? parsed.customFolders
          : DEFAULT_STORE.customFolders,
        settings:
          parsed.settings && typeof parsed.settings === 'object'
            ? { ...DEFAULT_STORE.settings, ...parsed.settings }
            : DEFAULT_STORE.settings,
      };
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf8');
    return DEFAULT_STORE;
  } catch (err) {
    console.error('Failed to read store file, using in-memory fallback:', err);
    return { ...DEFAULT_STORE };
  }
}

function saveCloudStore(data: CloudStoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${STORE_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpFile, STORE_FILE);
  } catch (err) {
    console.error('Failed to persist store file:', err);
  }
}

const store = loadCloudStore();
const sseClients = new Set<express.Response>();

function buildPublicStatePayload(eventType: string) {
  return {
    type: eventType,
    projectStars: store.projectStars,
    visitorCount: store.visitorCount,
    messages: store.messages,
    messagesCount: store.messages.length,
    unreadMessagesCount: store.messages.filter((m) => !m.read).length,
    guestbook: store.guestbook,
    customFiles: store.customFiles,
    customFolders: store.customFolders,
    settings: store.settings,
    syncCount: store.syncCount,
    lastSyncedAt: store.lastSyncedAt,
    totalCommandsExecuted: store.totalCommandsExecuted,
  };
}

function broadcastSyncUpdate(eventType: string) {
  const payload = JSON.stringify(buildPublicStatePayload(eventType));
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // Real-time Server-Sent Events (SSE) endpoint for live portfolio state synchronization
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);

    const initialPayload = JSON.stringify(buildPublicStatePayload('connected'));
    res.write(`data: ${initialPayload}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Get full synchronized backend state
  app.get('/api/portfolio', (_req, res) => {
    res.json(buildPublicStatePayload('snapshot'));
  });

  // Track unique portfolio session visit
  app.post('/api/visit', (_req, res) => {
    store.visitorCount += 1;
    saveCloudStore(store);
    broadcastSyncUpdate('visitor_joined');
    res.json({
      ok: true,
      visitorCount: store.visitorCount,
    });
  });

  // Trigger manual cloud sync & increment counter
  app.post('/api/sync', (req, res) => {
    const commandUsed = Boolean(req.body?.fromTerminal);
    store.syncCount += 1;
    if (commandUsed) {
      store.totalCommandsExecuted += 1;
    }
    store.lastSyncedAt = new Date().toISOString();
    saveCloudStore(store);
    broadcastSyncUpdate('manual_sync');
    res.json({
      ok: true,
      syncCount: store.syncCount,
      visitorCount: store.visitorCount,
      lastSyncedAt: store.lastSyncedAt,
      totalCommandsExecuted: store.totalCommandsExecuted,
    });
  });

  // Persist Explorer custom files, folders, and VS Code Settings Sync
  app.put('/api/workspace', (req, res) => {
    const { customFiles, customFolders, settings } = req.body || {};

    if (customFiles && typeof customFiles === 'object') {
      store.customFiles = customFiles;
    }
    if (Array.isArray(customFolders)) {
      store.customFolders = customFolders.map((f) => String(f).trim()).filter(Boolean);
    }
    if (settings && typeof settings === 'object') {
      store.settings = {
        ...store.settings,
        ...settings,
      };
    }

    store.syncCount += 1;
    store.lastSyncedAt = new Date().toISOString();
    saveCloudStore(store);
    broadcastSyncUpdate('workspace_synced');

    res.json({
      ok: true,
      customFiles: store.customFiles,
      customFolders: store.customFolders,
      settings: store.settings,
      syncCount: store.syncCount,
      lastSyncedAt: store.lastSyncedAt,
    });
  });

  // Star / endorse a project with persistent storage
  app.post('/api/projects/:id/star', (req, res) => {
    const projectId = String(req.params.id || '').toLowerCase();
    if (!['streampulse', 'devdock', 'geolearn'].includes(projectId)) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    store.projectStars[projectId] = (store.projectStars[projectId] || 0) + 1;
    store.syncCount += 1;
    store.lastSyncedAt = new Date().toISOString();
    saveCloudStore(store);
    broadcastSyncUpdate('project_starred');
    res.json({
      ok: true,
      projectId,
      stars: store.projectStars[projectId],
      projectStars: store.projectStars,
    });
  });

  // Retrieve all contact messages for the Explorer Inbox file & Terminal CLI
  app.get('/api/messages', (_req, res) => {
    res.json({
      ok: true,
      messages: store.messages,
      unreadCount: store.messages.filter((m) => !m.read).length,
    });
  });

  // Submit contact message (from Contact page form or Terminal CLI)
  app.post('/api/messages', (req, res) => {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim();
    const message = String(req.body?.message || '').trim();
    const source = req.body?.source === 'terminal' ? 'terminal' : 'form';
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (
      name.length < 1 ||
      name.length > 100 ||
      email.length > 254 ||
      !isValidEmail ||
      message.length < 1 ||
      message.length > 5000
    ) {
      res.status(400).json({
        error:
          'Please provide a valid name, email address, and message (up to 5,000 characters).',
      });
      return;
    }

    const newMsg: ContactMessage = {
      id: `msg-${Date.now()}`,
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
      source,
      read: false,
    };

    store.messages.unshift(newMsg);
    if (store.messages.length > 200) {
      store.messages = store.messages.slice(0, 200);
    }
    store.syncCount += 1;
    store.lastSyncedAt = new Date().toISOString();
    saveCloudStore(store);
    broadcastSyncUpdate('message_received');

    res.status(201).json({
      ok: true,
      message:
        'Thank you! Your message has been synchronized and saved to MD Mustafa Hossain’s Inbox.',
      entry: newMsg,
      messages: store.messages,
    });
  });

  // Toggle or mark a contact message as read
  app.patch('/api/messages/:id/read', (req, res) => {
    const targetId = String(req.params.id || '');
    const target = store.messages.find((m) => m.id === targetId);
    if (!target) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    target.read = typeof req.body?.read === 'boolean' ? req.body.read : !target.read;
    store.syncCount += 1;
    store.lastSyncedAt = new Date().toISOString();
    saveCloudStore(store);
    broadcastSyncUpdate('message_updated');
    res.json({
      ok: true,
      entry: target,
      messages: store.messages,
    });
  });

  // Delete a contact message from the inbox
  app.delete('/api/messages/:id', (req, res) => {
    const targetId = String(req.params.id || '');
    const beforeLen = store.messages.length;
    store.messages = store.messages.filter((m) => m.id !== targetId);
    if (store.messages.length === beforeLen) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    store.syncCount += 1;
    store.lastSyncedAt = new Date().toISOString();
    saveCloudStore(store);
    broadcastSyncUpdate('message_deleted');
    res.json({
      ok: true,
      messages: store.messages,
    });
  });

  // Add a public developer endorsement / guestbook note
  app.post('/api/guestbook', (req, res) => {
    const author = String(req.body?.author || '').trim();
    const role = String(req.body?.role || 'Developer Visitor').trim();
    const comment = String(req.body?.comment || '').trim();

    if (author.length < 1 || author.length > 80 || comment.length < 2 || comment.length > 600) {
      res.status(400).json({
        error: 'Please provide your name and a brief note (2–600 characters).',
      });
      return;
    }

    const newEntry: GuestbookEntry = {
      id: `gb-${Date.now()}`,
      author,
      role: role.slice(0, 80),
      comment,
      createdAt: new Date().toISOString(),
    };

    store.guestbook.unshift(newEntry);
    if (store.guestbook.length > 100) {
      store.guestbook = store.guestbook.slice(0, 100);
    }
    store.syncCount += 1;
    store.lastSyncedAt = new Date().toISOString();
    saveCloudStore(store);
    broadcastSyncUpdate('guestbook_updated');

    res.status(201).json({
      ok: true,
      entry: newEntry,
      guestbook: store.guestbook,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MUSTAFA.dev VS Code Portfolio server listening on http://localhost:${PORT}`);
  });
}

startServer();
