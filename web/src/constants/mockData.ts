import { CreatedEventType, TicketTierType, EventDetail, DiscoverItem, EventMetaType, CountryInfo } from "@/types/event";
import { User } from "@/types/user";
import { EventLiveState, EventStats, TicketType } from "@/types/booking";
import { MediaItem } from "@/components/ui/media-grid-item";

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

export const MOCK_EVENTS_DETAILS: Record<string, EventDetail> = {
  e1: {
    id: "e1",
    organizer: "Utopia Entertainment",
    verifiedOrganizer: true,
    title: "Club Utopia DJ Set",
    category: "Clubbing",
    musicGenre: "Techno & House",
    ageRestricted: true,
    date: "Friday, May 29",
    time: "9:00 PM - 3:00 AM",
    venue: "Utopia Club, C-Scheme, Jaipur",
    distance: "2.4 km away",
    ticketsLeft: 14,
    trending: true,
    price: "₹999",
    about: "Jaipur's premier underground techno night is back. Join us at Utopia for an unparalleled sensory trip featuring state-of-the-art visual mapping, absolute acoustic bliss, and a headline set by national mixmasters.",
    lineup: [
      { name: "DJ Shadow", role: "Headliner (Tech-House)", avatarBg: "from-[#FF4FD8] to-[#C96CFF]" },
      { name: "Neon Ghost", role: "Supporting Act (Melodic)", avatarBg: "from-[#72B7FF] to-[#C96CFF]" },
      { name: "Aarav Mehta", role: "Local Opener (Minimal)", avatarBg: "from-[#FFB347] to-[#FF4FD8]" }
    ],
    friendsAttending: [
      { name: "Aria", avatarLetter: "A", color: "bg-pink-500" },
      { name: "Rohan", avatarLetter: "R", color: "bg-blue-500" },
      { name: "Sneha", avatarLetter: "S", color: "bg-purple-500" },
      { name: "Kabir", avatarLetter: "K", color: "bg-amber-500" }
    ],
    banner: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
    lat: 26.9124,
    lng: 75.8087,
    gallery: [
      "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1486591978090-58e619d37fe7?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&w=600&q=80"
    ],
    tiers: [
      { tierID: "e1_t1", name: "Early Bird Admission", price: 799, description: "Limited early access pass before midnight." },
      { tierID: "e1_t2", name: "General Entry", price: 999, description: "Standard entry to all dance floors and bars." },
      { tierID: "e1_t3", name: "VIP Balcony Pass", price: 1499, description: "Exclusive balcony access & dedicated VIP lounge service." }
    ]
  },
  e2: {
    id: "e2",
    organizer: "Unplugged Nights",
    verifiedOrganizer: false,
    title: "Rooftop Unplugged Gig",
    category: "Acoustic Gig",
    musicGenre: "Indie / Folk",
    ageRestricted: false,
    date: "Saturday, May 30",
    time: "7:00 PM - 10:00 PM",
    venue: "Cafe Sky, Malviya Nagar, Jaipur",
    distance: "5.1 km away",
    ticketsLeft: 35,
    trending: false,
    price: "₹499",
    about: "An intimate evening under the stars featuring acoustic covers, soulful original sets, and cozy ambient dining. Unplug from the rush of the city and immerse in cozy vibes.",
    lineup: [
      { name: "Sneha Sen", role: "Acoustic Soloist", avatarBg: "from-[#72B7FF] to-[#C96CFF]" },
      { name: "Kabir & The Strings", role: "Indie Duo Band", avatarBg: "from-[#FFB347] to-[#FF4FD8]" }
    ],
    friendsAttending: [
      { name: "Sarah", avatarLetter: "S", color: "bg-emerald-500" },
      { name: "Vikram", avatarLetter: "V", color: "bg-sky-500" }
    ],
    banner: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
    lat: 26.8529,
    lng: 75.8052,
    gallery: [
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1493676304818-94cf0cb5ef1e?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1485872299829-967f05efe90a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80"
    ],
    tiers: [
      { tierID: "e2_t1", name: "Standard Acoustic Entry", price: 499, description: "Includes open lawn seating & welcome drink." },
      { tierID: "e2_t2", name: "Front Row Lounge", price: 899, description: "Reserved premium sofa seating closest to the stage." }
    ]
  },
  sp1: {
    id: "sp1",
    organizer: "Happnix VIP Labs",
    verifiedOrganizer: true,
    title: "Forbidden Forest Warehouse Party",
    category: "Private Party",
    musicGenre: "Industrial Techno",
    ageRestricted: true,
    date: "Saturday, June 6",
    time: "10:00 PM onwards",
    venue: "Warehouse 12, Industrial Area, Jaipur",
    distance: "9.2 km away",
    ticketsLeft: 5,
    trending: true,
    price: "₹1,999",
    about: "A warehouse rave in the outskirts of the pink city. Industrial vibes, heavy bass lines, and laser sweeps that go on until sunrise. Access code required for gate entry.",
    lineup: [
      { name: "DJ Phantom", role: "Special Guest (Berlin)", avatarBg: "from-[#FF4FD8] to-[#C96CFF]" },
      { name: "Acid Eclipse", role: "Hardware Live Set", avatarBg: "from-[#72B7FF] to-[#C96CFF]" },
      { name: "Circuit Breaker", role: "Dark Techno Opener", avatarBg: "from-[#FFB347] to-[#FF4FD8]" }
    ],
    friendsAttending: [
      { name: "DJ Shadow", avatarLetter: "D", color: "bg-red-500" },
      { name: "Aria", avatarLetter: "A", color: "bg-pink-500" },
      { name: "Sarah", avatarLetter: "S", color: "bg-emerald-500" }
    ],
    banner: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80",
    lat: 26.8289,
    lng: 75.8021,
    gallery: [
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1578946956088-940c3b502864?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80"
    ],
    tiers: [
      { tierID: "sp1_t1", name: "Warehouse Gate Access", price: 1999, description: "All-night rave access code & security clearance." },
      { tierID: "sp1_t2", name: "VIP Artist Stage Pass", price: 3499, description: "Backstage artist pit access & open premium bar." }
    ]
  }
};

