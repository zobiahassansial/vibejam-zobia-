import React, { useEffect, useMemo, useRef, useState } from 'react';
import { History, Search, Trash2, X } from 'lucide-react';
import type { Conversation } from '../../types';
import { formatHistoryListTime } from '../../utils/formatChatTime';

interface ChatHistoryDrawerProps {
  open: boolean;
  conversations: Conversation[];
  activeConversationId: string;
  onClose: () => void;
  onSelect: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
  onClearAll: () => void;
}

export function ChatHistoryDrawer({
  open,
  conversations,
  activeConversationId,
  onClose,
  onSelect,
  onDelete,
  onClearAll,
}: ChatHistoryDrawerProps) {
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(
    () => [...conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    ),
    [conversations],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sorted;
    return sorted.filter((conversation) => {
      if (conversation.title.toLowerCase().includes(needle)) return true;
      return conversation.messages.some((message) => message.content.toLowerCase().includes(needle));
    });
  }, [query, sorted]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const previousFocus = document.activeElement as HTMLElement | null;
    searchRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, input, [href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 flex justify-end bg-[var(--scrim)] backdrop-blur-sm motion-reduce:backdrop-blur-none">
      <div
        ref={panelRef}
        className="flex h-full w-full flex-col border-l border-[var(--border)] bg-[var(--bg-elevated)] shadow-glass sm:max-w-[380px]"
        role="dialog"
        aria-modal="true"
        aria-label="Chat history"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
            <History size={16} aria-hidden />
            History
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
            aria-label="Close history"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search chats..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
              aria-label="Search saved chats"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {filtered.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-[var(--text-muted)]">No saved chats yet</p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((conversation) => {
                const { time, dateLabel } = formatHistoryListTime(conversation.updatedAt);
                const isActive = conversation.id === activeConversationId;
                return (
                  <li key={conversation.id}>
                    <div className={`group flex items-stretch gap-1 rounded-xl border ${isActive ? 'border-[var(--primary)] bg-[var(--primary-soft)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(conversation.id);
                          onClose();
                        }}
                        className="min-w-0 flex-1 px-3 py-2.5 text-left"
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <p className="truncate text-sm font-semibold text-[var(--text)]">{conversation.title}</p>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {time}{dateLabel ? ` · ${dateLabel}` : ''} · {conversation.messages.length} messages
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(conversation.id)}
                        className="shrink-0 px-2 text-[var(--text-muted)] hover:text-[var(--danger)] sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                        aria-label={`Delete chat ${conversation.title}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-[var(--border)] p-4">
          <button
            type="button"
            onClick={() => setShowClearAllModal(true)}
            disabled={conversations.length === 0}
            className="w-full rounded-xl border border-[var(--border-strong)] px-3 py-2 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-40"
          >
            Clear all history
          </button>
        </div>

        {deleteTarget && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--scrim)] p-4">
            <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-glass">
              <h3 className="text-base font-bold text-[var(--text)]">Delete this chat?</h3>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)]">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    const id = deleteTarget;
                    setDeleteTarget(null);
                    onDelete(id);
                  }}
                  className="rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-2 text-xs font-bold text-[var(--danger)]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showClearAllModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--scrim)] p-4">
            <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-glass">
              <h3 className="text-base font-bold text-[var(--text)]">Delete all saved chats?</h3>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setShowClearAllModal(false)} className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)]">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    setShowClearAllModal(false);
                    onClearAll();
                    onClose();
                  }}
                  className="rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-2 text-xs font-bold text-[var(--danger)]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}