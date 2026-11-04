export interface ProjectMetric {
  label: string;
  value: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  year: string;
  description: string;
  github: string;
  demo: string;
  image: string;
  tags: string[];
  challenge: string;
  solution: string;
  codeSpotlight: string;
  metrics: ProjectMetric[];
  stars: number;
}

export interface PortfolioSkill {
  id: string;
  name: string;
  desc: string;
  category: 'Frontend Core' | 'UI & Architecture' | 'Backend & Tooling';
  experience: string;
  version: string;
  publisher: string;
  logoUrl: string;
  projectsUsed: string[];
  codeExample: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  year: string;
  location: string;
  score?: string;
  highlights: string[];
}

export interface BlogArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  coverImage: string;
  date: string;
  readTime: string;
  content: string;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  folder: 'src/pages' | 'config' | 'workbench';
  language: 'TypeScript React' | 'JSON' | 'Markdown' | 'MDX' | 'Settings UI' | 'Extension';
  extension: 'tsx' | 'ts' | 'json' | 'md' | 'mdx';
  navLabel: string;
  shortcut: string;
  description: string;
  symbols?: Array<{ name: string; kind: 'method' | 'variable' | 'constant' | 'property'; line: number }>;
}

export const DEVELOPER_PROFILE = {
  name: 'MD Mustafa Hossain',
  brandName: 'MUSTAFA.dev',
  title: 'Frontend Developer',
  roleSubtitle: 'React & UI Engineering',
  email: 'hussainmustafa2001@gmail.com',
  location: 'Murshidabad, West Bengal, India',
  educationShort: 'BCA Graduate · Brainware University (9.09 / 10 CGPA)',
  availability: 'Available for Frontend Internships & React Developer Roles',
  avatarUrl: '/assets/profile.webp',
  fallbackAvatarUrl: '/src/assets/images/avatar_mustafa_portrait_1793286955092.jpg',
  resumeUrl: 'https://mustafa-dev-portfolio.web.app/resume.pdf',
  livePortfolioUrl: 'https://mustafa-dev-portfolio.web.app',
  quote: 'Good interfaces should feel obvious to use and straightforward to keep improving.',
  bioHeadline: 'A practical frontend developer who cares about the details',
  leadSubtitle:
    'I build clear, responsive interfaces with React, turning product ideas into focused experiences that are easy to use and maintain.',
  bioParagraphs: [
    'Hello! I am MD Mustafa Hossain, a Frontend Developer based in West Bengal, India, focused on crafting clean, responsive, and accessible web applications.',
    'My passion for web engineering drives me to build intuitive user interfaces where component architecture, state predictability, and visual polish work together seamlessly.',
    'Currently, my primary toolkit centers around React JS and Tailwind CSS. I focus on creating pixel-accurate layouts, fast page-loads, and purposeful micro-interactions.',
    'I am actively seeking Frontend Developer internships and entry-level roles where I can contribute production-ready code, collaborate with engineering teams, and deliver real value to users.',
  ],
  socials: [
    {
      name: 'GitHub',
      handle: '@md-mustafa-hossain-create',
      url: 'https://github.com/md-mustafa-hossain-create',
    },
    {
      name: 'LinkedIn',
      handle: 'in/mdmustafahossain',
      url: 'https://www.linkedin.com/in/mdmustafahossain',
    },
    {
      name: 'Twitter / X',
      handle: '@MDMustafaHussa7',
      url: 'https://x.com/MDMustafaHussa7',
    },
    {
      name: 'Email Direct',
      handle: 'hussainmustafa2001@gmail.com',
      url: 'mailto:hussainmustafa2001@gmail.com',
    },
  ],
  kpiMetrics: [
    { label: 'Core Focus', value: 'React & UI', context: 'Component Architecture & State' },
    { label: 'Selected Projects', value: '03', context: 'StreamPulse · DevDock · GeoLearn' },
    { label: 'Core Technologies', value: '09', context: 'React · JS · Tailwind · Firebase · Git' },
    { label: 'Unique Visitors', value: 'LIVE', context: 'Real-time deduplicated portfolio visitors' },
  ],
};

