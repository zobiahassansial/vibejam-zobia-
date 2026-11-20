import React, { useState, useEffect, useRef } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Mail,
  Sparkles,
  ExternalLink,
  Bot,
  User,
} from 'lucide-react';
import type { ChatMessage } from '../../types';
import { useToast } from '../common/Toast';
import { formatChatTime } from '../../utils/formatChatTime';
import { hasUrduScript } from '../../utils/language';

interface MessageBubbleProps {
  message: ChatMessage;
  onAnimated?: (id: number) => void;
  onFeedback?: (id: number, helpful: boolean) => void;
  onCitationClick?: (faqId: string) => void;
}

function formatTime(ts: string): string {
  if (!ts) return '';
  return formatChatTime(ts);
}

export function MessageBubble({
  message,
  onAnimated,
  onFeedback,
  onCitationClick,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isNotFound = message.found === false && message.type !== 'smalltalk';
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const shouldAnimate = !isUser && message.animated === false;
  const animatedCallback = useRef(onAnimated);
  useEffect(() => { animatedCallback.current = onAnimated; }, [onAnimated]);

  const [displayedContent, setDisplayedContent] = useState<string>(() => {
    return shouldAnimate ? '' : message.content;
  });
  const [isTyping, setIsTyping] = useState<boolean>(shouldAnimate);

  useEffect(() => {
    if (!shouldAnimate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayedContent(message.content);
      setIsTyping(false);
      if (shouldAnimate) animatedCallback.current?.(message.id);
      return;
    }
    const words = message.content.split(/(\s+)/).filter(Boolean);
    const stepDurationMs = Math.max(16, Math.floor(500 / Math.max(words.length, 1)));
    let index = 0;
    const finish = () => {
      setDisplayedContent(message.content);
      setIsTyping(false);
      animatedCallback.current?.(message.id);
    };
    const interval = window.setInterval(() => {
      index += 1;
      if (index >= words.length) {
        finish();
        window.clearInterval(interval);
      } else {
        setDisplayedContent(words.slice(0, index).join(''));
      }
    }, stepDurationMs);
    const onKeyDown = () => { window.clearInterval(interval); finish(); };
    window.addEventListener('keydown', onKeyDown, { once: true });
    return () => { window.clearInterval(interval); window.removeEventListener('keydown', onKeyDown); };
  }, [message.content, message.id, shouldAnimate]);

  const handleSkipTyping = () => {
    if (isTyping) {
      setDisplayedContent(message.content);
      setIsTyping(false);
      onAnimated?.(message.id);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    showToast('Copied answer to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex items-start gap-3 mb-5 transition-opacity ${shouldAnimate ? 'animate-message-in' : ''} ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
      onClick={handleSkipTyping}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isUser
            ? 'bg-gradient-to-tr from-[var(--primary)] to-[var(--primary)] text-theme-on-primary'
            : isNotFound
            ? 'bg-theme-warning-soft text-theme-warning border border-theme-warning '
            : 'bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-theme-primary-hover  border border-theme-primary'
        }`}
      >
        {isUser ? <User size={15} /> : isNotFound ? <Mail size={15} /> : <Bot size={16} />}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] md:max-w-[70%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] text-theme-on-primary rounded-tr-sm shadow-[var(--shadow)]'
              : isNotFound
              ? 'bg-theme-warning-soft  border border-theme-warning  text-theme-text  rounded-tl-sm'
              : 'glass-panel text-theme-text  rounded-tl-sm shadow-glass-sm'
          }`}
        >
          {/* Main Content */}
          <p dir="auto" className={`whitespace-pre-wrap leading-relaxed select-text text-start ${hasUrduScript(message.content) ? 'urdu-script' : ''}`}>
            {displayedContent}
            {isTyping && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-theme-primary animate-pulse align-middle" />
            )}
          </p>

          {/* Not Found Special Action Button */}
          {isNotFound && (
            <div className="mt-3 pt-2.5 border-t border-theme-warning  flex flex-wrap items-center gap-2">
              <a
                href="mailto:helpdesk@se.example.edu"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-theme-warning-soft text-theme-warning border border-theme-warning hover:bg-theme-surface-hover transition-colors shadow-sm"
              >
                <Mail size={13} />
                Email Help Desk
              </a>
              {onCitationClick && (
                <button
                  onClick={() => onCitationClick('FAQ-08')}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-theme-warning text-theme-warning  hover:bg-theme-warning-soft  transition-colors"
                >
                  <Sparkles size={12} />
                  View Help & Office Hours
                </button>
              )}
            </div>
          )}

          {/* Citation Chips: rendered exactly as "[FAQ-XX]" */}
          {!isUser && message.faq_ids && message.faq_ids.length > 0 && !isNotFound && (
            <div className="mt-3 pt-2.5 border-t border-theme-border  flex items-center flex-wrap gap-2">
              <span className="text-[11px] font-semibold text-theme-muted  tracking-wide uppercase">
                Source:
              </span>
              {message.faq_ids.map((id) => (
                <button
                  key={id}
                  onClick={() => onCitationClick && onCitationClick(id)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-theme-primary-soft text-theme-primary-hover border border-theme-primary hover:bg-theme-surface-hover hover:scale-105 active:scale-95 transition-all shadow-sm"
                  title={`View details for ${id}`}
                >
                  <span>[{id}]</span>
                  <ExternalLink size={10} className="opacity-70" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer info: Timestamp + Copy + Feedback */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[11px] font-medium text-theme-faint ">
            {formatTime(message.timestamp)}
          </span>

          {!isUser && (
            <div className="flex items-center gap-1 bg-theme-surface-2  rounded-lg px-1.5 py-0.5 border border-theme-border ">
              {/* Copy answer */}
              <button
                onClick={handleCopy}
                className="p-1 rounded text-theme-faint hover:text-theme-muted  transition-colors"
                title="Copy response"
                aria-label="Copy response"
              >
                {copied ? <Check size={12} className="text-theme-success" /> : <Copy size={12} />}
              </button>

              {/* Helpful feedback button */}
              {onFeedback && (
                <>
                  <button
                    onClick={() => onFeedback(message.id, true)}
                    className={`p-1 rounded transition-all active:scale-125 ${
                      message.feedback === 'helpful'
                        ? 'text-theme-success font-bold scale-110'
                        : 'text-theme-faint hover:text-theme-success'
                    }`}
                    title="Helpful"
                    aria-label="Helpful"
                  >
                    <ThumbsUp size={12} className={message.feedback === 'helpful' ? 'fill-current' : ''} />
                  </button>
                  <button
                    onClick={() => onFeedback(message.id, false)}
                    className={`p-1 rounded transition-all active:scale-125 ${
                      message.feedback === 'not_helpful'
                        ? 'text-theme-danger font-bold scale-110'
                        : 'text-theme-faint hover:text-theme-danger'
                    }`}
                    title="Not helpful"
                    aria-label="Not helpful"
                  >
                    <ThumbsDown size={12} className={message.feedback === 'not_helpful' ? 'fill-current' : ''} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