export const DISCOVER_ITEMS: DiscoverItem[] = [
  {
    id: "e1",
    type: "event",
    title: "Club Utopia DJ Set",
    category: "Clubbing",
    genre: "Techno & House",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80",
    hype: "2.8M Hype",
    attending: "6 friends",
    host: "Utopia Entertainment",
    verified: true,
    price: "₹999",
    venue: "C-Scheme, Jaipur"
  },
  {
    id: "e2",
    type: "event",
    title: "Rooftop Unplugged Gig",
    category: "Acoustic Gig",
    genre: "Indie / Folk",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80",
    hype: "4.2M Hype",
    attending: "2 friends",
    host: "Unplugged Nights",
    verified: false,
    price: "₹499",
    venue: "Malviya Nagar, Jaipur"
  },
  {
    id: "sp1",
    type: "event",
    title: "Forbidden Forest Warehouse Rave",
    category: "Private Party",
    genre: "Industrial Techno",
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=400&q=80",
    hype: "5.1M Hype",
    attending: "3 friends",
    host: "Happnix VIP Labs",
    verified: true,
    price: "₹1,999",
    venue: "Industrial Area, Jaipur"
  },
  {
    id: "m4",
    type: "social",
    title: "Late Night Boiler Room Session Jaipur edit",
    category: "Rave",
    genre: "Acid Techno",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
    hype: "2.5M Hype",
    attending: "18 attending",
    host: "Circuit Breaker",
    verified: false,
    price: "Free Entry",
    venue: "Sector 5, Jaipur"
  },
  {
    id: "m5",
    type: "social",
    title: "Soundcheck with Sneha unplugged folk cover",
    category: "Acoustic",
    genre: "Folk / Indie",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80",
    hype: "16M Views",
    attending: "Local Session",
    host: "Sneha Sen",
    verified: true,
    price: "Invite Only",
    venue: "C-Scheme, Jaipur"
  },
  {
    id: "m6",
    type: "event",
    title: "Eclipse Deep House pool gig",
    category: "Pool Party",
    genre: "Deep House",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=400&q=80",
    hype: "2.8M Hype",
    attending: "5 friends",
    host: "Shadowmix Lab",
    verified: true,
    price: "₹799",
    venue: "Amer Road, Jaipur"
  }
];

