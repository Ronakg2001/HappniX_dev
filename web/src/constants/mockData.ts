import { CreatedEventType, TicketTierType } from "@/types/event";
import { EventLiveState, EventStats, TicketType } from "@/types/booking";

function withTierDefaults(t: Omit<TicketTierType, "entryType"|"flexibleSeats"|"promoText"> & Partial<Pick<TicketTierType,"entryType"|"flexibleSeats"|"promoText">>): TicketTierType {
  return { entryType: "Regular", flexibleSeats: false, promoText: "", ...t };
}

export const MOCK_EVENTS: CreatedEventType[] = [
  {
    id: "c1",
    status: "Upcoming",
    title: "Jaipur Underground Techno Summit",
    category: "Clubbing",
    description: "An immersive underground techno experience featuring 6 international DJs across 2 stages. Featuring light installations, live VJ sets, and the city's best sound system setup.",
    bannerUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80",
    ageGroup: "21+",
    tags: ["techno", "underground", "club", "dj"],
    highlights: [
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80",
    ],
    highlightText: "6 international DJs, 2 stages, UV installations",
    services: ["Alcohol", "Security", "Valet Parking"],
    dresscode: {
      enabled: true,
      style: "All Black",
    },
    artists: ["DJ Ayasha", "LVRS", "Aneesh Gera", "Void System", "Kiri Moto"],
    schedule: {
      startDate: "2026-06-28",
      endDate: "2026-06-29",
      startTime: "22:00",
      endTime: "06:00",
    },
    location: {
      venue: "Utopia Club, C-Scheme",
      address: "Plot 23, C-Scheme, Jaipur, Rajasthan 302001",
      lat: 26.9124,
      lng: 75.7873,
    },
    ticketing: {
      mode: "paid",
      capacity: 500,
      capacityFlex: false,
      tiers: [
        withTierDefaults({ id: "t1", name: "General Admission", price: 899, inventory: 350, sold: 218, paused: false }),
        withTierDefaults({ id: "t2", name: "VIP Access Pass", price: 1399, inventory: 100, sold: 31, paused: false }),
        withTierDefaults({ id: "t3", name: "Squad Package (4 entries)", price: 2879, inventory: 50, sold: 8, paused: false }),
      ],
      promoCodes: [],
      price: "₹899",
    },
    policies: {
      termsAndConditions: "",
      privacyPolicy: "",
      faqs: [
        { id: "faq1", question: "Is this 21+ only?", answer: "Yes, valid ID required at entry." },
        { id: "faq2", question: "Are re-entries allowed?", answer: "No re-entries after 2 AM." },
      ],
    },
  },
  {
    id: "c2",
    status: "Draft",
    title: "Rooftop Unplugged Gig — Monsoon Edition",
    category: "Gig",
    description: "An intimate acoustic session with 4 local indie artists performing original compositions under the open sky. Featuring live looping, poetry, and ambient soundscapes.",
    bannerUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80",
    ageGroup: "All Ages",
    tags: ["acoustic", "indie", "free", "rooftop"],
    highlights: [
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80",
    ],
    highlightText: "",
    services: [],
    dresscode: {
      enabled: false,
      style: "",
    },
    artists: ["Riya Nair", "The Monsoon Collective"],
    schedule: {
      startDate: "2026-06-15",
      endDate: "2026-06-15",
      startTime: "18:00",
      endTime: "22:00",
    },
    location: {
      venue: "Cafe Sky, Malviya Nagar",
      address: "D-72, Malviya Nagar, Jaipur, Rajasthan 302017",
      lat: null,
      lng: null,
    },
    ticketing: {
      mode: "free",
      capacity: 120,
      capacityFlex: false,
      tiers: [
        withTierDefaults({ id: "t1", name: "Free Entry", price: 0, inventory: 120, sold: 0, paused: false }),
      ],
      promoCodes: [],
      price: "Free Entry",
    },
    policies: {
      termsAndConditions: "",
      privacyPolicy: "",
      faqs: [],
    },
  },
  {
    id: "c3",
    status: "Live",
    title: "Neon Warehouse Rave — Phase IV",
    category: "Party",
    description: "The fourth edition of Jaipur's most iconic warehouse rave. 10,000 sq ft of industrial space, 3 zones, UV body painting, and a lineup that will shake the city.",
    bannerUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
    ageGroup: "18+",
    tags: ["rave", "warehouse", "neon", "party"],
    highlights: [
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=400&q=80",
    ],
    highlightText: "",
    services: ["Food", "Alcohol", "Security"],
    dresscode: {
      enabled: true,
      style: "Neon / UV Reactive",
    },
    artists: ["Kade Flux", "SBK Collective", "Null Pointer", "Yung Tempo", "DJ Ayasha"],
    schedule: {
      startDate: "2026-06-22",
      endDate: "2026-06-23",
      startTime: "21:00",
      endTime: "05:00",
    },
    location: {
      venue: "Industrial Zone 7, Vishwakarma",
      address: "Shed 7B, Vishwakarma Industrial Area, Jaipur 302013",
      lat: 26.8978,
      lng: 75.7632,
    },
    ticketing: {
      mode: "paid",
      capacity: 800,
      capacityFlex: false,
      tiers: [
        withTierDefaults({ id: "t1", name: "General Admission", price: 1299, inventory: 550, sold: 550, paused: true }),
        withTierDefaults({ id: "t2", name: "VIP Access Pass", price: 1799, inventory: 150, sold: 148, paused: false }),
        withTierDefaults({ id: "t3", name: "Squad Package (4 entries)", price: 4155, inventory: 100, sold: 26, paused: false }),
      ],
      promoCodes: [],
      price: "₹1,299",
    },
    policies: {
      termsAndConditions: "",
      privacyPolicy: "",
      faqs: [],
    },
  },
  {
    id: "c4",
    status: "Completed",
    title: "Acoustic Sunset Jam — Vol. 3",
    category: "Gig",
    description: "A highly successful third edition of the Acoustic Sunset series. Featuring 5 artists and 450+ attendees, this event became one of the highest rated events on HappniX.",
    bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    ageGroup: "All Ages",
    tags: ["acoustic", "sunset", "gig", "folk"],
    highlights: [
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80",
    ],
    highlightText: "",
    services: [],
    dresscode: {
      enabled: false,
      style: "",
    },
    artists: ["Riya Nair", "Soulstice Duo", "Kiran Beats", "Noor Acoustic", "The Wanderers"],
    schedule: {
      startDate: "2026-05-20",
      endDate: "2026-05-20",
      startTime: "17:00",
      endTime: "21:00",
    },
    location: {
      venue: "Amer Amphitheatre, Amer",
      address: "Near Amer Fort, Amer, Jaipur, Rajasthan 302028",
      lat: null,
      lng: null,
    },
    ticketing: {
      mode: "paid",
      capacity: 450,
      capacityFlex: false,
      tiers: [
        withTierDefaults({ id: "t1", name: "General Entry", price: 299, inventory: 450, sold: 450, paused: true }),
      ],
      promoCodes: [],
      price: "₹299",
    },
    policies: {
      termsAndConditions: "",
      privacyPolicy: "",
      faqs: [],
    },
  },
  {
    id: "c5",
    status: "Archived",
    title: "Pink Moon Pool Party 2024",
    category: "Party",
    description: "Jaipur's first luxury pool party of the season. Hosted at the rooftop infinity pool with a curated selection of house and tropical house DJs.",
    bannerUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80",
    ageGroup: "21+",
    tags: ["pool", "summer", "luxury", "house"],
    highlights: [
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=400&q=80",
    ],
    highlightText: "",
    services: ["Food", "Alcohol", "Valet Parking"],
    dresscode: {
      enabled: false,
      style: "",
    },
    artists: ["Surf Mango", "Coconut Jones"],
    schedule: {
      startDate: "2026-04-05",
      endDate: "2026-04-05",
      startTime: "14:00",
      endTime: "22:00",
    },
    location: {
      venue: "Hilton Jaipur, Tonk Road",
      address: "Tonk Road, Jaipur, Rajasthan 302018",
      lat: null,
      lng: null,
    },
    ticketing: {
      mode: "paid",
      capacity: 200,
      capacityFlex: false,
      tiers: [
        withTierDefaults({ id: "t1", name: "Pool Access", price: 1499, inventory: 200, sold: 200, paused: true }),
      ],
      promoCodes: [],
      price: "₹1,499",
    },
    policies: {
      termsAndConditions: "",
      privacyPolicy: "",
      faqs: [],
    },
  },
];