export const WORKSPACE_FILES: WorkspaceFile[] = [
  {
    id: 'overview.tsx',
    name: 'overview.tsx',
    path: 'src/pages/overview.tsx',
    folder: 'src/pages',
    language: 'TypeScript React',
    extension: 'tsx',
    navLabel: 'Overview',
    shortcut: 'Alt+1',
    description: 'Developer profile, engineering focus, and core UI philosophy.',
    symbols: [
      { name: 'MustafaPortfolioOverview', kind: 'method', line: 6 },
      { name: 'heroProfileCard', kind: 'variable', line: 12 },
      { name: 'portfolioHighlights', kind: 'constant', line: 24 },
      { name: 'aboutMeSection', kind: 'property', line: 34 },
    ],
  },
  {
    id: 'projects.tsx',
    name: 'projects.tsx',
    path: 'src/pages/projects.tsx',
    folder: 'src/pages',
    language: 'TypeScript React',
    extension: 'tsx',
    navLabel: 'Projects',
    shortcut: 'Alt+2',
    description: 'Selected frontend engineering case studies with architecture spotlights and source links.',
    symbols: [
      { name: 'SELECTED_PROJECTS', kind: 'constant', line: 4 },
      { name: 'StreamPulse', kind: 'method', line: 10 },
      { name: 'DevDock', kind: 'method', line: 22 },
      { name: 'GeoLearn', kind: 'method', line: 34 },
    ],
  },
  {
    id: 'skills.json',
    name: 'skills.json',
    path: 'src/pages/skills.json',
    folder: 'src/pages',
    language: 'JSON',
    extension: 'json',
    navLabel: 'Stack',
    shortcut: 'Alt+3',
    description: 'Core frontend technologies, state architecture, and version control tooling.',
    symbols: [
      { name: 'frontendCore', kind: 'property', line: 5 },
      { name: 'uiAndArchitecture', kind: 'property', line: 16 },
      { name: 'backendAndTooling', kind: 'property', line: 28 },
    ],
  },
  {
    id: 'education.md',
    name: 'education.md',
    path: 'src/pages/education.md',
    folder: 'src/pages',
    language: 'Markdown',
    extension: 'md',
    navLabel: 'Academics',
    shortcut: 'Alt+4',
    description: 'Academic credentials at Brainware University, Kolkata and school foundations.',
    symbols: [
      { name: 'Brainware University (BCA · 9.09 CGPA)', kind: 'constant', line: 3 },
      { name: 'Netaji Subhas Public School (12th)', kind: 'property', line: 15 },
      { name: "Nawab Bahadur's Institution (10th)", kind: 'property', line: 24 },
    ],
  },
  {
    id: 'blog.mdx',
    name: 'blog.mdx',
    path: 'src/pages/blog.mdx',
    folder: 'src/pages',
    language: 'MDX',
    extension: 'mdx',
    navLabel: 'Articles',
    shortcut: 'Alt+5',
    description: 'Technical publications and architecture notes on modern React & web performance.',
    symbols: [
      { name: 'frontmatter', kind: 'constant', line: 2 },
      { name: 'Choosing the Right Technology Stack', kind: 'method', line: 14 },
      { name: 'Performance and Application Architecture', kind: 'method', line: 28 },
    ],
  },
  {
    id: 'contact.tsx',
    name: 'contact.tsx',
    path: 'src/pages/contact.tsx',
    folder: 'src/pages',
    language: 'TypeScript React',
    extension: 'tsx',
    navLabel: 'Contact',
    shortcut: 'Alt+6',
    description: 'Direct message form and official social & email endpoints.',
    symbols: [
      { name: 'dispatchDirectMessage', kind: 'method', line: 5 },
      { name: 'directEndpoints', kind: 'constant', line: 20 },
      { name: 'availabilityDetails', kind: 'property', line: 30 },
    ],
  },
  {
    id: 'messages-inbox.json',
    name: 'messages-inbox.json',
    path: 'config/messages-inbox.json',
    folder: 'config',
    language: 'JSON',
    extension: 'json',
    navLabel: 'Inbox',
    shortcut: 'Alt+7',
    description: 'Private owner-only contact inbox protected by Firebase Authentication & Firestore rules.',
    symbols: [
      { name: 'incomingMessages', kind: 'property', line: 4 },
      { name: 'unreadCount', kind: 'constant', line: 12 },
    ],
  },
];