export const CATEGORY_PILLS = [
  "All", 
  "Techno & House", 
  "Acoustic Gigs", 
  "Warehouse Raves", 
  "Pool Parties", 
  "Deep House", 
  "Indie / Folk"
];

export const TRENDING_SEARCHES = [
  "Forbidden Forest Warehouse Party",
  "Utopia Techno DJ set",
  "Rooftop Acoustic Sneha Sen",
  "Pool gig Amer Road",
  "Industrial Beats Jaipur",
  "Squad chat invites"
];

export const INDIA_DEFAULT: CountryInfo = {
  name: "India",
  region_code: "IN",
  dial_code: "+91",
  mobile_number_pattern: "^[6-9]\\d{9}$",
  region_flag: "🇮🇳",
};

export const EVENT_META: Record<string, EventMetaType> = {
  "club utopia dj set": {
    banner: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80",
    venue: "Utopia Club, C-Scheme, Jaipur",
    locationLink: "https://maps.google.com/?q=Utopia+Club+C-Scheme+Jaipur",
    instructions: ["Age limit: 18+ only. Valid ID required at entrance.", "Smart Casual attire. Club rules apply.", "Pass code is unique and active for 1 scan."]
  },
  "neon nights party": {
    banner: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80",
    venue: "Utopia Club, C-Scheme, Jaipur",
    locationLink: "https://maps.google.com/?q=Utopia+Club+C-Scheme+Jaipur",
    instructions: ["Age limit: 18+ only. Valid ID required at entrance.", "Smart Casual attire. Club rules apply.", "Pass code is unique and active for 1 scan."]
  },
  "rooftop unplugged gig": {
    banner: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80",
    venue: "Cafe Sky, Malviya Nagar, Jaipur",
    locationLink: "https://maps.google.com/?q=Cafe+Sky+Malviya+Nagar+Jaipur",
    instructions: ["All ages welcome. Under 16 must be accompanied.", "Gate opens at 6:45 PM.", "Food and drinks menu available at venue."]
  },
  "forbidden forest warehouse party": {
    banner: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80",
    venue: "Warehouse 12, Industrial Area, Jaipur",
    locationLink: "https://maps.google.com/?q=Warehouse+12+Industrial+Area+Jaipur",
    instructions: ["Strictly 21+ event. Zero tolerance policy.", "Warehouses can get chilly - dress accordingly.", "Access code active until 1:00 AM."]
  }
};

export const MOCK_FOLLOWERS = [
  { id: "f1", name: "Sarah Connor", username: "sarahc", avatar: null, mutuals: 4 },
  { id: "f2", name: "Aria Roy", username: "ariar", avatar: null, mutuals: 7 },
  { id: "f3", name: "DJ Shadow", username: "shadowmix", avatar: null, mutuals: 12 },
  { id: "f4", name: "Neha Kapoor", username: "nehak", avatar: null, mutuals: 2 },
  { id: "f5", name: "Vikram Singh", username: "vikrams", avatar: null, mutuals: 9 },
];

export const MOCK_FOLLOWING = [
  { id: "g1", name: "Utopia Entertainment", username: "utopiaent", avatar: null, mutuals: 0 },
  { id: "g2", name: "Rohan Gupta", username: "rohang", avatar: null, mutuals: 12 },
  { id: "g3", name: "Ananya Sharma", username: "ananyas", avatar: null, mutuals: 5 },
];

