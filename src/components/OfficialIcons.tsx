import React, { useState } from 'react';

/**
 * 1. Official VS Code Codicon Helper (`<i class="codicon codicon-...">`)
 * Uses the authentic `@vscode/codicons` icon font loaded in `index.html`.
 */
export const Codicon: React.FC<{
  name: string;
  className?: string;
  title?: string;
  spin?: boolean;
}> = ({ name, className = '', title, spin }) => (
  <i
    className={`codicon codicon-${name} ${
      spin ? 'codicon-modifier-spin' : ''
    } select-none inline-flex items-center justify-center ${className}`}
    title={title}
    aria-hidden={title ? undefined : 'true'}
  />
);

/**
 * Verified Local Official SVG Paths (Priority 1: 0ms load, offline-ready, no network failure)
 */
const LOCAL_SKILL_URLS: Record<string, string> = {
  vscode: '/assets/skills/vscode.svg',
  react: '/assets/skills/react.svg',
  javascript: '/assets/skills/javascript.svg',
  typescript: '/assets/skills/typescript.svg',
  html5: '/assets/skills/html5.svg',
  css3: '/assets/skills/css3.svg',
  tailwind: '/assets/skills/tailwind.svg',
  'react-router': '/assets/skills/react-router.svg',
  firebase: '/assets/skills/firebase.svg',
  git: '/assets/skills/git.svg',
  github: '/assets/skills/github.svg',
};

/**
 * Official Verified CDN Fallback URLs (Priority 2: Devicon & SimpleIcons)
 */
const CDN_SKILL_URLS: Record<string, string> = {
  vscode:
    'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vscode/vscode-original.svg',
  react:
    'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
  javascript:
    'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
  typescript:
    'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg',
  html5:
    'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg',
  css3:
    'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg',
  tailwind:
    'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg',
  'react-router':
    'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/reactrouter/reactrouter-original.svg',
  firebase:
    'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-original.svg',
  git: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg',
  github:
    'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg',
};

/**
 * Verified Local Official VS Code File Icon SVGs (Priority 1: downloaded from vscode-icons repository)
 */
const LOCAL_FILE_URLS: Record<string, string> = {
  tsx: '/assets/files/reactts.svg',
  jsx: '/assets/files/reactts.svg',
  ts: '/assets/files/typescript.svg',
  js: '/assets/files/javascript.svg',
  json: '/assets/files/json.svg',
  md: '/assets/files/markdown.svg',
  mdx: '/assets/files/mdx.svg',
  git: '/assets/files/git.svg',
  npm: '/assets/files/npm.svg',
  config: '/assets/files/settings.svg',
  settings: '/assets/files/settings.svg',
};

const CDN_FILE_URLS: Record<string, string> = {
  tsx: 'https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons/file_type_reactts.svg',
  jsx: 'https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons/file_type_reactjs.svg',
  ts: 'https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons/file_type_typescript_official.svg',
  js: 'https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons/file_type_js_official.svg',
  json: 'https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons/file_type_json.svg',
  md: 'https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons/file_type_markdown.svg',
  mdx: 'https://cdn.jsdelivr.net/gh/gilbarbara/logos@main/logos/mdx.svg',
  git: 'https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons/file_type_git.svg',
  npm: 'https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons/file_type_npm.svg',
  config:
    'https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons/file_type_config.svg',
};

/**
 * 2. Official Visual Studio Code Ribbon Logo (`OfficialVSCodeLogo`)
 * Renders the authentic official Microsoft Visual Studio Code icon from local SVG.
 */
