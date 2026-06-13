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
