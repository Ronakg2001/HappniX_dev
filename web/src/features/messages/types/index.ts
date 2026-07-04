export type UserPresence = "online" | "away" | "offline" | "typing";

export interface ChatUser {
  id: string;
  username: string;
  avatarUrl: string;
  presence: UserPresence;
  lastSeenAt?: string;
  isVerified?: boolean;
}

export type MessageType = "text" | "image" | "video" | "audio" | "system" | "event_share" | "deleted";

export type MessageStatus = "pending" | "sending" | "sent" | "delivered" | "failed";

export interface MessageAttachment {
  id: string;
  type: "image" | "video" | "audio" | "file";
  url: string;
  name: string;
  sizeBytes?: number;
}

export interface EventSharePayload {
  eventId: string;
  title: string;
  coverImage: string;
  date: string;
  venue: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  attachments?: MessageAttachment[];
  eventShare?: EventSharePayload;
  status: MessageStatus;
  createdAt: string;
  updatedAt?: string;
  replyToId?: string;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  title: string;
  avatarUrl?: string;
  lastMessage?: Message;
  unreadCount: number;
  members: ChatUser[];
  typingUserIds?: string[];
  isBlocked?: boolean;
  isPendingRequest?: boolean;
}