export const INITIAL_PROJECTS: PortfolioProject[] = [
  {
    id: 'streampulse',
    title: 'StreamPulse',
    category: 'Music Streaming App',
    year: '2026',
    description:
      'A music streaming web application built with React, Tailwind CSS, and Firestore, featuring glassmorphism design and custom audio controller node APIs.',
    github: 'https://github.com/md-mustafa-hossain-create/streampulse',
    demo: 'https://streampulse-demo.web.app',
    image: '/src/assets/images/project_streampulse_1793286953084.jpg',
    tags: ['React', 'Tailwind CSS', 'Firebase', 'Web Audio API'],
    challenge:
      'Creating a seamless playback experience across routes with visualizers while managing global state without heavy state-management libraries like Redux.',
    solution:
      'Designed a Context-based React State Provider paired with React Audio Nodes. Leveraged requestAnimationFrame loops to sync canvas visualizers in real-time without blocking UI thread render passes.',
    codeSpotlight: `const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within AudioProvider");
  }
  return context;
};`,
    metrics: [
      { label: 'UI Architecture', value: 'React 19' },
      { label: 'Audio Engine', value: 'Web Audio' },
      { label: 'Cloud Store', value: 'Firestore' },
    ],
    stars: 0,
  },
  {
    id: 'devdock',
    title: 'DevDock',
    category: 'Developer Workspace Tool',
    year: '2026',
    description:
      'An interactive, drag-and-drop workspace app that lets developers build and customize portfolios, complete with custom themes and modular layouts.',
    github: 'https://github.com/md-mustafa-hossain-create/devdock',
    demo: 'https://devdock.web.app',
    image: '/src/assets/images/project_devdock_1793286953830.jpg',
    tags: ['React', 'Drag-and-Drop', 'LocalStorage', 'Tailwind CSS'],
    challenge:
      'Handling fluid visual layouts during drag-and-drop actions on mobile browsers where touch interaction events are heavily throttled.',
    solution:
      'Implemented CSS hardware acceleration will-change flags alongside passive touchstart events. Abstracted dragging calculations into a clean React Hook with requestAnimationFrame lerping.',
    codeSpotlight: `export function useSpringTransition(value: number, stiffness = 0.1) {
  const [current, setCurrent] = useState(value);
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      setCurrent(prev => prev + (value - prev) * stiffness);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, stiffness]);
  return current;
}`,
    metrics: [
      { label: 'UI Architecture', value: 'React 19' },
      { label: 'Interaction', value: 'Drag & Drop' },
      { label: 'State Storage', value: 'LocalStorage' },
    ],
    stars: 0,
  },
  {
    id: 'geolearn',
    title: 'GeoLearn',
    category: 'Gamified Map Platform',
    year: '2025',
    description:
      'An interactive education platform teaching geography through gamified map-based quizzes, dynamic statistics, and localized trivia modules.',
    github: 'https://github.com/md-mustafa-hossain-create/geolearn',
    demo: 'https://geolearn.web.app',
    image: '/src/assets/images/project_geolearn_1793286954644.jpg',
    tags: ['React', 'Leaflet Maps', 'Tailwind CSS', 'Recharts'],
    challenge:
      'Loading high-resolution SVG map elements dynamically without introducing noticeable layout shifts (CLS) on slow mobile connections.',
    solution:
      'Configured pre-sized bounding box elements acting as container targets. Implemented lazy-loaded GeoJSON tiles chunking combined with Web Workers to parse geometry threads.',
    codeSpotlight: `const worker = new Worker(
  new URL('./geoWorker.js', import.meta.url),
  { type: 'module' }
);
worker.postMessage({ geoJsonData, viewportBounds });`,
    metrics: [
      { label: 'Map Engine', value: 'Leaflet.js' },
      { label: 'Data Charts', value: 'Recharts' },
      { label: 'Geometry Data', value: 'GeoJSON' },
    ],
    stars: 0,
  },
];

