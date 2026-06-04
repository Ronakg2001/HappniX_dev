"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLayout } from "@/components/layout/AppLayout";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Tag, 
  Users, 
  Ticket, 
  Music, 
  ShieldCheck, 
  Heart, 
  Bookmark, 
  Share2, 
  Navigation,
  Sparkles,
  Info,
  CalendarDays,
  Compass,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

interface EventDetail {
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

const MOCK_EVENTS_DETAILS: Record<string, EventDetail> = {
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
    ]
  }
};

export default function EventDetailPageClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { openBooking } = useLayout();
  
  // Interactive States
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "lineup" | "map">("about");
  const [followed, setFollowed] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const eventId = params?.id || "e1";
  const event = MOCK_EVENTS_DETAILS[eventId] || MOCK_EVENTS_DETAILS.e1;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2500);
  };

  return (
    <div className="flex-1 min-w-0 mx-auto w-full flex flex-col gap-6 relative select-none">
      {/* Dynamic Alert Banner for Share success */}
      {showShareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-brand-gradient text-white text-xs font-bold shadow-glow flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="h-4 w-4" /> Link copied to Clipboard! Share with your Squad.
        </div>
      )}

      {/* Floating Action Header Bar */}
      <div className="flex items-center justify-between shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white hover:scale-102 active:scale-98 transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Feed
        </button>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setLiked(!liked)} 
            className={`p-2.5 rounded-xl border transition-all duration-300 hover:scale-105 cursor-pointer active:scale-95 ${
              liked 
                ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]' 
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title="Like event"
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 animate-pulse' : ''}`} />
          </button>
          <button 
            onClick={() => setSaved(!saved)} 
            className={`p-2.5 rounded-xl border transition-all duration-300 hover:scale-105 cursor-pointer active:scale-95 ${
              saved 
                ? 'bg-[var(--brand-2)]/20 border-[var(--brand-2)] text-[var(--brand-2)] shadow-glow' 
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title="Bookmark event"
          >
            <Bookmark className={`h-4 w-4 ${saved ? 'fill-[var(--brand-2)]' : ''}`} />
          </button>
          <button 
            onClick={handleShare}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:scale-105 cursor-pointer active:scale-95 transition-all duration-200"
            title="Copy link to share"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Glassmorphic Wrapper */}
      <div className="liquid-glass liquid-edge rounded-[24px] overflow-hidden flex flex-col shadow-glow">
        
        {/* Banner Hero Image & Neon overlay */}
        <div 
          className="relative h-48 sm:h-64 bg-cover bg-center flex flex-col justify-end p-6"
          style={{ backgroundImage: `url(${event.banner})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent z-0" />
          <div className="absolute inset-0 bg-brand-gradient/10 z-0" />

          {/* Glowing Radial Backdrop Sweep */}
          <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[60%] rounded-full bg-[var(--brand-2)]/25 blur-[90px] pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
            <div className="flex flex-col gap-2.5 flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex gap-2">
                {event.trending && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[var(--brand-1)] text-white text-[9px] font-black uppercase tracking-widest shadow-glow animate-pulse">
                    Trending Event
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/5">
                  {event.category}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3.5xl font-black text-white leading-tight text-shadow-glow break-words">{event.title}</h1>

              {/* Organizer Row */}
              <div className="flex items-center gap-2 mt-1">
                <div className="h-7 w-7 rounded-full bg-brand-gradient flex items-center justify-center font-black text-[10px] text-white">
                  {event.organizer[0]}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white/95">Hosted by {event.organizer}</span>
                  {event.verifiedOrganizer && (
                    <ShieldCheck className="h-4 w-4 text-[var(--brand-3)]" />
                  )}
                </div>
                <button 
                  onClick={() => setFollowed(!followed)}
                  className={`ml-3 px-2 py-0.5 rounded-md text-[9px] font-bold border transition-all duration-200 cursor-pointer ${
                    followed 
                      ? "bg-white/10 border-white/20 text-white/60" 
                      : "bg-brand-gradient text-white border-transparent shadow-glow hover:scale-102"
                  }`}
                >
                  {followed ? "Following" : "Follow"}
                </button>
              </div>
            </div>

            {/* Quick Hero Book Now Button */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col sm:items-end">
                <span className="text-[8px] text-white/40 uppercase font-black tracking-widest leading-none">Starting from</span>
                <span className="text-sm font-black text-white leading-tight mt-0.5">{event.price}</span>
              </div>
              <button
                onClick={() => openBooking(event.title, event.price)}
                className="px-4 py-2 rounded-lg bg-brand-gradient text-white text-[11px] font-black shadow-glow hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <Ticket className="h-3.5 w-3.5" /> Book Now
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Action Tabs Panel */}
        <div className="flex border-b border-white/10 bg-white/[0.02]">
          {(["about", "lineup", "map"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-300 relative ${
                activeTab === tab 
                  ? "text-white text-shadow-glow" 
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {tab === "about" && "The Details"}
              {tab === "lineup" && "Artist Line-up"}
              {tab === "map" && "Venue Map"}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-gradient shadow-glow" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Context Content Viewports */}
        <div className="p-6 flex flex-col gap-6">
          
          {/* Tab 1: Details */}
          {activeTab === "about" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              
              {/* Quick Metadata Info Tags */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/80 font-bold">
                  <Music className="h-4 w-4 text-[var(--brand-1)]" /> {event.musicGenre}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/80 font-bold">
                  <Tag className="h-4 w-4 text-[var(--brand-4)]" /> {event.ageRestricted ? "18+ Exclusive" : "All Ages Admission"}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold ml-auto">
                  <Ticket className="h-4 w-4" /> {event.ticketsLeft} Passes Left
                </span>
              </div>

              {/* Schedule and Location widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex gap-3.5 hover:bg-white/[0.05] transition-all">
                  <div className="h-10 w-10 rounded-xl bg-[var(--brand-1)]/10 text-[var(--brand-1)] flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider font-black text-white/30">Schedule Event</h4>
                    <p className="text-sm font-black text-white mt-1">{event.date}</p>
                    <p className="text-xs text-white/50 mt-0.5">{event.time}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex gap-3.5 hover:bg-white/[0.05] transition-all">
                  <div className="h-10 w-10 rounded-xl bg-[var(--brand-3)]/10 text-[var(--brand-3)] flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[10px] uppercase tracking-wider font-black text-white/30">Venue Address</h4>
                    <p className="text-sm font-black text-white mt-1 truncate">{event.venue}</p>
                    <p className="text-xs text-white/50 mt-0.5">{event.distance}</p>
                  </div>
                </div>
              </div>

              {/* About description */}
              <div className="p-4.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <h4 className="text-xs font-black uppercase tracking-wider text-white/40 mb-2.5 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-[var(--brand-2)]" /> About the experience
                </h4>
                <p className="text-sm text-white/80 leading-relaxed font-medium">{event.about}</p>
              </div>

              {/* Event Gallery Showcase */}
              <div className="p-4.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col gap-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-[var(--brand-3)]" /> Event Highlights & Menu
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {event.gallery?.slice(0, 5).map((imgUrl, i) => {
                    const isLast = i === 4 && (event.gallery?.length || 0) > 5;
                    const remainingCount = (event.gallery?.length || 0) - 5;
                    return (
                      <div 
                        key={i} 
                        onClick={() => setActivePhotoIndex(i)}
                        className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group cursor-pointer hover:border-white/20 transition-all duration-300"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={imgUrl} 
                          alt={`Gallery preview ${i+1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {isLast ? (
                          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white transition-colors group-hover:bg-black/70">
                            <span className="text-sm font-black">+{remainingCount + 1}</span>
                            <span className="text-[7px] uppercase font-black tracking-widest text-white/60">More</span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white animate-pulse" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Friends Social Stack */}
              <div className="p-4.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[var(--brand-4)]/10 text-[var(--brand-4)] flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Squad Check</h4>
                    <p className="text-[10px] text-white/50 mt-0.5">{event.friendsAttending.map(f => f.name).join(", ")} are attending</p>
                  </div>
                </div>
                {/* Visual Stack */}
                <div className="flex -space-x-2">
                  {event.friendsAttending.map((friend, i) => (
                    <div 
                      key={i} 
                      className={`h-7 w-7 rounded-full border-2 border-[#09090b] flex items-center justify-center text-[10px] font-black text-white cursor-pointer hover:-translate-y-1 hover:z-20 transition-all ${friend.color} shadow-glow`}
                      title={friend.name}
                    >
                      {friend.avatarLetter}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Artists Lineup */}
          {activeTab === "lineup" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40 mb-1 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[var(--brand-1)]" /> Headline & Supporting Artists
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {event.lineup.map((artist, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between hover:bg-white/[0.06] hover:scale-[1.01] hover:shadow-glow transition-all duration-300"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${artist.avatarBg} flex items-center justify-center text-white font-black text-base shadow-glow`}>
                        {artist.name[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{artist.name}</h4>
                        <p className="text-[10px] text-white/45 mt-1">{artist.role}</p>
                      </div>
                    </div>
                    
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-[var(--brand-3)] uppercase tracking-wider">
                      {idx === 0 ? "HEADLINER" : "SUPPORT"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Map Guide */}
          {activeTab === "map" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40 mb-1">Interactive Google Map</h3>
              <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] aspect-[16/9] sm:aspect-[21/9] overflow-hidden hover:border-white/20 transition-all duration-300">
                <iframe
                  title="Venue Location Map"
                  src={`https://maps.google.com/maps?q=${event.lat},${event.lng}&z=16&output=embed`}
                  className="w-full h-full border-0 invert opacity-80"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                
                {/* Visual overlay card badge */}
                <div className="absolute bottom-3 left-3 right-3 sm:left-auto bg-black/80 backdrop-blur-md p-3.5 rounded-xl border border-white/10 flex items-center justify-between gap-4 max-w-sm">
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-white truncate">{event.venue}</h4>
                    <p className="text-[10px] text-white/40 truncate mt-0.5">{event.distance}</p>
                  </div>
                  <button 
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(event.venue)}`)}
                    className="px-3 py-1.5 rounded-lg bg-brand-gradient text-white text-[10px] font-black uppercase tracking-wider shadow-glow hover:scale-102 cursor-pointer transition-all shrink-0"
                  >
                    Open maps
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Carousel Modal overlay */}
      {activePhotoIndex !== null && (
        <div 
          onClick={() => setActivePhotoIndex(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
        >
          {/* Close button */}
          <button 
            onClick={() => setActivePhotoIndex(null)}
            className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer active:scale-95 transition-all"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Main Carousel Wrapper */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full flex items-center justify-center gap-4 select-none cursor-default"
          >
            {/* Left Nav Arrow */}
            <button 
              onClick={() => setActivePhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : (event.gallery?.length || 1) - 1))}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Photo Container */}
            <div className="relative aspect-square sm:aspect-video w-full max-h-[70vh] rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={event.gallery?.[activePhotoIndex]} 
                alt={`Full preview ${activePhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300"
              />
            </div>

            {/* Right Nav Arrow */}
            <button 
              onClick={() => setActivePhotoIndex((prev) => (prev !== null && prev < (event.gallery?.length || 1) - 1 ? prev + 1 : 0))}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Carousel footer stats indicator */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="mt-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-black text-white/60 uppercase tracking-widest cursor-default"
          >
            {activePhotoIndex + 1} of {event.gallery?.length}
          </div>
        </div>
      )}
    </div>
  );
}
