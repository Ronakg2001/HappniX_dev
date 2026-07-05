"use client";

import React from "react";
import { Check, CheckCheck, AlertCircle, Calendar, MapPin, Play, Music } from "lucide-react";
import { Message } from "../../types";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
}

export const MessageBubble = React.memo(({ message, isMe }: MessageBubbleProps) => {
  const renderStatus = () => {
    if (!isMe) return null;
    switch (message.status) {
      case "pending":
      case "sending":
        return <span className="w-3.5 h-3.5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />;
      case "sent":
        return <Check className="h-3.5 w-3.5 text-white/40" />;
      case "delivered":
        return <CheckCheck className="h-3.5 w-3.5 text-white" />;
      case "failed":
        return <AlertCircle className="h-3.5 w-3.5 text-rose-500" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (message.type) {
      case "event_share":
        if (!message.eventShare) return null;
        return (
          <div className="flex flex-col gap-2 select-none min-w-[240px]">
            <img
              src={message.eventShare.coverImage}
              alt={message.eventShare.title}
              className="w-full h-32 object-cover rounded-xl border border-white/10"
            />
            <div>
              <h4 className="text-sm font-black truncate text-white">{message.eventShare.title}</h4>
              <div className="flex items-center gap-1.5 text-xs text-white/70 mt-1">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{message.eventShare.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/70 mt-0.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{message.eventShare.venue}</span>
              </div>
            </div>
            <button className="w-full mt-1.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-bold text-white transition-all">
              View Ticket Details
            </button>
          </div>
        );

      case "image":
        const imgUrl = message.attachments?.[0]?.url || "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500";
        return (
          <div className="flex flex-col gap-1 select-none min-w-[200px]">
            <img
              src={imgUrl}
              alt="Attachment"
              className="w-full max-h-48 object-cover rounded-xl border border-white/10"
            />
            {message.content && <p className="text-sm mt-1 whitespace-pre-wrap">{message.content}</p>}
          </div>
        );

      case "video":
        const videoUrl = message.attachments?.[0]?.url || "";
        return (
          <div className="flex flex-col gap-1 min-w-[200px] relative">
            <div className="w-full h-36 bg-black/40 rounded-xl flex items-center justify-center border border-white/10 relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500"
                alt="Video thumbnail"
                className="absolute inset-0 w-full h-full object-cover opacity-60 filter blur-[2px]"
              />
              <div className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white backdrop-blur-sm z-10 cursor-pointer border border-white/20 transition-all">
                <Play className="h-5 w-5 fill-current ml-0.5" />
              </div>
            </div>
            {message.content && <p className="text-sm mt-1 whitespace-pre-wrap">{message.content}</p>}
          </div>
        );

      case "audio":
        return (
          <div className="flex items-center gap-3 min-w-[220px] bg-white/5 border border-white/10 p-2.5 rounded-xl select-none">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <Music className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="h-6 flex items-center gap-0.5">
                {[3, 7, 5, 8, 4, 6, 3, 7, 5, 8, 4, 6, 2, 5, 7].map((height, i) => (
                  <span
                    key={i}
                    className="flex-1 bg-white/40 rounded-full animate-pulse"
                    style={{
                      height: `${height * 2.5}px`,
                      animationDelay: `${i * 100}ms`,
                      animationDuration: "1.2s"
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-white/60 block mt-1">Audio Message (0:12)</span>
            </div>
          </div>
        );

      case "system":
        return (
          <div className="flex items-center justify-center w-full my-2 select-none">
            <span className="text-xs px-3 py-1 bg-white/5 border border-white/5 text-white/50 rounded-full">
              {message.content}
            </span>
          </div>
        );

      default:
        return <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>;
    }
  };

  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center w-full mb-3">
        <span className="text-xs px-3 py-1 bg-white/5 border border-white/5 text-white/50 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] md:max-w-[70%] w-fit rounded-2xl px-4 py-2.5 relative border transition-all overflow-hidden ${
          isMe
            ? "bg-primary text-white border-primary/40 shadow-glow-sm rounded-br-none"
            : "bg-muted border-border/80 text-white rounded-bl-none"
        }`}
      >
        {renderContent()}

        {/* Footer timestamp & status */}
        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-60">
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
          {renderStatus()}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";
