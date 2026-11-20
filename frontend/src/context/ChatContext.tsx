import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { chatApi, faqApi } from '../api/client';
import { APP_CONFIG } from '../config';
import type { ChatMessage, FAQ, LanguageMode } from '../types';
import { characterCount, getReplyLanguage } from '../utils/language';

interface PersistedChatState {
  messages: ChatMessage[];
  input: string;
  languageMode: LanguageMode;
  urduScriptMode: boolean;
}

interface ChatContextValue extends PersistedChatState {
  loading: boolean;
  error: string | null;
  suggestedFaqs: FAQ[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setLanguageMode: React.Dispatch<React.SetStateAction<LanguageMode>>;
  setUrduScriptMode: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  sendMessage: (overrideText?: string) => Promise<boolean>;
  clearMessages: () => Promise<void>;
  markAnimated: (id: number) => void;
  stopRequest: () => void;
}

const STORAGE_KEY = 'askse_chat_ui_v1';
const ChatContext = createContext<ChatContextValue | null>(null);

function loadPersisted(): PersistedChatState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<PersistedChatState>;
    return {
      messages: Array.isArray(parsed.messages)
        ? parsed.messages.map((message) => ({ ...message, animated: true }))
        : [],
      input: typeof parsed.input === 'string' ? parsed.input : '',
      languageMode: ['auto', 'english', 'urdu'].includes(parsed.languageMode || '')
        ? parsed.languageMode as LanguageMode
        : 'auto',
      urduScriptMode: Boolean(parsed.urduScriptMode),
    };
  } catch {
    return { messages: [], input: '', languageMode: 'auto', urduScriptMode: false };
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const initial = useRef(loadPersisted()).current;
  const [messages, setMessages] = useState<ChatMessage[]>(initial.messages);
  const [input, setInput] = useState(initial.input);
  const [languageMode, setLanguageMode] = useState<LanguageMode>(initial.languageMode);
  const [urduScriptMode, setUrduScriptMode] = useState(initial.urduScriptMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedFaqs, setSuggestedFaqs] = useState<FAQ[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    chatApi.getHistory().then((res) => {
      const history: ChatMessage[] = (res.data || []).map((message: ChatMessage) => ({
        ...message,
        animated: true,
      }));
      setMessages(history);
    }).catch(() => {});
    faqApi.getAll().then((res) => {
      const all: FAQ[] = res.data || [];
      setSuggestedFaqs(all.filter((faq) => faq.is_starter).slice(0, 5));
    }).catch(() => {});
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, input, languageMode, urduScriptMode }));
  }, [messages, input, languageMode, urduScriptMode]);

  const stopRequest = useCallback(() => abortRef.current?.abort(), []);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const raw = overrideText ?? input;
    const text = raw.trim();
    if (loading) return false;
    if (!text || characterCount(raw) > 300) {
      setError(APP_CONFIG.validationMessage);
      return false;
    }

    const userMessage: ChatMessage = {
      id: -Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: 'user',
      animated: true,
    };
    const { detectedLanguage, replyLanguage } = getReplyLanguage(text, languageMode, urduScriptMode);
    const controller = new AbortController();
    abortRef.current = controller;
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const response = await chatApi.sendMessage(
        text,
        languageMode,
        urduScriptMode,
        detectedLanguage,
        replyLanguage,
        controller.signal,
      );
      setMessages((current) => [...current, { ...response.data, animated: false }]);
      return true;
    } catch (requestError: any) {
      const detail = requestError?.response?.data?.detail || APP_CONFIG.aiUnavailableMessage;
      setError(detail);
      setInput(text);
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));
      return false;
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  }, [input, languageMode, loading, urduScriptMode]);

  const clearMessages = useCallback(async () => {
    await chatApi.clearHistory();
    setMessages([]);
  }, []);

  const markAnimated = useCallback((id: number) => {
    setMessages((current) => current.map((message) => (
      message.id === id ? { ...message, animated: true } : message
    )));
  }, []);

  return (
    <ChatContext.Provider value={{
      messages, input, languageMode, urduScriptMode, loading, error, suggestedFaqs,
      setMessages, setInput, setLanguageMode, setUrduScriptMode, setError,
      sendMessage, clearMessages, markAnimated, stopRequest,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used inside ChatProvider');
  return context;
}
