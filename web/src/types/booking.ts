export interface TicketType {
  id: string;
  eventTitle: string;
  date: string;
  time: string;
  seat: string;
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
