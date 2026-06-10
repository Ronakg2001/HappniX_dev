"use client";

import React, { useState, useEffect } from "react";
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
  Ticket,
  Grid3X3,
} from "lucide-react";

import {
  VerificationModal,
  FollowGraphModal,
  ProfileNotificationsModal,
  MediaViewerModal,
  type UserProfile,
} from "@/components/modals/ProfileModals";

import { apiClient } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { ProfileStat } from "@/components/ui/profile-stat";
import { MediaGridItem, type MediaItem } from "@/components/ui/media-grid-item";

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

// ─── MAIN PROFILE PAGE ─────────────────────────────────────────
export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {        
        const data: any = await apiClient.get("/api/profile/me");
        if (data && data.success && data.profile) {
          setProfile(data.profile);
        } else if (data && data.data) {
          // Fallback if data is inside the 'data' field
          setProfile(data.data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const router = useRouter();

  // Modal states
  const [showVerify, setShowVerify] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [followGraphType, setFollowGraphType] = useState<"followers" | "following" | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const handleVerified = () =>
    setProfile((prev) => (prev ? { ...prev, verified: true } : null));

  if (loading) {
    return (
      <main className="flex-1 min-w-0 flex flex-col gap-0 mx-auto w-full items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-24 w-24 bg-foreground/10 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-foreground/10 rounded mb-2"></div>
          <div className="h-3 w-24 bg-foreground/10 rounded"></div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex-1 min-w-0 flex flex-col gap-0 mx-auto w-full items-center justify-center min-h-[50vh]">
        <p className="text-foreground/50">{error || "Failed to load profile."}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 px-4 py-2 bg-foreground/10 rounded-lg">
          Retry
        </Button>
      </main>
    );
  }

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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifs(true)}
                className="relative p-2 h-auto rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 hover:text-white transition-all"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand-gradient text-white text-[8px] font-black flex items-center justify-center shadow-glow">
                  2
                </span>
              </Button>
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/profile/edit")}
                  className="absolute inset-0 h-full w-full rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/60"
                >
                  <Camera className="h-5 w-5 text-white" />
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/my-bookings")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-xs font-bold text-foreground/80 hover:bg-foreground/12 hover:text-foreground transition-all"
                >
                  <Ticket className="h-3.5 w-3.5 animate-pulse" /> Bookings
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/profile/edit")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground/8 border border-border text-xs font-bold text-foreground/80 hover:bg-foreground/12 hover:text-foreground transition-all"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                </Button>
              </div>
            </div>

            {/* Name + Badges */}
            <div className="mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-foreground leading-none">
                  {profile.name}
                  {profile.pronoun && <span className="text-sm text-foreground/50 font-semibold align-bottom ml-2 normal-case tracking-normal">({profile.pronoun})</span>}
                </h1>
                {profile.verified ? (
                  <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-cyan-400/15 border border-cyan-400/40 text-cyan-400 text-[10px] font-black">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowVerify(true)}
                    className="flex items-center h-auto gap-1 px-2 py-0.5 rounded-lg bg-red-400/10 border border-red-400/30 text-red-400 text-[10px] font-black hover:bg-red-400/20 active:scale-95 transition-all cursor-pointer hover:text-red-400"
                    title="Click to verify identity"
                  >
                    <ShieldAlert className="h-3 w-3 shrink-0" />
                    <span>Unverified</span>
                  </Button>
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
              <p className="text-sm text-foreground/80 leading-relaxed mb-4 max-w-md whitespace-pre-wrap">{profile.bio}</p>
            ) : (
              <p
                className="text-sm text-foreground/35 italic mb-4 cursor-pointer hover:text-foreground/60 transition-colors"
                onClick={() => router.push("/profile/edit")}
              >
                Add a bio to tell people about yourself…
              </p>
            )}

            {/* Social Links */}
            {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
              <div className="flex gap-4 mb-4">
                {profile.socialLinks.x && (
                  <a href={profile.socialLinks.x} target="_blank" rel="noreferrer" className="text-foreground/50 hover:text-foreground transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}
                {profile.socialLinks.instagram && (
                  <a href={profile.socialLinks.instagram} target="_blank" rel="noreferrer" className="text-foreground/50 hover:text-foreground transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
                {profile.socialLinks.facebook && (
                  <a href={profile.socialLinks.facebook} target="_blank" rel="noreferrer" className="text-foreground/50 hover:text-foreground transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
                {profile.socialLinks.tiktok && (
                  <a href={profile.socialLinks.tiktok} target="_blank" rel="noreferrer" className="text-foreground/50 hover:text-foreground transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Social Stats */}
            <div className="flex items-center gap-0 border-t border-border pt-3">
              <ProfileStat label="Vibes" value={profile.vibes} />
              <div className="w-px h-8 bg-border" />
              <ProfileStat label="Fans" value={profile.followers} onClick={() => setFollowGraphType("followers")} />
              <div className="w-px h-8 bg-border" />
              <ProfileStat label="Following" value={profile.following} onClick={() => setFollowGraphType("following")} />
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
