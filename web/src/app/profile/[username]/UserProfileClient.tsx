"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  Globe,
  Grid3X3,
  Sparkles,
  UserPlus,
  UserCheck,
  MoreHorizontal,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProfileStat } from "@/components/ui/profile-stat";
import { MOCK_USERS } from "@/constants/mockData";
import { type User } from "@/types/user";

function ProfileSkeleton() {
  return (
    <main className="flex-1 min-w-0 flex flex-col gap-0 mx-auto w-full animate-pulse">
      <div className="liquid-glass liquid-edge rounded-lg overflow-hidden mb-4">
        <div className="h-28 bg-white/[0.04]" />
        <div className="px-4 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="h-20 w-20 rounded-full bg-white/[0.07] border-4 border-background" />
            <div className="h-9 w-24 rounded-lg bg-white/[0.06]" />
          </div>
          <div className="h-5 w-40 bg-white/[0.07] rounded mb-2" />
          <div className="h-3 w-24 bg-white/[0.05] rounded mb-3" />
          <div className="h-3 w-full bg-white/[0.04] rounded mb-1.5" />
          <div className="h-3 w-3/4 bg-white/[0.04] rounded mb-4" />
          <div className="flex gap-6 pt-3 border-t border-white/5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="h-4 w-10 bg-white/[0.07] rounded" />
                <div className="h-2.5 w-12 bg-white/[0.04] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-white/[0.04] rounded-sm" />
        ))}
      </div>
    </main>
  );
}

function UserNotFound({ username }: { username: string }) {
  const router = useRouter();
  return (
    <main className="flex-1 min-w-0 flex flex-col items-center justify-center text-center p-8 min-h-[60vh]">
      <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4 text-2xl font-black text-white/20">
        ?
      </div>
      <h2 className="text-sm font-black text-white uppercase tracking-wider mb-1">
        User not found
      </h2>
      <p className="text-[11px] text-white/40 max-w-xs leading-relaxed mb-5">
        @{username} doesn&apos;t exist or may have changed their username.
      </p>
      <Button
        onClick={() => router.back()}
        variant="outline"
        size="sm"
        className="border-white/15 text-white/70 hover:text-white hover:bg-white/[0.08] text-xs"
      >
        <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Go back
      </Button>
    </main>
  );
}

interface UserProfileClientProps {
  username: string;
}

export default function UserProfileClient({ username }: UserProfileClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!username) return;
    const timer = setTimeout(() => {
      const found = MOCK_USERS.find((u) => u.username === username) ?? null;
      setUser(found);
      setIsFollowing(found?.isFollowing ?? false);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [username]);

  if (loading) return <ProfileSkeleton />;
  if (!user) return <UserNotFound username={username} />;

  return (
    <>
      <main className="flex-1 min-w-0 flex flex-col gap-0 mx-auto w-full animate-in fade-in duration-300">
        <div className="liquid-glass liquid-edge rounded-lg overflow-hidden mb-4">
          <div className="relative h-28 sm:h-36 bg-gradient-to-br from-[var(--brand-1)]/60 via-[var(--brand-2)]/40 to-[var(--brand-3)]/50">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            <div className="absolute top-3 left-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                aria-label="Go back"
                className="p-2 h-8 w-8 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute top-3 right-3">
              <Button
                variant="ghost"
                size="icon"
                aria-label="More options"
                className="p-2 h-8 w-8 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="px-4 sm:px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-3">
              <div className="relative z-10 h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-background bg-brand-gradient flex items-center justify-center font-black text-2xl sm:text-3xl text-white shadow-glow overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  user.name[0].toUpperCase()
                )}
              </div>

              <div className="flex gap-2 items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Send message"
                  className="h-9 w-9 rounded-lg bg-white/[0.06] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.10] transition-all"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => setIsFollowing((f) => !f)}
                  aria-label={isFollowing ? `Unfollow ${user.name}` : `Follow ${user.name}`}
                  aria-pressed={isFollowing}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-2)] ${
                    isFollowing
                      ? "bg-white/[0.06] border border-white/10 text-white/70 hover:bg-white/[0.10]"
                      : "bg-brand-gradient text-white shadow-glow hover:scale-[1.03] active:scale-[0.97]"
                  }`}
                >
                  {isFollowing ? (
                    <UserCheck className="h-3.5 w-3.5" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            </div>

            <div className="mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-foreground leading-none">
                  {user.name}
                </h1>
                {user.verified && (
                  <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-cyan-400/15 border border-cyan-400/40 text-cyan-400 text-[10px] font-black">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-foreground/5 border border-border text-foreground/50 text-[10px] font-semibold">
                  <Globe className="h-2.5 w-2.5" /> Public
                </span>
              </div>
              <p className="text-sm text-foreground/50 mt-0.5">@{user.username}</p>
            </div>

            {user.bio && (
              <p className="text-sm text-foreground/80 leading-relaxed mb-4 max-w-md whitespace-pre-wrap">
                {user.bio}
              </p>
            )}

            {user.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {user.tags.map((tag) => (
                  <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-wider"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {user.mutuals > 0 && (
              <p className="text-[11px] text-[var(--brand-2)] font-semibold mb-3">
                {user.mutuals} mutual connection{user.mutuals !== 1 ? "s" : ""}
              </p>
            )}

            <div className="flex items-center gap-0 border-t border-border pt-3">
              <ProfileStat label="Fans" value={user.followers} />
              <div className="w-px h-8 bg-border" />
              <ProfileStat label="Vibes" value={0} />
              <div className="w-px h-8 bg-border" />
              <ProfileStat label="Events" value={0} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 mt-2">
          <Grid3X3 className="h-4 w-4 text-foreground/40" />
          <h2 className="text-xs font-black uppercase tracking-wider text-foreground/40">Vibes</h2>
        </div>

        <div className="liquid-glass liquid-edge rounded-lg flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="h-10 w-10 text-foreground/20 mb-3 animate-pulse" />
          <p className="text-sm font-bold text-foreground/40">No vibes yet</p>
          <p className="text-xs text-foreground/30 mt-1">
            {user.name.split(" ")[0]} hasn&apos;t shared any moments yet.
          </p>
        </div>
      </main>
    </>
  );
}
