import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { FAQ } from '../../types';

interface SuggestedChipsProps {
  faqs: FAQ[];
  onSelect: (question: string) => void;
}

export function SuggestedChips({ faqs, onSelect }: SuggestedChipsProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="shrink-0 px-4 pb-1.5 pt-0.5">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-theme-muted ">
          <Sparkles size={12} className="text-theme-accent animate-pulse" />
          <span>Suggested Questions</span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[11px] flex items-center gap-1 text-theme-faint hover:text-theme-primary-hover  transition-colors"
          aria-label={collapsed ? 'Show suggested questions' : 'Hide suggested questions'}
        >
          <span>{collapsed ? 'Show' : 'Hide'}</span>
          {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar chip-scroll">
          {faqs.map((faq) => (
            <button
              key={faq.id}
              onClick={() => onSelect(faq.question)}
              className="h-8 shrink-0 text-xs font-medium px-3 py-0 rounded-full border border-theme-border-strong bg-theme-surface-2 text-theme-text hover:bg-theme-primary-soft hover:border-theme-primary hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-sm max-w-[280px] truncate focus-visible:ring-2 focus-visible:ring-theme-ring"
              title={faq.question}
            >
              {faq.question}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
