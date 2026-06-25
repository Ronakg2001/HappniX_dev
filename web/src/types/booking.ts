export interface TicketType {
  id: string;              // ticketID
  orderID?: string;
  orderNumber?: string;
  eventID?: string;
  eventTitle: string;
  tierName?: string;
  tierID?: string;
  date: string;            // event startAt formatted (e.g. "Jun 06")
  time: string;            // event startAt time portion (e.g. "9:00 PM")
  seat: string;            // tier name (e.g. "General Entry", "VIP Access")
  venue?: string;
  status?: string;         // "Pending" | "Confirmed" | "Cancelled"
  totalPaid?: number;
  tierPrice?: number;
  paymentStatus?: string;
  qrPayload?: string | null;
  coverImageUrl?: string | null;
  eventStartAt?: string;
  eventEndAt?: string;
  eventStatus?: string;
  checkedInAt?: string | null;
  createdAt?: string;
}

export interface AttendeeType {
  id: string;
  name: string;
  email: string;
  phone: string;
  ticketType: string;
  status: "Pending" | "Approved" | "Rejected";
  checkedIn: boolean;
  registeredAt: string;
}

export interface SessionType {
  id: string;
  title: string;
  time: string;
  speaker: string;
  duration: string;
  active: boolean;
}

export interface AnnouncementType {
  id: string;
  content: string;
  timestamp: string;
  channel: "email" | "push" | "both";
}

export interface FeedbackType {
  id: string;
  rating: number;
  comment: string;
  author: string;
  timestamp: string;
}

export interface EventLiveState {
  eventId: string;
  registrationOpen: boolean;
  isPublic: boolean;
  attendees: AttendeeType[];
  sessions: SessionType[];
  speakers: string[];
  announcements: AnnouncementType[];
  media: string[];
}

export interface EventStats {
  eventId: string;
  revenue: number;
  views: number;
  hype: string;
  feedback: FeedbackType[];
}
