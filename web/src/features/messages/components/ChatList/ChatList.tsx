"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Users } from "lucide-react";
import { useMessageStore } from "../../stores/useMessageStore";
import { Conversation } from "../../types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChatList() {
  const router = useRouter();
  const pathname = usePathname();
  const { conversations, activeConversationId, setActiveConversationId, typingUsers } = useMessageStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "direct" | "squads">("all");

  const filteredConversations = conversations.filter((conv) => {
    // Tab filter
    if (activeTab === "direct" && conv.type !== "direct") return false;
    if (activeTab === "squads" && conv.type !== "group") return false;
    
    // Search query filter
    if (searchQuery.trim() === "") return true;
    return conv.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelectChat = (conv: Conversation) => {
    setActiveConversationId(conv.id);
    router.push(`/messages?chatId=${conv.id}`);
  };

  return (
    <div className="flex flex-col h-full bg-background/30 select-none">
      {/* Header Info Banner */}
      <div className="p-4 flex items-center justify-between border-b border-border bg-background/40">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          Messages
        </h1>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-foreground/40 z-10" />
          <Input
            type="text"
            placeholder="Search Friends"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex px-3 pb-2 gap-2 border-b border-border/40">
        {(["all", "direct", "squads"] as const).map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            variant={activeTab === tab ? "default" : "outline"}
            className="flex-1 text-xs capitalize"
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => {
            const isSelected = activeConversationId === conv.id;
            const convTyping = typingUsers[conv.id] || [];

            return (
              <div
                key={conv.id}
                onClick={() => handleSelectChat(conv)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-muted/80 border-primary/45 shadow-glass text-white"
                    : "hover:bg-muted/40 border-transparent text-foreground/80 hover:text-white"
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm ${
                    conv.type === "group" 
                      ? "bg-purple-600/40 border border-purple-500/30" 
                      : "bg-brand-gradient"
                  }`}>
                    {conv.type === "group" ? (
                      <Users className="h-5 w-5 text-purple-200" />
                    ) : (
                      conv.title.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  {conv.members[0]?.presence === "online" && conv.type === "direct" && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold truncate text-white">
                      {conv.title}
                    </h3>
                    <span className="text-[10px] text-foreground/40">
                      {conv.lastMessage
                        ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : ""}
                    </span>
                  </div>
                  
                  {/* Typing state or last message */}
                  {convTyping.length > 0 ? (
                    <span className="text-xs text-brand-2 font-medium flex items-center gap-1 animate-pulse">
                      typing...
                    </span>
                  ) : (
                    <p className="text-xs text-foreground/50 truncate font-medium mt-0.5">
                      {conv.lastMessage?.content || "No messages yet"}
                    </p>
                  )}
                </div>

                {/* Unread Badge */}
                {conv.unreadCount > 0 && !isSelected && (
                  <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-glow-sm">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-foreground/40">
            No conversations found
          </div>
        )}
      </div>
    </div>
  );
}
