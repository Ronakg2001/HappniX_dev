"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
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

import { EventDetail } from "@/types/event";
import { MOCK_EVENTS_DETAILS } from "@/constants/mockData";

function formatRealEventToDetail(raw: any, fallbackId: string): EventDetail {
  if (!raw) return MOCK_EVENTS_DETAILS[fallbackId] || MOCK_EVENTS_DETAILS.e1;
  if (raw.about && raw.lineup && raw.gallery && raw.verifiedOrganizer !== undefined) return raw;

  let metadata: any = {};
  try {
    const cleaned = typeof raw.metadata === 'string' ? raw.metadata.replace(/'/g, '"').replace(/False/g, 'false').replace(/True/g, 'true') : "{}";
    metadata = typeof raw.metadata === 'object' ? raw.metadata : JSON.parse(cleaned || "{}");
  } catch {}

  let dateStr = "Upcoming";
  let timeStr = "8:00 PM";
  if (raw.startAt) {
    try {
      const d = new Date(raw.startAt);
      dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {}
  } else if (raw.schedule) {
    dateStr = raw.schedule.startDate || "Upcoming";
    timeStr = raw.schedule.startTime || "8:00 PM";
  }

  const artistsList: string[] = Array.isArray(metadata.artists) ? metadata.artists : (Array.isArray(raw.artists) ? raw.artists : []);
  const lineup = artistsList.map((a: any) => ({
    name: typeof a === 'string' ? a : a?.name || "Artist",
    role: "Featured Headliner",
    avatarBg: "bg-purple-600"
  }));

  const gallery: string[] = Array.isArray(metadata.gallery) && metadata.gallery.length > 0
    ? metadata.gallery
    : [raw.coverImageUrl || raw.bannerUrl || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80"];

  let priceRaw = raw.basePrice || raw.ticketing?.price || "499";
  const priceStr = raw.ticketType === "Paid" || (raw.ticketing?.mode === "paid")
    ? (str => str.startsWith('₹') ? str : `₹${str}`)(String(priceRaw))
    : "Free Entry";

  return {
    id: raw.eventID || raw.id || fallbackId,
    organizer: raw.hostName || raw.hostUserName || raw.organizer || "HappniX Host",
    verifiedOrganizer: true,
    title: raw.title || "HappniX Event",
    category: raw.eventCategory || raw.category || "Party",
    musicGenre: raw.eventCategory || raw.category || "Open Format",
    ageRestricted: metadata.ageGroup === "18+" || raw.ageGroup === "18+" || true,
    date: dateStr,
    time: timeStr,
    venue: raw.locationName || raw.location?.venue || "HappniX Venue",
    distance: raw.locationAddress || raw.location?.address || "Mumbai",
    ticketsLeft: raw.maxAttendees ? parseInt(raw.maxAttendees) : (raw.ticketing?.capacity || 100),
    trending: true,
    price: priceStr,
    about: raw.description || "Join us for an electrifying party experience curated on HappniX!",
    lineup,
    friendsAttending: [],
    banner: raw.coverImageUrl || raw.bannerUrl || gallery[0],
    lat: raw.latitude ? parseFloat(raw.latitude) : (raw.location?.lat || 19.076),
    lng: raw.longitude ? parseFloat(raw.longitude) : (raw.location?.lng || 72.877),
    gallery
  };
}

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
  const [event, setEvent] = useState<EventDetail>(() => {
    const fallback = MOCK_EVENTS_DETAILS[eventId] || MOCK_EVENTS_DETAILS.e1;
    if (typeof window === 'undefined') return fallback;
    try {
      const created = JSON.parse(localStorage.getItem("happnix_created_events_v4") || "[]");
      const cached = JSON.parse(localStorage.getItem("happnix_cached_feed_events") || "[]");
      const match = [...created, ...cached].find((e: any) => (e.eventID || e.id) === eventId);
      if (match) return formatRealEventToDetail(match, eventId);
    } catch {}
    return fallback;
  });

  useEffect(() => {
    if (!eventId) return;
    try {
      const created = JSON.parse(localStorage.getItem("happnix_created_events_v4") || "[]");
      const cached = JSON.parse(localStorage.getItem("happnix_cached_feed_events") || "[]");
      const match = [...created, ...cached].find((e: any) => (e.eventID || e.id) === eventId);
      if (match) {
        setEvent(formatRealEventToDetail(match, eventId));
        return;
      }
    } catch {}

    apiClient.get("api/events")
      .then((res: any) => {
        const list = res?.events || res?.data || [];
        if (Array.isArray(list)) {
          const match = list.find((e: any) => (e.eventID || e.id) === eventId);
          if (match) setEvent(formatRealEventToDetail(match, eventId));
        }
      }).catch(() => {});
  }, [eventId]);

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
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="rounded-xl px-3.5 h-9 text-xs font-bold text-white/80 hover:scale-102 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Feed
        </Button>

        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setLiked(!liked)} 
            variant={liked ? "destructive" : "outline"}
            size="icon"
            className={`rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
              liked ? 'shadow-[0_0_15px_rgba(239,68,68,0.25)]' : ''
            }`}
            title="Like event"
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current animate-pulse' : 'text-white/60'}`} />
          </Button>
          <Button 
            onClick={() => setSaved(!saved)} 
            variant="outline"
            size="icon"
            className={`rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
              saved 
                ? 'bg-[var(--brand-2)]/20 border-[var(--brand-2)] text-[var(--brand-2)] shadow-glow' 
                : 'text-white/60'
            }`}
            title="Bookmark event"
          >
            <Bookmark className={`h-4 w-4 ${saved ? 'fill-[var(--brand-2)]' : ''}`} />
          </Button>
          <Button 
            onClick={handleShare}
            variant="outline"
            size="icon"
            className="rounded-xl text-white/60 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200"
            title="Copy link to share"
          >
            <Share2 className="h-4 w-4" />
          </Button>
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
                <Button 
                  onClick={() => setFollowed(!followed)}
                  variant={followed ? "outline" : "brand"}
                  size="xs"
                  className="ml-3 px-2 text-[9px] font-bold"
                >
                  {followed ? "Following" : "Follow"}
                </Button>
              </div>
            </div>

            {/* Quick Hero Book Now Button */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col sm:items-end">
                <span className="text-[8px] text-white/40 uppercase font-black tracking-widest leading-none">Starting from</span>
                <span className="text-sm font-black text-white leading-tight mt-0.5">{event.price}</span>
              </div>
              <Button
                onClick={() => openBooking(event.title, event.price, event.id)}
                variant="brand"
                size="sm"
                className="px-4 rounded-lg text-[11px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Ticket className="h-3.5 w-3.5 mr-1" /> Book Now
              </Button>
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
                  <Button 
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(event.venue)}`)}
                    variant="brand"
                    size="sm"
                    className="px-3 text-[10px] font-black uppercase tracking-wider shrink-0"
                  >
                    Open maps
                  </Button>
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
          <Button 
            onClick={() => setActivePhotoIndex(null)}
            variant="ghost"
            size="icon"
            className="absolute top-6 right-6 rounded-xl text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Main Carousel Wrapper */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full flex items-center justify-center gap-4 select-none cursor-default"
          >
            {/* Left Nav Arrow */}
            <Button 
              onClick={() => setActivePhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : (event.gallery?.length || 1) - 1))}
              variant="outline"
              size="icon"
              className="rounded-full bg-white/5 border-white/10 text-white/80 hover:text-white shrink-0"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

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
            <Button 
              onClick={() => setActivePhotoIndex((prev) => (prev !== null && prev < (event.gallery?.length || 1) - 1 ? prev + 1 : 0))}
              variant="outline"
              size="icon"
              className="rounded-full bg-white/5 border-white/10 text-white/80 hover:text-white shrink-0"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
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
