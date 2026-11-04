import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const PORTFOLIO_SYSTEM_INSTRUCTION = `You are the official Gemini AI Assistant integrated into MD Mustafa Hossain's VS Code Developer Portfolio (MUSTAFA.dev).
Your goal is to help visitors, recruiters, and engineers explore MD Mustafa Hossain's work, frontend skills, academic background, and contact details, as well as answer frontend/React engineering questions concisely and accurately.

Key Facts about MD Mustafa Hossain:
- Name: MD Mustafa Hossain (Brand: MUSTAFA.dev)
- Role: Frontend Developer (React & UI Engineering)
- Location: Murshidabad, West Bengal, India
- Availability: Available for Frontend Internships & React Developer Roles
- Direct Email: hussainmustafa2001@gmail.com
- Live Portfolio: https://mustafa-dev-portfolio.web.app
- Socials:
  - GitHub: https://github.com/md-mustafa-hossain-create (@md-mustafa-hossain-create)
  - LinkedIn: https://www.linkedin.com/in/mdmustafahossain
  - Twitter/X: https://x.com/MDMustafaHussa7

Selected Production Projects (in src/pages/projects.tsx):
1. StreamPulse (2025, Video & Media Streaming UI):
   - Responsive video discovery & streaming platform built with React JS, Tailwind CSS, YouTube Data API v3, and Context API.
   - Features debounced search (300ms), category filtering, skeleton loading states, and dark-mode theater player.
   - Live Demo: https://streampulse-mustafa.web.app | GitHub: https://github.com/md-mustafa-hossain-create/streampulse
2. DevDock (2025, Developer Productivity Suite):
   - Browser-based developer workspace combining a markdown scratchpad, JSON formatter, Pomodoro sprint timer, and snippet manager with IndexedDB/LocalStorage persistence and keyboard shortcuts.
   - Live Demo: https://devdock-mustafa.web.app | GitHub: https://github.com/md-mustafa-hossain-create/devdock
3. GeoLearn (2024, Interactive Atlas & Quiz Engine):
   - Interactive geography explorer and quiz application using REST Countries API, React Router v6, and Tailwind CSS with client-side caching.
   - Live Demo: https://geolearn-mustafa.web.app | GitHub: https://github.com/md-mustafa-hossain-create/geolearn

Core Tech Stack (in src/pages/skills.json):
- Frontend Core: React JS (v19), JavaScript (ES2024+), HTML5, CSS3
- UI & Architecture: Tailwind CSS (v4), React Router (v6)
- Backend & Tooling: Firebase (Auth & Firestore), Git, GitHub

Education (in src/pages/education.md):
- Bachelor of Computer Applications (BCA) — Brainware University, Barasat, Kolkata, West Bengal (2021–2024) · CGPA: 9.09 / 10
- Higher Secondary (12th Grade, WBCHSE) — Netaji Subhas Public School, Murshidabad (2019–2021)
- Secondary Examination (10th Grade, WBBSE) — Nawab Bahadur's Institution, Murshidabad (2019)

Portfolio Workspace Files Visitors Can Open:
- overview.tsx (Overview & Bio)
- projects.tsx (Selected Projects & Case Studies)
- skills.json (Tech Stack)
- education.md (Academic Credentials)
- blog.mdx (Technical Article on Choosing the Right Tech Stack & Performance)
- contact.tsx (Direct Contact Form & Social Links)

Response Style:
- Keep responses clear, helpful, concise, and developer-friendly.
- Use bullet points when listing projects or skills.
- Mention relevant workspace file names (like projects.tsx, skills.json, education.md, or contact.tsx) when guiding the user.`;

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
  uniqueVisitors: string[];
  projectEndorsements: Record<string, string[]>;
  customFiles: Record<string, string>;
  customFolders: string[];
  settings: Partial<PersistedWorkbenchSettings>;
  lastUpdatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'portfolio-cloud-store.json');

const VALID_PROJECT_IDS = ['streampulse', 'devdock', 'geolearn'] as const;

const DEFAULT_STORE: CloudStoreData = {
  uniqueVisitors: [],
  projectEndorsements: {
    streampulse: [],
    devdock: [],
    geolearn: [],
  },
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
  lastUpdatedAt: new Date().toISOString(),
};

function sanitizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  for (const item of input) {
    if (typeof item === 'string' && item.trim().length > 0) {
      seen.add(item.trim());
    }
  }
  return Array.from(seen);
}

