import React, { useState } from 'react';
import { Codicon, SetiFileIcon } from './OfficialIcons';
import { PortfolioProject } from '../data/portfolioData';

interface ProjectCaseStudyModalProps {
  project: PortfolioProject | null;
  onClose: () => void;
  onStar: (projectId: string) => Promise<void>;
}

export const ProjectCaseStudyModal: React.FC<ProjectCaseStudyModalProps> = ({
  project,
  onClose,
  onStar,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [starring, setStarring] = useState(false);

  if (!project) return null;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(project.codeSpotlight);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndorse = async () => {
    if (starring) return;
    setStarring(true);
    try {
      await onStar(project.id);
    } finally {
      setStarring(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} Engineering Case Study`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-md border border-[#454545] bg-[#1F1F1F] text-[#CCCCCC] shadow-2xl overflow-hidden my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Official VS Code Modal Tab Header */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-[#2B2B2B] bg-[#181818] shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#858585] font-mono">
              <SetiFileIcon extension="tsx" className="w-4 h-4 shrink-0" />
              <span className="text-[#4EC9B0] truncate">{project.id}.case-study.tsx</span>
              <span aria-hidden="true" className="hidden xs:inline">·</span>
              <span className="hidden xs:inline">{project.category}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{project.year}</span>
            </div>
            <h2 className="text-base sm:text-xl font-bold text-white mt-0.5 truncate">
              {project.title} — Architecture &amp; Benchmarks
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close case study modal"
            className="px-2 sm:px-2.5 py-1 rounded bg-[#2B2B2B] hover:bg-[#3C3C3C] text-xs font-mono text-[#CCCCCC] hover:text-white transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span className="hidden xs:inline">ESC</span>
            <Codicon name="close" className="!text-[13px]" />
          </button>
        </div>

        {/* Scrollable Case Study Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Media Preview Container */}
          <div className="relative w-full aspect-video rounded border border-[#2B2B2B] overflow-hidden bg-[#141414]">
            {!imgFailed ? (
              <img
                src={project.image}
                alt={`${project.title} application interface`}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#141414] p-6 sm:p-8 text-center">
                <Codicon name="code" className="!text-[32px] text-[#0078D4] mb-3" />
                <p className="text-lg font-bold text-white">{project.title}</p>
                <p className="text-xs text-[#858585] mt-1">{project.category}</p>
              </div>
            )}
          </div>

          {/* Quantitative Benchmark Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 border-y border-[#2B2B2B] py-3.5 sm:py-4">
            {project.metrics.map((m) => (
              <div key={m.label} className="space-y-0.5 sm:space-y-1">
                <p className="text-xs text-[#858585]">{m.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-[#4EC9B0] font-mono tabular-nums">
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Engineering Challenge & Solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#569CD6]">
                01. Engineering Challenge
              </h3>
              <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed">{project.challenge}</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#4EC9B0]">
                02. Architectural Solution
              </h3>
              <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed">{project.solution}</p>
            </div>
          </div>

          {/* Code Spotlight */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#DCDCAA]">
                03. Implementation Spotlight
              </h3>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2B2B2B] hover:bg-[#3C3C3C] text-xs font-mono text-[#CCCCCC] transition-colors cursor-pointer shrink-0"
              >
                <Codicon
                  name={copied ? 'check' : 'copy'}
                  className={`!text-[13px] ${copied ? 'text-[#4EC9B0]' : ''}`}
                />
                <span>{copied ? 'Copied' : 'Copy Snippet'}</span>
              </button>
            </div>
            <pre className="p-3 sm:p-4 rounded bg-[#141414] border border-[#2B2B2B] text-[11px] sm:text-xs font-mono text-[#9CDCFE] overflow-x-auto leading-relaxed">
              <code>{project.codeSpotlight}</code>
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 sm:px-5 py-2.5 sm:py-3 border-t border-[#2B2B2B] bg-[#181818] shrink-0">
          <button
            type="button"
            onClick={handleEndorse}
            disabled={starring}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#2B2B2B] hover:bg-[#3C3C3C] text-xs font-mono text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Codicon name="star-full" className="!text-[14px] text-[#DCDCAA]" />
            <span className="tabular-nums">Star Project ({project.stars})</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#3C3C3C] hover:bg-[#2A2D2E] text-xs font-medium text-[#CCCCCC] hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Codicon name="source-control" className="!text-[13px]" />
              <span>Repository</span>
            </a>
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0078D4] hover:bg-[#1084DF] text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
            >
              <span>Launch Live Demo</span>
              <Codicon name="link-external" className="!text-[13px]" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