export const OfficialVSCodeLogo: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => {
  const [useFallback, setUseFallback] = useState(false);

  if (!useFallback) {
    return (
      <img
        src="/assets/skills/vscode.svg"
        alt="Visual Studio Code"
        referrerPolicy="no-referrer"
        onError={() => setUseFallback(true)}
        className={`shrink-0 object-contain select-none ${className}`}
      />
    );
  }

  // Exact official Microsoft VS Code vector markup
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <mask id="vsc-m" width="128" height="128" x="0" y="0" maskUnits="userSpaceOnUse">
        <path
          fill="#fff"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M90.767 127.126a7.968 7.968 0 0 0 6.35-.244l26.353-12.681a8 8 0 0 0 4.53-7.209V21.009a8 8 0 0 0-4.53-7.21L97.117 1.12a7.97 7.97 0 0 0-9.093 1.548l-50.45 46.026L15.6 32.013a5.328 5.328 0 0 0-6.807.302l-7.048 6.411a5.335 5.335 0 0 0-.006 7.888L20.796 64 1.74 81.387a5.336 5.336 0 0 0 .006 7.887l7.048 6.411a5.327 5.327 0 0 0 6.807.303l21.974-16.68 50.45 46.025a7.96 7.96 0 0 0 2.743 1.793Zm5.252-92.183L57.74 64l38.28 29.058V34.943Z"
        />
      </mask>
      <g mask="url(#vsc-m)">
        <path
          fill="#0065A9"
          d="M123.471 13.82 97.097 1.12A7.973 7.973 0 0 0 88 2.668L1.662 81.387a5.333 5.333 0 0 0 .006 7.887l7.052 6.411a5.333 5.333 0 0 0 6.811.303l103.971-78.875c3.488-2.646 8.498-.158 8.498 4.22v-.306a8.001 8.001 0 0 0-4.529-7.208Z"
        />
        <path
          fill="#007ACC"
          d="m123.471 114.181-26.374 12.698A7.973 7.973 0 0 1 88 125.333L1.662 46.613a5.333 5.333 0 0 1 .006-7.887l7.052-6.411a5.333 5.333 0 0 1 6.811-.303l103.971 78.874c3.488 2.647 8.498.159 8.498-4.219v.306a8.001 8.001 0 0 1-4.529 7.208Z"
        />
        <path
          fill="#1F9CF0"
          d="M97.098 126.882A7.977 7.977 0 0 1 88 125.333c2.952 2.952 8 .861 8-3.314V5.98c0-4.175-5.048-6.266-8-3.313a7.977 7.977 0 0 1 9.098-1.549L123.467 13.8A8 8 0 0 1 128 21.01v85.982a8 8 0 0 1-4.533 7.21l-26.369 12.681Z"
        />
      </g>
    </svg>
  );
};

/**
 * 3. Official VS Code File Icon Theme (`SetiFileIcon`)
 * Renders authentic official `vscode-icons` SVGs for every file type.
 */
export const SetiFileIcon: React.FC<{
  fileId?: string;
  extension?: string;
  filename?: string;
  className?: string;
}> = ({ fileId = '', extension = '', filename = '', className = 'w-4 h-4' }) => {
  const [failCount, setFailCount] = useState(0);

  const lower = (filename || fileId || `.${extension}`).toLowerCase();
  const ext = extension.toLowerCase();

  let fileKey = 'tsx';
  if (lower.includes('package.json')) {
    fileKey = 'npm';
  } else if (lower.includes('tsconfig') || lower.endsWith('.json')) {
    fileKey = lower.includes('tsconfig') ? 'config' : 'json';
  } else if (lower.startsWith('.git')) {
    fileKey = 'git';
  } else if (ext === 'tsx' || lower.endsWith('.tsx') || ext === 'jsx' || lower.endsWith('.jsx')) {
    fileKey = 'tsx';
  } else if (ext === 'ts' || lower.endsWith('.ts')) {
    fileKey = 'ts';
  } else if (ext === 'js' || lower.endsWith('.js')) {
    fileKey = 'js';
  } else if (ext === 'mdx' || lower.endsWith('.mdx')) {
    fileKey = 'mdx';
  } else if (ext === 'md' || lower.endsWith('.md')) {
    fileKey = 'md';
  } else if (lower.includes('setting') || lower.includes('config')) {
    fileKey = 'settings';
  }

  // Source priority: 1. Local downloaded SVG -> 2. CDN URL -> 3. Codicon
  const primarySrc = LOCAL_FILE_URLS[fileKey];
  const cdnSrc = CDN_FILE_URLS[fileKey];

  if (failCount === 0 && primarySrc) {
    return (
      <img
        src={primarySrc}
        alt=""
        aria-hidden="true"
        onError={() => setFailCount(1)}
        className={`shrink-0 object-contain select-none ${className}`}
      />
    );
  }

  if (failCount === 1 && cdnSrc) {
    return (
      <img
        src={cdnSrc}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        onError={() => setFailCount(2)}
        className={`shrink-0 object-contain select-none ${className}`}
      />
    );
  }

  // Fallback to crisp Codicon
  const codiconMap: Record<string, string> = {
    tsx: 'symbol-react',
    ts: 'symbol-method',
    js: 'symbol-variable',
    json: 'json',
    md: 'markdown',
    mdx: 'markdown',
    git: 'git-merge',
    npm: 'package',
    settings: 'gear',
  };

  return (
    <Codicon
      name={codiconMap[fileKey] || 'file'}
      className={`text-[#858585] ${className}`}
    />
  );
};

