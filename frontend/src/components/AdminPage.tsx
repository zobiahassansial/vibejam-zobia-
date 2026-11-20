import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  KeyRound,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Lock,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { adminApi, faqApi } from '../api/client';
import type { FAQ, FAQCategory } from '../types';
import { APP_CONFIG } from '../config';
import { useToast } from './common/Toast';

const CATEGORIES: FAQCategory[] = [
  'Labs',
  'Academics',
  'Library',
  'Exams',
  'Fees',
  'Projects',
  'Transport',
  'Help',
];

const STARTER_IDS = new Set([
  'FAQ-01',
  'FAQ-02',
  'FAQ-03',
  'FAQ-04',
  'FAQ-05',
  'FAQ-06',
  'FAQ-07',
  'FAQ-08',
]);

export function AdminPage() {
  const { showToast } = useToast();

  // Session-unlock only (resets on page reload)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState(false);
  const [shake, setShake] = useState(false);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // FAQ management state
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);

  // Add FAQ form state
  const [newCategory, setNewCategory] = useState<FAQCategory>('Labs');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [addErrors, setAddErrors] = useState<{ question?: string; answer?: string }>({});
  const [addLoading, setAddLoading] = useState(false);

  // Edit FAQ state
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [editCategory, setEditCategory] = useState<FAQCategory>('Labs');
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editErrors, setEditErrors] = useState<{ question?: string; answer?: string }>({});
  const [editLoading, setEditLoading] = useState(false);

  // Reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [clearChatStats, setClearChatStats] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const res = await faqApi.getAll();
      setFaqs(res.data || []);
    } catch {
      showToast('Failed to load FAQs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadFaqs();
    }
  }, [isAuthenticated]);

  // Handle 4-digit PIN auto-advance
  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = digit;
    setPinDigits(newDigits);
    setPinError(false);

    if (digit && index < 3) {
      pinInputRefs.current[index + 1]?.focus();
    }

    // If 4 digits entered, verify
    if (newDigits.every((d) => d !== '')) {
      verifyPin(newDigits.join(''));
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyPin = async (fullPin: string) => {
    try {
      const res = await adminApi.verify(fullPin);
      if (res.data?.valid) {
        setIsAuthenticated(true);
        setPinError(false);
        showToast('Admin session unlocked.', 'success');
      } else {
        triggerPinError();
      }
    } catch {
      triggerPinError();
    }
  };

  const triggerPinError = () => {
    setPinError(true);
    setShake(true);
    showToast(APP_CONFIG.incorrectPinMessage, 'error');
    setPinDigits(['', '', '', '']);
    setTimeout(() => {
      setShake(false);
      pinInputRefs.current[0]?.focus();
    }, 500);
  };

  const validateFields = (q: string, a: string) => {
    const errors: { question?: string; answer?: string } = {};
    if (q.trim().length < 10) errors.question = 'Question must be at least 10 characters.';
    else if (q.trim().length > 150) errors.question = 'Question must be 150 characters or fewer.';

    if (a.trim().length < 10) errors.answer = 'Answer must be at least 10 characters.';
    else if (a.trim().length > 400) errors.answer = 'Answer must be 400 characters or fewer.';

    return errors;
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateFields(newQuestion, newAnswer);
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setAddLoading(true);
    try {
      const res = await adminApi.addFaq({
        category: newCategory,
        question: newQuestion.trim(),
        answer: newAnswer.trim(),
      });
      showToast(`Added ${res.data.id} successfully. AI uses it immediately!`, 'success');
      setNewQuestion('');
      setNewAnswer('');
      setAddErrors({});
      await loadFaqs();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to add FAQ.', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleOpenEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setEditCategory(faq.category as FAQCategory);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
    setEditErrors({});
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq) return;

    const errs = validateFields(editQuestion, editAnswer);
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setEditLoading(true);
    try {
      await adminApi.updateFaq(editingFaq.id, {
        category: editCategory,
        question: editQuestion.trim(),
        answer: editAnswer.trim(),
      });
      showToast(`Updated ${editingFaq.id} successfully.`, 'success');
      setEditingFaq(null);
      await loadFaqs();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to update FAQ.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (STARTER_IDS.has(id)) {
      showToast('Cannot delete starter FAQs.', 'error');
      return;
    }
    if (!confirm(`Are you sure you want to delete ${id}?`)) return;

    try {
      await adminApi.deleteFaq(id);
      showToast(`Deleted ${id}.`, 'info');
      await loadFaqs();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete FAQ.', 'error');
    }
  };

  const handleResetStarter = async () => {
    setResetLoading(true);
    try {
      await adminApi.reset(clearChatStats);
      showToast('Restored 8 starter FAQs successfully.', 'success');
      setShowResetModal(false);
      await loadFaqs();
    } catch {
      showToast('Failed to reset starter data.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  // PIN Gate Screen
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div
          className={`w-full max-w-sm glass-panel p-8 rounded-3xl shadow-glass border border-theme-border  transition-transform ${
            shake ? 'animate-shake translate-x-1' : ''
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] p-0.5 mx-auto mb-4 shadow-glow-brand">
            <div className="w-full h-full bg-theme-surface  rounded-[14px] flex items-center justify-center text-theme-primary-hover ">
              <Shield size={22} />
            </div>
          </div>

          <h2 className="text-lg font-bold text-center text-theme-text  mb-1">
            Admin Authentication
          </h2>
          <p className="text-xs text-center text-theme-muted  mb-6">
            Enter 4-digit PIN to access department administration
          </p>

          {/* 4-digit PIN input boxes with auto-advance */}
          <div className="flex justify-center gap-3 mb-4">
            {pinDigits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  pinInputRefs.current[i] = el;
                }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(i, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-bold font-mono rounded-xl glass-input border text-theme-text  outline-none transition-all ${
                  pinError
                    ? 'border-theme-danger bg-theme-danger-soft'
                    : 'border-theme-border-strong  focus:border-theme-primary '
                }`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {/* Exact error message requirement */}
          {pinError && (
            <p className="text-xs font-bold text-theme-danger text-center mb-4 animate-fade-in">
              {APP_CONFIG.incorrectPinMessage}
            </p>
          )}

          <div className="text-center text-[11px] text-theme-faint mt-4">
            Default competition PIN: <span className="font-mono font-bold">2026</span>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard (Split View)
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Admin Top Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-theme-border  glass-panel shrink-0">
        <div className="flex items-center gap-2.5">
          <Shield size={18} className="text-theme-primary-hover " />
          <div>
            <h1 className="font-bold text-theme-text  text-base">
              Department Administration
            </h1>
            <p className="text-xs text-theme-muted ">
              Manage FAQs & Knowledge Base. Updates take effect immediately.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-theme-warning  bg-theme-warning-soft text-theme-warning  hover:bg-theme-warning-soft transition-colors"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset to Starter Data</span>
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-theme-border  text-theme-muted  hover:bg-theme-surface-hover  transition-colors"
            title="Lock admin session"
          >
            <Lock size={13} />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Split View Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Add FAQ Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-2xl shadow-glass-sm border border-theme-border ">
            <h2 className="text-sm font-bold text-theme-text  flex items-center gap-2 mb-4">
              <Plus size={16} className="text-theme-primary-hover " />
              <span>Add New FAQ</span>
            </h2>

            <form onSubmit={handleAddFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-muted  mb-1.5">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as FAQCategory)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl glass-input text-theme-text  outline-none focus:border-theme-primary"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-theme-surface  text-theme-text ">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-theme-muted ">
                    Question (10–150 chars)
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      newQuestion.length > 150 ? 'text-theme-danger' : 'text-theme-faint'
                    }`}
                  >
                    {newQuestion.length}/150
                  </span>
                </div>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g. Where can I find lost student ID cards?"
                  className={`w-full px-3.5 py-2 text-xs rounded-xl glass-input text-theme-text  placeholder-theme-faint outline-none focus:border-theme-primary ${
                    addErrors.question ? 'border-theme-danger' : ''
                  }`}
                />
                {addErrors.question && (
                  <p className="text-[11px] text-theme-danger mt-1">{addErrors.question}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-theme-muted ">
                    Answer (10–400 chars)
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      newAnswer.length > 400 ? 'text-theme-danger' : 'text-theme-faint'
                    }`}
                  >
                    {newAnswer.length}/400
                  </span>
                </div>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="e.g. Lost cards are handed to Security Office in Block B. Bring your registration slip."
                  rows={4}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl glass-input text-theme-text  placeholder-theme-faint outline-none resize-none focus:border-theme-primary ${
                    addErrors.answer ? 'border-theme-danger' : ''
                  }`}
                />
                {addErrors.answer && (
                  <p className="text-[11px] text-theme-danger mt-1">{addErrors.answer}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={addLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] hover:from-[var(--primary)] hover:to-[var(--primary)] text-theme-on-primary text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {addLoading ? 'Saving...' : 'Add FAQ (Auto ID Assigned)'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live FAQ List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-theme-text ">
              All Knowledge Base FAQs ({faqs.length})
            </h2>
            <span className="text-xs text-theme-faint">
              Starter: 8 | Custom: {Math.max(0, faqs.length - 8)}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-theme-faint">Loading FAQs...</div>
          ) : (
            <div className="space-y-2.5">
              {faqs.map((faq) => {
                const isStarter = STARTER_IDS.has(faq.id);
                return (
                  <div
                    key={faq.id}
                    className="glass-panel p-4 rounded-xl border border-theme-border  flex items-start justify-between gap-3 shadow-sm hover:border-theme-border-strong  transition-all"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-theme-primary-hover ">
                          {faq.id}
                        </span>
                        <span className="text-[11px] px-2 py-0.2 rounded-full bg-theme-surface-2  text-theme-muted  font-medium">
                          {faq.category}
                        </span>
                        {!isStarter ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.2 rounded-full bg-theme-success-soft text-theme-success  border border-theme-success">
                            <Sparkles size={8} />
                            New
                          </span>
                        ) : (
                          <span className="text-[10px] text-theme-faint ">
                            Protected
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-theme-text  truncate">
                        {faq.question}
                      </p>
                      <p className="text-xs text-theme-muted  line-clamp-2">
                        {faq.answer}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isStarter ? (
                        <>
                          <button
                            onClick={() => handleOpenEdit(faq)}
                            className="p-1.5 rounded-lg text-theme-faint hover:text-theme-primary-hover hover:bg-theme-surface-hover  transition-colors"
                            title="Edit FAQ"
                            aria-label={`Edit ${faq.id}`}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(faq.id)}
                            className="p-1.5 rounded-lg text-theme-faint hover:text-theme-danger hover:bg-theme-danger-soft transition-colors"
                            title="Delete FAQ"
                            aria-label={`Delete ${faq.id}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-theme-faint italic px-1">Read-only</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit FAQ Modal */}
      {editingFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-theme-scrim backdrop-blur-sm p-4">
          <div className="glass-panel bg-theme-elevated rounded-2xl shadow-glass border border-theme-border p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-theme-text ">
                Edit FAQ ({editingFaq.id})
              </h3>
              <button onClick={() => setEditingFaq(null)} className="text-theme-faint hover:text-theme-text">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-muted  mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as FAQCategory)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl glass-input text-theme-text  outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-theme-surface  text-theme-text ">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-theme-muted ">
                    Question (10–150 chars)
                  </label>
                  <span className="text-[10px] font-mono text-theme-faint">
                    {editQuestion.length}/150
                  </span>
                </div>
                <input
                  type="text"
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-theme-text  outline-none"
                />
                {editErrors.question && (
                  <p className="text-[11px] text-theme-danger mt-1">{editErrors.question}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-theme-muted ">
                    Answer (10–400 chars)
                  </label>
                  <span className="text-[10px] font-mono text-theme-faint">{editAnswer.length}/400</span>
                </div>
                <textarea
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-theme-text  outline-none resize-none"
                />
                {editErrors.answer && (
                  <p className="text-[11px] text-theme-danger mt-1">{editErrors.answer}</p>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFaq(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-theme-border  text-theme-muted  hover:bg-theme-surface-hover "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-theme-on-primary shadow-sm"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-theme-scrim backdrop-blur-sm p-4">
          <div className="glass-panel bg-theme-elevated rounded-2xl shadow-glass border border-theme-border p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-2.5 text-theme-warning mb-3">
              <AlertTriangle size={20} />
              <h3 className="font-bold text-theme-text  text-base">
                Confirm Reset to Starter Data
              </h3>
            </div>
            <p className="text-xs text-theme-muted  mb-4 leading-relaxed">
              Are you sure? This will restore the original 8 starter FAQs and remove any custom FAQs you added.
            </p>

            {/* Optional checkbox to also clear chat stats */}
            <label className="flex items-center gap-2.5 text-xs text-theme-muted  font-medium mb-6 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={clearChatStats}
                onChange={(e) => setClearChatStats(e.target.checked)}
                className="w-4 h-4 rounded text-theme-primary-hover focus:ring-theme-primary"
              />
              <span>Also clear chat history & statistics</span>
            </label>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-theme-border  text-theme-muted  hover:bg-theme-surface-hover "
              >
                Cancel
              </button>
              <button
                onClick={handleResetStarter}
                disabled={resetLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-theme-danger bg-theme-danger-soft hover:bg-theme-danger text-theme-danger hover:text-theme-bg shadow-sm"
              >
                {resetLoading ? 'Resetting...' : 'Yes, Reset Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
