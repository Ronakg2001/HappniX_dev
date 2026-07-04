"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMessageStore } from "@/features/messages/stores/useMessageStore";
import { messageService } from "@/features/messages/services/messages";
import ChatList from "@/features/messages/components/ChatList/ChatList";

function MessagesLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");
  const isIndividualChat = !!chatId;
  const { setConversations, setConnected, addMessage, setTypingUser, updateMessageStatus } = useMessageStore();

  // Initialize conversations list
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await messageService.getConversations();
        setConversations(data);
      } catch (err) {
        console.error("Failed to load conversations", err);
      }
    };
    loadConversations();
  }, [setConversations]);

  // Initialize WebSocket connection
  useEffect(() => {
    messageService.initWebSocket("usr_me", "me", {
      onNewMessage: (msg) => {
        addMessage(msg.conversationId, msg);
      },
      onTypingStatus: (conversationId, username, isTyping) => {
        setTypingUser(conversationId, username, isTyping);
      },
      onStatusUpdate: (messageId, status) => {
        updateMessageStatus(messageId, status);
      },
      onConnectionChange: (connected) => {
        setConnected(connected);
      }
    });

    return () => {
      messageService.disconnect();
    };
  }, [addMessage, setTypingUser, updateMessageStatus, setConnected]);

  return (
    <div className="flex-1 flex bg-card/40 backdrop-blur-md border border-border rounded-lg overflow-hidden h-[calc(100dvh-180px)] md:h-[80vh] relative z-10">
      {/* Left Column: Chat list (hidden on mobile if in chat details) */}
      <div
        className={`${
          isIndividualChat ? "hidden md:flex" : "flex"
        } w-full md:w-[360px] lg:w-[400px] flex-col border-r border-border`}
      >
        <ChatList />
      </div>

      {/* Right Column: Chat window (hidden on mobile if not in chat details) */}
      <div className={`${isIndividualChat ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        {children}
      </div>
    </div>
  );
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex-1 flex bg-card/40 backdrop-blur-md border border-border rounded-lg items-center justify-center min-h-[75vh]">
        <div className="text-white/60 animate-pulse">Loading Messages...</div>
      </div>
    }>
      <MessagesLayoutInner>{children}</MessagesLayoutInner>
    </Suspense>
  );
}
