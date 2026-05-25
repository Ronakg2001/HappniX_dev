"use client";

import React, { useState } from "react";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Check, 
  MapPin, 
  Calendar, 
  Clock, 
  Ticket, 
  UserPlus, 
  UserCheck, 
  Volume2, 
  Smile, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Lock,
  Globe
} from "lucide-react";

// --- SOCIAL POST CARD ---
interface SocialPostCardProps {
  post: {
    id: string;
    user: { name: string; username: string; avatar: string; verified: boolean };
    timestamp: string;
    privacy: "public" | "friends";
    content: string;
    hashtags: string[];
    mentions: string[];
    musicTag?: string;
    moodTag?: string;
    images?: string[];
    likes: number;
    comments: number;
    location?: string;
    liked: boolean;
    saved: boolean;
  };
}

export function SocialPostCard({ post }: SocialPostCardProps) {
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [saved, setSaved] = useState(post.saved);

  const toggleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount(likesCount - 1);
    } else {
      setLiked(true);
      setLikesCount(likesCount + 1);
    }
  };

  return (
    <article className="liquid-glass liquid-edge rounded-lg p-4 sm:p-5 mb-4 hover:scale-[1.005] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-brand-gradient flex items-center justify-center font-bold text-sm border border-white/20 text-white shrink-0">
            {post.user.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h4 className="text-sm font-bold text-white leading-none">{post.user.name}</h4>
              {post.user.verified && (
                <span className="h-4 w-4 bg-[var(--brand-1)] text-white text-[9px] font-black rounded-full flex items-center justify-center scale-90">✓</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-white/40">
              <span>@{post.user.username}</span>
              <span>•</span>
              <span>{post.timestamp}</span>
              <span>•</span>
              {post.privacy === "public" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            </div>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="text-sm sm:text-base text-white/90 leading-relaxed mb-3">
        <p className="whitespace-pre-line">{post.content}</p>
        
        {/* Hashtags and Mentions */}
        <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2 text-xs font-semibold">
          {post.mentions.map((m) => (
            <span key={m} className="text-[var(--brand-2)] hover:underline cursor-pointer">@{m}</span>
          ))}
          {post.hashtags.map((h) => (
            <span key={h} className="text-[var(--brand-3)] hover:underline cursor-pointer">#{h}</span>
          ))}
        </div>
      </div>

      {/* Tags (Music / Mood) */}
      <div className="flex flex-wrap gap-2 mb-4">
        {post.musicTag && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/70">
            <Volume2 className="h-3.5 w-3.5 text-[var(--brand-1)]" />
            {post.musicTag}
          </span>
        )}
        {post.moodTag && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/70">
            <Smile className="h-3.5 w-3.5 text-[var(--brand-4)]" />
            {post.moodTag}
          </span>
        )}
        {post.location && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--brand-1)]/10 border border-[var(--brand-1)]/20 text-[11px] font-semibold text-white/90 ml-auto">
            <MapPin className="h-3.5 w-3.5 text-[var(--brand-1)]" />
            {post.location}
          </span>
        )}
      </div>

      {/* Media Content */}
      {post.images && post.images.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-white/10 mb-4 bg-black/45 relative aspect-[16/10] sm:aspect-[16/9]">
          {/* Simulated Image */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-black/20" />
          <div className="absolute inset-0 flex items-center justify-center bg-brand-gradient/20">
            <Sparkles className="h-10 w-10 text-white/30 animate-pulse" />
          </div>
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
            Happnix Gallery
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-white/60">
        <button 
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold hover:text-[var(--brand-1)] active:scale-90 transition-all ${liked ? 'text-[var(--brand-1)]' : ''}`}
        >
          <Heart className={`h-4 sm:h-5 w-4 sm:w-5 ${liked ? 'fill-[var(--brand-1)]' : ''}`} />
          {likesCount}
        </button>

        <button className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold hover:text-[var(--brand-3)] transition-all">
          <MessageCircle className="h-4 sm:h-5 w-4 sm:w-5" />
          {post.comments}
        </button>

        <button className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold hover:text-[var(--brand-4)] transition-all">
          <Share2 className="h-4 sm:h-5 w-4 sm:w-5" />
          Share
        </button>

        <button 
          onClick={() => setSaved(!saved)}
          className={`p-1 hover:text-[var(--brand-2)] active:scale-95 transition-all ${saved ? 'text-[var(--brand-2)]' : ''}`}
        >
          <Bookmark className={`h-4 sm:h-5 w-4 sm:w-5 ${saved ? 'fill-[var(--brand-2)]' : ''}`} />
        </button>
      </div>
    </article>
  );
}


// --- EVENT CARD ---
interface EventCardProps {
  event: {
    id: string;
    organizer: string;
    verifiedOrganizer: boolean;
    banner: string;
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
    friendsAttending?: number;
    price: string;
  };
  onBookNow: () => void;
}

export function EventCard({ event, onBookNow }: EventCardProps) {
  const [interested, setInterested] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="liquid-glass liquid-edge rounded-lg overflow-hidden mb-4 hover:scale-[1.005] transition-all duration-300">
      {/* Banner / Hero Section */}
      <div className="relative h-36 sm:h-36 bg-black/45 border-b border-white/5 flex flex-col justify-end p-4">
        {/* Dynamic decorative backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-0" />
        <div className="absolute inset-0 bg-brand-gradient/10 z-0" />
        
        {/* Tags on image */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {event.trending && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--brand-1)] text-white text-[10px] font-bold uppercase tracking-wider shadow-glow">
              <TrendingUp className="h-3 w-3" />
              Trending
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
            {event.category}
          </span>
        </div>

        {/* Organizer details */}
        <div className="relative z-10 flex items-center gap-1.5 mb-1.5 text-xs text-white/70">
          <span>By {event.organizer}</span>
          {event.verifiedOrganizer && (
            <span className="h-3.5 w-3.5 bg-[var(--brand-3)] text-white text-[8px] font-black rounded-full flex items-center justify-center">✓</span>
          )}
        </div>

        <h3 className="relative z-10 text-lg sm:text-xl font-bold text-white mb-1.5">{event.title}</h3>
        
        {/* Genres & Restrictions */}
        <div className="relative z-10 flex flex-wrap gap-2 text-xs">
          <span className="text-[var(--brand-3)] font-semibold">{event.musicGenre}</span>
          <span className="text-white/40">•</span>
          <span className="text-white/60">{event.ageRestricted ? "18+ Only" : "All Ages"}</span>
        </div>
      </div>

      {/* Details Section */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs sm:text-sm text-white/75">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[var(--brand-1)] shrink-0" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--brand-2)] shrink-0" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <MapPin className="h-4 w-4 text-[var(--brand-3)] shrink-0" />
            <span className="truncate">{event.venue} • <strong className="text-white/90">{event.distance}</strong></span>
          </div>
        </div>

        {/* Real-time Indicators */}
        <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-white/5 border border-white/5 mb-4 text-xs">
          <span className="text-red-400 font-bold flex items-center gap-1">
            <Ticket className="h-3.5 w-3.5" />
            {event.ticketsLeft} tickets left!
          </span>
          {event.friendsAttending && (
            <span className="text-white/60 font-semibold">
              ✨ {event.friendsAttending} friends attending
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onBookNow}
            className="flex-1 py-3 px-4 rounded-2xl bg-brand-gradient text-white text-xs sm:text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow text-center"
          >
            Book Now • {event.price}
          </button>

          <button 
            onClick={() => setInterested(!interested)}
            className={`py-3 px-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all ${
              interested 
                ? "bg-[var(--brand-3)]/10 border-[var(--brand-3)] text-white" 
                : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            {interested ? "Interested ✓" : "Interested"}
          </button>

          <button 
            onClick={() => setSaved(!saved)}
            className={`p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 transition-all ${
              saved ? "text-[var(--brand-1)]" : "text-white/60"
            }`}
          >
            <Bookmark className={`h-4 sm:h-5 w-4 sm:w-5 ${saved ? 'fill-[var(--brand-1)]' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}


// --- SPONSORED / FEATURED EVENT CARD ---
export function SponsoredEventCard({ event, onBookNow }: EventCardProps) {
  return (
    <div className="relative rounded-lg overflow-hidden mb-6 border-2 border-[var(--brand-1)]/30 bg-black shadow-[0_0_30px_rgba(var(--glow-rgb),0.15)] hover:scale-[1.005] transition-all duration-300">
      {/* Promoter tag */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--brand-1)] text-white text-[10px] font-black uppercase tracking-wider shadow-glow">
        <Sparkles className="h-3 w-3" />
        Promoted
      </div>

      <div className="flex flex-col sm:flex-row">
        {/* Banner Column */}
        <div className="relative w-full sm:w-[45%] h-44 sm:h-auto min-h-[180px] bg-black/45 flex flex-col justify-end p-4">
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black via-black/40 to-transparent z-0" />
          <div className="absolute inset-0 bg-brand-gradient/20 z-0" />
          
          <span className="relative z-10 px-2 py-0.5 rounded bg-[var(--brand-4)] text-black text-[9px] font-extrabold uppercase w-max mb-2">
            PREMIUM VENUE
          </span>
          <h3 className="relative z-10 text-base sm:text-lg font-black text-white leading-tight">{event.title}</h3>
        </div>

        {/* Details Column */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between bg-white/5 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs text-white/50">
              <span>Host: <strong className="text-white/80">{event.organizer}</strong></span>
              <span className="h-3.5 w-3.5 bg-[var(--brand-1)] text-white text-[8px] font-black rounded-full flex items-center justify-center">✓</span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-white/85 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--brand-1)] shrink-0" />
                <span>{event.date} @ {event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--brand-3)] shrink-0" />
                <span className="truncate">{event.venue}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 mt-auto">
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold">Tickets starts at</p>
              <p className="text-base font-black text-[var(--brand-1)]">{event.price}</p>
            </div>
            <button 
              onClick={onBookNow}
              className="py-2.5 px-5 rounded-2xl bg-brand-gradient text-white text-xs font-bold hover:scale-[1.03] active:scale-[0.97] transition-all shadow-glow flex items-center gap-1"
            >
              Get Tickets
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// --- SUGGESTED PROFILES CARD ---
interface Profile {
  id: string;
  name: string;
  username: string;
  mutuals: number;
  interests: string[];
}

export function SuggestedProfilesCard() {
  const [followedIds, setFollowedIds] = useState<string[]>([]);

  const profiles: Profile[] = [
    { id: "1", name: "Sarah Connor", username: "sarahc", mutuals: 4, interests: ["Techno", "Pool Parties"] },
    { id: "2", name: "DJ Shadow", username: "shadowmix", mutuals: 8, interests: ["Underground", "Clubs"] },
    { id: "3", name: "Aria Roy", username: "ariar", mutuals: 2, interests: ["Social Meetups", "Gig Hopping"] }
  ];

  const handleFollow = (id: string) => {
    if (followedIds.includes(id)) {
      setFollowedIds(followedIds.filter(item => item !== id));
    } else {
      setFollowedIds([...followedIds, id]);
    }
  };

  return (
    <div className="liquid-glass liquid-edge rounded-lg p-4 sm:p-5 mb-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white/55 mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[var(--brand-2)]" />
        Suggested People Nearby
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
        {profiles.map((profile) => {
          const isFollowing = followedIds.includes(profile.id);

          return (
            <div 
              key={profile.id} 
              className="min-w-[150px] sm:min-w-[180px] rounded-2xl bg-white/5 border border-white/5 p-3 flex flex-col items-center text-center snap-start"
            >
              <div className="h-12 w-12 rounded-full bg-brand-gradient flex items-center justify-center font-bold text-base border border-white/10 mb-2 text-white">
                {profile.name[0]}
              </div>

              <h4 className="text-xs font-bold text-white line-clamp-1">{profile.name}</h4>
              <p className="text-[10px] text-white/40 mb-2">@{profile.username}</p>

              <p className="text-[9px] font-semibold text-white/60 mb-3 bg-white/5 px-2 py-0.5 rounded-full">
                {profile.mutuals} mutual friends
              </p>

              <button
                onClick={() => handleFollow(profile.id)}
                className={`w-full py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                  isFollowing
                    ? "bg-white/10 text-white border border-white/10"
                    : "bg-brand-gradient text-white shadow-glow hover:scale-[1.02]"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="h-3 w-3" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3" />
                    Follow
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