/**
 * 4. Official Multi-Color Brand Technology Logos (`OfficialSkillIcon`)
 * Loads authentic Devicon / SimpleIcons SVGs downloaded locally with zero latency,
 * CDN backup, and exact official vector rendering.
 */
export const OfficialSkillIcon: React.FC<{
  skillId: string;
  className?: string;
  theme?: 'dark' | 'light';
}> = ({ skillId, className = 'w-6 h-6', theme = 'dark' }) => {
  const [failCount, setFailCount] = useState(0);

  const normalizedId = skillId.toLowerCase().trim();
  const localSrc = LOCAL_SKILL_URLS[normalizedId];
  const cdnSrc = CDN_SKILL_URLS[normalizedId];

  // For GitHub mark, adjust contrast if in light theme
  const isGithub = normalizedId === 'github';
  const githubClass = isGithub && theme === 'light' ? 'invert-0' : isGithub ? '' : '';

  if (failCount === 0 && localSrc) {
    return (
      <img
        src={localSrc}
        alt={skillId}
        onError={() => setFailCount(1)}
        className={`shrink-0 object-contain select-none ${githubClass} ${className}`}
      />
    );
  }

  if (failCount === 1 && cdnSrc) {
    return (
      <img
        src={cdnSrc}
        alt={skillId}
        referrerPolicy="no-referrer"
        onError={() => setFailCount(2)}
        className={`shrink-0 object-contain select-none ${githubClass} ${className}`}
      />
    );
  }

  // Exact official SimpleIcons / Devicon vector fallback if images blocked
  switch (normalizedId) {
    case 'react':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 128 128"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
        >
          <g fill="#61DAFB">
            <circle cx="64" cy="64" r="11.4" />
            <path d="M107.3 45.2c-2.2-.8-4.5-1.6-6.9-2.3.6-2.4 1.1-4.8 1.5-7.1 2.1-13.2-.2-22.5-6.6-26.1-1.9-1.1-4-1.6-6.4-1.6-7 0-15.9 5.2-24.9 13.9-9-8.7-17.9-13.9-24.9-13.9-2.4 0-4.5.5-6.4 1.6-6.4 3.7-8.7 13-6.6 26.1.4 2.3.9 4.7 1.5 7.1-2.4.7-4.7 1.4-6.9 2.3C8.2 50 1.4 56.6 1.4 64s6.9 14 19.3 18.8c2.2.8 4.5 1.6 6.9 2.3-.6 2.4-1.1 4.8-1.5 7.1-2.1 13.2.2 22.5 6.6 26.1 1.9 1.1 4 1.6 6.4 1.6 7.1 0 16-5.2 24.9-13.9 9 8.7 17.9 13.9 24.9 13.9 2.4 0 4.5-.5 6.4-1.6 6.4-3.7 8.7-13 6.6-26.1-.4-2.3-.9-4.7-1.5-7.1 2.4-.7 4.7-1.4 6.9-2.3 12.5-4.8 19.3-11.4 19.3-18.8s-6.8-14-19.3-18.8z" />
          </g>
        </svg>
      );

    case 'javascript':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 128 128"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
        >
          <path fill="#F0DB4F" d="M1.408 1.408h125.184v125.185H1.408z" />
          <path
            fill="#323330"
            d="M116.347 96.736c-.917-5.711-4.641-10.508-15.672-14.981-3.832-1.761-8.104-3.022-9.377-5.926-.452-1.69-.512-2.642-.226-3.665.821-3.32 4.784-4.355 7.925-3.403 2.023.678 3.938 2.237 5.093 4.724 5.402-3.498 5.391-3.475 9.163-5.879-1.381-2.141-2.118-3.129-3.022-4.045-3.249-3.629-7.676-5.498-14.756-5.355l-3.688.477c-3.534.893-6.902 2.748-8.877 5.235-5.926 6.724-4.236 18.492 2.975 23.335 7.104 5.332 17.54 6.545 18.873 11.531 1.297 6.104-4.486 8.08-10.234 7.378-4.236-.881-6.592-3.034-9.139-6.949-4.688 2.713-4.688 2.713-9.508 5.485 1.143 2.499 2.344 3.63 4.26 5.795 9.068 9.198 31.76 8.746 35.83-5.176.165-.478 1.261-3.666.38-8.581zM69.462 58.943H57.753l-.048 30.272c0 6.438.333 12.34-.714 14.149-1.713 3.558-6.152 3.117-8.175 2.427-2.059-1.012-3.106-2.451-4.319-4.485-.333-.584-.583-1.036-.667-1.071l-9.52 5.83c1.583 3.249 3.915 6.069 6.902 7.901 4.462 2.678 10.459 3.499 16.731 2.059 4.082-1.189 7.604-3.652 9.448-7.401 2.666-4.915 2.094-10.864 2.07-17.444.06-10.735.001-21.468.001-32.237z"
          />
        </svg>
      );

    case 'tailwind':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 128 128"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
        >
          <path
            d="M64.004 25.602c-17.067 0-27.73 8.53-32 25.597 6.398-8.531 13.867-11.73 22.398-9.597 4.871 1.214 8.352 4.746 12.207 8.66C72.883 56.629 80.145 64 96.004 64c17.066 0 27.73-8.531 32-25.602-6.399 8.536-13.867 11.735-22.399 9.602-4.87-1.215-8.347-4.746-12.207-8.66-6.27-6.367-13.53-13.738-29.394-13.738zM32.004 64c-17.066 0-27.73 8.531-32 25.602C6.402 81.066 13.87 77.867 22.402 80c4.871 1.215 8.352 4.746 12.207 8.66 6.274 6.367 13.536 13.738 29.395 13.738 17.066 0 27.73-8.53 32-25.597-6.399 8.531-13.867 11.73-22.399 9.597-4.87-1.214-8.347-4.746-12.207-8.66C55.128 71.371 47.868 64 32.004 64zm0 0"
            fill="#38bdf8"
          />
        </svg>
      );

    case 'firebase':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 128 128"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
        >
          <path fill="#ffa000" d="M17.474 103.276 33.229 2.462a2.91 2.91 0 0 1 5.44-.924l16.294 30.39 6.494-12.366a2.91 2.91 0 0 1 5.15 0l43.97 83.714H17.474Z" />
          <path fill="#f57c00" d="M71.903 64.005 54.955 31.913l-37.481 71.363Z" />
          <path fill="#ffca28" d="M110.577 103.276 98.51 28.604a2.913 2.913 0 0 0-1.984-2.286 2.906 2.906 0 0 0-2.94.714l-76.112 76.243 42.115 23.618a8.728 8.728 0 0 0 8.51 0l42.478-23.618Z" />
        </svg>
      );

    case 'git':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 128 128"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
        >
          <path
            fill="#F05032"
            d="M124.6 57.3L70.7 3.4c-4.5-4.5-11.8-4.5-16.3 0L39.8 17.9l17.8 17.8c4.3-.8 8.8.5 12 3.7 3.2 3.2 4.4 7.6 3.7 11.9l17.2 17.2c4.3-.7 8.7.5 11.9 3.7 4.5 4.5 4.5 11.8 0 16.3-4.5 4.5-11.8 4.5-16.3 0-3.3-3.3-4.5-7.8-3.6-12.1L66.7 60.3v34.3c.9.5 1.8 1.1 2.6 1.9 4.5 4.5 4.5 11.8 0 16.3s-11.8 4.5-16.3 0-4.5-11.8 0-16.3c1.1-1.1 2.4-1.9 3.8-2.4V59.4c-1.4-.5-2.7-1.3-3.8-2.4-3.4-3.4-4.5-8.1-3.4-12.5L32.8 27 3.4 56.4c-4.5 4.5-4.5 11.8 0 16.3l53.9 53.9c4.5 4.5 11.8 4.5 16.3 0l51-51c4.5-4.4 4.5-11.8 0-16.3z"
          />
        </svg>
      );

    case 'html5':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 128 128"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
        >
          <path d="M19.387 11.488h89.226l-8.118 90.963-36.46 10.125-36.564-10.14-8.084-90.948z" fill="#E44D26" />
          <path d="M64.035 104.398l29.418-8.156 6.945-77.742H64.035v85.898z" fill="#F16529" />
          <path d="M64.035 52.887H47.887l-1.117-12.535h34.527V27.426H33.844l3.352 37.957h26.839v-12.496zm0 28.539l-.086.023-14.074-3.8-1.02-11.422H36.312l1.996 22.375 25.641 7.121.086-.023V81.426z" fill="#EBEBEB" />
          <path d="M63.992 52.887v12.496h14.887l-1.402 15.695-13.484 3.645v12.723l25.637-7.117.156-1.742 2.871-32.148.336-3.551H63.992zm0-25.461v12.926h30.082l1.152-12.926H63.992z" fill="#FFF" />
        </svg>
      );

    case 'css3':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 128 128"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
        >
          <path d="M19.387 11.488h89.226l-8.118 90.963-36.46 10.125-36.564-10.14-8.084-90.948z" fill="#1572B6" />
          <path d="M64.035 104.398l29.418-8.156 6.945-77.742H64.035v85.898z" fill="#33A9DC" />
          <path d="M64.035 52.887H47.887l-1.117-12.535h34.527V27.426H33.844l3.352 37.957h26.839v-12.496zm0 28.539l-.086.023-14.074-3.8-1.02-11.422H36.312l1.996 22.375 25.641 7.121.086-.023V81.426z" fill="#EBEBEB" />
          <path d="M63.992 52.887v12.496h14.887l-1.402 15.695-13.484 3.645v12.723l25.637-7.117.156-1.742 2.871-32.148.336-3.551H63.992zm0-25.461v12.926h30.082l1.152-12.926H63.992z" fill="#FFF" />
        </svg>
      );

    case 'github':
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 128 128"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
        >
          <g fill={theme === 'light' ? '#24292F' : '#FFFFFF'}>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M64 5.103c-33.347 0-60.388 27.035-60.388 60.388 0 26.682 17.303 49.317 41.297 57.303 3.017.56 4.125-1.31 4.125-2.905 0-1.44-.056-6.197-.082-11.243-16.8 3.653-20.345-7.125-20.345-7.125-2.747-6.98-6.705-8.836-6.705-8.836-5.48-3.748.413-3.67.413-3.67 6.063.425 9.257 6.223 9.257 6.223 5.386 9.23 14.127 6.562 17.573 5.02.542-3.903 2.107-6.568 3.834-8.076-13.413-1.525-27.514-6.704-27.514-29.843 0-6.593 2.36-11.98 6.223-16.21-.628-1.52-2.695-7.662.584-15.98 0 0 5.07-1.623 16.61 6.19C53.7 35 58.867 34.327 64 34.304c5.13.023 10.3.694 15.127 2.033 11.526-7.813 16.59-6.19 16.59-6.19 3.287 8.317 1.22 14.46.593 15.98 3.872 4.23 6.215 9.617 6.215 16.21 0 23.194-14.127 28.3-27.574 29.796 2.167 1.874 4.097 5.55 4.097 11.183 0 8.08-.07 14.583-.07 16.572 0 1.607 1.088 3.49 4.148 2.897 23.98-7.994 41.263-30.622 41.263-57.294C124.388 32.14 97.35 5.104 64 5.104z"
            />
          </g>
        </svg>
      );
  }
};

