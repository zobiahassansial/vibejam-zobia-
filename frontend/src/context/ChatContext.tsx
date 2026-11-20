import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { chatApi, faqApi } from '../api/client';
import { APP_CONFIG } from '../config';
import type { ChatMessage, Conversation, FAQ, LanguageMode } from '../types';
import {
  collectPersistedMessageIds,
  conversationTitle,
  createEmptyConversation,
  loadConversationsState,
  persistConversationsState,
  trimConversations,
} from '../utils/conversationStorage';
import { getReplyLanguage } from '../utils/language';
import { localTimestamp } from '../utils/formatChatTime';
import { validateChatMessage } from '../utils/validateChatMessage';

interface ChatContextValue {
  messages: ChatMessage[];
  conversations: Conversation[];
  activeConversationId: string;
  input: string;
  languageMode: LanguageMode;
  urduScriptMode: boolean;
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
  startNewChat: () => void;
  switchConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearAllConversations: () => Promise<void>;
  markAnimated: (id: number) => void;
  stopRequest: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

async function deleteBackendMessageIds(ids: number[]) {
  if (!ids.length) return;
  try {
    await chatApi.deleteMessages(ids);
  } catch {
    // stats best-effort; local history remains source of UI truth
  }
}

function messageIdsFrom(messages: ChatMessage[]): number[] {
  return messages.map((message) => message.id).filter((id) => id > 0);
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const initialState = useRef(loadConversationsState()).current;
  const [conversations, setConversations] = useState<Conversation[]>(initialState.conversations);
  const [activeConversationId, setActiveConversationId] = useState(initialState.activeConversationId);
  const [input, setInput] = useState(initialState.input);
  const [languageMode, setLanguageMode] = useState<LanguageMode>(initialState.languageMode);
  const [urduScriptMode, setUrduScriptMode] = useState(initialState.urduScriptMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedFaqs, setSuggestedFaqs] = useState<FAQ[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const legacyHydrated = useRef(false);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId)
      ?? conversations[0]
      ?? createEmptyConversation(),
    [conversations, activeConversationId],
  );
  const messages = activeConversation.messages;

  const patchActiveConversation = useCallback((
    updater: (conversation: Conversation) => Conversation,
  ) => {
    setConversations((current) => current.map((conversation) => (
      conversation.id === activeConversationId ? updater(conversation) : conversation
    )));
  }, [activeConversationId]);

  const setMessages = useCallback((
    updater: React.SetStateAction<ChatMessage[]>,
  ) => {
    patchActiveConversation((conversation) => {
      const nextMessages = typeof updater === 'function'
        ? updater(conversation.messages)
        : updater;
      const now = localTimestamp();
      return {
        ...conversation,
        messages: nextMessages,
        updatedAt: now,
        title: conversationTitle(nextMessages),
      };
    });
  }, [patchActiveConversation]);

  useEffect(() => {
    if (legacyHydrated.current) return;
    legacyHydrated.current = true;
    const hasAnyMessages = conversations.some((conversation) => conversation.messages.length > 0);
    if (hasAnyMessages) return;
    chatApi.getHistory().then((res) => {
      const history: ChatMessage[] = (res.data || []).map((message: ChatMessage, index: number) => ({
        ...message,
        timestamp: /^\d{4}-\d{2}-\d{2}/.test(String(message.timestamp))
          ? message.timestamp
          : new Date(Date.now() - (res.data.length - index) * 1000).toISOString(),
        animated: true,
      }));
      if (!history.length) return;
      setConversations((current) => {
        const first = current[0] ?? createEmptyConversation();
        const merged: Conversation = {
          ...first,
          messages: history,
          title: conversationTitle(history),
          updatedAt: localTimestamp(),
        };
        return trimConversations([merged, ...current.filter((c) => c.id !== first.id)]);
      });
    }).catch(() => {});
  }, [conversations]);

  useEffect(() => {
    faqApi.getAll().then((res) => {
      const all: FAQ[] = res.data || [];
      setSuggestedFaqs(all.filter((faq) => faq.is_starter).slice(0, 5));
    }).catch(() => {});
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    persistConversationsState({
      conversations,
      activeConversationId,
      input,
      languageMode,
      urduScriptMode,
    });
  }, [conversations, activeConversationId, input, languageMode, urduScriptMode]);

  const stopRequest = useCallback(() => abortRef.current?.abort(), []);

  const startNewChat = useCallback(() => {
    if (messages.length === 0) return;
    const fresh = createEmptyConversation();
    setConversations((current) => trimConversations([fresh, ...current]));
    setActiveConversationId(fresh.id);
    setInput('');
    setError(null);
    stopRequest();
  }, [messages.length, stopRequest]);

  const switchConversation = useCallback((conversationId: string) => {
    if (conversationId === activeConversationId) return;
    setActiveConversationId(conversationId);
    setInput('');
    setError(null);
    stopRequest();
  }, [activeConversationId, stopRequest]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    const target = conversations.find((conversation) => conversation.id === conversationId);
    if (!target) return;
    await deleteBackendMessageIds(messageIdsFrom(target.messages));
    const remaining = conversations.filter((conversation) => conversation.id !== conversationId);
    if (conversationId === activeConversationId) {
      const fresh = createEmptyConversation();
      setConversations(trimConversations([fresh, ...remaining]));
      setActiveConversationId(fresh.id);
    } else {
      setConversations(trimConversations(remaining.length ? remaining : [createEmptyConversation()]));
    }
    setInput('');
    setError(null);
    stopRequest();
  }, [conversations, activeConversationId, stopRequest]);

  const clearAllConversations = useCallback(async () => {
    const ids = collectPersistedMessageIds(conversations);
    await deleteBackendMessageIds(ids);
    const fresh = createEmptyConversation();
    setConversations([fresh]);
    setActiveConversationId(fresh.id);
    setInput('');
    setError(null);
    stopRequest();
  }, [conversations, stopRequest]);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const raw = overrideText ?? input;
    const text = raw.trim();
    if (loading) return false;
    const validationError = validateChatMessage(raw);
    if (validationError) {
      setError(validationError);
      return false;
    }

    const sentAt = localTimestamp();
    const userMessage: ChatMessage = {
      id: -Date.now(),
      role: 'user',
      content: text,
      timestamp: sentAt,
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
      const assistantMessage: ChatMessage = {
        ...response.data,
        timestamp: sentAt,
        animated: false,
      };
      setMessages((current) => [...current, assistantMessage]);
      return true;
    } catch (requestError: any) {
      const detail = requestError?.response?.data?.detail;
      setError(detail === APP_CONFIG.validationMessage ? detail : APP_CONFIG.aiUnavailableMessage);
      setInput(text);
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));
      return false;
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  }, [input, languageMode, loading, setMessages, urduScriptMode]);

  const clearMessages = useCallback(async () => {
    await deleteBackendMessageIds(messageIdsFrom(messages));
    setMessages([]);
  }, [messages, setMessages]);

  const markAnimated = useCallback((id: number) => {
    setMessages((current) => current.map((message) => (
      message.id === id ? { ...message, animated: true } : message
    )));
  }, [setMessages]);

  return (
    <ChatContext.Provider value={{
      messages,
      conversations,
      activeConversationId,
      input,
      languageMode,
      urduScriptMode,
      loading,
      error,
      suggestedFaqs,
      setMessages,
      setInput,
      setLanguageMode,
      setUrduScriptMode,
      setError,
      sendMessage,
      clearMessages,
      startNewChat,
      switchConversation,
      deleteConversation,
      clearAllConversations,
      markAnimated,
      stopRequest,
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