export const PORTFOLIO_SKILLS: PortfolioSkill[] = [
  {
    id: 'react',
    name: 'React JS',
    desc: 'Component Architecture & State Hooks',
    category: 'Frontend Core',
    experience: 'Primary UI Framework',
    version: 'v19.0.1',
    publisher: 'Meta Open Source',
    logoUrl: '/assets/skills/react.svg',
    projectsUsed: ['StreamPulse', 'DevDock', 'GeoLearn'],
    codeExample: 'const [activeTab, setActiveTab] = useState("overview.tsx");',
  },
  {
    id: 'javascript',
    name: 'JavaScript (ES2024+)',
    desc: 'Async Logic, Web Audio & Workers',
    category: 'Frontend Core',
    experience: 'Core Language',
    version: 'ES2024',
    publisher: 'ECMA International',
    logoUrl: '/assets/skills/javascript.svg',
    projectsUsed: ['StreamPulse', 'DevDock', 'GeoLearn'],
    codeExample: 'const audioCtx = new window.AudioContext();',
  },
  {
    id: 'html5',
    name: 'HTML5',
    desc: 'Semantic Structure & WCAG Accessibility',
    category: 'Frontend Core',
    experience: 'Foundational Standard',
    version: 'v5.3',
    publisher: 'W3C / WHATWG',
    logoUrl: '/assets/skills/html5.svg',
    projectsUsed: ['StreamPulse', 'DevDock', 'GeoLearn'],
    codeExample: '<main role="main" aria-label="Workspace Editor Canvas">',
  },
  {
    id: 'css3',
    name: 'CSS3',
    desc: 'Grid Systems & Hardware-Accelerated Motion',
    category: 'UI & Architecture',
    experience: 'Layout & Visuals',
    version: 'v3.0',
    publisher: 'W3C CSS Working Group',
    logoUrl: '/assets/skills/css3.svg',
    projectsUsed: ['StreamPulse', 'DevDock', 'GeoLearn'],
    codeExample: 'transform: translate3d(0, 0, 0); transition: opacity 150ms cubic-bezier(0.16, 1, 0.3, 1);',
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    desc: 'Rapid Design Systems & Responsive Tokens',
    category: 'UI & Architecture',
    experience: 'Primary Styling Engine',
    version: 'v4.3.3',
    publisher: 'Tailwind Labs',
    logoUrl: '/assets/skills/tailwind.svg',
    projectsUsed: ['StreamPulse', 'DevDock', 'GeoLearn'],
    codeExample: 'className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"',
  },
  {
    id: 'react-router',
    name: 'React Router',
    desc: 'Single Page Navigation & Code Splitting',
    category: 'UI & Architecture',
    experience: 'Client Routing',
    version: 'v7.1.0',
    publisher: 'Remix Software',
    logoUrl: '/assets/skills/react-router.svg',
    projectsUsed: ['StreamPulse', 'GeoLearn'],
    codeExample: 'const ProjectCaseStudy = lazy(() => import("./pages/ProjectCaseStudy"));',
  },
  {
    id: 'firebase',
    name: 'Firebase',
    desc: 'Firestore Real-Time Database & Authentication',
    category: 'Backend & Tooling',
    experience: 'Cloud Persistence',
    version: 'v11.2.0',
    publisher: 'Google Cloud',
    logoUrl: '/assets/skills/firebase.svg',
    projectsUsed: ['StreamPulse', 'MUSTAFA.dev'],
    codeExample: 'await addDoc(collection(db, "messages"), { name, email, message, createdAt });',
  },
  {
    id: 'git',
    name: 'Git',
    desc: 'Distributed Version Control & Branching',
    category: 'Backend & Tooling',
    experience: 'Source Control',
    version: 'v2.47.0',
    publisher: 'Software Freedom Conservancy',
    logoUrl: '/assets/skills/git.svg',
    projectsUsed: ['StreamPulse', 'DevDock', 'GeoLearn'],
    codeExample: 'git checkout -b feat/portfolio-workbench',
  },
  {
    id: 'github',
    name: 'GitHub',
    desc: 'Collaboration, CI Workflows & Code Review',
    category: 'Backend & Tooling',
    experience: 'Repository Hosting',
    version: 'GitHub Cloud',
    publisher: 'GitHub, Inc.',
    logoUrl: '/assets/skills/github.svg',
    projectsUsed: ['StreamPulse', 'DevDock', 'GeoLearn'],
    codeExample: 'https://github.com/md-mustafa-hossain-create',
  },
];