/**
 * 5. Official Google Gemini Logo (`OfficialGeminiLogo`)
 * Renders the authentic Google Gemini AI Sparkle vector from local downloaded asset.
 */
export const OfficialGeminiLogo: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => {
  const [failCount, setFailCount] = useState(0);

  if (failCount === 0) {
    return (
      <img
        src="/assets/gemini.svg"
        alt="Google Gemini AI"
        onError={() => setFailCount(1)}
        className={`shrink-0 object-contain select-none ${className}`}
      />
    );
  }

  if (failCount === 1) {
    return (
      <img
        src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg"
        alt="Google Gemini AI"
        referrerPolicy="no-referrer"
        onError={() => setFailCount(2)}
        className={`shrink-0 object-contain select-none ${className}`}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 28 28"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id="official-gemini-spark"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(2.77876 11.3795) rotate(18.6832) scale(29.8025 238.737)"
        >
          <stop offset="0.0671246" stopColor="#9168C0" />
          <stop offset="0.342551" stopColor="#5684D1" />
          <stop offset="0.672076" stopColor="#1BA1E3" />
        </radialGradient>
      </defs>
      <path
        d="M14 28C14 26.0633 13.6267 24.2433 12.88 22.54C12.1567 20.8367 11.165 19.355 9.905 18.095C8.645 16.835 7.16333 15.8433 5.46 15.12C3.75667 14.3733 1.93667 14 0 14C1.93667 14 3.75667 13.6383 5.46 12.915C7.16333 12.1683 8.645 11.165 9.905 9.905C11.165 8.645 12.1567 7.16333 12.88 5.46C13.6267 3.75667 14 1.93667 14 0C14 1.93667 14.3617 3.75667 15.085 5.46C15.8317 7.16333 16.835 8.645 18.095 9.905C19.355 11.165 20.8367 12.1683 22.54 12.915C24.2433 13.6383 26.0633 14 28 14C26.0633 14 24.2433 14.3733 22.54 15.12C20.8367 15.8433 19.355 16.835 18.095 18.095C16.835 19.355 15.8317 20.8367 15.085 22.54C14.3617 24.2433 14 26.0633 14 28Z"
        fill="url(#official-gemini-spark)"
      />
    </svg>
  );
};