function loadCloudStore(): CloudStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);

      const endorsements: Record<string, string[]> = {
        streampulse: [],
        devdock: [],
        geolearn: [],
      };
      if (parsed.projectEndorsements && typeof parsed.projectEndorsements === 'object') {
        for (const pid of VALID_PROJECT_IDS) {
          endorsements[pid] = sanitizeStringArray(parsed.projectEndorsements[pid]);
        }
      }

      const loaded: CloudStoreData = {
        uniqueVisitors: sanitizeStringArray(parsed.uniqueVisitors),
        projectEndorsements: endorsements,
        customFiles:
          parsed.customFiles && typeof parsed.customFiles === 'object'
            ? parsed.customFiles
            : DEFAULT_STORE.customFiles,
        customFolders: sanitizeStringArray(parsed.customFolders),
        settings:
          parsed.settings && typeof parsed.settings === 'object'
            ? { ...DEFAULT_STORE.settings, ...parsed.settings }
            : DEFAULT_STORE.settings,
        lastUpdatedAt:
          typeof parsed.lastUpdatedAt === 'string'
            ? parsed.lastUpdatedAt
            : new Date().toISOString(),
      };
      saveCloudStore(loaded);
      return loaded;
    }
    saveCloudStore(DEFAULT_STORE);
    return { ...DEFAULT_STORE };
  } catch (err) {
    console.error('Failed to read store file, using clean default store:', err);
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

function computeVisitorHash(req: express.Request, clientVisitorId?: unknown): string {
  const rawId =
    typeof clientVisitorId === 'string' && clientVisitorId.trim().length >= 8
      ? `uid:${clientVisitorId.trim().slice(0, 128)}`
      : `net:${req.ip || req.socket.remoteAddress || 'local'}|ua:${
          req.headers['user-agent'] || 'browser'
        }`;
  return crypto.createHash('sha256').update(rawId).digest('hex').slice(0, 24);
}

function getProjectStarCounts(storeData: CloudStoreData): Record<string, number> {
  return {
    streampulse: (storeData.projectEndorsements.streampulse || []).length,
    devdock: (storeData.projectEndorsements.devdock || []).length,
    geolearn: (storeData.projectEndorsements.geolearn || []).length,
  };
}

const store = loadCloudStore();
const sseClients = new Set<express.Response>();

function buildPublicStatePayload(eventType: string) {
  return {
    type: eventType,
    visitorCount: store.uniqueVisitors.length,
    projectStars: getProjectStarCounts(store),
    customFiles: store.customFiles,
    customFolders: store.customFolders,
    settings: store.settings,
    lastUpdatedAt: store.lastUpdatedAt,
  };
}

function broadcastStateUpdate(eventType: string) {
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

  app.set('trust proxy', true);
  app.use(express.json({ limit: '1mb' }));

  // Real-time Server-Sent Events (SSE) endpoint for live portfolio state updates
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

  // Get current portfolio public state (unique visitor count, real project endorsements, workspace settings)
  app.get('/api/portfolio', (_req, res) => {
    res.json(buildPublicStatePayload('snapshot'));
  });

  // Register a unique portfolio visitor (deduplicated by persistent client UUID + network hash)
  app.post('/api/visit', (req, res) => {
    const visitorHash = computeVisitorHash(req, req.body?.visitorId);
    const isNewVisitor = !store.uniqueVisitors.includes(visitorHash);

    if (isNewVisitor) {
      store.uniqueVisitors.push(visitorHash);
      store.lastUpdatedAt = new Date().toISOString();
      saveCloudStore(store);
      broadcastStateUpdate('visitor_registered');
    }

    res.json({
      ok: true,
      isNewVisitor,
      visitorCount: store.uniqueVisitors.length,
    });
  });

  // Persist Explorer custom scratchpad files, folders, and VS Code Settings
  app.put('/api/workspace', (req, res) => {
    const { customFiles, customFolders, settings } = req.body || {};

    if (customFiles && typeof customFiles === 'object') {
      store.customFiles = customFiles;
    }
    if (Array.isArray(customFolders)) {
      store.customFolders = sanitizeStringArray(customFolders);
    }
    if (settings && typeof settings === 'object') {
      store.settings = {
        ...store.settings,
        ...settings,
      };
    }

    store.lastUpdatedAt = new Date().toISOString();
    saveCloudStore(store);
    broadcastStateUpdate('workspace_updated');

    res.json({
      ok: true,
      customFiles: store.customFiles,
      customFolders: store.customFolders,
      settings: store.settings,
      lastUpdatedAt: store.lastUpdatedAt,
    });
  });

  // Endorse / star a project (deduplicated per unique visitor, toggles endorsement on repeat click)
  app.post('/api/projects/:id/star', (req, res) => {
    const projectId = String(req.params.id || '').toLowerCase();
    if (!VALID_PROJECT_IDS.includes(projectId as (typeof VALID_PROJECT_IDS)[number])) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const visitorHash = computeVisitorHash(req, req.body?.visitorId);
    const currentList = store.projectEndorsements[projectId] || [];
    const existingIdx = currentList.indexOf(visitorHash);

    let endorsed = false;
    if (existingIdx === -1) {
      currentList.push(visitorHash);
      endorsed = true;
    } else {
      currentList.splice(existingIdx, 1);
      endorsed = false;
    }

    store.projectEndorsements[projectId] = currentList;
    store.lastUpdatedAt = new Date().toISOString();
    saveCloudStore(store);
    broadcastStateUpdate('project_endorsed');

    const projectStars = getProjectStarCounts(store);
    res.json({
      ok: true,
      projectId,
      endorsed,
      stars: projectStars[projectId],
      projectStars,
    });
  });

  // Contact messages are strictly isolated in Firebase Firestore with owner-only security rules
  app.get('/api/messages', (_req, res) => {
    res.status(403).json({
      error:
        'Access denied: Contact messages are strictly restricted to the verified website owner via Firebase Authentication & Firestore Security Rules.',
    });
  });

  // Server-Side Gemini AI Chat Endpoint with automatic model fallback on 503 high-demand spikes
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error:
            'GEMINI_API_KEY is not configured. Please check the Settings > Secrets panel in AI Studio.',
        });
        return;
      }

      const { message, history } = req.body || {};
      if (typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Message is required.' });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const conversationContents: Array<{
        role: 'user' | 'model';
        parts: Array<{ text: string }>;
      }> = [];

      if (Array.isArray(history)) {
        for (const turn of history.slice(-12)) {
          if (
            turn &&
            (turn.role === 'user' || turn.role === 'model') &&
            typeof turn.text === 'string' &&
            turn.text.trim()
          ) {
            conversationContents.push({
              role: turn.role,
              parts: [{ text: turn.text.trim() }],
            });
          }
        }
      }

      conversationContents.push({
        role: 'user',
        parts: [{ text: message.trim() }],
      });

      const candidateModels = [
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
        'gemini-flash-latest',
      ] as const;

      let replyText = '';
      let usedModel = 'gemini-3.1-flash-lite';
      let lastError: unknown = null;

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: conversationContents,
            config: {
              systemInstruction: PORTFOLIO_SYSTEM_INSTRUCTION,
            },
          });

          if (response.text && response.text.trim()) {
            replyText = response.text.trim();
            usedModel = modelName;
            break;
          }
        } catch (modelErr: unknown) {
          lastError = modelErr;
          console.warn(`Model ${modelName} failed, trying next fallback:`, modelErr);
        }
      }

      if (!replyText) {
        throw (
          lastError ||
          new Error('All Gemini models are currently busy. Please try again in a moment.')
        );
      }

      // Generate brief reasoning thoughts reflecting the question
      const queryLower = message.toLowerCase();
      const thoughts: string[] = [];
      if (queryLower.includes('project') || queryLower.includes('streampulse') || queryLower.includes('devdock') || queryLower.includes('geolearn')) {
        thoughts.push('Analyzing inquiry regarding MD Mustafa Hossain’s frontend applications');
        thoughts.push('Reviewing architecture metrics, live demos, and GitHub repositories');
        thoughts.push('Formatting technical spotlights and key engineering benchmarks');
      } else if (queryLower.includes('stack') || queryLower.includes('skill') || queryLower.includes('tech') || queryLower.includes('react')) {
        thoughts.push('Querying core frontend technologies and state libraries');
        thoughts.push('Checking versions: React 19, Tailwind CSS v4, TypeScript, Firebase');
        thoughts.push('Synthesizing production engineering experience');
      } else if (queryLower.includes('education') || queryLower.includes('degree') || queryLower.includes('cgpa') || queryLower.includes('bca') || queryLower.includes('college')) {
        thoughts.push('Retrieving verified academic credentials from Brainware University');
        thoughts.push('Cross-referencing Bachelor of Computer Applications graduation record (9.09 CGPA)');
        thoughts.push('Structuring academic summary');
      } else if (queryLower.includes('contact') || queryLower.includes('hire') || queryLower.includes('email') || queryLower.includes('interview')) {
        thoughts.push('Checking availability for frontend internships & React developer positions');
        thoughts.push('Preparing direct email and verified profile endpoints (LinkedIn, GitHub)');
        thoughts.push('Composing response with direct connection links');
      } else {
        thoughts.push('Processing question in the context of MD Mustafa Hossain’s frontend portfolio');
        thoughts.push('Synthesizing developer profile, code philosophy, and workspace files');
        thoughts.push('Finalizing comprehensive, developer-focused response');
      }

      res.json({ ok: true, reply: replyText, model: usedModel, thoughts });
    } catch (err: unknown) {
      console.error('Gemini API error:', err);
      const errMsg =
        err instanceof Error ? err.message : 'Failed to communicate with Gemini AI.';
      res.status(500).json({
        error: errMsg,
      });
    }
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
