"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import ChatWindow from "@/features/messages/components/ChatWindow/ChatWindow";

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");

  if (chatId) {
    return <ChatWindow chatId={chatId} />;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/20">
      <div className="h-16 w-16 rounded-full bg-brand-gradient flex items-center justify-center mb-4 text-white shadow-glow">
        <MessageSquare className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">No conversation selected</h2>
      <p className="text-sm text-foreground/60 max-w-xs">
        Choose a direct message thread or group squad from the list to start planning your next gig.
      </p>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-8 text-center bg-background/20">
        <div className="text-white/60 animate-pulse">Loading Chat Window...</div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
}
