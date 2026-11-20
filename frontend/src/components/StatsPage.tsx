import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  CheckCircle2,
  XCircle,
  MessageSquareHeart,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Download,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Award,
  Search,
} from 'lucide-react';
import { statsApi } from '../api/client';
import type { StatsData } from '../types';
import { useToast } from './common/Toast';

interface StatsPageProps {
  onAskFirstQuestion?: () => void;
}

export function StatsPage({ onAskFirstQuestion }: StatsPageProps) {
  const { showToast } = useToast();
  const [range, setRange] = useState<'today' | '7d' | 'all'>('all');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentSearch, setRecentSearch] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await statsApi.get(range);
      setStats(res.data);
    } catch {
      showToast('Failed to load statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [range]);

  const handleResetStats = async () => {
    setResetLoading(true);
    try {
      await statsApi.reset();
      showToast('Statistics reset successfully.', 'success');
      setShowResetModal(false);
      await fetchStats();
    } catch {
      showToast('Failed to reset statistics.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.open(statsApi.exportCsvUrl, '_blank');
    showToast('Exporting CSV log...', 'info');
  };

  const filteredRecent = (stats?.recent_questions || []).filter((q) => {
    if (!recentSearch.trim()) return true;
    return q.question.toLowerCase().includes(recentSearch.toLowerCase().trim());
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-theme-border  glass-panel shrink-0">
        <div>
          <h1 className="font-bold text-theme-text  text-lg flex items-center gap-2">
            <span>Analytics & Performance</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-theme-primary-soft text-theme-primary-hover  font-mono font-semibold">
              Live Metrics
            </span>
          </h1>
          <p className="text-xs text-theme-muted ">
            Real-time evaluation of AI grounding, query resolution, and student feedback
          </p>
        </div>

        {/* Range Toggle & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-theme-surface-2  p-1 rounded-xl border border-theme-border ">
            {(['today', '7d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                  range === r
                    ? 'bg-theme-surface  text-theme-primary-hover  shadow-sm'
                    : 'text-theme-muted hover:text-theme-text '
                }`}
              >
                {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchStats}
            className="p-2 rounded-xl glass-panel text-theme-muted hover:text-theme-primary-hover  transition-colors"
            title="Refresh statistics"
            aria-label="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-theme-border  glass-panel text-theme-muted  hover:bg-theme-surface-hover  transition-colors"
            title="Export CSV"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="p-2 rounded-xl text-theme-faint hover:text-theme-danger hover:bg-theme-danger-soft transition-colors"
            title="Reset statistics"
            aria-label="Reset stats"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {/* Empty state when no questions asked yet */}
        {!loading && stats && stats.total_questions === 0 && (
          <div className="glass-panel max-w-md mx-auto p-8 rounded-3xl text-center space-y-3 animate-fade-in my-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] p-0.5 mx-auto mb-2 shadow-glow-brand">
              <div className="w-full h-full bg-theme-surface  rounded-[14px] flex items-center justify-center text-theme-primary-hover ">
                <Sparkles size={24} />
              </div>
            </div>
            <h3 className="text-base font-bold text-theme-text ">
              No questions recorded yet
            </h3>
            <p className="text-xs text-theme-muted  leading-relaxed">
              Once users ask questions in the chat, live citation metrics, satisfaction scores, and query volume charts will appear here.
            </p>
            {onAskFirstQuestion && (
              <button
                onClick={onAskFirstQuestion}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-theme-on-primary shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                <span>Ask your first question</span>
              </button>
            )}
          </div>
        )}

        {/* Top KPI Cards (8 KPI metrics required) */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* Total Questions */}
            <div className="glass-panel p-3.5 rounded-2xl border border-theme-border ">
              <div className="flex items-center justify-between text-theme-faint mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total</span>
                <MessageCircle size={14} className="text-theme-primary-hover" />
              </div>
              <p className="text-xl md:text-2xl font-black text-theme-text ">
                {stats.total_questions}
              </p>
              <span className="text-[10px] text-theme-faint">Queries</span>
            </div>

            {/* Answered */}
            <div className="glass-panel p-3.5 rounded-2xl border border-theme-border ">
              <div className="flex items-center justify-between text-theme-faint mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Answered</span>
                <CheckCircle2 size={14} className="text-theme-success" />
              </div>
              <p className="text-xl md:text-2xl font-black text-theme-success ">
                {stats.answered}
              </p>
              <span className="text-[10px] text-theme-faint">Grounded</span>
            </div>

            {/* Not Found */}
            <div className="glass-panel p-3.5 rounded-2xl border border-theme-border ">
              <div className="flex items-center justify-between text-theme-faint mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Not Found</span>
                <XCircle size={14} className="text-theme-danger" />
              </div>
              <p className="text-xl md:text-2xl font-black text-theme-danger">
                {stats.not_found}
              </p>
              <span className="text-[10px] text-theme-faint">Fallback</span>
            </div>

            {/* Chit-chat */}
            <div className="glass-panel p-3.5 rounded-2xl border border-theme-border ">
              <div className="flex items-center justify-between text-theme-faint mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Chit-chat</span>
                <MessageSquareHeart size={14} className="text-theme-primary-hover" />
              </div>
              <p className="text-xl md:text-2xl font-black text-theme-primary-hover ">
                {stats.chit_chat}
              </p>
              <span className="text-[10px] text-theme-faint">Greetings</span>
            </div>

            {/* Answer Rate % */}
            <div className="glass-panel p-3.5 rounded-2xl border border-theme-border ">
              <div className="flex items-center justify-between text-theme-faint mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Rate</span>
                <TrendingUp size={14} className="text-theme-accent" />
              </div>
              <p className="text-xl md:text-2xl font-black text-theme-accent">
                {stats.answer_rate}%
              </p>
              <span className="text-[10px] text-theme-faint">Resolution</span>
            </div>

            {/* Helpful */}
            <div className="glass-panel p-3.5 rounded-2xl border border-theme-border ">
              <div className="flex items-center justify-between text-theme-faint mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Helpful</span>
                <ThumbsUp size={14} className="text-theme-success" />
              </div>
              <p className="text-xl md:text-2xl font-black text-theme-success">
                {stats.helpful_count}
              </p>
              <span className="text-[10px] text-theme-faint">Votes</span>
            </div>

            {/* Not Helpful */}
            <div className="glass-panel p-3.5 rounded-2xl border border-theme-border ">
              <div className="flex items-center justify-between text-theme-faint mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Unhelpful</span>
                <ThumbsDown size={14} className="text-theme-warning" />
              </div>
              <p className="text-xl md:text-2xl font-black text-theme-warning">
                {stats.not_helpful_count}
              </p>
              <span className="text-[10px] text-theme-faint">Votes</span>
            </div>

            {/* Satisfaction % */}
            <div className="glass-panel p-3.5 rounded-2xl border border-theme-border ">
              <div className="flex items-center justify-between text-theme-faint mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Score</span>
                <Award size={14} className="text-theme-violet" />
              </div>
              <p className="text-xl md:text-2xl font-black text-theme-violet">
                {stats.satisfaction_rate}%
              </p>
              <span className="text-[10px] text-theme-faint">Satisfaction</span>
            </div>
          </div>
        )}

        {/* Highlight Card: Most Cited FAQ */}
        {stats?.most_cited_faq && (
          <div className="glass-panel p-5 rounded-2xl border border-theme-primary bg-gradient-to-r from-[var(--primary)] via-[var(--primary)] to-[var(--accent)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] text-theme-on-primary shadow-sm shrink-0">
                <Award size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-theme-primary-hover  uppercase tracking-wider">
                    Most Cited Department FAQ
                  </span>
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-theme-primary-soft text-theme-primary-hover ">
                    {stats.most_cited_faq.id}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-theme-text ">
                  {stats.most_cited_faq.question}
                </h3>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-black text-theme-text ">
                {stats.most_cited_faq.citations}
              </span>
              <span className="text-xs text-theme-muted  block">Total Citations</span>
            </div>
          </div>
        )}

        {/* Interactive Charts Grid */}
        {stats && stats.total_questions > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart A: Resolution Donut (Answered vs Not Found vs Chit-chat) */}
            <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-theme-border  flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-xs text-theme-text  uppercase tracking-wider mb-1">
                  Query Breakdown
                </h3>
                <p className="text-[11px] text-theme-muted  mb-4">
                  Answered vs Not Found vs Chit-chat
                </p>
              </div>

              {/* Donut representation */}
              <div className="flex items-center justify-center py-4">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  {/* SVG Donut */}
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {/* Background circle */}
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      className="text-theme-faint "
                    />
                    {/* Answered segment */}
                    {stats.answered > 0 && (
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--success)"
                        strokeWidth="4"
                        strokeDasharray={`${(stats.answered / stats.total_questions) * 100}, 100`}
                        strokeLinecap="round"
                      />
                    )}
                    {/* Not found segment */}
                    {stats.not_found > 0 && (
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--danger)"
                        strokeWidth="4"
                        strokeDasharray={`${(stats.not_found / stats.total_questions) * 100}, 100`}
                        strokeDashoffset={`-${(stats.answered / stats.total_questions) * 100}`}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-theme-text ">
                      {stats.total_questions}
                    </span>
                    <span className="text-[10px] text-theme-faint font-semibold uppercase">Total</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-theme-border  text-center text-xs">
                <div>
                  <div className="flex items-center justify-center gap-1 text-theme-success font-bold">
                    <span className="w-2 h-2 rounded-full bg-theme-success" />
                    <span>{stats.answered}</span>
                  </div>
                  <span className="text-[10px] text-theme-faint">Answered</span>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-theme-danger font-bold">
                    <span className="w-2 h-2 rounded-full bg-theme-danger" />
                    <span>{stats.not_found}</span>
                  </div>
                  <span className="text-[10px] text-theme-faint">Not Found</span>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-theme-primary-hover font-bold">
                    <span className="w-2 h-2 rounded-full bg-theme-primary" />
                    <span>{stats.chit_chat}</span>
                  </div>
                  <span className="text-[10px] text-theme-faint">Chit-chat</span>
                </div>
              </div>
            </div>

            {/* Chart B: Horizontal Citations per FAQ */}
            <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border border-theme-border ">
              <h3 className="font-bold text-xs text-theme-text  uppercase tracking-wider mb-1">
                FAQ Citations Distribution
              </h3>
              <p className="text-[11px] text-theme-muted  mb-4">
                Which department FAQs are cited most by the AI grounding engine
              </p>

              {stats.citations_chart.length === 0 ? (
                <div className="py-8 text-center text-xs text-theme-faint">
                  No citations recorded in this time range.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.citations_chart.map((item) => {
                    const maxCitations = Math.max(...stats.citations_chart.map((c) => c.citations), 1);
                    const percent = Math.round((item.citations / maxCitations) * 100);

                    return (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-theme-muted  truncate max-w-[80%]">
                            {item.label}
                          </span>
                          <span className="font-mono font-bold text-theme-text ">
                            {item.citations}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-theme-surface-2  overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.is_top
                                ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--primary)]'
                                : 'bg-theme-surface-2 '
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback Progress Bar */}
        {stats && (stats.helpful_count > 0 || stats.not_helpful_count > 0) && (
          <div className="glass-panel p-5 rounded-2xl border border-theme-border ">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-theme-text  uppercase tracking-wider">
                Student Satisfaction Ratio
              </span>
              <span className="text-xs font-bold text-theme-success">
                {stats.satisfaction_rate}% Positive
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-theme-surface-2  overflow-hidden flex">
              <div
                className="bg-theme-success h-full transition-all duration-500"
                style={{ width: `${stats.satisfaction_rate}%` }}
                title={`Helpful: ${stats.helpful_count}`}
              />
              <div
                className="bg-theme-warning h-full transition-all duration-500"
                style={{ width: `${100 - stats.satisfaction_rate}%` }}
                title={`Not helpful: ${stats.not_helpful_count}`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-theme-faint mt-2">
              <span className="flex items-center gap-1 text-theme-success">
                <ThumbsUp size={11} /> {stats.helpful_count} Helpful
              </span>
              <span className="flex items-center gap-1 text-theme-warning">
                <ThumbsDown size={11} /> {stats.not_helpful_count} Not Helpful
              </span>
            </div>
          </div>
        )}

        {/* Recent Questions Table */}
        {stats && stats.recent_questions && stats.recent_questions.length > 0 && (
          <div className="glass-panel rounded-2xl border border-theme-border  overflow-hidden">
            <div className="px-5 py-4 border-b border-theme-border  flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-xs text-theme-text  uppercase tracking-wider">
                  Recent Interactions
                </h3>
                <p className="text-[11px] text-theme-faint">Live question log and citation results</p>
              </div>

              {/* Search recent */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-faint" />
                <input
                  type="text"
                  value={recentSearch}
                  onChange={(e) => setRecentSearch(e.target.value)}
                  placeholder="Filter recent questions…"
                  className="pl-7 pr-3 py-1 text-xs rounded-lg glass-input text-theme-text  placeholder-theme-faint outline-none w-48"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-theme-surface  border-b border-theme-border  text-theme-faint font-semibold">
                    <th className="py-2.5 px-4">Time</th>
                    <th className="py-2.5 px-4">Question</th>
                    <th className="py-2.5 px-4">Result</th>
                    <th className="py-2.5 px-4">Citations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border ">
                  {filteredRecent.map((q) => (
                    <tr key={q.id} className="hover:bg-theme-surface-hover  transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-theme-faint whitespace-nowrap">
                        {q.time}
                      </td>
                      <td className="py-3 px-4 font-medium text-theme-text  max-w-xs truncate">
                        {q.question}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {q.type === 'smalltalk' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-primary-soft text-theme-primary-hover font-semibold">
                            Chit-chat
                          </span>
                        ) : q.found ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-success-soft text-theme-success font-semibold">
                            Answered
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-danger-soft text-theme-danger font-semibold">
                            Not Found
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-theme-muted  whitespace-nowrap">
                        {q.citations && q.citations.length > 0 ? q.citations.join(', ') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reset Stats Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-theme-scrim backdrop-blur-sm p-4">
          <div className="glass-panel bg-theme-elevated rounded-2xl shadow-glass border border-theme-border p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold text-theme-text  text-base mb-2">
              Reset All Statistics?
            </h3>
            <p className="text-xs text-theme-muted  mb-6 leading-relaxed">
              This will clear all question metrics, feedback ratings, and interaction logs. FAQs will not be deleted.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-theme-border  text-theme-muted  hover:bg-theme-surface-hover "
              >
                Cancel
              </button>
              <button
                onClick={handleResetStats}
                disabled={resetLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-theme-danger bg-theme-danger-soft hover:bg-theme-danger text-theme-danger hover:text-theme-bg shadow-sm"
              >
                {resetLoading ? 'Resetting...' : 'Yes, Reset Stats'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