export const MOCK_MEDIA: MediaItem[] = [
  { id: "m1", type: "photo" as const, gradient: "from-[var(--brand-1)]/40 to-[var(--brand-2)]/30", caption: "Chasing sunsets 🌅", likes: 42, comments: 8 },
  { id: "m2", type: "video" as const, gradient: "from-[var(--brand-3)]/40 to-[var(--brand-2)]/30", caption: "Club Utopia was 🔥", likes: 87, comments: 23 },
  { id: "m3", type: "event" as const, gradient: "from-[var(--brand-4)]/40 to-[var(--brand-1)]/20", caption: "VIP Pass — Neon Nights", likes: 31, comments: 5 },
  { id: "m4", type: "photo" as const, gradient: "from-[var(--brand-2)]/40 to-[var(--brand-3)]/20", caption: "Rooftop vibes ✨", likes: 56, comments: 14 },
  { id: "m5", type: "photo" as const, gradient: "from-[var(--brand-3)]/30 to-[var(--brand-4)]/30", caption: "Night out 🎵", likes: 29, comments: 6 },
  { id: "m6", type: "video" as const, gradient: "from-[var(--brand-4)]/30 to-[var(--brand-1)]/30", caption: "Acoustic session", likes: 74, comments: 18 },
  { id: "m7", type: "photo" as const, gradient: "from-[var(--brand-1)]/30 to-[var(--brand-4)]/20", caption: "Festival mode 🎪", likes: 61, comments: 11 },
  { id: "m8", type: "event" as const, gradient: "from-[var(--brand-2)]/30 to-[var(--brand-3)]/30", caption: "Techno set ticket", likes: 19, comments: 3 },
  { id: "m9", type: "photo" as const, gradient: "from-[var(--brand-3)]/40 to-[var(--brand-1)]/20", caption: "Sound & light 💫", likes: 94, comments: 31 },
];

export const MOCK_POSTS = [
  {
    id: "p1",
    user: { name: "Aarav Mehta", username: "aaravm", avatar: "", verified: true },
    timestamp: "2 hours ago",
    privacy: "public" as const,
    content: "Just booked tickets for the Utopia DJ Set! Who else is going this Friday? The line-up looks insane! 🔥🎧",
    hashtags: ["UtopiaMusic", "JaipurGigs", "WeekendVibes"],
    mentions: ["sarahc", "shadowmix"],
    musicTag: "Utopia Underground - Techno Mix",
    moodTag: "Hyped Up",
    likes: 42,
    comments: 18,
    location: "Utopia Club, Jaipur",
    liked: true,
    saved: false
  },
  {
    id: "p2",
    user: { name: "Sneha Sen", username: "snehasen", avatar: "", verified: false },
    timestamp: "5 hours ago",
    privacy: "public" as const,
    content: "Chasing sunsets and acoustic vibes in Jaipur. If you love unplugged music, there's a cozy gathering happening tomorrow at C-Scheme.",
    hashtags: ["AcousticSession", "Unplugged", "JaipurDiaries"],
    mentions: [],
    musicTag: "Cozy Acoustic - Indie Cover",
    moodTag: "Chill & Relaxed",
    likes: 29,
    comments: 7,
    location: "Cafe Noir, C-Scheme",
    liked: false,
    saved: true
  }
];

export const MOCK_FEED_EVENTS = [
  {
    id: "e1",
    organizer: "Utopia Entertainment",
    verifiedOrganizer: true,
    banner: "",
    title: "Club Utopia DJ Set",
    category: "Clubbing",
    musicGenre: "Techno / House",
    ageRestricted: true,
    date: "Friday, May 29",
    time: "9:00 PM - 3:00 AM",
    venue: "Utopia Club, C-Scheme, Jaipur",
    distance: "2.4 km away",
    ticketsLeft: 14,
    trending: true,
    friendsAttending: 6,
    price: "₹999"
  },
  {
    id: "e2",
    organizer: "Unplugged Nights",
    verifiedOrganizer: false,
    banner: "",
    title: "Rooftop Unplugged Gig",
    category: "Gig",
    musicGenre: "Acoustic / Indie",
    ageRestricted: false,
    date: "Saturday, May 30",
    time: "7:00 PM - 10:00 PM",
    venue: "Cafe Sky, Malviya Nagar, Jaipur",
    distance: "5.1 km away",
    ticketsLeft: 35,
    trending: false,
    friendsAttending: 2,
    price: "₹499"
  }
];

export const MOCK_SPONSORED_EVENT = {
  id: "sp1",
  organizer: "Happnix VIP Labs",
  verifiedOrganizer: true,
  banner: "",
  title: "Forbidden Forest Warehouse Party",
  category: "Party",
  musicGenre: "Industrial Techno",
  ageRestricted: true,
  date: "Saturday, June 6",
  time: "10:00 PM onwards",
  venue: "Warehouse 12, Industrial Area, Jaipur",
  distance: "9.2 km away",
  ticketsLeft: 5,
  trending: true,
  price: "₹1,999"
};

