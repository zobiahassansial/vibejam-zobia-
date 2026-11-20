import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Grid2X2, History, Languages, Mic, MicOff, Plus, Send, Sparkles, Trash2, X } from 'lucide-react';
import { ChatHistoryDrawer } from './ChatHistoryDrawer';
import { TopicCardGrid } from './TopicCards';
import { MessageBubble } from './MessageBubble';
import { SuggestedChips } from './SuggestedChips';
import { TypingIndicator } from './TypingIndicator';
import { statsApi } from '../../api/client';
import { APP_CONFIG } from '../../config';
import { useChat } from '../../context/ChatContext';
import type { ChatMessage } from '../../types';
import { characterCount, hasUrduScript, truncateCharacters } from '../../utils/language';
import { useToast } from '../common/Toast';

interface ChatPageProps { onNavigateToFaq?: (faqId: string) => void; }

export function ChatPage({ onNavigateToFaq }: ChatPageProps) {
  const {
    messages, conversations, activeConversationId, input, languageMode, urduScriptMode, loading, error, suggestedFaqs,
    setMessages, setInput, setLanguageMode, setUrduScriptMode, setError,
    sendMessage, clearMessages, startNewChat, switchConversation, deleteConversation, clearAllConversations, markAnimated, stopRequest,
  } = useChat();
  const { showToast } = useToast();
  const [showClearModal, setShowClearModal] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimer = useRef<number | null>(null);
  const speechBase = useRef('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stopRecognition = useCallback(() => {
    if (silenceTimer.current) window.clearTimeout(silenceTimer.current);
    silenceTimer.current = null;
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading, activeConversationId]);

  const handleNewChat = useCallback(() => {
    stopRecognition();
    if (messages.length === 0) {
      textareaRef.current?.focus();
      return;
    }
    startNewChat();
    textareaRef.current?.focus();
  }, [messages.length, startNewChat, stopRecognition]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setSpeechSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      const separator = speechBase.current && transcript ? ' ' : '';
      setInput(truncateCharacters(`${speechBase.current}${separator}${transcript}`));
      if (silenceTimer.current) window.clearTimeout(silenceTimer.current);
      silenceTimer.current = window.setTimeout(() => recognition.stop(), 1500);
    };
    recognition.onerror = (event: any) => {
      const messagesByError: Record<string, string> = {
        'not-allowed': 'Microphone permission is blocked. Allow it in the browser address bar.',
        'service-not-allowed': 'Microphone permission is blocked. Allow it in the browser address bar.',
        'no-speech': 'No speech was detected. Please try again.',
        'audio-capture': 'No microphone was found. Check your audio device.',
        network: 'Voice input needs a network connection. Please try again.',
      };
      showToast(messagesByError[event.error] || 'Voice input unavailable.', 'error');
      setListening(false);
    };
    recognition.onend = () => {
      if (silenceTimer.current) window.clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
      setListening(false);
    };
    recognitionRef.current = recognition;
    return () => { try { recognition.stop(); } catch {} };
  }, [setInput, showToast]);

  useEffect(() => () => stopRecognition(), [stopRecognition]);

  const handleVoice = () => {
    if (!recognitionRef.current) return;
    if (listening) { stopRecognition(); return; }
    speechBase.current = input;
    recognitionRef.current.lang = languageMode === 'urdu' ? 'ur-PK' : 'en-US';
    try {
      recognitionRef.current.start();
      setListening(true);
      if (silenceTimer.current) window.clearTimeout(silenceTimer.current);
      silenceTimer.current = window.setTimeout(() => recognitionRef.current?.stop(), 1500);
    } catch { setListening(false); }
  };

  const handleSend = useCallback(async (question?: string) => {
    stopRecognition();
    const sent = await sendMessage(question);
    if (sent && question) setShowTopics(false);
  }, [sendMessage, stopRecognition]);

  const handleFeedback = async (id: number, helpful: boolean) => {
    try {
      await statsApi.submitFeedback(id, helpful);
      setMessages((current) => current.map((message) => message.id === id
        ? { ...message, feedback: helpful ? 'helpful' : 'not_helpful' }
        : message));
      showToast('Thank you for your feedback!', 'success');
    } catch { showToast('Feedback already recorded.', 'info'); }
  };

  const handleClear = async () => {
    try {
      await clearMessages();
      setShowClearModal(false);
      showToast('Chat history cleared.', 'success');
    } catch {
      setShowClearModal(false);
      showToast('Failed to clear chat history.', 'error');
    }
  };

  const counter = characterCount(input);
  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-theme-border glass-panel z-10 shrink-0">
        <div><h1 className="font-bold text-theme-text text-base md:text-lg flex items-center gap-2">Department Help Desk <span className="w-2 h-2 rounded-full bg-theme-success animate-pulse" title="AI Ready" /></h1><p className="text-xs text-theme-muted">Ask questions about labs, attendance, exams, fees, library and FYP</p></div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button type="button" onClick={handleNewChat} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl border border-theme-border-strong text-theme-text hover:bg-theme-surface-hover" title="New chat" aria-label="New chat"><Plus size={14} /><span className="hidden sm:inline">New chat</span></button>
          <button type="button" onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl border border-theme-border-strong text-theme-text hover:bg-theme-surface-hover" title="History" aria-label="History"><History size={14} /><span className="hidden sm:inline">History</span></button>
          <button type="button" onClick={() => setShowTopics(true)} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl border border-theme-border-strong text-theme-text hover:bg-theme-surface-hover" title="Topics" aria-label="Open topics"><Grid2X2 size={14} /><span className="hidden sm:inline">Topics</span></button>
          <button type="button" onClick={() => setShowClearModal(true)} disabled={messages.length === 0} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl border border-theme-border-strong text-theme-text hover:text-theme-danger hover:bg-theme-danger-soft hover:border-theme-danger disabled:opacity-40" title="Clear all messages" aria-label="Clear chat"><Trash2 size={13} /><span className="hidden sm:inline">Clear Chat</span></button>
        </div>
      </div>

      <div className="mx-4 md:mx-6 mt-2 mb-0 shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-theme-warning-soft border border-theme-warning text-theme-warning text-sm shadow-sm"><AlertCircle size={15} className="shrink-0" /><p className="font-medium leading-snug text-xs sm:text-sm">{APP_CONFIG.noticeText}</p></div>

      <div
        className={`flex-1 min-h-0 overflow-y-auto px-4 md:px-6 ${
          messages.length === 0 && !loading
            ? 'flex flex-col justify-center py-2'
            : 'space-y-3 py-3'
        }`}
      >
        {messages.length === 0 && !loading && (
          <div className="flex w-full max-w-[900px] mx-auto flex-col items-center gap-3 text-center px-1">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] p-0.5 shadow-glow-brand">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-theme-surface text-theme-primary-hover">
                <Sparkles size={18} />
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-theme-text tracking-tight">
              Welcome to <span className="text-theme-primary-hover">AskSE</span> Help Desk
            </h2>
            <p className="text-sm text-theme-muted max-w-[520px] leading-snug line-clamp-2">
              Your official Software Engineering Department assistant. Grounded exclusively in verified FAQs.
            </p>
            <p className="w-full text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              CLICK ANY TOPIC BELOW TO ASK
            </p>
            <TopicCardGrid layout="welcome" onSelect={handleSend} />
          </div>
        )}
        {messages.map((message) => <MessageBubble key={message.id} message={message} onAnimated={markAnimated} onFeedback={handleFeedback} onCitationClick={onNavigateToFaq} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <SuggestedChips faqs={suggestedFaqs} onSelect={(question) => { setInput(question); textareaRef.current?.focus(); }} />
      {error && (
        <p className="px-4 md:px-6 pb-1 text-xs font-medium text-theme-danger" role="alert">
          {error}
        </p>
      )}
      <div className="px-4 md:px-6 pb-3 shrink-0"><div className="glass-panel rounded-2xl shadow-glass-sm border border-theme-border-strong focus-within:border-theme-primary focus-within:shadow-[0_0_0_3px_var(--ring)] p-3">
        <textarea ref={textareaRef} value={input} onChange={(event) => { setInput(event.target.value); if (error) setError(null); }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); handleSend(); } }} placeholder="Ask about CS lab timings, attendance rules, library hours, fee challan, FYP proposal..." rows={2} dir="auto" className={`w-full px-1 pt-0 pb-1 text-sm bg-transparent resize-none outline-none text-theme-text placeholder-theme-faint text-start ${hasUrduScript(input) ? 'urdu-script' : ''}`} />
        <div className="flex items-center justify-between gap-2 pt-1"><div className="flex items-center gap-2 min-w-0"><select value={languageMode} onChange={(event) => setLanguageMode(event.target.value as typeof languageMode)} aria-label="Reply language" className="max-w-24 bg-theme-surface-2 border border-theme-border text-theme-text text-xs rounded-lg px-2 py-1.5"><option value="auto">Auto</option><option value="english">English</option><option value="urdu">Urdu</option></select><button onClick={() => setUrduScriptMode((value) => !value)} className={`hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${urduScriptMode ? 'border-theme-primary bg-theme-primary-soft text-theme-primary-hover' : 'border-theme-border text-theme-muted hover:bg-theme-surface-hover'}`} title="Urdu script replies" aria-pressed={urduScriptMode}><Languages size={13} /><span>Urdu script</span></button><span title={speechSupported ? '' : 'Voice input is not supported in this browser. Please use Chrome or Edge.'}><button onClick={handleVoice} disabled={!speechSupported} aria-pressed={listening} aria-label={listening ? 'Stop listening' : 'Start voice input'} className={`p-2 rounded-lg border disabled:opacity-40 ${listening ? 'border-theme-danger bg-theme-danger-soft text-theme-danger animate-pulse' : 'border-theme-border text-theme-muted hover:bg-theme-surface-hover'}`}>{listening ? <MicOff size={15} /> : <Mic size={15} />}</button></span>{listening && <span className="text-xs text-theme-danger">Listening...</span>}</div><div className="flex items-center gap-3"><span className={`text-xs font-mono ${counter > 300 ? 'text-theme-danger font-bold' : counter >= 270 ? 'text-theme-warning' : 'text-theme-muted'}`}>{counter}/300</span><button onClick={() => handleSend()} disabled={loading} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-theme-primary text-theme-on-primary hover:bg-theme-primary-hover disabled:opacity-40" aria-label="Send message"><Send size={13} /><span>Send</span></button></div></div>
      </div></div>

      <ChatHistoryDrawer
        open={showHistory}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onClose={() => setShowHistory(false)}
        onSelect={(conversationId) => {
          stopRecognition();
          switchConversation(conversationId);
        }}
        onDelete={deleteConversation}
        onClearAll={clearAllConversations}
      />

      {showTopics && <div className="absolute inset-0 z-30 bg-theme-scrim backdrop-blur-sm p-4 flex justify-end" role="dialog" aria-modal="true" aria-label="Topics"><div className="w-full max-w-xl h-full overflow-y-auto bg-theme-elevated border border-theme-border rounded-2xl p-5 shadow-glass"><div className="flex justify-between items-center mb-5"><div><h2 className="font-bold text-theme-text">Topics</h2><p className="text-xs text-theme-muted">Choose a topic to send its question.</p></div><button onClick={() => setShowTopics(false)} className="p-2 rounded-lg text-theme-muted hover:bg-theme-surface-hover" aria-label="Close topics"><X size={16} /></button></div><TopicCardGrid layout="drawer" onSelect={handleSend} /><div className="mt-6"><SuggestedChips faqs={suggestedFaqs} onSelect={(question) => handleSend(question)} /></div></div></div>}
      {showClearModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-theme-scrim backdrop-blur-sm p-4"><div className="glass-panel bg-theme-elevated rounded-2xl shadow-glass border border-theme-border p-6 max-w-sm w-full mx-4"><h3 className="font-bold text-theme-text text-base mb-2">{APP_CONFIG.clearConfirmMessage}</h3><p className="text-xs text-theme-muted mb-6 leading-relaxed">This will permanently delete all chat messages from your local history. FAQs in the knowledge base will not be affected.</p><div className="flex justify-end gap-2.5"><button onClick={() => setShowClearModal(false)} className="px-4 py-2 text-xs font-semibold rounded-xl border border-theme-border text-theme-muted hover:bg-theme-surface-hover">Cancel</button><button onClick={handleClear} className="px-4 py-2 text-xs font-bold rounded-xl border border-theme-danger bg-theme-danger-soft hover:bg-theme-danger text-theme-danger hover:text-theme-bg">Clear</button></div></div></div>}
    </div>
  );
}
