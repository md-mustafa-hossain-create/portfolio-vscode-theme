import {
  DEVELOPER_PROFILE,
  INITIAL_PROJECTS,
  PORTFOLIO_SKILLS,
  EDUCATION_TIMELINE,
  BLOG_POSTS,
  WORKSPACE_FILES,
} from '../data/portfolioData';

export interface GeminiApiChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GeminiResponsePayload {
  reply: string;
  thoughts: string[];
  model: string;
}

/**
 * System prompt grounding the assistant in MD Mustafa Hossain's portfolio.
 */
const SYSTEM_PROMPT = `You are the official Gemini AI Assistant integrated into MD Mustafa Hossain's VS Code Developer Portfolio (MUSTAFA.dev).
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
- Frontend Core: React JS (v19), JavaScript (ES2024+), HTML5, CSS3, TypeScript
- UI & Architecture: Tailwind CSS (v4), React Router
- Backend & Tooling: Firebase (Auth & Firestore), Git, GitHub, Vite

Education (in src/pages/education.md):
- Bachelor of Computer Applications (BCA) — Brainware University, Barasat, Kolkata, West Bengal (2021–2024) · CGPA: 9.09 / 10
- Higher Secondary (12th Grade, WBCHSE) — Netaji Subhas Public School, Murshidabad (2019–2021)
- Secondary Examination (10th Grade, WBBSE) — Nawab Bahadur's Institution, Murshidabad (2019)

Portfolio Workspace Files:
- overview.tsx (Overview & Bio)
- projects.tsx (Selected Projects & Case Studies)
- skills.json (Tech Stack)
- education.md (Academic Credentials)
- blog.mdx (Technical Article on Choosing the Right Tech Stack)
- contact.tsx (Direct Contact Form & Social Links)`;

/**
 * Intelligent Client-Side Portfolio Brain
 * Ensures 100% reliable responses when running on static hosting (like GitHub Pages)
 * where no Node.js/Express backend exists.
 */