export const EDUCATION_TIMELINE: EducationEntry[] = [
  {
    id: 'bca-brainware',
    institution: 'Brainware University',
    degree: 'Bachelor of Computer Applications (BCA)',
    year: '2024',
    location: 'Kolkata, West Bengal, India',
    score: '9.09 / 10 CGPA',
    highlights: [
      'Graduated with First Class Honors (9.09/10 CGPA) specializing in Web Engineering, Data Structures, and Software Architecture.',
      'Built interactive React & Firebase web applications and led frontend UI engineering for capstone academic projects.',
      'Focused on DOM performance optimization, responsive CSS architecture, and accessible human-computer interaction.',
    ],
  },
  {
    id: 'hs-netaji',
    institution: 'Netaji Subhas Public School',
    degree: 'Higher Secondary (12th)',
    year: '2019',
    location: 'Jiaganj, Murshidabad, India',
    highlights: [
      'Completed Higher Secondary education with a strong foundation in Mathematics, Computer Science fundamentals, and Analytical Problem Solving.',
    ],
  },
  {
    id: 'sec-nawab',
    institution: "Nawab Bahadur's Institution",
    degree: 'Secondary (10th)',
    year: '2017',
    location: 'Lalbagh, Murshidabad, India',
    highlights: [
      'Completed Secondary board examinations at one of Murshidabad’s historic academic institutions.',
    ],
  },
];

export const BLOG_POSTS: BlogArticle[] = [
  {
    id: 'building-modern-portfolio',
    title: 'Building a High-Performance Modern Developer Portfolio from Scratch',
    summary:
      'A behind-the-scenes look at the technologies, architectural decisions, and interactive features behind my developer portfolio, featuring React 19, Tailwind CSS v4, and modern web engineering.',
    category: 'Frontend Engineering',
    tags: ['React 19', 'Tailwind CSS v4', 'Firebase', 'Web Performance'],
    coverImage: '/assets/blog_cover.webp',
    date: 'June 16, 2026',
    readTime: '5 min read',
    content: `A developer portfolio is more than a place to showcase projects or host a resume. It serves as a practical demonstration of technical expertise, design thinking, and problem-solving ability. With that mindset, I approached the development of my latest portfolio with a clear objective: create an experience that goes beyond a traditional static website and reflects my passion for modern frontend development.

This article provides a behind-the-scenes look at the technologies, architectural decisions, and interactive features that shaped the project.

## Choosing the Right Technology Stack

Building a highly interactive and performant application required a modern frontend stack focused on speed, scalability, and maintainability.

### Core Technologies
- **Framework (React 19 + Vite 8)**: React 19 provided the foundation for building a component-driven user interface, while Vite 8 delivered a fast development experience through lightning-fast module replacement and optimized production builds.
- **Styling (Tailwind CSS v4)**: Tailwind CSS enabled rapid development of a consistent design system while making it easy to implement clean surface contrast and responsive layouts across mobile and desktop viewports.
- **Backend & Real-Time Sync**: Cloud persistence handles contact form submissions, unique visitor tracking, and dynamic content updates without page reloads.
- **Testing & Quality**: Components are structured with strict prop validation, keyboard accessibility, and clean error boundaries.

## Performance and Application Architecture

Performance was a key consideration throughout development. The application follows a modular component-based architecture designed to maximize reusability, maintainability, and separation of concerns.

### Page-Level Lazy Loading
To reduce the initial bundle size and improve loading performance, heavier views of the application (such as case studies and article readers) are loaded on demand using React's lazy and Suspense APIs.

### Robust Form & State Handling
The contact module connects directly to our Firebase Firestore persistence layer with strict owner-only security rules, giving visitors immediate confirmation while keeping messages private.`,
  },
];
