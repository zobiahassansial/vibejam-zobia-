import type { ChatMessage, LanguageMode } from '../types';
import type { Conversation } from '../types';

export const MAX_CONVERSATIONS = 30;
export const STORAGE_KEY_V2 = 'askse_conversations_v1';
const STORAGE_KEY_V1 = 'askse_chat_ui_v1';

export function conversationTitle(messages: ChatMessage[], fallback = 'New chat'): string {
  const firstUser = messages.find((message) => message.role === 'user');
  if (!firstUser?.content?.trim()) return fallback;
  const trimmed = firstUser.content.trim();
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
}

export function createEmptyConversation(): Conversation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: 'New chat',
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function trimConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, MAX_CONVERSATIONS);
}

export interface PersistedConversationsState {
  conversations: Conversation[];
  activeConversationId: string;
  input: string;
  languageMode: LanguageMode;
  urduScriptMode: boolean;
}

export function loadConversationsState(): PersistedConversationsState {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as Partial<PersistedConversationsState>;
      const conversations = Array.isArray(parsed.conversations)
        ? parsed.conversations.map((conversation) => ({
            ...conversation,
            messages: (conversation.messages || []).map((message) => ({
              ...message,
              animated: true,
            })),
          }))
        : [createEmptyConversation()];
      const trimmed = trimConversations(conversations);
      const activeConversationId =
        trimmed.some((conversation) => conversation.id === parsed.activeConversationId)
          ? String(parsed.activeConversationId)
          : trimmed[0].id;
      return {
        conversations: trimmed.length ? trimmed : [createEmptyConversation()],
        activeConversationId,
        input: typeof parsed.input === 'string' ? parsed.input : '',
        languageMode: ['auto', 'english', 'urdu'].includes(parsed.languageMode || '')
          ? parsed.languageMode as LanguageMode
          : 'auto',
        urduScriptMode: Boolean(parsed.urduScriptMode),
      };
    }
  } catch {
    /* fall through to migration */
  }

  try {
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as {
        messages?: ChatMessage[];
        input?: string;
        languageMode?: LanguageMode;
        urduScriptMode?: boolean;
      };
      const messages = Array.isArray(parsed.messages)
        ? parsed.messages.map((message) => ({ ...message, animated: true }))
        : [];
      const now = new Date().toISOString();
      const conversation: Conversation = {
        id: crypto.randomUUID(),
        title: conversationTitle(messages),
        createdAt: now,
        updatedAt: now,
        messages,
      };
      return {
        conversations: [conversation],
        activeConversationId: conversation.id,
        input: typeof parsed.input === 'string' ? parsed.input : '',
        languageMode: parsed.languageMode || 'auto',
        urduScriptMode: Boolean(parsed.urduScriptMode),
      };
    }
  } catch {
    /* empty */
  }

  const conversation = createEmptyConversation();
  return {
    conversations: [conversation],
    activeConversationId: conversation.id,
    input: '',
    languageMode: 'auto',
    urduScriptMode: false,
  };
}

export function persistConversationsState(state: PersistedConversationsState): void {
  const payload: PersistedConversationsState = {
    ...state,
    conversations: trimConversations(state.conversations),
  };
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload));
    return;
  } catch {
    const reduced = trimConversations(state.conversations).slice(0, Math.max(5, MAX_CONVERSATIONS - 5));
    const activeStillExists = reduced.some((c) => c.id === state.activeConversationId);
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify({
        ...state,
        conversations: reduced,
        activeConversationId: activeStillExists ? state.activeConversationId : (reduced[0]?.id ?? state.activeConversationId),
      }));
    } catch {
      // ignore quota errors
    }
  }
}

export function collectPersistedMessageIds(conversations: Conversation[]): number[] {
  const ids = new Set<number>();
  for (const conversation of conversations) {
    for (const message of conversation.messages) {
      if (typeof message.id === 'number' && message.id > 0) ids.add(message.id);
    }
  }
  return Array.from(ids);
}