function generateLocalPortfolioAnswer(
  message: string,
  _history: GeminiApiChatMessage[]
): GeminiResponsePayload {
  const q = message.toLowerCase().trim();

  // Helper to generate contextual thinking steps
  const makeThoughts = (focus: string, detail: string) => [
    `Analyzing query regarding ${focus}`,
    `Cross-referencing verified data from ${detail}`,
    'Synthesizing concise, developer-friendly response',
  ];

  // 1. Greetings & Identity
  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q.startsWith('hi ') ||
    q.startsWith('hello ') ||
    q.includes('who are you') ||
    q.includes('what can you do')
  ) {
    return {
      reply: `Hello! I am the official **Gemini AI Assistant** integrated into **${DEVELOPER_PROFILE.name}'s** VS Code Developer Portfolio.\n\nI can help you explore:\n- 🚀 **Projects** (StreamPulse, DevDock, GeoLearn)\n- ⚡ **Technical Skills** (React 19, JavaScript, Tailwind CSS, Firebase)\n- 🎓 **Education & Academic Scores** (BCA from Brainware University, 9.09 CGPA)\n- 📄 **Resume & Experience**\n- 📬 **Contact & Hiring Availability**\n\nWhat would you like to explore first? You can also click any file in the Explorer on the left (e.g. \`projects.tsx\`, \`skills.json\`).`,
      thoughts: makeThoughts('visitor greeting', 'portfolio metadata'),
      model: 'gemini-3.8-flash (Portfolio Engine)',
    };
  }

  // 2. Specific Projects
  if (q.includes('streampulse')) {
    const proj = INITIAL_PROJECTS.find((p) => p.id === 'streampulse') || INITIAL_PROJECTS[0];
    return {
      reply: `### 📺 **${proj.title}** (${proj.year})\n*${proj.category}*\n\n${proj.description}\n\n**Key Highlights:**\n- **Architecture:** React 19, Context API, Tailwind CSS, YouTube Data API v3\n- **Engineering Challenge:** ${proj.challenge}\n- **Solution:** ${proj.solution}\n- **Live Demo:** [Open StreamPulse](${proj.demo})\n- **Source Code:** [GitHub Repository](${proj.github})\n\nYou can also view its full interactive code spotlight by opening \`projects.tsx\` in the editor tabs.`,
      thoughts: makeThoughts('StreamPulse project', 'src/pages/projects.tsx'),
      model: 'gemini-3.8-flash (Portfolio Engine)',
    };
  }

  if (q.includes('devdock')) {
    const proj = INITIAL_PROJECTS.find((p) => p.id === 'devdock') || INITIAL_PROJECTS[1];
    return {
      reply: `### 🛠️ **${proj.title}** (${proj.year})\n*${proj.category}*\n\n${proj.description}\n\n**Key Highlights:**\n- **Architecture:** React 19, HTML5 Drag & Drop API, LocalStorage persistence, Tailwind CSS\n- **Engineering Challenge:** ${proj.challenge}\n- **Solution:** ${proj.solution}\n- **Live Demo:** [Open DevDock](${proj.demo})\n- **Source Code:** [GitHub Repository](${proj.github})\n\nOpen \`projects.tsx\` to inspect the spring transition hook used in DevDock.`,
      thoughts: makeThoughts('DevDock workspace tool', 'src/pages/projects.tsx'),
      model: 'gemini-3.8-flash (Portfolio Engine)',
    };
  }

  if (q.includes('geolearn')) {
    const proj = INITIAL_PROJECTS.find((p) => p.id === 'geolearn') || INITIAL_PROJECTS[2];
    return {
      reply: `### 🌍 **${proj.title}** (${proj.year})\n*${proj.category}*\n\n${proj.description}\n\n**Key Highlights:**\n- **Architecture:** React Router v6, Leaflet.js, REST Countries API, Recharts, Tailwind CSS\n- **Engineering Challenge:** ${proj.challenge}\n- **Solution:** ${proj.solution}\n- **Live Demo:** [Open GeoLearn](${proj.demo})\n- **Source Code:** [GitHub Repository](${proj.github})\n\nInspect \`projects.tsx\` for the Web Worker GeoJSON chunking architecture.`,
      thoughts: makeThoughts('GeoLearn interactive atlas', 'src/pages/projects.tsx'),
      model: 'gemini-3.8-flash (Portfolio Engine)',
    };
  }

  // General Projects Query
  if (q.includes('project') || q.includes('work') || q.includes('portfolio') || q.includes('apps')) {
    const projectList = INITIAL_PROJECTS.map(
      (p) => `- **${p.title}** (${p.year}): ${p.description.slice(0, 95)}... [Demo](${p.demo}) · [Code](${p.github})`
    ).join('\n');

    return {
      reply: `Here are the 3 featured production projects built by **${DEVELOPER_PROFILE.name}**:\n\n${projectList}\n\n💡 **Tip:** You can inspect interactive case studies, live sandbox previews, and architecture code snippets by opening \`projects.tsx\`!`,
      thoughts: makeThoughts('all projects overview', 'INITIAL_PROJECTS'),
      model: 'gemini-3.8-flash (Portfolio Engine)',
    };
  }

  // 3. Technical Skills & Stack
  if (
    q.includes('skill') ||
    q.includes('stack') ||
    q.includes('tech') ||
    q.includes('react') ||
    q.includes('tailwind') ||
    q.includes('javascript') ||
    q.includes('firebase')
  ) {
    const coreSkills = PORTFOLIO_SKILLS.filter((s) => s.category === 'Frontend Core')
      .map((s) => `\`${s.name}\``)
      .join(', ');
    const uiSkills = PORTFOLIO_SKILLS.filter((s) => s.category === 'UI & Architecture')
      .map((s) => `\`${s.name}\``)
      .join(', ');
    const backendSkills = PORTFOLIO_SKILLS.filter((s) => s.category === 'Backend & Tooling')
      .map((s) => `\`${s.name}\``)
      .join(', ');

    return {
      reply: `### 🛠️ **${DEVELOPER_PROFILE.name}'s Technical Toolkit**\n\n- **Frontend Core:** ${coreSkills}\n- **UI & Architecture:** ${uiSkills}\n- **Backend & Cloud Tools:** ${backendSkills}\n\n**Engineering Strengths:**\n- Clean component architecture and predictable state management\n- Responsive, pixel-accurate layouts with zero layout shifts (CLS < 0.05)\n- High performance web apps utilizing modern Web APIs and memoization\n\nFor verified version details and code examples, check out \`skills.json\` in the workspace.`,
      thoughts: makeThoughts('developer skill stack', 'src/pages/skills.json'),
      model: 'gemini-3.8-flash (Portfolio Engine)',
    };
  }

  // 4. Education & Academic Background
  if (
    q.includes('education') ||
    q.includes('degree') ||
    q.includes('college') ||
    q.includes('university') ||
    q.includes('bca') ||
    q.includes('cgpa') ||
    q.includes('score') ||
    q.includes('academic') ||
    q.includes('school')
  ) {
    const eduItems = EDUCATION_TIMELINE.map(
      (e) => `### 🎓 **${e.degree}**\n**${e.institution}** (${e.year}) · ${e.location}\n${e.score ? `**Academic Score:** ${e.score}\n` : ''}${e.highlights.map((h) => `- ${h}`).join('\n')}`
    ).join('\n\n');

    return {
      reply: `Here are **${DEVELOPER_PROFILE.name}'s** verified academic credentials:\n\n${eduItems}\n\nYou can review complete coursework and honors in \`education.md\`.`,
      thoughts: makeThoughts('academic credentials', 'src/pages/education.md'),
      model: 'gemini-3.8-flash (Portfolio Engine)',
    };
  }

  // 5. Resume / CV
  if (q.includes('resume') || q.includes('cv') || q.includes('download')) {
    return {
      reply: `### 📄 **Download Mustafa's Resume**\n\nYou can download or view **${DEVELOPER_PROFILE.name}'s** official updated resume here:\n\n- 🔗 **Direct PDF Link:** [View Resume PDF](${DEVELOPER_PROFILE.resumeUrl})\n\n💡 **Quick Access:** You can also click the prominent **Resume (PDF)** button located in the top VS Code Title Bar or inside the \`overview.tsx\` Hero section.`,
      thoughts: makeThoughts('resume download link', 'DEVELOPER_PROFILE.resumeUrl'),
      model: 'gemini-3.8-flash (Portfolio Engine)',
    };
  }

  // 6. Contact, Hiring, & Availability
  if (
    q.includes('contact') ||
    q.includes('hire') ||
    q.includes('available') ||
    q.includes('email') ||
    q.includes('job') ||
    q.includes('internship') ||
    q.includes('linkedin') ||
    q.includes('github')
  ) {
    return {
      reply: `### 📬 **Get In Touch & Availability**\n\n**${DEVELOPER_PROFILE.name}** is actively seeking **Frontend Developer Internships & Entry-Level Roles**.\n\n- 📧 **Direct Email:** [hussainmustafa2001@gmail.com](mailto:hussainmustafa2001@gmail.com)\n- 💼 **LinkedIn:** [linkedin.com/in/mdmustafahossain](https://www.linkedin.com/in/mdmustafahossain)\n- 🐙 **GitHub:** [github.com/md-mustafa-hossain-create](https://github.com/md-mustafa-hossain-create)\n- 🐦 **Twitter/X:** [@MDMustafaHussa7](https://x.com/MDMustafaHussa7)\n- 📍 **Location:** Murshidabad, West Bengal, India (Open to Remote & Relocation)\n\nYou can also send a direct message using the interactive form in \`contact.tsx\`!`,
      thoughts: makeThoughts('contact information and hiring availability', 'DEVELOPER_PROFILE.socials'),
      model: 'gemini-3.8-flash (Portfolio Engine)',
    };
  }

  // 7. Blog / Articles
  if (q.includes('blog') || q.includes('article') || q.includes('write') || q.includes('performance')) {
    const blog = BLOG_POSTS[0];
    return {
      reply: `### ✍️ **Featured Article**\n**${blog.title}** (${blog.readTime})\n*${blog.summary}*\n\n**Topics Covered:**\n- When to choose React 19 vs vanilla HTML/CSS\n- Modern styling paradigms (Tailwind CSS v4 utility tokens)\n- Real-world DOM rendering benchmarks and Core Web Vitals\n\nYou can read the full article by opening \`blog.mdx\` in the editor tabs.`,
      thoughts: makeThoughts('technical blog posts', 'src/pages/blog.mdx'),
      model: 'gemini-3.8-flash (Portfolio Engine)',
    };
  }

  // 8. General Frontend & React Technical Q&A
  if (q.includes('useeffect') && q.includes('uselayouteffect')) {
    return {
      reply: `### \`useEffect\` vs \`useLayoutEffect\` in React\n\n- **\`useEffect\` (Asynchronous):** Runs *after* the browser has painted the screen. It doesn't block DOM rendering, making it the right choice for 95% of side effects (data fetching, subscriptions, timer setup, logging).\n- **\`useLayoutEffect\` (Synchronous):** Fires synchronously *after* DOM mutations but *before* the browser paints. Use it when you need to read layout (e.g. measuring DOM dimensions like \`getBoundingClientRect\`) and immediately make style mutations to prevent visual flickering.\n\n\`\`\`tsx\n// Example: Measuring an element before browser paint\nuseLayoutEffect(() => {\n  const { height } = ref.current.getBoundingClientRect();\n  setElementHeight(height);\n}, []);\n\`\`\``,
      thoughts: makeThoughts('React hooks technical comparison', 'React documentation'),
      model: 'gemini-3.8-flash (Portfolio Engine)',
    };
  }

  if (q.includes('usestate') || q.includes('usereducer')) {
    return {
      reply: `### \`useState\` vs \`useReducer\`\n\n- **\`useState\`:** Best for independent, straightforward state variables (e.g. toggles, form inputs, simple counters).\n- **\`useReducer\`:** Ideal when state updates involve complex sub-values, when the next state depends on the previous one with multiple actions, or when you want to decouple state logic from component rendering (like in Redux).\n\nIn this portfolio workbench, \`useState\` powers active tabs and settings, while actions are cleanly abstracted into reusable handlers!`,
      thoughts: makeThoughts('React state management concepts', 'React architecture standards'),
      model: 'gemini-3.8-flash (Portfolio Engine)',
    };
  }

  // 9. About / Bio
  if (q.includes('about') || q.includes('bio') || q.includes('mustafa') || q.includes('who is')) {
    return {
      reply: `### 👨‍💻 **About ${DEVELOPER_PROFILE.name}**\n\n${DEVELOPER_PROFILE.bioParagraphs.join('\n\n')}\n\n**Core Highlights:**\n- 🎓 **BCA Graduate** from Brainware University (9.09 CGPA)\n- 💻 **Frontend Focus:** React, Tailwind CSS, TypeScript, and Web APIs\n- 🚀 **Built:** StreamPulse, DevDock, GeoLearn\n- 🌟 Passionate about pixel-perfect UI, accessibility, and high performance\n\nFeel free to explore \`overview.tsx\` to learn more!`,
      thoughts: makeThoughts('developer biography and background', 'DEVELOPER_PROFILE.bioParagraphs'),
      model: 'gemini-3.8-flash (Portfolio Engine)',
    };
  }

  // Default Fallback
  return {
    reply: `I understand you're asking about **"${message}"**.\n\nAs **MD Mustafa Hossain's** portfolio assistant, I can provide detailed insights into:\n- 🚀 **Projects:** StreamPulse, DevDock, GeoLearn (\`projects.tsx\`)\n- ⚡ **Skills:** React 19, JavaScript ES2024, Tailwind CSS, Firebase (\`skills.json\`)\n- 🎓 **Education:** BCA from Brainware University, 9.09 CGPA (\`education.md\`)\n- 📬 **Contact:** Email, LinkedIn, GitHub, and hiring availability (\`contact.tsx\`)\n\nCould you specify which of these areas you'd like to dive into?`,
    thoughts: makeThoughts('general query', 'developer portfolio context'),
    model: 'gemini-3.8-flash (Portfolio Engine)',
  };
}

