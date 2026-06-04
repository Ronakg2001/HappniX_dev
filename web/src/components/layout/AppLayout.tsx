"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header";
import LocationBar from "@/components/location/LocationBar";
import LeftSidebar from "./LeftSidebar";
import BottomNav from "./BottomNav";
import { 
  BookingModal, 
  NotificationsModal, 
  CreateEventModal 
} from "@/components/modals/HomeModals";

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

export interface TicketTierType {
  id: string;
  name: string;
  price: number;
  inventory: number;
  sold: number;
  paused: boolean;
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

export interface CreatedEventType {
  id: string;
  title: string;
  category: string;
  description: string;
  price: string;
  date: string;
  time: string;
  endTime: string;
  venue: string;
  address: string;
  status: "Draft" | "Upcoming" | "Live" | "Completed" | "Archived";
  registrationOpen: boolean;
  isPublic: boolean;
  capacity: number;
  revenue: number;
  views: number;
  hype: string;
  bannerUrl: string;
  attendees: AttendeeType[];
  tickets: TicketTierType[];
  sessions: SessionType[];
  speakers: string[];
  announcements: AnnouncementType[];
  feedback: FeedbackType[];
  media: string[];
  tags: string[];
}

interface LayoutContextType {
  openBooking: (title: string, price: string) => void;
  openCreateEvent: () => void;
  currentLocation: string;
  radius: number;
  bookedTickets: TicketType[];
  addTicket: (title: string, price: string) => void;
  createdEvents: CreatedEventType[];
  addCreatedEvent: (title: string, category: string, price: string) => void;
  updateCreatedEvent: (id: string, patch: Partial<CreatedEventType>) => void;
  duplicateCreatedEvent: (id: string) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}

// ─── Rich Mock Events ───────────────────────────────────────────────────────
const MOCK_EVENTS: CreatedEventType[] = [
  {
    id: "c1",
    title: "Jaipur Underground Techno Summit",
    category: "Clubbing",
    description: "An immersive underground techno experience featuring 6 international DJs across 2 stages. Featuring light installations, live VJ sets, and the city's best sound system setup.",
    price: "₹899",
    date: "Jun 28",
    time: "10:00 PM",
    endTime: "6:00 AM",
    venue: "Utopia Club, C-Scheme",
    address: "Plot 23, C-Scheme, Jaipur, Rajasthan 302001",
    status: "Upcoming",
    registrationOpen: true,
    isPublic: true,
    capacity: 500,
    revenue: 224750,
    views: 4200,
    hype: "1.4M Hype",
    bannerUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80",
    attendees: [
      { id: "a1", name: "Priya Sharma", email: "priya@email.com", phone: "+91 98765 43210", ticketType: "VIP Access Pass", status: "Approved", checkedIn: false, registeredAt: "Jun 10, 2:30 PM" },
      { id: "a2", name: "Arjun Mehta", email: "arjun@email.com", phone: "+91 87654 32109", ticketType: "General Admission", status: "Approved", checkedIn: false, registeredAt: "Jun 11, 11:15 AM" },
      { id: "a3", name: "Riya Patel", email: "riya@email.com", phone: "+91 76543 21098", ticketType: "General Admission", status: "Pending", checkedIn: false, registeredAt: "Jun 12, 9:00 AM" },
      { id: "a4", name: "Dev Kapoor", email: "dev@email.com", phone: "+91 65432 10987", ticketType: "Squad Package", status: "Approved", checkedIn: false, registeredAt: "Jun 12, 3:45 PM" },
      { id: "a5", name: "Neha Singh", email: "neha@email.com", phone: "+91 54321 09876", ticketType: "VIP Access Pass", status: "Rejected", checkedIn: false, registeredAt: "Jun 13, 7:20 AM" },
    ],
    tickets: [
      { id: "t1", name: "General Admission", price: 899, inventory: 350, sold: 218, paused: false },
      { id: "t2", name: "VIP Access Pass", price: 1399, inventory: 100, sold: 31, paused: false },
      { id: "t3", name: "Squad Package (4 entries)", price: 2879, inventory: 50, sold: 8, paused: false },
    ],
    sessions: [
      { id: "s1", title: "Opening Set — Dusk Ritual", time: "10:00 PM", speaker: "DJ Ayasha", duration: "90 min", active: false },
      { id: "s2", title: "Peak Hour — Frequency Drive", time: "12:00 AM", speaker: "LVRS", duration: "120 min", active: false },
      { id: "s3", title: "Closing Set — Dawn Prayer", time: "4:00 AM", speaker: "Aneesh Gera", duration: "120 min", active: false },
    ],
    speakers: ["DJ Ayasha", "LVRS", "Aneesh Gera", "Void System", "Kiri Moto"],
    announcements: [
      { id: "ann1", content: "Lineup confirmed! Check the full schedule on the event page.", timestamp: "Jun 8, 12:00 PM", channel: "both" },
    ],
    feedback: [],
    media: [],
    tags: ["techno", "underground", "club", "dj"],
  },
  {
    id: "c2",
    title: "Rooftop Unplugged Gig — Monsoon Edition",
    category: "Gig",
    description: "An intimate acoustic session with 4 local indie artists performing original compositions under the open sky. Featuring live looping, poetry, and ambient soundscapes.",
    price: "Free Entry",
    date: "Jun 15",
    time: "6:00 PM",
    endTime: "10:00 PM",
    venue: "Cafe Sky, Malviya Nagar",
    address: "D-72, Malviya Nagar, Jaipur, Rajasthan 302017",
    status: "Draft",
    registrationOpen: false,
    isPublic: false,
    capacity: 120,
    revenue: 0,
    views: 0,
    hype: "0 Hype",
    bannerUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80",
    attendees: [],
    tickets: [
      { id: "t1", name: "Free Entry", price: 0, inventory: 120, sold: 0, paused: false },
    ],
    sessions: [
      { id: "s1", title: "Opening Performance", time: "6:00 PM", speaker: "TBD", duration: "45 min", active: false },
    ],
    speakers: ["Riya Nair", "The Monsoon Collective"],
    announcements: [],
    feedback: [],
    media: [],
    tags: ["acoustic", "indie", "free", "rooftop"],
  },
  {
    id: "c3",
    title: "Neon Warehouse Rave — Phase IV",
    category: "Party",
    description: "The fourth edition of Jaipur's most iconic warehouse rave. 10,000 sq ft of industrial space, 3 zones, UV body painting, and a lineup that will shake the city.",
    price: "₹1,299",
    date: "Jun 22",
    time: "9:00 PM",
    endTime: "5:00 AM",
    venue: "Industrial Zone 7, Vishwakarma",
    address: "Shed 7B, Vishwakarma Industrial Area, Jaipur 302013",
    status: "Live",
    registrationOpen: false,
    isPublic: true,
    capacity: 800,
    revenue: 748350,
    views: 12800,
    hype: "3.2M Hype",
    bannerUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
    attendees: [
      { id: "a1", name: "Kabir Malhotra", email: "kabir@email.com", phone: "+91 98765 11111", ticketType: "VIP Access Pass", status: "Approved", checkedIn: true, registeredAt: "Jun 5, 10:00 AM" },
      { id: "a2", name: "Zara Khan", email: "zara@email.com", phone: "+91 87654 22222", ticketType: "General Admission", status: "Approved", checkedIn: true, registeredAt: "Jun 6, 2:00 PM" },
      { id: "a3", name: "Rohan Gupta", email: "rohan@email.com", phone: "+91 76543 33333", ticketType: "General Admission", status: "Approved", checkedIn: false, registeredAt: "Jun 7, 11:00 AM" },
      { id: "a4", name: "Mia D'Souza", email: "mia@email.com", phone: "+91 65432 44444", ticketType: "VIP Access Pass", status: "Approved", checkedIn: true, registeredAt: "Jun 7, 4:00 PM" },
      { id: "a5", name: "Aarav Joshi", email: "aarav@email.com", phone: "+91 54321 55555", ticketType: "Squad Package", status: "Approved", checkedIn: false, registeredAt: "Jun 8, 9:00 AM" },
      { id: "a6", name: "Tara Mehta", email: "tara@email.com", phone: "+91 43210 66666", ticketType: "General Admission", status: "Approved", checkedIn: true, registeredAt: "Jun 8, 12:00 PM" },
    ],
    tickets: [
      { id: "t1", name: "General Admission", price: 1299, inventory: 550, sold: 550, paused: true },
      { id: "t2", name: "VIP Access Pass", price: 1799, inventory: 150, sold: 148, paused: false },
      { id: "t3", name: "Squad Package (4 entries)", price: 4155, inventory: 100, sold: 26, paused: false },
    ],
    sessions: [
      { id: "s1", title: "Warm Up — Arrivals", time: "9:00 PM", speaker: "Yung Tempo", duration: "90 min", active: false },
      { id: "s2", title: "Zone A — Main Stage Peak", time: "11:30 PM", speaker: "Kade Flux", duration: "150 min", active: true },
      { id: "s3", title: "Zone B — Bass Garden", time: "11:00 PM", speaker: "SBK Collective", duration: "180 min", active: true },
      { id: "s4", title: "Zone C — Techno Basement", time: "10:00 PM", speaker: "Null Pointer", duration: "210 min", active: true },
      { id: "s5", title: "Closing — Sunrise Session", time: "3:30 AM", speaker: "DJ Ayasha", duration: "90 min", active: false },
    ],
    speakers: ["Kade Flux", "SBK Collective", "Null Pointer", "Yung Tempo", "DJ Ayasha"],
    announcements: [
      { id: "ann1", content: "🚨 Zone A is at 90% capacity. Guests please distribute across zones.", timestamp: "Tonight, 11:45 PM", channel: "push" },
      { id: "ann2", content: "Coat check & merchandise counter open near main entrance.", timestamp: "Tonight, 9:30 PM", channel: "push" },
    ],
    feedback: [],
    media: [],
    tags: ["rave", "warehouse", "neon", "party"],
  },
  {
    id: "c4",
    title: "Acoustic Sunset Jam — Vol. 3",
    category: "Gig",
    description: "A highly successful third edition of the Acoustic Sunset series. Featuring 5 artists and 450+ attendees, this event became one of the highest rated events on HappniX.",
    price: "₹299",
    date: "May 20",
    time: "5:00 PM",
    endTime: "9:00 PM",
    venue: "Amer Amphitheatre, Amer",
    address: "Near Amer Fort, Amer, Jaipur, Rajasthan 302028",
    status: "Completed",
    registrationOpen: false,
    isPublic: true,
    capacity: 450,
    revenue: 112050,
    views: 8900,
    hype: "2.1M Hype",
    bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    attendees: [
      { id: "a1", name: "Priya Sharma", email: "priya@email.com", phone: "+91 98765 43210", ticketType: "General", status: "Approved", checkedIn: true, registeredAt: "May 10, 9:00 AM" },
      { id: "a2", name: "Arjun Mehta", email: "arjun@email.com", phone: "+91 87654 32109", ticketType: "General", status: "Approved", checkedIn: true, registeredAt: "May 11, 2:00 PM" },
      { id: "a3", name: "Kabir Malhotra", email: "kabir@email.com", phone: "+91 98765 11111", ticketType: "General", status: "Approved", checkedIn: false, registeredAt: "May 12, 6:00 PM" },
    ],
    tickets: [
      { id: "t1", name: "General Entry", price: 299, inventory: 450, sold: 450, paused: true },
    ],
    sessions: [
      { id: "s1", title: "Opening Act", time: "5:00 PM", speaker: "Soulstice Duo", duration: "45 min", active: false },
      { id: "s2", title: "Headliner", time: "7:00 PM", speaker: "Riya Nair", duration: "90 min", active: false },
    ],
    speakers: ["Riya Nair", "Soulstice Duo", "Kiran Beats", "Noor Acoustic", "The Wanderers"],
    announcements: [
      { id: "ann1", content: "Thank you to all 450+ attendees who made this night magic. Vol. 4 announced soon!", timestamp: "May 21, 10:00 AM", channel: "both" },
    ],
    feedback: [
      { id: "f1", rating: 5, comment: "Absolutely magical! The sunset backdrop with live music was breathtaking.", author: "Priya S.", timestamp: "May 21" },
      { id: "f2", rating: 5, comment: "Best event I've been to this year. Riya Nair was incredible.", author: "Arjun M.", timestamp: "May 21" },
      { id: "f3", rating: 4, comment: "Great vibe, sound could've been better in the back rows.", author: "Neha K.", timestamp: "May 22" },
      { id: "f4", rating: 5, comment: "Seamless check-in process, everything was well organized.", author: "Rohan G.", timestamp: "May 22" },
    ],
    media: [
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80",
    ],
    tags: ["acoustic", "sunset", "gig", "folk"],
  },
  {
    id: "c5",
    title: "Pink Moon Pool Party 2024",
    category: "Party",
    description: "Jaipur's first luxury pool party of the season. Hosted at the rooftop infinity pool with a curated selection of house and tropical house DJs.",
    price: "₹1,499",
    date: "Apr 05",
    time: "2:00 PM",
    endTime: "10:00 PM",
    venue: "Hilton Jaipur, Tonk Road",
    address: "Tonk Road, Jaipur, Rajasthan 302018",
    status: "Archived",
    registrationOpen: false,
    isPublic: false,
    capacity: 200,
    revenue: 224850,
    views: 6500,
    hype: "900K Hype",
    bannerUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80",
    attendees: [],
    tickets: [
      { id: "t1", name: "Pool Access", price: 1499, inventory: 200, sold: 200, paused: true },
    ],
    sessions: [
      { id: "s1", title: "Afternoon Set", time: "2:00 PM", speaker: "Surf Mango", duration: "120 min", active: false },
      { id: "s2", title: "Sunset Set", time: "6:00 PM", speaker: "Coconut Jones", duration: "120 min", active: false },
    ],
    speakers: ["Surf Mango", "Coconut Jones"],
    announcements: [],
    feedback: [
      { id: "f1", rating: 5, comment: "Perfect summer vibes. Will come back every year!", author: "Zara K.", timestamp: "Apr 06" },
      { id: "f2", rating: 4, comment: "Amazing DJ, food could be better.", author: "Dev K.", timestamp: "Apr 06" },
    ],
    media: [
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=400&q=80",
    ],
    tags: ["pool", "summer", "luxury", "house"],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Location States
  const [currentLocation, setCurrentLocation] = useState("Jaipur");
  const [radius, setRadius] = useState(10);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Tickets State
  const [bookedTickets, setBookedTickets] = useState<TicketType[]>([]);

  // Created Events State
  const [createdEvents, setCreatedEvents] = useState<CreatedEventType[]>([]);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLoc = localStorage.getItem("happnix_location");
      if (savedLoc) setCurrentLocation(savedLoc);

      const savedRadius = localStorage.getItem("happnix_radius");
      if (savedRadius) setRadius(Number(savedRadius));

      const savedTickets = localStorage.getItem("happnix_booked_tickets");
      if (savedTickets) {
        const parsed = JSON.parse(savedTickets);
        if (parsed.length === 1 && parsed[0].id === "t1") {
          const defaultTickets = [
            { id: "t1", eventTitle: "Neon Nights Party", date: "May 28", time: "9:00 PM", seat: "VIP Entry" },
            { id: "t2", eventTitle: "Rooftop Unplugged Gig", date: "May 30", time: "7:00 PM", seat: "General Entry" },
            { id: "t3", eventTitle: "Forbidden Forest Warehouse Party", date: "Jun 06", time: "10:00 PM", seat: "VIP Access Pass" }
          ];
          setBookedTickets(defaultTickets);
          localStorage.setItem("happnix_booked_tickets", JSON.stringify(defaultTickets));
        } else {
          setBookedTickets(parsed);
        }
      } else {
        const defaultTickets = [
          { id: "t1", eventTitle: "Neon Nights Party", date: "May 28", time: "9:00 PM", seat: "VIP Entry" },
          { id: "t2", eventTitle: "Rooftop Unplugged Gig", date: "May 30", time: "7:00 PM", seat: "General Entry" },
          { id: "t3", eventTitle: "Forbidden Forest Warehouse Party", date: "Jun 06", time: "10:00 PM", seat: "VIP Access Pass" }
        ];
        setBookedTickets(defaultTickets);
        localStorage.setItem("happnix_booked_tickets", JSON.stringify(defaultTickets));
      }

      const savedCreated = localStorage.getItem("happnix_created_events_v2");
      if (savedCreated) {
        setCreatedEvents(JSON.parse(savedCreated));
      } else {
        setCreatedEvents(MOCK_EVENTS);
        localStorage.setItem("happnix_created_events_v2", JSON.stringify(MOCK_EVENTS));
      }
    }
  }, []);

  const handleLocationChange = (loc: string) => {
    setCurrentLocation(loc);
    localStorage.setItem("happnix_location", loc);
  };

  const handleRadiusChange = (rad: number) => {
    setRadius(rad);
    localStorage.setItem("happnix_radius", String(rad));
  };

  const addTicket = (title: string, price: string) => {
    const newTicket: TicketType = {
      id: `t_${Date.now()}`,
      eventTitle: title,
      date: "Jun 06",
      time: "9:00 PM",
      seat: "General Entry"
    };
    const updated = [newTicket, ...bookedTickets];
    setBookedTickets(updated);
    localStorage.setItem("happnix_booked_tickets", JSON.stringify(updated));
  };

  const addCreatedEvent = (title: string, category: string, price: string) => {
    const newEvent: CreatedEventType = {
      id: `c_${Date.now()}`,
      title,
      category,
      description: "",
      price: price ? `₹${price}` : "Free Entry",
      date: "TBD",
      time: "8:00 PM",
      endTime: "11:00 PM",
      venue: "Venue TBD",
      address: "",
      status: "Draft",
      registrationOpen: false,
      isPublic: false,
      capacity: 100,
      revenue: 0,
      views: 0,
      hype: "0 Hype",
      bannerUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
      attendees: [],
      tickets: [{ id: "t1", name: "General Entry", price: price ? parseInt(price) : 0, inventory: 100, sold: 0, paused: false }],
      sessions: [],
      speakers: [],
      announcements: [],
      feedback: [],
      media: [],
      tags: [],
    };
    const updated = [newEvent, ...createdEvents];
    setCreatedEvents(updated);
    localStorage.setItem("happnix_created_events_v2", JSON.stringify(updated));
  };

  const updateCreatedEvent = (id: string, patch: Partial<CreatedEventType>) => {
    const updated = createdEvents.map((ev) =>
      ev.id === id ? { ...ev, ...patch } : ev
    );
    setCreatedEvents(updated);
    localStorage.setItem("happnix_created_events_v2", JSON.stringify(updated));
  };

  const duplicateCreatedEvent = (id: string) => {
    const original = createdEvents.find((ev) => ev.id === id);
    if (!original) return;
    const clone: CreatedEventType = {
      ...original,
      id: `c_${Date.now()}`,
      title: `${original.title} (Copy)`,
      status: "Draft",
      revenue: 0,
      views: 0,
      attendees: [],
      feedback: [],
      announcements: [],
    };
    const updated = [clone, ...createdEvents];
    setCreatedEvents(updated);
    localStorage.setItem("happnix_created_events_v2", JSON.stringify(updated));
  };

  // Modal States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{ title: string; price: string } | null>(null);

  const isAppRoute = pathname !== "/" && pathname !== "/signin" && pathname !== "/signup";

  const openBooking = (title: string, price: string) => {
    setSelectedBooking({ title, price });
  };

  const openCreateEvent = () => {
    setIsCreateOpen(true);
  };

  if (!isAppRoute) {
    return <>{children}</>;
  }

  return (
    <LayoutContext.Provider value={{ openBooking, openCreateEvent, currentLocation, radius, bookedTickets, addTicket, createdEvents, addCreatedEvent, updateCreatedEvent, duplicateCreatedEvent }}>
      <div className="min-h-screen flex flex-col relative bg-background text-foreground home-feed">
        {/* Background gradients/glow effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--brand-1)]/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--brand-3)]/10 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        </div>

        {/* Top Header */}
        <Header
          currentLocation={currentLocation}
          onLocationClick={() => setIsLocationModalOpen(true)}
          onNotificationsClick={() => setIsNotificationsOpen(true)}
        />

        {/* Location Bar */}
        <LocationBar
          currentLocation={currentLocation}
          radius={radius}
          onLocationChange={handleLocationChange}
          onRadiusChange={handleRadiusChange}
          isModalOpen={isLocationModalOpen}
          setIsModalOpen={setIsLocationModalOpen}
        />

        {/* Layout Grid */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:pb-6 w-full flex gap-6 relative z-10">
          <LeftSidebar
            onCreateClick={openCreateEvent}
            onNotificationsClick={() => setIsNotificationsOpen(true)}
            onMessagesClick={() => router.push("/messages")}
          />
          <div className="flex-1 min-w-0 flex gap-6">
            {children}
          </div>
        </div>

        <BottomNav onCreateClick={openCreateEvent} />

        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />

        <CreateEventModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />

        {selectedBooking && (
          <BookingModal
            isOpen={!!selectedBooking}
            onClose={() => setSelectedBooking(null)}
            eventTitle={selectedBooking.title}
            price={selectedBooking.price}
          />
        )}
      </div>
    </LayoutContext.Provider>
  );
}
