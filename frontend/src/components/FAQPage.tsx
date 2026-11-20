import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  BookOpen,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Filter,
} from 'lucide-react';
import { faqApi } from '../api/client';
import type { FAQ, FAQCategory } from '../types';

interface FAQPageProps {
  highlightId?: string | null;
  onAskInChat?: (question: string) => void;
}

const CATEGORIES: (FAQCategory | 'All')[] = [
  'All',
  'Labs',
  'Academics',
  'Library',
  'Exams',
  'Fees',
  'Projects',
  'Transport',
  'Help',
];

const categoryStyles: Record<string, string> = {
  Labs: 'bg-theme-primary-soft text-theme-accent border-theme-accent',
  Academics: 'bg-theme-violet-soft text-theme-violet border-theme-violet',
  Library: 'bg-theme-success-soft text-theme-success  border-theme-success',
  Exams: 'bg-theme-warning-soft text-theme-warning  border-theme-warning',
  Fees: 'bg-theme-danger-soft text-theme-danger  border-theme-danger',
  Projects: 'bg-theme-primary-soft text-theme-primary-hover  border-theme-primary',
  Transport: 'bg-theme-teal-soft text-theme-teal border-theme-teal',
  Help: 'bg-theme-pink-soft text-theme-pink border-theme-pink',
};

export function FAQPage({ highlightId, onAskInChat }: FAQPageProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | 'All'>('All');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setLoading(true);
    faqApi
      .getAll()
      .then((res) => {
        setFaqs(res.data || []);
        setError(null);
      })
      .catch(() => setError('Failed to load FAQs.'))
      .finally(() => setLoading(false));
  }, []);

  // When highlightId is provided (clicked from a citation chip), expand it and scroll into view
  useEffect(() => {
    if (highlightId) {
      setExpandedMap((prev) => ({ ...prev, [highlightId]: true }));
      setTimeout(() => {
        const el = cardRefs.current[highlightId];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
    }
  }, [highlightId, faqs]);

  const toggleExpand = (id: string) => {
    setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter and maintain exact ID order (FAQ-01, FAQ-02, ...)
  const filtered = faqs
    .filter((f) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
      const matchCat = selectedCategory === 'All' || f.category === selectedCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  // Helper to highlight matching text in search
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-theme-primary-soft text-theme-primary-hover  rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme-border  glass-panel shrink-0">
        <h1 className="font-bold text-theme-text  text-lg">Knowledge Base FAQs</h1>
        <p className="text-xs text-theme-muted ">
          Official departmental policies, timings, and procedures
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5">
        {/* Search bar & Category filters */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-faint" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keywords (e.g. lab timings, attendance, SLATE, bus cards)…"
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl glass-input text-theme-text  placeholder-theme-faint outline-none focus:border-theme-primary  transition-all shadow-sm"
            />
          </div>

          {/* Category Chips with counts */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
            {CATEGORIES.map((cat) => {
              const count = cat === 'All' ? faqs.length : faqs.filter((f) => f.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-theme-primary text-theme-on-primary shadow-sm'
                      : 'bg-theme-surface text-theme-muted border border-theme-border hover:bg-theme-surface-hover'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-theme-surface text-theme-text' : 'bg-theme-surface-2 text-theme-muted'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active summary */}
          <div className="flex items-center justify-between text-xs text-theme-muted  pt-1">
            <span>
              Showing {filtered.length} {filtered.length === 1 ? 'FAQ' : 'FAQs'}
            </span>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-theme-primary-hover  hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-panel p-5 rounded-2xl animate-pulse space-y-3">
                <div className="w-20 h-4 bg-theme-surface-2  rounded" />
                <div className="w-3/4 h-5 bg-theme-surface-2  rounded" />
                <div className="w-full h-12 bg-theme-surface-2  rounded" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-theme-danger text-sm font-medium">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 max-w-sm mx-auto glass-panel p-8 rounded-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-theme-surface-2  flex items-center justify-center mx-auto mb-3 text-theme-faint">
              <Filter size={20} />
            </div>
            <h3 className="text-sm font-bold text-theme-text  mb-1">No FAQs found</h3>
            <p className="text-xs text-theme-muted  mb-4">
              We couldn't find any FAQs matching "{search}". Try searching another keyword or clear your filters.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
              }}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-theme-primary text-theme-on-primary hover:bg-theme-primary-hover transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Responsive FAQ Grid (1 col phone, 2 col tablet, 3 col desktop) */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((faq) => {
              const isExpanded = !!expandedMap[faq.id];
              const isHighlighted = highlightId === faq.id;
              const isNew = !faq.is_starter;

              return (
                <div
                  key={faq.id}
                  ref={(el) => {
                    cardRefs.current[faq.id] = el;
                  }}
                  className={`glass-panel rounded-2xl p-4 md:p-5 flex flex-col justify-between transition-all duration-300 shadow-glass-sm hover:shadow-glass ${
                    isHighlighted
                      ? 'border-theme-accent  ring-2 ring-theme-accent bg-theme-primary-soft'
                      : 'hover:border-theme-border-strong '
                  }`}
                >
                  <div className="space-y-3">
                    {/* ID + Category Pill + New Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg bg-theme-surface-2  text-theme-muted  border border-theme-border ">
                          {faq.id}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            categoryStyles[faq.category] || 'bg-theme-surface-2 text-theme-muted'
                          }`}
                        >
                          {faq.category}
                        </span>
                      </div>

                      {isNew && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[var(--success)] to-[var(--teal)] text-theme-on-primary shadow-sm">
                          <Sparkles size={9} />
                          New
                        </span>
                      )}
                    </div>

                    {/* Question (bold) */}
                    <h3 className="font-bold text-sm text-theme-text  leading-snug">
                      {highlightMatch(faq.question, search)}
                    </h3>

                    {/* Answer: accordion with 2-line collapse */}
                    <div className="relative">
                      <p
                        className={`text-xs text-theme-muted  leading-relaxed transition-all duration-300 ${
                          !isExpanded ? 'line-clamp-2' : ''
                        }`}
                      >
                        {highlightMatch(faq.answer, search)}
                      </p>
                    </div>
                  </div>

                  {/* Card Actions: Expand/Collapse & "Ask this in chat" */}
                  <div className="mt-4 pt-3 border-t border-theme-border  flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleExpand(faq.id)}
                      className="text-xs font-medium text-theme-muted  hover:text-theme-primary-hover  flex items-center gap-1 transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <span>{isExpanded ? 'Less' : 'More'}</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    {onAskInChat && (
                      <button
                        onClick={() => onAskInChat(faq.question)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-theme-primary-hover hover:underline px-2 py-1 rounded-lg hover:bg-theme-primary-soft transition-colors"
                        title="Send this question to AskSE in chat"
                      >
                        <MessageSquare size={12} />
                        <span>Ask in Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
