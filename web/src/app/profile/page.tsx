"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  Edit3,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Globe,
  Bell,
  Camera,
  Sparkles,
  Heart,
  MessageCircle,
  Play,
  Ticket,
  UserPlus,
  UserCheck,
  Grid3X3,
} from "lucide-react";

import {
  EditProfileModal,
  VerificationModal,
  FollowGraphModal,
  DiscoverProfileModal,
  ProfileNotificationsModal,
  MediaViewerModal,
  type UserProfile,
} from "@/components/modals/ProfileModals";

// ─── MOCK DATA ─────────────────────────────────────────────────

const MOCK_FOLLOWERS = [
  { id: "f1", name: "Sarah Connor", username: "sarahc", avatar: null, mutuals: 4 },
  { id: "f2", name: "Aria Roy", username: "ariar", avatar: null, mutuals: 7 },
  { id: "f3", name: "DJ Shadow", username: "shadowmix", avatar: null, mutuals: 12 },
  { id: "f4", name: "Neha Kapoor", username: "nehak", avatar: null, mutuals: 2 },
  { id: "f5", name: "Vikram Singh", username: "vikrams", avatar: null, mutuals: 9 },
];

const MOCK_FOLLOWING = [
  { id: "g1", name: "Utopia Entertainment", username: "utopiaent", avatar: null, mutuals: 0 },
  { id: "g2", name: "Rohan Gupta", username: "rohang", avatar: null, mutuals: 12 },
  { id: "g3", name: "Ananya Sharma", username: "ananyas", avatar: null, mutuals: 5 },
];

