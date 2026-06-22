export interface TicketTierType {
  id: string;
  name: string;
  price: number;
  inventory: number;
  sold: number;
  paused: boolean;
  entryType: "Regular" | "VIP" | "Early Bird" | "Custom";
  flexibleSeats: boolean;
  promoText: string;
}

export interface PromoCodeType {
  id: string;
  code: string;
  discount: number;
  maxUses: number;
}

export interface FAQType {
  id: string;
  question: string;
  answer: string;
}

export interface CreatedEventType {
  id: string;
  status: "Draft" | "Upcoming" | "Live" | "Completed" | "Archived";
  
  // Top-level properties directly on the object
  title: string;
  category: string;
  description: string;
  bannerUrl: string;
  ageGroup: string;
  tags: string[];

  // Specific event attributes at root level
  highlights: string[];
  highlightText: string;
  services: string[];
  dresscode: {
    enabled: boolean;
    style: string;
  };
  artists: string[];

  schedule: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  
  location: {
    venue: string;
    address: string;
    lat: number | null;
    lng: number | null;
  };
  
  ticketing: {
    mode: "free" | "paid" | "guestlist";
    capacity: number;
    capacityFlex: boolean;
    tiers: TicketTierType[];
    promoCodes: PromoCodeType[];
    price: string;
  };
  
  policies: {
    termsAndConditions: string;
    privacyPolicy: string;
    faqs: FAQType[];
  };
}

export interface EventDetail {
  id: string;
  organizer: string;
  verifiedOrganizer: boolean;
  title: string;
  category: string;
  musicGenre: string;
  ageRestricted: boolean;
  date: string;
  time: string;
  venue: string;
  distance: string;
  ticketsLeft: number;
  trending: boolean;
  price: string;
  about: string;
  lineup: { name: string; role: string; avatarBg: string }[];
  friendsAttending: { name: string; avatarLetter: string; color: string }[];
  banner: string;
  lat: number;
  lng: number;
  gallery: string[];
}
export interface DiscoverItem {
  id: string;
  type: string;
  title: string;
  category: string;
  genre: string;
  image: string;
  hype: string;
  attending: string;
  host: string;
  host_avatar?: string | null;
  verified: boolean;
  price: string;
  venue: string;
}export interface CountryInfo {
  name: string;
  region_code: string;
  dial_code: string;
  mobile_number_pattern: string;
  region_flag: string;
}

export interface EventMetaType {
  banner: string;
  venue: string;
  locationLink: string;
  instructions: string[];
}
