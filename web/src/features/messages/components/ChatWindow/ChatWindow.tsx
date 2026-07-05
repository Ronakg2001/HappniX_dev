"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { Send, Image, ArrowLeft, MoreVertical, Calendar, Plus, Video, Music, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMessageStore } from "../../stores/useMessageStore";
import { messageService } from "../../services/messages";
import { MessageBubble } from "../Bubbles/MessageBubble";
import { Message, MessageType } from "../../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatWindow({ chatId }: { chatId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const {
    messagesByConversation,
    conversations,
    setMessages,
    addMessage,
    addOptimisticMessage,
    updateMessageStatus,
    typingUsers
  } = useMessageStore();

  const conversation = conversations.find((c) => c.id === chatId);
  const rawMessages = messagesByConversation[chatId] || [];
  const activeTyping = typingUsers[chatId] || [];

  const [inputText, setInputText] = useState("");
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isSquadInfoOpen, setIsSquadInfoOpen] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hidden File Inputs Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAttachmentMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Fetch messages initially
  useEffect(() => {
    let active = true;
    const fetchThread = async () => {
      try {
        const res = await messageService.getMessages(chatId);
        if (active) {
          setMessages(chatId, res.messages);
        }
      } catch (err) {
        console.error("Failed fetching message thread", err);
      }
    };
    fetchThread();
    return () => {
      active = false;
    };
  }, [chatId, setMessages]);

  // Virtualizer setup
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rawMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70,
    overscan: 5
  });

  // Scroll to bottom on mount or new messages
  const lastMessagesLengthRef = useRef(rawMessages.length);
  useEffect(() => {
    if (parentRef.current && rawMessages.length > lastMessagesLengthRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
    lastMessagesLengthRef.current = rawMessages.length;
  }, [rawMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Typing broadcast logic
    messageService.sendTyping(chatId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      messageService.sendTyping(chatId, false);
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const currentText = inputText;
    setInputText("");

    // Create optimistic message object
    const optId = `opt_${Date.now()}`;
    const optimisticMessage: Message = {
      id: optId,
      conversationId: chatId,
      senderId: "me",
      type: "text",
      content: currentText,
      status: "sending",
      createdAt: new Date().toISOString()
    };

    // Pre-insert in store
    addOptimisticMessage(chatId, optimisticMessage);
    if (parentRef.current) {
      setTimeout(() => {
        if (parentRef.current) parentRef.current.scrollTop = parentRef.current.scrollHeight;
      }, 50);
    }

    try {
      const realMsg = await messageService.sendMessage(chatId, currentText, "text", undefined, optId);
      updateMessageStatus(optId, "sent");
      addMessage(chatId, realMsg);
    } catch (err) {
      console.error("Failed sending message", err);
      updateMessageStatus(optId, "failed");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video" | "audio") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    handleSendRealAttachment(type, localUrl, file.name, file.size);
    e.target.value = ""; // Reset
  };

  const handleSendRealAttachment = async (
    type: "image" | "video" | "audio",
    url: string,
    fileName: string,
    sizeBytes: number
  ) => {
    setIsAttachmentMenuOpen(false);
    const optId = `opt_${type}_${Date.now()}`;

    const attachments = [{
      id: `att_${Date.now()}`,
      type,
      url,
      name: fileName,
      sizeBytes
    }];

    const content = "";

    const optMsg: Message = {
      id: optId,
      conversationId: chatId,
      senderId: "me",
      type,
      content,
      attachments,
      status: "sending",
      createdAt: new Date().toISOString()
    };

    addOptimisticMessage(chatId, optMsg);
    if (parentRef.current) {
      setTimeout(() => {
        if (parentRef.current) parentRef.current.scrollTop = parentRef.current.scrollHeight;
      }, 50);
    }

    try {
      const realMsg = await messageService.sendMessage(
        chatId,
        content,
        type,
        undefined,
        optId
      );
      updateMessageStatus(optId, "sent");
      addMessage(chatId, { ...realMsg, attachments });
    } catch (err) {
      updateMessageStatus(optId, "failed");
    }
  };

  const handleSendAttachment = async (type: MessageType) => {
    setIsAttachmentMenuOpen(false);
    
    // For file uploads, trigger respective input dialogs instead of sending mock URL instantly
    if (type === "image") {
      imageInputRef.current?.click();
      return;
    }
    if (type === "video") {
      videoInputRef.current?.click();
      return;
    }
    if (type === "audio") {
      audioInputRef.current?.click();
      return;
    }

    // Fallback/direct mock send for event shares
    const optId = `opt_${type}_${Date.now()}`;
    let eventShare = undefined;
    let content = "";

    if (type === "event_share") {
      content = "Shared Event";
      eventShare = {
        eventId: "evt_shared_mock",
        title: "Sub Sonic Techno Session",
        coverImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500",
        date: "Jun 06, 9:00 PM",
        venue: "Warehouse Club, Sector 5"
      };
    } else {
      return;
    }

    const optMsg: Message = {
      id: optId,
      conversationId: chatId,
      senderId: "me",
      type,
      content,
      eventShare,
      status: "sending",
      createdAt: new Date().toISOString()
    };

    addOptimisticMessage(chatId, optMsg);
    if (parentRef.current) {
      setTimeout(() => {
        if (parentRef.current) parentRef.current.scrollTop = parentRef.current.scrollHeight;
      }, 50);
    }

    try {
      const realMsg = await messageService.sendMessage(
        chatId,
        content,
        type,
        eventShare,
        optId
      );
      updateMessageStatus(optId, "sent");
      addMessage(chatId, realMsg);
    } catch (err) {
      updateMessageStatus(optId, "failed");
    }
  };

  const handleHeaderClick = () => {
    if (conversation?.type === "direct" && conversation.members?.[0]?.id) {
      router.push(`/user?id=${conversation.members[0].id}`);
    } else if (conversation?.type === "group") {
      setIsSquadInfoOpen(true);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-foreground/40">
        Conversation not found
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background/25">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, "image")}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, "video")}
      />
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, "audio")}
      />

      {/* Top Header */}
      <div className="p-4 border-b border-border bg-background/40 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => startTransition(() => router.push("/messages"))}
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div
            onClick={handleHeaderClick}
            className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-black text-sm cursor-pointer hover:opacity-90"
          >
            {conversation.title.slice(0, 2).toUpperCase()}
          </div>
          
          <div 
            onClick={handleHeaderClick} 
            className="cursor-pointer"
          >
            <h2 className="text-sm font-bold text-white hover:underline">
              {conversation.title}
            </h2>
            {activeTyping.length > 0 ? (
              <span className="text-[10px] text-brand-2 animate-pulse font-medium">
                typing...
              </span>
            ) : (
              <span className="text-[10px] text-foreground/40">
                {conversation.type === "group" 
                  ? `${conversation.members.length} participants` 
                  : "Active now"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" className="text-foreground/60 hover:text-white">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Message List Grid */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin scroll-smooth"
        style={{ height: `100%` }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative"
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const message = rawMessages[virtualRow.index];
            const isMe = message.senderId === "me";

            return (
              <div
                key={message.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                <MessageBubble message={message} isMe={isMe} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Input controls */}
      <div className="p-4 border-t border-border bg-background/40 relative">
        {/* Attachment Dropdown */}
        {isAttachmentMenuOpen && (
          <div
            ref={dropdownRef}
            className="absolute bottom-16 left-4 w-48 bg-[#0f0f16] border rounded-md p-1 z-20 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <Button
              onClick={() => handleSendAttachment("image")}
              variant="ghost"
              className="justify-start"
            >
              <Image className="h-4 w-4 text-pink-400" />
              Share Photo
            </Button>
            <Button
              onClick={() => handleSendAttachment("video")}
              variant="ghost"
              className="justify-start"
            >
              <Video className="h-4 w-4 text-purple-400" />
              Share Video
            </Button>
            <Button
              onClick={() => handleSendAttachment("audio")}
              variant="ghost"
              className="justify-start"
            >
              <Music className="h-4 w-4 text-blue-400" />
              Share Audio
            </Button>
            <Button
              onClick={() => handleSendAttachment("event_share")}
              variant="ghost"
              className="justify-start"
            >
              <Calendar className="h-4 w-4 text-white" />
              Share Gig Card
            </Button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
            className="text-foreground/60 hover:text-white shrink-0 border border-border"
          >
            <Plus className="h-5 w-5" />
          </Button>
          
          <Input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={`Message ${conversation.title}...`}
            className="flex-1 bg-muted border border-border/80"
          />

          <Button
            type="submit"
            disabled={!inputText.trim()}
            variant="brand"
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Squad/Group Info Dialog Modal */}
      {isSquadInfoOpen && conversation && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-lg bg-[#0f0f16] border border-border p-4 max-h-[80vh] overflow-y-auto animate-in duration-200 relative">
            <Button 
              onClick={() => setIsSquadInfoOpen(false)}
              variant="ghost"
              size="icon-xs"
              className="absolute top-4 right-4 text-foreground/50 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-12 h-12 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-purple-300 font-black text-lg mb-2">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">{conversation.title}</h3>
              <p className="text-xs text-foreground/50">Squad Chat Group</p>
            </div>

            <div className="mt-5">
              <h4 className="text-[10px] font-black text-foreground/40 uppercase tracking-wider mb-2">
                Participants ({conversation.members.length})
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {conversation.members.map((member) => (
                  <Button 
                    key={member.id} 
                    onClick={() => {
                      setIsSquadInfoOpen(false);
                      router.push(`/user?id=${member.id}`);
                    }}
                    variant="ghost"
                    className="w-full justify-between py-1.5 h-auto text-foreground/80 hover:text-white hover:bg-white/5 cursor-pointer rounded-xl font-normal"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex">
                        <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-[10px]">
                          {member.username.slice(0, 2).toUpperCase()}
                        </div>
                        {member.presence === "online" && (
                          <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-zinc-950 rounded-full" />
                        )}
                      </div>
                      <span className="text-xs font-semibold">@{member.username}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