const MOCK_MEDIA = [
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

// ─── STAT CARD ─────────────────────────────────────────────────
function StatCard({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center px-4 py-2 rounded-lg transition-all ${onClick ? "hover:bg-foreground/8 cursor-pointer active:scale-95" : "cursor-default"}`}
    >
      <span className="text-xl font-black text-foreground leading-none">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
      </span>
      <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-0.5">{label}</span>
    </button>
  );
}

// ─── MEDIA GRID ITEM ───────────────────────────────────────────
function MediaGridItem({ item, onClick }: { item: (typeof MOCK_MEDIA)[0]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${hovered ? "scale-[1.02] shadow-glow" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`} />
      <div className="absolute inset-0 flex items-center justify-center">
        {item.type === "video" ? (
          <Play className="h-7 w-7 text-white/40" />
        ) : item.type === "event" ? (
          <Ticket className="h-7 w-7 text-white/40" />
        ) : (
          <Sparkles className="h-7 w-7 text-white/40" />
        )}
      </div>

      {/* Hover overlay */}
      <div className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-white text-xs font-bold">
            <Heart className="h-3.5 w-3.5 fill-white" /> {item.likes}
          </span>
          <span className="flex items-center gap-1 text-white text-xs font-bold">
            <MessageCircle className="h-3.5 w-3.5" /> {item.comments}
          </span>
        </div>
      </div>

      {/* Type badge */}
      {item.type !== "photo" && (
        <div className="absolute top-1.5 right-1.5 p-1 rounded bg-black/50">
          {item.type === "video" ? (
            <Play className="h-2.5 w-2.5 text-white" />
          ) : (
            <Ticket className="h-2.5 w-2.5 text-[var(--brand-4)]" />
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PROFILE PAGE ─────────────────────────────────────────
export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "Aarav Mehta",
    username: "aaravm",
    bio: "Chasing sunsets & soundwaves. Techno enthusiast. Jaipur nightlife explorer. 🎧",
    avatar: null,
    verified: false,
    isPrivate: false,
    vibes: 9,
    followers: 843,
    following: 312,
  });

  const router = useRouter();

  // Modal states
  const [showEdit, setShowEdit] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [followGraphType, setFollowGraphType] = useState<"followers" | "following" | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<(typeof MOCK_MEDIA)[0] | null>(null);

  const handleProfileSave = (updates: Partial<UserProfile>) =>
    setProfile((prev) => ({ ...prev, ...updates }));

  const handleVerified = () =>
    setProfile((prev) => ({ ...prev, verified: true }));

  return (
    <>
      <main className="flex-1 min-w-0 flex flex-col gap-0 mx-auto w-full">

        {/* ── Profile Header Card ────────────────────────── */}
        <div className="liquid-glass liquid-edge rounded-lg overflow-hidden mb-4">
          {/* Gradient Banner */}
          <div className="relative h-28 sm:h-36 bg-gradient-to-br from-[var(--brand-1)]/60 via-[var(--brand-2)]/40 to-[var(--brand-3)]/50">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Top-right action buttons */}
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={() => setShowNotifs(true)}
                className="relative p-2 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand-gradient text-white text-[8px] font-black flex items-center justify-center shadow-glow">
                  2
                </span>
              </button>
              <Link
                href="/settings"
                className="p-2 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Profile Info */}
          <div className="px-4 sm:px-5 pb-5">
            {/* Avatar Row */}
            <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-3">
              <div className="relative group">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-background bg-brand-gradient flex items-center justify-center font-black text-2xl sm:text-3xl text-white shadow-glow overflow-hidden">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    profile.name[0]
                  )}
                </div>
                <button
                  onClick={() => setShowEdit(true)}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Camera className="h-5 w-5 text-white" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => router.push("/my-bookings")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-xs font-bold text-foreground/80 hover:bg-foreground/12 hover:text-foreground transition-all"
                >
                  <Ticket className="h-3.5 w-3.5 animate-pulse" /> Bookings
                </button>
                
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground/8 border border-border text-xs font-bold text-foreground/80 hover:bg-foreground/12 hover:text-foreground transition-all"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                </button>
              </div>
            </div>

            {/* Name + Badges */}
            <div className="mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-foreground leading-none">{profile.name}</h1>
                {profile.verified ? (
                  <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-cyan-400/15 border border-cyan-400/40 text-cyan-400 text-[10px] font-black">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <button 
                    onClick={() => setShowVerify(true)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-400/10 border border-red-400/30 text-red-400 text-[10px] font-black hover:bg-red-400/20 active:scale-95 transition-all cursor-pointer"
                    title="Click to verify identity"
                  >
                    <ShieldAlert className="h-3 w-3 shrink-0" />
                    <span>Unverified</span>
                  </button>
                )}
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-foreground/5 border border-border text-foreground/50 text-[10px] font-semibold">
                  {profile.isPrivate ? <Lock className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
                  {profile.isPrivate ? "Private" : "Public"}
                </span>
              </div>
              <p className="text-sm text-foreground/50 mt-0.5">@{profile.username}</p>
            </div>

            {/* Bio */}
            {profile.bio ? (
              <p className="text-sm text-foreground/80 leading-relaxed mb-4 max-w-md">{profile.bio}</p>
            ) : (
              <p
                className="text-sm text-foreground/35 italic mb-4 cursor-pointer hover:text-foreground/60 transition-colors"
                onClick={() => setShowEdit(true)}
              >
                Add a bio to tell people about yourself…
              </p>
            )}

            {/* Social Stats */}
            <div className="flex items-center gap-0 border-t border-border pt-3">
              <StatCard label="Vibes" value={profile.vibes} />
              <div className="w-px h-8 bg-border" />
              <StatCard label="Fans" value={profile.followers} onClick={() => setFollowGraphType("followers")} />
              <div className="w-px h-8 bg-border" />
              <StatCard label="Following" value={profile.following} onClick={() => setFollowGraphType("following")} />
            </div>
          </div>
        </div>

        {/* ── Content Grid Header ─────────────────────── */}
        <div className="flex items-center gap-2 mb-3 mt-2">
          <Grid3X3 className="h-4 w-4 text-foreground/40" />
          <h2 className="text-xs font-black uppercase tracking-wider text-foreground/40">Vibes</h2>
          <span className="text-xs text-foreground/30 font-semibold">({MOCK_MEDIA.length})</span>
        </div>

        {/* ── Tabs Content ────────────────────────────── */}
        {MOCK_MEDIA.length === 0 ? (
          <div className="liquid-glass liquid-edge rounded-lg flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-10 w-10 text-foreground/20 mb-3 animate-pulse" />
            <p className="text-sm font-bold text-foreground/40">No vibes yet</p>
            <p className="text-xs text-foreground/30 mt-1">Share your first party moment!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {MOCK_MEDIA.map((item) => (
              <MediaGridItem key={item.id} item={item} onClick={() => setSelectedMedia(item)} />
            ))}
          </div>
        )}
      </main>

      {/* ── MODALS ─────────────────────────────────────── */}
      <EditProfileModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        profile={profile}
        onSave={handleProfileSave}
      />

      <VerificationModal
        isOpen={showVerify}
        onClose={() => setShowVerify(false)}
        onVerified={handleVerified}
      />

      <ProfileNotificationsModal
        isOpen={showNotifs}
        onClose={() => setShowNotifs(false)}
      />

      {followGraphType && (
        <FollowGraphModal
          isOpen={!!followGraphType}
          onClose={() => setFollowGraphType(null)}
          type={followGraphType}
          list={followGraphType === "followers" ? MOCK_FOLLOWERS : MOCK_FOLLOWING}
        />
      )}

      <MediaViewerModal
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        item={selectedMedia}
      />
    </>
  );
}

/* 
Restricted Features Until Verified
Unverified users are warned:
* Cannot host parties
* Cannot join parties

### Verification Banners & Prompts
The app repeatedly encourages verification through:
* Red warning banners
* “Verify Aadhaar” buttons
* Security modals
*/