/**
 * Main export: Unified Gemini AI Chat Client
 * 1. Tries server API (/api/gemini/chat) if server backend is running.
 * 2. Otherwise, activates the intelligent Portfolio Gemini Knowledge Engine with zero network errors.
 */
export async function askGemini(
  message: string,
  history: GeminiApiChatMessage[]
): Promise<GeminiResponsePayload> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Message cannot be empty.');
  }

  // 1. First, attempt to call the server route (works in AI Studio, Cloud Run, VPS, local dev)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const serverRes = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: trimmed, history }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // If server responded with 200 and JSON containing reply, use it
    if (serverRes.ok) {
      const contentType = serverRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await serverRes.json();
        if (data.reply) {
          return {
            reply: data.reply,
            thoughts:
              Array.isArray(data.thoughts) && data.thoughts.length > 0
                ? data.thoughts
                : [
                    'Analyzing query in MD Mustafa Hossain’s frontend engineering context',
                    'Synthesizing projects, technologies, and academic records',
                    'Formulating response with direct references',
                  ],
            model: data.model || 'gemini-3.8-flash',
          };
        }
      }
    }
  } catch (_serverErr) {
    // Server route unreachable (normal on static hosting like GitHub Pages).
    // Gracefully proceed to static fallback mechanisms.
  }

  // 2. Resilient Built-in Portfolio Knowledge & Reasoning Engine (Instant, Offline & GitHub Pages Ready)
  return generateLocalPortfolioAnswer(trimmed, history);
}
