import React, { useState, useRef } from 'react';
import { Codicon, SetiFileIcon } from './OfficialIcons';
import {
  DEVELOPER_PROFILE,
  PortfolioProject,
  PORTFOLIO_SKILLS,
  EDUCATION_TIMELINE,
  BLOG_POSTS,
} from '../data/portfolioData';

interface SourceCodeViewProps {
  activeFile: string;
  projects: PortfolioProject[];
  theme: 'dark' | 'light';
  customFiles?: Record<string, string>;
  messages?: Array<{
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: string;
    source: string;
    read: boolean;
  }>;
  cursorPos?: { line: number; col: number };
  cursorStyle?: 'block' | 'line' | 'underline';
  cursorBlinking?: 'smooth' | 'blink' | 'solid';
  onCursorChange?: (line: number, col: number) => void;
}

export const SourceCodeView: React.FC<SourceCodeViewProps> = ({
  activeFile,
  projects,
  theme,
  customFiles = {},
  messages = [],
  cursorPos = { line: 1, col: 1 },
  cursorStyle = 'block',
  cursorBlinking = 'smooth',
  onCursorChange,
}) => {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const generateSourceString = (): string => {
    if (customFiles[activeFile] !== undefined) {
      return customFiles[activeFile];
    }

    if (activeFile.startsWith('extension:')) {
      const skillId = activeFile.replace('extension:', '');
      const skill =
        PORTFOLIO_SKILLS.find((s) => s.id === skillId) || PORTFOLIO_SKILLS[0];
      return JSON.stringify(
        {
          identifier: `mustafa.${skill.id}`,
          displayName: skill.name,
          version: skill.version,
          publisher: skill.publisher,
          description: skill.desc,
          category: skill.category,
          downloads: skill.downloads,
          rating: skill.rating,
          projectsUsed: skill.projectsUsed,
          codeExample: skill.codeExample,
        },
        null,
        2
      );
    }

    switch (activeFile) {
      case 'overview.tsx':
        return `import React from 'react';
import { DeveloperProfile, AcademicRecord } from '@mustafa/types';

/**
 * ${DEVELOPER_PROFILE.name} — ${DEVELOPER_PROFILE.title} (${DEVELOPER_PROFILE.roleSubtitle})
 * Location: ${DEVELOPER_PROFILE.location}
 * Education: ${DEVELOPER_PROFILE.educationShort}
 */
export const MUSTAFA_PROFILE: DeveloperProfile = {
  name: "${DEVELOPER_PROFILE.name}",
  brand: "${DEVELOPER_PROFILE.brandName}",
  role: "${DEVELOPER_PROFILE.title} / ${DEVELOPER_PROFILE.roleSubtitle}",
  email: "${DEVELOPER_PROFILE.email}",
  location: "${DEVELOPER_PROFILE.location}",
  education: {
    degree: "Bachelor of Computer Applications (BCA)",
    university: "Brainware University, West Bengal, India",
    cgpa: 9.09,
    scale: 10.0,
    graduated: 2024,
  },
  availability: "${DEVELOPER_PROFILE.availability}",
  philosophy: "${DEVELOPER_PROFILE.quote}",
  socials: {
    github: "https://github.com/md-mustafa-hossain-create",
    linkedin: "https://www.linkedin.com/in/mdmustafahossain",
    twitter: "https://x.com/MDMustafaHussa7",
    portfolio: "${DEVELOPER_PROFILE.livePortfolioUrl}"
  }
};

export default function OverviewWorkspace() {
  return (
    <main className="vscode-editor-surface">
      <h1>{MUSTAFA_PROFILE.name}</h1>
      <p>{MUSTAFA_PROFILE.role}</p>
      <blockquote>{MUSTAFA_PROFILE.philosophy}</blockquote>
    </main>
  );
}`;

      case 'projects.tsx':
        return `import { PortfolioProject } from '@mustafa/types';

// Production Web Applications by MD Mustafa Hossain
export const PRODUCTION_PROJECTS: PortfolioProject[] = ${JSON.stringify(
          projects.map((p) => ({
            id: p.id,
            title: p.title,
            category: p.category,
            year: p.year,
            tags: p.tags,
            github: p.github,
            demo: p.demo,
            metrics: p.metrics,
            stars: p.stars,
          })),
          null,
          2
        )};`;

      case 'skills.json':
        return JSON.stringify(
          {
            $schema: 'https://mustafa-dev-portfolio.web.app/schemas/skills.json',
            developer: DEVELOPER_PROFILE.name,
            role: DEVELOPER_PROFILE.title,
            coreStack: ['React 19', 'Tailwind CSS v4', 'JavaScript ES2024+', 'Firebase'],
            skills: PORTFOLIO_SKILLS.map((s) => ({
              id: s.id,
              name: s.name,
              version: s.version,
              category: s.category,
              description: s.desc,
              projectsUsed: s.projectsUsed,
            })),
          },
          null,
          2
        );

      case 'education.md':
        return `# Academic Credentials — ${DEVELOPER_PROFILE.name}

${EDUCATION_TIMELINE.map(
  (e) => `## ${e.degree} (${e.year})
- **Institution**: ${e.institution}
- **Location**: ${e.location}${e.score ? `\n- **CGPA / Score**: ${e.score}` : ''}
${e.highlights.map((h) => `  - ${h}`).join('\n')}`
).join('\n\n')}`;

      case 'blog.mdx':
        return `---
title: "${BLOG_POSTS[0].title}"
author: "${DEVELOPER_PROFILE.name}"
date: "${BLOG_POSTS[0].date}"
readTime: "${BLOG_POSTS[0].readTime}"
category: "${BLOG_POSTS[0].category}"
tags: ${JSON.stringify(BLOG_POSTS[0].tags)}
---

${BLOG_POSTS[0].content}`;

      case 'contact.tsx':
        return `import { sendCloudMessage } from '../services/cloudSync';

export const CONTACT_CONFIG = {
  developer: "${DEVELOPER_PROFILE.name}",
  directEmail: "${DEVELOPER_PROFILE.email}",
  location: "${DEVELOPER_PROFILE.location}",
  openToRoles: [
    "Frontend Developer Intern",
    "React JS Developer",
    "UI Engineer"
  ],
  profiles: ${JSON.stringify(DEVELOPER_PROFILE.socials, null, 2)}
};`;

      case 'messages-inbox.json':
        return JSON.stringify(
          {
            $schema: 'https://mustafa-dev-portfolio.web.app/schemas/messages-inbox.json',
            owner: DEVELOPER_PROFILE.name,
            endpoint: '/api/messages',
            unreadCount: messages.filter((m) => !m.read).length,
            incomingMessages: messages,
          },
          null,
          2
        );

      case 'settings':
      case 'package.json':
      default:
        return JSON.stringify(
          {
            name: 'mustafa-dev-portfolio',
            author: DEVELOPER_PROFILE.name,
            email: DEVELOPER_PROFILE.email,
            version: '2.4.0',
            private: true,
            scripts: {
              dev: 'tsx server.ts',
              build: 'vite build',
              start: 'node server.ts',
              lint: 'tsc --noEmit',
            },
            dependencies: {
              '@vscode/codicons': '^0.0.36',
              react: '^19.0.1',
              'react-dom': '^19.0.1',
              tailwindcss: '^4.3.3',
              express: '^5.1.0',
            },
          },
          null,
          2
        );
    }
  };

  const getLineSyntaxColorClass = (line: string): string => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return 'text-[#6A9955]';
    }
    if (trimmed.startsWith('#')) {
      return 'text-[#569CD6] font-semibold';
    }
    if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) {
      return 'text-[#C586C0]';
    }
    if (line.includes('":')) {
      return 'text-[#9CDCFE]';
    }
    return 'text-[#CCCCCC]';
  };

  const caretBlinkClass =
    cursorBlinking === 'blink'
      ? 'vscode-caret-stick-blink'
      : cursorBlinking === 'solid'
      ? 'vscode-caret-stick-solid'
      : '';

  const code = generateSourceString();
  const lines = code.split('\n');
  const isDark = theme === 'dark';

  // Clamp active line & column to valid bounds for this file
  const activeLine = Math.max(1, Math.min(lines.length, cursorPos.line));
  const currentLineText = lines[activeLine - 1] ?? '';
  const activeCol = Math.max(1, Math.min(currentLineText.length + 1, cursorPos.col));

  // Render a line with interactive character-level click targets and the Single Thin White Blinking Stick Caret on the active line/column
  const renderLineWithBlockCursor = (line: string, lineNumber: number) => {
    const isCursorLine = lineNumber === activeLine;
    const baseColorClass = getLineSyntaxColorClass(line);
    const chars = line.split('');

    return (
      <span className={baseColorClass}>
        {chars.map((ch, idx) => {
          const colNum = idx + 1;
          const isCursorBefore = isCursorLine && colNum === activeCol;
          return (
            <React.Fragment key={idx}>
              {isCursorBefore && (
                <span
                  key={`caret-${lineNumber}-${activeCol}`}
                  className={`vscode-caret-stick ${caretBlinkClass}`}
                  aria-hidden="true"
                />
              )}
              <span
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickedRightHalf = e.clientX - rect.left > rect.width / 2;
                  const targetCol = clickedRightHalf ? colNum + 1 : colNum;
                  onCursorChange?.(lineNumber, targetCol);
                  containerRef.current?.focus();
                }}
              >
                {ch}
              </span>
            </React.Fragment>
          );
        })}
        {/* End-of-line thin white blinking stick caret when col is at line.length + 1 (or empty line) */}
        {isCursorLine && activeCol > chars.length && (
          <span
            key={`caret-eol-${lineNumber}-${activeCol}`}
            className={`vscode-caret-stick ${caretBlinkClass}`}
            aria-hidden="true"
          />
        )}
      </span>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextLine = Math.min(lines.length, activeLine + 1);
      const maxCol = (lines[nextLine - 1]?.length ?? 0) + 1;
      onCursorChange?.(nextLine, Math.min(activeCol, maxCol));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevLine = Math.max(1, activeLine - 1);
      const maxCol = (lines[prevLine - 1]?.length ?? 0) + 1;
      onCursorChange?.(prevLine, Math.min(activeCol, maxCol));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const maxCol = currentLineText.length + 1;
      if (activeCol < maxCol) {
        onCursorChange?.(activeLine, activeCol + 1);
      } else if (activeLine < lines.length) {
        onCursorChange?.(activeLine + 1, 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (activeCol > 1) {
        onCursorChange?.(activeLine, activeCol - 1);
      } else if (activeLine > 1) {
        const prevLen = (lines[activeLine - 2]?.length ?? 0) + 1;
        onCursorChange?.(activeLine - 1, prevLen);
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      onCursorChange?.(activeLine, 1);
    } else if (e.key === 'End') {
      e.preventDefault();
      onCursorChange?.(activeLine, currentLineText.length + 1);
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ext = (activeFile.split('.').pop() || 'json') as string;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`h-full flex flex-col font-mono text-[13px] select-text focus:outline-none ${
        isDark ? 'bg-[#1F1F1F] text-[#CCCCCC]' : 'bg-white text-[#1F1F1F]'
      }`}
    >
      {/* CodeLens & Caret Telemetry Toolbar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 border-b text-[11px] ${
          isDark
            ? 'border-[#2B2B2B] bg-[#181818] text-[#858585]'
            : 'border-[#E5E5E5] bg-[#F8F8F8] text-[#616161]'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <SetiFileIcon fileId={activeFile} extension={ext} className="w-3.5 h-3.5" />
            <span>
              Source Buffer · <strong className="text-[#4EC9B0]">{activeFile}</strong> (
              {lines.length} lines)
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#2B2B2B] hover:bg-[#3C3C3C] text-[#CCCCCC] transition-colors cursor-pointer"
        >
          <Codicon
            name={copied ? 'check' : 'copy'}
            className={`!text-[12px] ${copied ? 'text-[#4EC9B0]' : ''}`}
          />
          <span>{copied ? 'Copied' : 'Copy Buffer'}</span>
        </button>
      </div>

      {/* Line-Numbered Code Surface with Translucent White Active Line Highlighter & White Blinking Stick Cursor */}
      <div className="flex-1 overflow-auto py-3">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, i) => {
              const lineNum = i + 1;
              const isSelected = activeLine === lineNum;
              return (
                <tr
                  key={i}
                  onClick={() => {
                    onCursorChange?.(lineNum, line.length + 1);
                    containerRef.current?.focus();
                  }}
                  className={
                    isSelected
                      ? isDark
                        ? 'vscode-active-line-dark'
                        : 'vscode-active-line-light'
                      : isDark
                      ? 'hover:bg-white/[0.03]'
                      : 'hover:bg-slate-100'
                  }
                >
                  <td
                    onClick={(e) => {
                      e.stopPropagation();
                      onCursorChange?.(lineNum, 1);
                    }}
                    title={`Line ${lineNum}`}
                    className={`pl-3 pr-4 text-right select-none w-14 tabular-nums text-xs cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'text-white font-semibold'
                          : 'text-[#1F1F1F] font-semibold'
                        : 'text-[#6E7681]'
                    }`}
                  >
                    {lineNum}
                  </td>
                  <td className="pr-6 whitespace-pre leading-[1.65] font-mono cursor-text">
                    {renderLineWithBlockCursor(line, lineNum)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
