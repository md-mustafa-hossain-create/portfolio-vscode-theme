import React, { useState, useRef, useEffect } from 'react';
import { Codicon, OfficialGeminiLogo, SetiFileIcon } from './OfficialIcons';
import { DEVELOPER_PROFILE, WORKSPACE_FILES } from '../data/portfolioData';

export interface GeminiChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isError?: boolean;
  thoughts?: string[];
  isThinking?: boolean;
}

interface GeminiChatPanelProps {
  onOpenFile: (fileId: string) => void;
  theme: 'dark' | 'light';
}

const STARTER_PROMPTS = [
  "Tell me about Mustafa's React projects",
  "What is Mustafa's core tech stack?",
  "Summarize Mustafa's BCA academic record",
  'How can I contact Mustafa for a role?',
];

export const GeminiChatPanel: React.FC<GeminiChatPanelProps> = ({
  onOpenFile,
  theme,
}) => {
  const isDark = theme === 'dark';
  const [messages, setMessages] = useState<GeminiChatMessage[]>([
    {
      id: 'welcome-gemini',
      role: 'model',
      text: `Hi! I'm the **Gemini AI Assistant** for **${DEVELOPER_PROFILE.name}**'s developer portfolio.\n\nAsk me anything about Mustafa's React projects (**StreamPulse**, **DevDock**, **GeoLearn**), frontend tech stack, BCA academic credentials, or how to get in touch!`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState('gemini-3.1-flash-lite');
  
  // Fast typewriter state: streams the active response smoothly and rapidly
  const [activeStreamingMessageId, setActiveStreamingMessageId] = useState<string | null>(null);
  const [displayedStreamingText, setDisplayedStreamingText] = useState<string>('');
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, displayedStreamingText]);

  // Clean up typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  const startTypewriter = (messageId: string, fullText: string) => {
    setActiveStreamingMessageId(messageId);
    setDisplayedStreamingText('');

    let currentIndex = 0;
    const totalLength = fullText.length;
    // Fast chunk pace (3-6 characters every 10-14ms) ensuring crisp pacing without boredom
    const step = () => {
      if (currentIndex < totalLength) {
        const chunkSize = Math.min(Math.floor(Math.random() * 4) + 3, totalLength - currentIndex);
        currentIndex += chunkSize;
        setDisplayedStreamingText(fullText.slice(0, currentIndex));
        typingTimerRef.current = window.setTimeout(step, 12);
      } else {
        setDisplayedStreamingText(fullText);
        setActiveStreamingMessageId(null);
      }
    };

    typingTimerRef.current = window.setTimeout(step, 10);
  };

  const handleSendMessage = async (promptText?: string) => {
    const trimmed = (promptText ?? input).trim();
    if (!trimmed || isLoading) return;

    const userMsg: GeminiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const historyForApi = messages
      .filter((m) => !m.isError && m.id !== 'welcome-gemini')
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) {
      setInput('');
    }
    setIsLoading(true);

    const tempAiId = `model-${Date.now()}`;

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to get response from Gemini AI.');
      }

      if (typeof data.model === 'string' && data.model) {
        setActiveModel(data.model);
      }

      const generatedThoughts = Array.isArray(data.thoughts) && data.thoughts.length > 0
        ? data.thoughts
        : [
            'Analyzing query in MD Mustafa Hossain’s frontend engineering context',
            'Synthesizing projects, technologies, and academic records',
            'Formulating response with direct references'
          ];

      const aiMsg: GeminiChatMessage = {
        id: tempAiId,
        role: 'model',
        text: data.reply,
        thoughts: generatedThoughts,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      // Add message into list and immediately trigger brisk streaming typewriter
      setMessages((prev) => [...prev, aiMsg]);
      setExpandedThoughts((prev) => ({ ...prev, [tempAiId]: false }));
      startTypewriter(tempAiId, data.reply);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Unable to reach Gemini AI right now. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: errMsg,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }
    setActiveStreamingMessageId(null);
    setDisplayedStreamingText('');
    setMessages([
      {
        id: 'welcome-gemini',
        role: 'model',
        text: `Chat cleared. Ask me anything about **${DEVELOPER_PROFILE.name}**'s projects, skills, or frontend engineering!`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
  };

  const toggleThoughts = (msgId: string) => {
    setExpandedThoughts((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const renderFormattedText = (text: string, isCurrentlyStreaming = false) => {
    const mentionedFiles = WORKSPACE_FILES.filter(
      (f) => f.id !== 'messages-inbox.json' && text.toLowerCase().includes(f.name.toLowerCase())
    );

    const paragraphs = text.split('\n');
    return (
      <div className="space-y-1.5 relative">
        {paragraphs.map((line, idx) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return <div key={idx} className="h-1" />;

          const isBullet = trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ');
          const cleanLine = isBullet ? trimmedLine.slice(2) : line;

          const segments = cleanLine.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
          const renderedSegments = segments.map((seg, sIdx) => {
            if (seg.startsWith('**') && seg.endsWith('**')) {
              return (
                <strong
                  key={sIdx}
                  className={isDark ? 'text-white font-semibold' : 'text-[#1F1F1F] font-semibold'}
                >
                  {seg.slice(2, -2)}
                </strong>
              );
            }
            if (seg.startsWith('`') && seg.endsWith('`')) {
              return (
                <code
                  key={sIdx}
                  className="px-1 py-0.5 rounded bg-[#2B2B2B] text-[#4EC9B0] font-mono text-[11px]"
                >
                  {seg.slice(1, -1)}
                </code>
              );
            }
            return <React.Fragment key={sIdx}>{seg}</React.Fragment>;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-[#0078D4] mt-0.5">•</span>
                <span className="flex-1 leading-relaxed">{renderedSegments}</span>
              </div>
            );
          }

          return (
            <p key={idx} className="leading-relaxed">
              {renderedSegments}
            </p>
          );
        })}

        {isCurrentlyStreaming && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-[#4FC1FF] animate-pulse align-middle" />
        )}

        {!isCurrentlyStreaming && mentionedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {mentionedFiles.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => onOpenFile(file.id)}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#252526] hover:bg-[#04395E] border border-[#3C3C3C] hover:border-[#0078D4] text-[11px] font-mono text-[#9CDCFE] hover:text-white transition-colors cursor-pointer"
                title={`Open ${file.path} in Editor`}
              >
                <SetiFileIcon
                  fileId={file.id}
                  extension={file.extension}
                  className="w-3.5 h-3.5 shrink-0"
                />
                <span>{file.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden text-xs">
      {/* Sub-header with Gemini status and Clear Chat button */}
      <div
        className={`px-3 py-2 border-b ${
          isDark ? 'border-[#2B2B2B] bg-[#1E1E1E]' : 'border-[#E5E5E5] bg-[#F3F3F3]'
        } flex items-center justify-between gap-2 shrink-0`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <OfficialGeminiLogo className="w-4 h-4 shrink-0" />
          <div className="truncate">
            <span
              className={`font-semibold ${isDark ? 'text-white' : 'text-[#1F1F1F]'}`}
            >
              Gemini AI
            </span>
            <span className="ml-1.5 text-[10px] font-mono text-[#4EC9B0]">
              {activeModel}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClearChat}
          title="Clear Conversation"
          className="p-1 rounded hover:bg-[#2A2D2E] text-[#858585] hover:text-white cursor-pointer flex items-center justify-center shrink-0"
        >
          <Codicon name="clear-all" className="!text-[14px]" />
        </button>
      </div>

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isStreaming = activeStreamingMessageId === msg.id;
          const currentText = isStreaming ? displayedStreamingText : msg.text;
          const hasThoughts = Array.isArray(msg.thoughts) && msg.thoughts.length > 0;
          const isThoughtExpanded = Boolean(expandedThoughts[msg.id]);

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 px-0.5 text-[10px] text-[#858585]">
                {!isUser && <OfficialGeminiLogo className="w-3.5 h-3.5" />}
                <span className="font-semibold">
                  {isUser ? 'You' : 'Gemini AI'}
                </span>
                <span>·</span>
                <span className="font-mono">{msg.timestamp}</span>
              </div>

              {/* Gemini Thinking Accordion Pill (just like official Gemini app) */}
              {!isUser && hasThoughts && (
                <div className="w-full max-w-[94%] my-0.5">
                  <button
                    type="button"
                    onClick={() => toggleThoughts(msg.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#252526] hover:bg-[#2F2F2F] border border-[#3C3C3C] text-[11px] font-mono text-[#4FC1FF] transition-colors cursor-pointer"
                  >
                    <OfficialGeminiLogo className="w-3 h-3 text-[#4FC1FF]" />
                    <span>Thought Process ({msg.thoughts!.length} steps)</span>
                    <Codicon
                      name={isThoughtExpanded ? 'chevron-up' : 'chevron-down'}
                      className="!text-[11px]"
                    />
                  </button>

                  {isThoughtExpanded && (
                    <div className="mt-1.5 p-2.5 rounded bg-[#1A1A1A] border border-[#2B2B2B] text-[11px] font-mono space-y-1 text-[#A0A0A0]">
                      <div className="text-[10px] uppercase tracking-wider text-[#4EC9B0] font-semibold flex items-center gap-1 mb-1">
                        <Codicon name="sparkle" className="!text-[11px]" />
                        <span>Reasoning Trace</span>
                      </div>
                      {msg.thoughts!.map((thought, tIdx) => (
                        <div key={tIdx} className="flex items-start gap-1.5 pl-1 leading-relaxed">
                          <span className="text-[#569CD6]">›</span>
                          <span>{thought}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div
                className={`max-w-[94%] rounded-md px-3 py-2.5 text-[12px] ${
                  isUser
                    ? 'bg-[#0078D4] text-white'
                    : msg.isError
                    ? 'bg-[#3A1E1E] border border-[#F48771]/40 text-[#F48771]'
                    : isDark
                    ? 'bg-[#252526] border border-[#2B2B2B] text-[#CCCCCC]'
                    : 'bg-white border border-[#E5E5E5] text-[#1F1F1F]'
                }`}
              >
                {isUser ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  renderFormattedText(currentText, isStreaming)
                )}
              </div>
            </div>
          );
        })}

        {/* Starter Prompts when only welcome message is present */}
        {messages.length === 1 && !isLoading && (
          <div className="pt-1 space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#858585] px-0.5">
              Suggested Questions
            </p>
            <div className="flex flex-col gap-1.5">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className={`w-full text-left px-2.5 py-2 rounded border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    isDark
                      ? 'bg-[#252526]/70 border-[#2B2B2B] hover:border-[#0078D4] hover:bg-[#2A2D2E] text-[#CCCCCC]'
                      : 'bg-white border-[#E5E5E5] hover:border-[#0078D4] text-[#333333]'
                  }`}
                >
                  <span className="truncate">{prompt}</span>
                  <Codicon
                    name="arrow-right"
                    className="!text-[11px] text-[#0078D4] shrink-0"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gemini Active Thinking Card (official pulsing state while generating) */}
        {isLoading && (
          <div className="w-full max-w-[94%] p-3 rounded-md bg-[#252526] border border-[#3C3C3C] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#CCCCCC]">
              <OfficialGeminiLogo className="w-4 h-4 animate-spin" />
              <span className="font-semibold text-white">Gemini is thinking...</span>
            </div>
            <div className="space-y-1 pl-6 text-[11px] font-mono text-[#858585]">
              <p className="flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0078D4]" />
                <span>Formulating reasoning path & reviewing codebase...</span>
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className={`p-2.5 border-t ${
          isDark ? 'border-[#2B2B2B] bg-[#181818]' : 'border-[#E5E5E5] bg-[#F8F8F8]'
        } shrink-0`}
      >
        <div
          className={`flex items-end gap-1.5 rounded border px-2.5 py-1.5 focus-within:border-[#0078D4] ${
            isDark
              ? 'bg-[#252526] border-[#3C3C3C]'
              : 'bg-white border-[#CCCCCC]'
          }`}
        >
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask Gemini AI about Mustafa's portfolio..."
            disabled={isLoading || Boolean(activeStreamingMessageId)}
            className={`flex-1 bg-transparent text-xs resize-none focus:outline-none leading-relaxed ${
              isDark
                ? 'text-white placeholder-[#858585]'
                : 'text-[#1F1F1F] placeholder-[#767676]'
            }`}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || Boolean(activeStreamingMessageId)}
            title="Send message to Gemini AI (Enter)"
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors shrink-0 ${
              input.trim() && !isLoading && !activeStreamingMessageId
                ? 'bg-[#0078D4] hover:bg-[#1084DF] text-white cursor-pointer'
                : 'bg-[#3C3C3C]/50 text-[#858585] cursor-not-allowed'
            }`}
          >
            <Codicon name="send" className="!text-[12px]" />
          </button>
        </div>
      </form>
    </div>
  );
};