export const MOCK_USERS: User[] = [
  {
    id: "u1",
    name: "Aria Roy",
    username: "ariaroy",
    avatar: null,
    bio: "DJ & music producer based in Jaipur. Techno purist. 🎧",
    verified: true,
    followers: 12400,
    mutuals: 7,
    isFollowing: false,
    tags: ["techno", "dj", "music"],
  },
  {
    id: "u2",
    name: "Sneha Sen",
    username: "snehasen",
    avatar: null,
    bio: "Acoustic singer-songwriter. Coffee & chords. ☕🎸",
    verified: false,
    followers: 3200,
    mutuals: 2,
    isFollowing: true,
    tags: ["acoustic", "folk", "indie"],
  },
  {
    id: "u3",
    name: "Kabir Malhotra",
    username: "kabirm",
    avatar: null,
    bio: "Event promoter · Warehouse raves · Collective curator",
    verified: true,
    followers: 8900,
    mutuals: 12,
    isFollowing: false,
    tags: ["events", "rave", "promoter"],
  },
  {
    id: "u4",
    name: "Zara Khan",
    username: "zarakhan",
    avatar: null,
    bio: "House music lover & night owl 🌙 Jaipur → Mumbai",
    verified: false,
    followers: 1540,
    mutuals: 4,
    isFollowing: false,
    tags: ["house", "party", "music"],
  },
  {
    id: "u5",
    name: "Rohan Gupta",
    username: "rohang",
    avatar: null,
    bio: "Festival head. Photographer. Always on the guest list. 📸",
    verified: false,
    followers: 5600,
    mutuals: 12,
    isFollowing: true,
    tags: ["festival", "photography"],
  },
  {
    id: "u6",
    name: "DJ Shadow",
    username: "shadowmix",
    avatar: null,
    bio: "Tech-House. Melodic. Minimal. Headliner — Utopia Club.",
    verified: true,
    followers: 48000,
    mutuals: 3,
    isFollowing: false,
    tags: ["dj", "techno", "house"],
  },
  {
    id: "u7",
    name: "Neha Kapoor",
    username: "nehak",
    avatar: null,
    bio: "Vibes only ✨ | Music therapy student | Indie soul",
    verified: false,
    followers: 890,
    mutuals: 2,
    isFollowing: false,
    tags: ["indie", "music", "therapy"],
  },
  {
    id: "u8",
    name: "Aarav Mehta",
    username: "aaravm",
    avatar: null,
    bio: "Local DJ · Minimal · Jaipur underground scene founder",
    verified: true,
    followers: 9200,
    mutuals: 9,
    isFollowing: false,
    tags: ["dj", "minimal", "underground"],
  },
  {
    id: "u9",
    name: "Priya Sharma",
    username: "priyasharma",
    avatar: null,
    bio: "Party planner & social butterfly 🦋 Jaipur events insider",
    verified: false,
    followers: 2100,
    mutuals: 5,
    isFollowing: true,
    tags: ["events", "party"],
  },
  {
    id: "u10",
    name: "Vikram Singh",
    username: "vikrams",
    avatar: null,
    bio: "Bass head. Industrial techno enthusiast. Late night only.",
    verified: false,
    followers: 660,
    mutuals: 9,
    isFollowing: false,
    tags: ["bass", "techno", "industrial"],
  },
  {
    id: "u11",
    name: "Ananya Sharma",
    username: "ananyas",
    avatar: null,
    bio: "Singer | Songwriter | BTS of the Jaipur acoustic scene 🎼",
    verified: false,
    followers: 4300,
    mutuals: 5,
    isFollowing: true,
    tags: ["singer", "acoustic", "songwriter"],
  },
  {
    id: "u12",
    name: "Utopia Entertainment",
    username: "utopiaent",
    avatar: null,
    bio: "Jaipur's premier event collective. Club. Warehouse. Pool.",
    verified: true,
    followers: 91000,
    mutuals: 0,
    isFollowing: false,
    tags: ["events", "club", "collective"],
  },
];