export const MOCK_LIVE_STATES: Record<string, EventLiveState> = {
  c1: {
    eventId: "c1",
    registrationOpen: true,
    isPublic: true,
    attendees: [
      { id: "a1", name: "Priya Sharma", email: "priya@email.com", phone: "+91 98765 43210", ticketType: "VIP Access Pass", status: "Approved", checkedIn: false, registeredAt: "Jun 10, 2:30 PM" },
      { id: "a2", name: "Arjun Mehta", email: "arjun@email.com", phone: "+91 87654 32109", ticketType: "General Admission", status: "Approved", checkedIn: false, registeredAt: "Jun 11, 11:15 AM" },
      { id: "a3", name: "Riya Patel", email: "riya@email.com", phone: "+91 76543 21098", ticketType: "General Admission", status: "Pending", checkedIn: false, registeredAt: "Jun 12, 9:00 AM" },
      { id: "a4", name: "Dev Kapoor", email: "dev@email.com", phone: "+91 65432 10987", ticketType: "Squad Package", status: "Approved", checkedIn: false, registeredAt: "Jun 12, 3:45 PM" },
      { id: "a5", name: "Neha Singh", email: "neha@email.com", phone: "+91 54321 09876", ticketType: "VIP Access Pass", status: "Rejected", checkedIn: false, registeredAt: "Jun 13, 7:20 AM" },
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
    media: [],
  },
  c2: {
    eventId: "c2",
    registrationOpen: false,
    isPublic: false,
    attendees: [],
    sessions: [
      { id: "s1", title: "Opening Performance", time: "6:00 PM", speaker: "TBD", duration: "45 min", active: false },
    ],
    speakers: ["Riya Nair", "The Monsoon Collective"],
    announcements: [],
    media: [],
  },
  c3: {
    eventId: "c3",
    registrationOpen: false,
    isPublic: true,
    attendees: [
      { id: "a1", name: "Kabir Malhotra", email: "kabir@email.com", phone: "+91 98765 11111", ticketType: "VIP Access Pass", status: "Approved", checkedIn: true, registeredAt: "Jun 5, 10:00 AM" },
      { id: "a2", name: "Zara Khan", email: "zara@email.com", phone: "+91 87654 22222", ticketType: "General Admission", status: "Approved", checkedIn: true, registeredAt: "Jun 6, 2:00 PM" },
      { id: "a3", name: "Rohan Gupta", email: "rohan@email.com", phone: "+91 76543 33333", ticketType: "General Admission", status: "Approved", checkedIn: false, registeredAt: "Jun 7, 11:00 AM" },
      { id: "a4", name: "Mia D'Souza", email: "mia@email.com", phone: "+91 65432 44444", ticketType: "VIP Access Pass", status: "Approved", checkedIn: true, registeredAt: "Jun 7, 4:00 PM" },
      { id: "a5", name: "Aarav Joshi", email: "aarav@email.com", phone: "+91 54321 55555", ticketType: "Squad Package", status: "Approved", checkedIn: false, registeredAt: "Jun 8, 9:00 AM" },
      { id: "a6", name: "Tara Mehta", email: "tara@email.com", phone: "+91 43210 66666", ticketType: "General Admission", status: "Approved", checkedIn: true, registeredAt: "Jun 8, 12:00 PM" },
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
    media: [],
  },
  c4: {
    eventId: "c4",
    registrationOpen: false,
    isPublic: true,
    attendees: [
      { id: "a1", name: "Priya Sharma", email: "priya@email.com", phone: "+91 98765 43210", ticketType: "General", status: "Approved", checkedIn: true, registeredAt: "May 10, 9:00 AM" },
      { id: "a2", name: "Arjun Mehta", email: "arjun@email.com", phone: "+91 87654 32109", ticketType: "General", status: "Approved", checkedIn: true, registeredAt: "May 11, 2:00 PM" },
      { id: "a3", name: "Kabir Malhotra", email: "kabir@email.com", phone: "+91 98765 11111", ticketType: "General", status: "Approved", checkedIn: false, registeredAt: "May 12, 6:00 PM" },
    ],
    sessions: [
      { id: "s1", title: "Opening Act", time: "5:00 PM", speaker: "Soulstice Duo", duration: "45 min", active: false },
      { id: "s2", title: "Headliner", time: "7:00 PM", speaker: "Riya Nair", duration: "90 min", active: false },
    ],
    speakers: ["Riya Nair", "Soulstice Duo", "Kiran Beats", "Noor Acoustic", "The Wanderers"],
    announcements: [
      { id: "ann1", content: "Thank you to all 450+ attendees who made this night magic. Vol. 4 announced soon!", timestamp: "May 21, 10:00 AM", channel: "both" },
    ],
    media: [
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80",
    ],
  },
  c5: {
    eventId: "c5",
    registrationOpen: false,
    isPublic: false,
    attendees: [],
    sessions: [
      { id: "s1", title: "Afternoon Set", time: "2:00 PM", speaker: "Surf Mango", duration: "120 min", active: false },
      { id: "s2", title: "Sunset Set", time: "6:00 PM", speaker: "Coconut Jones", duration: "120 min", active: false },
    ],
    speakers: ["Surf Mango", "Coconut Jones"],
    announcements: [],
    media: [
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=400&q=80",
    ],
  },
};

export const MOCK_STATS: Record<string, EventStats> = {
  c1: {
    eventId: "c1",
    revenue: 224750,
    views: 4200,
    hype: "1.4M Hype",
    feedback: [],
  },
  c2: {
    eventId: "c2",
    revenue: 0,
    views: 0,
    hype: "0 Hype",
    feedback: [],
  },
  c3: {
    eventId: "c3",
    revenue: 748350,
    views: 12800,
    hype: "3.2M Hype",
    feedback: [],
  },
  c4: {
    eventId: "c4",
    revenue: 112050,
    views: 8900,
    hype: "2.1M Hype",
    feedback: [
      { id: "f1", rating: 5, comment: "Absolutely magical! The sunset backdrop with live music was breathtaking.", author: "Priya S.", timestamp: "May 21" },
      { id: "f2", rating: 5, comment: "Best event I've been to this year. Riya Nair was incredible.", author: "Arjun M.", timestamp: "May 21" },
      { id: "f3", rating: 4, comment: "Great vibe, sound could've been better in the back rows.", author: "Neha K.", timestamp: "May 22" },
      { id: "f4", rating: 5, comment: "Seamless check-in process, everything was well organized.", author: "Rohan G.", timestamp: "May 22" },
    ],
  },
  c5: {
    eventId: "c5",
    revenue: 224850,
    views: 6500,
    hype: "900K Hype",
    feedback: [
      { id: "f1", rating: 5, comment: "Perfect summer vibes. Will come back every year!", author: "Zara K.", timestamp: "Apr 06" },
      { id: "f2", rating: 4, comment: "Amazing DJ, food could be better.", author: "Dev K.", timestamp: "Apr 06" },
    ],
  },
};

export const MOCK_BOOKED_TICKETS: TicketType[] = [
  { id: "t1", eventTitle: "Neon Nights Party", date: "May 28", time: "9:00 PM", seat: "VIP Entry" },
  { id: "t2", eventTitle: "Rooftop Unplugged Gig", date: "May 30", time: "7:00 PM", seat: "General Entry" },
  { id: "t3", eventTitle: "Forbidden Forest Warehouse Party", date: "Jun 06", time: "10:00 PM", seat: "VIP Access Pass" }
];
