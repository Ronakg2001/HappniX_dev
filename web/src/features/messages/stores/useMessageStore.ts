import { create } from "zustand";
import { Conversation, Message } from "../types";

interface MessageState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messagesByConversation: Record<string, Message[]>;
  drafts: Record<string, string>;
  connected: boolean;
  loading: boolean;
  typingUsers: Record<string, string[]>; // conversationId -> usernames[]
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversationId: (id: string | null) => void;
  setConnected: (status: boolean) => void;
  setLoading: (status: boolean) => void;
  setDraft: (conversationId: string, draft: string) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  addOptimisticMessage: (conversationId: string, message: Message) => void;
  updateMessageStatus: (messageId: string, status: "sent" | "delivered" | "failed") => void;
  setTypingUser: (conversationId: string, username: string, isTyping: boolean) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  drafts: {},
  connected: false,
  loading: false,
  typingUsers: {},

  setConversations: (conversations) => set({ conversations }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setConnected: (connected) => set({ connected }),
  setLoading: (loading) => set({ loading }),
  
  setDraft: (conversationId, draft) => set((state) => ({
    drafts: { ...state.drafts, [conversationId]: draft }
  })),

  setMessages: (conversationId, messages) => set((state) => ({
    messagesByConversation: {
      ...state.messagesByConversation,
      [conversationId]: messages
    }
  })),

  addMessage: (conversationId, message) => set((state) => {
    const currentList = state.messagesByConversation[conversationId] || [];
    
    // De-duplicate if the message ID already exists (e.g. from optimistic update resolving)
    const exists = currentList.some((m) => m.id === message.id);
    let updatedList;
    if (exists) {
      updatedList = currentList.map((m) => m.id === message.id ? message : m);
    } else {
      updatedList = [...currentList, message];
    }

    // Also update last message in conversation list
    const updatedConvs = state.conversations.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          lastMessage: message,
          unreadCount: state.activeConversationId === conversationId ? 0 : c.unreadCount
        };
      }
      return c;
    });

    return {
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: updatedList
      },
      conversations: updatedConvs
    };
  }),

  addOptimisticMessage: (conversationId, message) => set((state) => {
    const currentList = state.messagesByConversation[conversationId] || [];
    return {
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [...currentList, message]
      }
    };
  }),

  updateMessageStatus: (messageId, status) => set((state) => {
    const nextMessages = { ...state.messagesByConversation };
    Object.keys(nextMessages).forEach((convId) => {
      nextMessages[convId] = nextMessages[convId].map((m) =>
        m.id === messageId ? { ...m, status } : m
      );
    });
    return { messagesByConversation: nextMessages };
  }),

  setTypingUser: (conversationId, username, isTyping) => set((state) => {
    const list = state.typingUsers[conversationId] || [];
    const updated = isTyping
      ? [...new Set([...list, username])]
      : list.filter((u) => u !== username);
    
    return {
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: updated
      }
    };
  })
}));
