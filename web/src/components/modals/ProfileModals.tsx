"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient, userApi, fixAvatarUrl } from "@/lib/api";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Check,
  ChevronRight,
  Users,
  UserPlus,
  UserCheck,
  Bell,
  Heart,
  Lock,
  Globe,
  EyeOff,
  Trash2,
  LogOut,
  Tag,
  AtSign,
  Crown,
  Baby,
  UserCog,
  Ban,
  Search,
  Sparkles,
} from "lucide-react";

// ─── SHARED TYPES ─────────────────────────────────────────────
export interface UserProfile {
  id?: string;
  userID?: string;
  name: string;
  username: string;
  bio: string;
  avatar: string | null;
  pronoun?: string;
  dob?: string;
  gender?: string;
  socialLinks?: {
    x?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  verified: boolean;
  isPrivate: boolean;
  vibes: number;
  followers: number;
  following: number;
}

// ─── AADHAAR VERIFICATION MODAL ────────────────────────────────
interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function VerificationModal({ isOpen, onClose, onVerified }: VerificationModalProps) {
  const [step, setStep] = useState<"aadhaar" | "otp" | "success">("aadhaar");
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!isOpen) return null;

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    setStep("success");
    setTimeout(() => {
      onVerified();
      onClose();
      setStep("aadhaar");
      setAadhaar("");
      setOtp(["", "", "", "", "", ""]);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-lg liquid-glass liquid-edge border border-border p-6 shadow-card animate-in zoom-in-95 duration-200">
        {step === "success" ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400 to-[var(--brand-3)] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(114,183,255,0.5)] animate-pulse">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-1">Identity Verified!</h3>
            <p className="text-xs text-foreground/60">Your Aadhaar has been linked. Cyan badge unlocked.</p>
          </div>
        ) : step === "otp" ? (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[9px] font-black tracking-widest text-[var(--brand-3)] uppercase">Aadhaar Verification</p>
                <h3 className="text-sm font-extrabold text-foreground mt-0.5">Enter OTP</h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-foreground/10 text-foreground/50 transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-foreground/60 mb-5">OTP sent to the mobile number linked with Aadhaar ending in {aadhaar.slice(-4)}.</p>
            <div className="flex gap-2 justify-center mb-6">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="h-11 w-10 rounded-lg bg-foreground/5 border border-border text-center text-base font-black text-foreground focus:outline-none focus:border-[var(--brand-3)] transition-all"
                />
              ))}
            </div>
            <button
              onClick={handleVerify}
              disabled={otp.some((d) => !d)}
              className="w-full py-3.5 rounded-lg bg-brand-gradient text-white text-xs font-bold shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              Verify Identity
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[9px] font-black tracking-widest text-[var(--brand-1)] uppercase">Aadhaar Verification</p>
                <h3 className="text-sm font-extrabold text-foreground mt-0.5">Verify Your Identity</h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-foreground/10 text-foreground/50 transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-foreground/60 leading-relaxed mb-5">
              Verified users can host and join parties. Your Aadhaar data is encrypted and never stored.
            </p>
            <div className="mb-5">
              <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Aadhaar Number</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                placeholder="XXXX XXXX XXXX"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                className="w-full px-4 py-3 rounded-lg bg-foreground/5 border border-border text-sm text-foreground focus:outline-none focus:border-[var(--brand-1)] transition-all placeholder-foreground/30 tracking-widest"
              />
            </div>
            <button
              onClick={() => setStep("otp")}
              disabled={aadhaar.length !== 12}
              className="w-full py-3.5 rounded-lg bg-brand-gradient text-white text-xs font-bold shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              Send OTP <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── FOLLOW GRAPH MODAL ────────────────────────────────────────
interface FollowPerson {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  mutuals?: number;
}

interface FollowGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "followers" | "following";
  list: FollowPerson[];
}

export function FollowGraphModal({ isOpen, onClose, type, list }: FollowGraphModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [followedIds, setFollowedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const filtered = list.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.username.toLowerCase().includes(query.toLowerCase())
  );

  const toggleFollow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    try {
      await userApi.toggleFollow(id);
    } catch (err) {
      console.error("Failed to toggle follow in modal:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-lg liquid-glass liquid-edge border border-border p-5 shadow-card animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--brand-2)]" />
            {type === "followers" ? "Followers" : "Following"}
            <span className="text-xs font-bold text-foreground/40 normal-case tracking-normal">({list.length})</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-foreground/10 text-foreground/50 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <input
            type="text"
            placeholder="Search people..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-foreground/5 border border-border text-sm text-foreground focus:outline-none focus:border-[var(--brand-2)] transition-all placeholder-foreground/30"
          />
        </div>

        {/* List */}
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-foreground/40">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No results found</p>
            </div>
          ) : (
            filtered.map((p) => {
              const isFollowing = followedIds.includes(p.id);
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-foreground/5 transition-all cursor-pointer" onClick={() => { onClose(); router.push(`/user?id=${p.id}`); }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-brand-gradient flex items-center justify-center font-bold text-sm border border-border shrink-0 text-white overflow-hidden">
                      {fixAvatarUrl(p.avatar) ? (
                        <img src={fixAvatarUrl(p.avatar)!} alt={p.name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        p.name[0]
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate">{p.name}</h4>
                      <p className="text-[10px] text-foreground/40 truncate">@{p.username}{p.mutuals ? ` • ${p.mutuals} mutuals` : ""}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => toggleFollow(p.id, e)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                      isFollowing
                        ? "bg-foreground/10 text-foreground border border-border"
                        : "bg-brand-gradient text-white shadow-glow hover:scale-[1.03]"
                    }`}
                  >
                    {isFollowing ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DISCOVER PROFILE MODAL ────────────────────────────────────
interface DiscoverProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: FollowPerson & { bio?: string; vibes?: number; followers?: number };
}

export function DiscoverProfileModal({ isOpen, onClose, person }: DiscoverProfileModalProps) {
  const [following, setFollowing] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-lg liquid-glass liquid-edge border border-border p-5 shadow-card animate-in zoom-in-95 duration-200 text-center">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-foreground/10 text-foreground/50 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-20 w-20 mx-auto rounded-full bg-brand-gradient flex items-center justify-center font-bold text-2xl border-2 border-border mb-3 text-white shadow-glow overflow-hidden">
          {person.avatar ? (
            <img src={person.avatar} alt={person.name} className="h-full w-full object-cover" />
          ) : (
            person.name[0]
          )}
        </div>
        <h3 className="text-base font-bold text-foreground">{person.name}</h3>
        <p className="text-xs text-foreground/40 mb-2">@{person.username}</p>
        {person.bio && <p className="text-xs text-foreground/60 px-4 leading-relaxed mb-4">{person.bio}</p>}
        <div className="flex justify-center gap-6 border-y border-border py-3 mb-4">
          {[
            { label: "Vibes", value: person.vibes ?? 0 },
            { label: "Followers", value: person.followers ?? 0 },
            { label: "Mutuals", value: person.mutuals ?? 0 },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xs text-foreground/40 uppercase font-semibold">{s.label}</p>
              <p className="text-sm font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
        <button
          onClick={async () => {
            setFollowing(!following);
            try { await userApi.toggleFollow(person.id); } catch (e) { console.error(e); }
          }}
          className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all ${
            following
              ? "bg-foreground/10 border border-border text-foreground"
              : "bg-brand-gradient text-white shadow-glow hover:scale-[1.02]"
          }`}
        >
          {following ? "Following ✓" : "Follow"}
        </button>
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS MODAL ───────────────────────────────────────
interface NotifItem {
  id: number;
  type: "follow_request" | "like" | "event";
  text: string;
  time: string;
  action?: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileNotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [items, setItems] = useState<NotifItem[]>([
    { id: 1, type: "follow_request", text: "Aria Roy requested to follow you", time: "2m ago", action: true },
    { id: 2, type: "follow_request", text: "Rohan Gupta requested to follow you", time: "10m ago", action: true },
    { id: 3, type: "like", text: "Sarah Connor liked your vibe", time: "1h ago" },
    { id: 4, type: "event", text: "Your booked event starts in 2 hours!", time: "2h ago" },
  ]);

  const dismiss = (id: number) => setItems((prev) => prev.filter((n) => n.id !== id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md rounded-lg liquid-glass liquid-edge border border-border p-5 shadow-card max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-[var(--brand-1)]" />
            Notifications
            {items.length > 0 && (
              <span className="h-5 w-5 rounded-full bg-brand-gradient text-white text-[9px] font-black flex items-center justify-center shadow-glow">
                {items.length}
              </span>
            )}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-foreground/10 text-foreground/50 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {items.length === 0 ? (
            <div className="text-center py-10 text-foreground/40">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">All caught up! No new notifications.</p>
            </div>
          ) : (
            items.map((n) => (
              <div key={n.id} className="p-3 rounded-lg bg-foreground/5 border border-border flex items-start gap-3 justify-between">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    n.type === "follow_request" ? "bg-[var(--brand-2)]/15 text-[var(--brand-2)]" :
                    n.type === "like" ? "bg-[var(--brand-1)]/15 text-[var(--brand-1)]" :
                    "bg-[var(--brand-4)]/15 text-[var(--brand-4)]"
                  }`}>
                    {n.type === "follow_request" && <UserPlus className="h-3.5 w-3.5" />}
                    {n.type === "like" && <Heart className="h-3.5 w-3.5" />}
                    {n.type === "event" && <Bell className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <p className="text-xs text-foreground/90 leading-snug">{n.text}</p>
                    <span className="text-[10px] text-foreground/40 mt-0.5 block">{n.time}</span>
                  </div>
                </div>
                {n.action ? (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => dismiss(n.id)} className="px-2.5 py-1 rounded-lg bg-brand-gradient text-white text-[10px] font-bold shadow-glow hover:scale-[1.02]">
                      Accept
                    </button>
                    <button onClick={() => dismiss(n.id)} className="px-2.5 py-1 rounded-lg bg-foreground/10 text-foreground/70 text-[10px] font-bold hover:bg-foreground/15">
                      Decline
                    </button>
                  </div>
                ) : (
                  <button onClick={() => dismiss(n.id)} className="p-1 rounded-full hover:bg-foreground/10 text-foreground/30 hover:text-foreground/60 shrink-0">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS MODAL ───────────────────────────────────────────
type SettingsTab = "privacy" | "safety" | "social" | "family" | "account";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPrivate: boolean;
  onPrivacyToggle: () => void;
  verified: boolean;
  onOpenVerification: () => void;
}

export function SettingsModal({ isOpen, onClose, isPrivate, onPrivacyToggle, verified, onOpenVerification }: SettingsModalProps) {
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await apiClient.post("/api/home/logout", { actionItem: "Logout" });
    } catch (err) {}
    onClose();
    router.push("/signin");
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>("privacy");
  const [blockedUsers] = useState(["shadow_x", "neon_ghost"]);
  const [restrictedUsers] = useState(["dj_phantom"]);
  const [tagPermission, setTagPermission] = useState<"everyone" | "followers" | "none">("followers");
  const [mentionPermission, setMentionPermission] = useState<"everyone" | "followers" | "none">("everyone");
  const [familyRole, setFamilyRole] = useState<"member" | "parent" | "child" | "admin">("member");

  if (!isOpen) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "privacy", label: "Privacy", icon: <Lock className="h-3.5 w-3.5" /> },
    { id: "safety", label: "Safety", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    { id: "social", label: "Social", icon: <Users className="h-3.5 w-3.5" /> },
    { id: "family", label: "Family", icon: <Crown className="h-3.5 w-3.5" /> },
    { id: "account", label: "Account", icon: <UserCog className="h-3.5 w-3.5" /> },
  ];

  const permOptions: { value: "everyone" | "followers" | "none"; label: string }[] = [
    { value: "everyone", label: "Everyone" },
    { value: "followers", label: "Followers only" },
    { value: "none", label: "No one" },
  ];

  const familyRoles: { value: "member" | "parent" | "child" | "admin"; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "member", label: "Member", icon: <Users className="h-4 w-4" />, desc: "Standard account access" },
    { value: "parent", label: "Parent", icon: <Crown className="h-4 w-4" />, desc: "Supervise child accounts" },
    { value: "child", label: "Child", icon: <Baby className="h-4 w-4" />, desc: "Under parental supervision" },
    { value: "admin", label: "Admin", icon: <UserCog className="h-4 w-4" />, desc: "Full platform management" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md rounded-lg liquid-glass liquid-edge border border-border shadow-card animate-in zoom-in-95 duration-200 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0 shrink-0">
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Settings</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-foreground/10 text-foreground/50 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex gap-1 p-3 overflow-x-auto scrollbar-none shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? "bg-brand-gradient text-white shadow-glow"
                  : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 pt-3 scrollbar-thin">
          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-foreground/5 border border-border">
                <div className="flex items-center gap-2.5">
                  {isPrivate ? <Lock className="h-4 w-4 text-[var(--brand-2)]" /> : <Globe className="h-4 w-4 text-[var(--brand-3)]" />}
                  <div>
                    <p className="text-xs font-bold text-foreground">{isPrivate ? "Private Account" : "Public Account"}</p>
                    <p className="text-[10px] text-foreground/50 mt-0.5">
                      {isPrivate ? "Only approved followers can see your content" : "Anyone can see your posts and vibes"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onPrivacyToggle}
                  className={`relative h-6 w-11 rounded-full transition-all ${isPrivate ? "bg-brand-gradient shadow-glow" : "bg-foreground/20"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isPrivate ? "left-5.5 translate-x-0.5" : "left-0.5"}`} />
                </button>
              </div>
              <div className="p-3.5 rounded-lg bg-foreground/5 border border-border">
                <div className="flex items-center gap-2.5 mb-2">
                  <UserPlus className="h-4 w-4 text-[var(--brand-1)]" />
                  <p className="text-xs font-bold text-foreground">Follow Requests</p>
                </div>
                <p className="text-[10px] text-foreground/50 leading-relaxed">
                  {isPrivate
                    ? "You have 2 pending follow requests. Manage them in Notifications."
                    : "Enable private account to manage follow requests."}
                </p>
              </div>
            </div>
          )}

          {/* Safety Tab */}
          {activeTab === "safety" && (
            <div className="space-y-3">
              {/* Verification Status */}
              <div className={`p-3.5 rounded-lg border ${verified ? "bg-cyan-400/10 border-cyan-400/30" : "bg-red-400/10 border-red-400/30"}`}>
                <div className="flex items-center gap-2.5">
                  {verified ? <ShieldCheck className="h-4 w-4 text-cyan-400" /> : <ShieldAlert className="h-4 w-4 text-red-400" />}
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">{verified ? "Aadhaar Verified" : "Not Verified"}</p>
                    <p className="text-[10px] text-foreground/50 mt-0.5">{verified ? "Your identity has been confirmed." : "Verify to unlock hosting & joining parties."}</p>
                  </div>
                  {!verified && (
                    <button onClick={() => { onOpenVerification(); onClose(); }} className="px-3 py-1.5 rounded-lg bg-brand-gradient text-white text-[10px] font-bold shadow-glow">
                      Verify
                    </button>
                  )}
                </div>
              </div>

              {/* Blocked Users */}
              <div className="p-3.5 rounded-lg bg-foreground/5 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Ban className="h-4 w-4 text-red-400" />
                  <p className="text-xs font-bold text-foreground">Blocked ({blockedUsers.length})</p>
                </div>
                {blockedUsers.map((u) => (
                  <div key={u} className="flex items-center justify-between py-1.5">
                    <p className="text-xs text-foreground/70">@{u}</p>
                    <button className="text-[10px] text-red-400 font-bold hover:underline">Unblock</button>
                  </div>
                ))}
              </div>

              {/* Restricted */}
              <div className="p-3.5 rounded-lg bg-foreground/5 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <EyeOff className="h-4 w-4 text-[var(--brand-4)]" />
                  <p className="text-xs font-bold text-foreground">Restricted ({restrictedUsers.length})</p>
                </div>
                {restrictedUsers.map((u) => (
                  <div key={u} className="flex items-center justify-between py-1.5">
                    <p className="text-xs text-foreground/70">@{u}</p>
                    <button className="text-[10px] text-[var(--brand-4)] font-bold hover:underline">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === "social" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-foreground/5 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-[var(--brand-2)]" />
                  <p className="text-xs font-bold text-foreground">Who can tag me?</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {permOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                      <div
                        onClick={() => setTagPermission(opt.value)}
                        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${tagPermission === opt.value ? "border-[var(--brand-2)] bg-[var(--brand-2)]" : "border-foreground/30"}`}
                      >
                        {tagPermission === opt.value && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <span className="text-xs text-foreground/80">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-foreground/5 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <AtSign className="h-4 w-4 text-[var(--brand-3)]" />
                  <p className="text-xs font-bold text-foreground">Who can mention me?</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {permOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                      <div
                        onClick={() => setMentionPermission(opt.value)}
                        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${mentionPermission === opt.value ? "border-[var(--brand-3)] bg-[var(--brand-3)]" : "border-foreground/30"}`}
                      >
                        {mentionPermission === opt.value && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <span className="text-xs text-foreground/80">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Family Tab */}
          {activeTab === "family" && (
            <div className="space-y-2">
              <p className="text-xs text-foreground/50 mb-3 leading-relaxed">
                Family supervision roles control account access and activity monitoring within your family group.
              </p>
              {familyRoles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setFamilyRole(r.value)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-lg border transition-all text-left ${
                    familyRole === r.value
                      ? "bg-brand-gradient/15 border-[var(--brand-1)]/40 shadow-glow"
                      : "bg-foreground/5 border-border hover:bg-foreground/8"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${familyRole === r.value ? "bg-brand-gradient text-white" : "bg-foreground/10 text-foreground/60"}`}>
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">{r.label}</p>
                    <p className="text-[10px] text-foreground/50 mt-0.5">{r.desc}</p>
                  </div>
                  {familyRole === r.value && <Check className="h-4 w-4 text-[var(--brand-1)] shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-foreground/5 border border-border">
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40 mb-3">Account Actions</p>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 py-2.5 text-left text-xs font-semibold text-foreground/80 hover:text-foreground transition-all"
                >
                  <LogOut className="h-4 w-4 text-[var(--brand-3)]" />
                  Sign Out
                </button>
                <div className="h-px bg-border my-1" />
                <button className="w-full flex items-center gap-2.5 py-2.5 text-left text-xs font-semibold text-red-400 hover:text-red-300 transition-all">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </button>
              </div>
              <div className="p-3.5 rounded-lg bg-foreground/5 border border-border">
                <p className="text-[10px] text-foreground/40 leading-relaxed">
                  Deleting your account is permanent and cannot be undone. All your data, vibes, and event bookings will be removed.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MEDIA VIEWER MODAL ────────────────────────────────────────
interface MediaItem {
  id: string;
  type: "photo" | "video" | "event";
  gradient: string;
  caption?: string;
  likes: number;
  comments: number;
}

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MediaItem | null;
}

export function MediaViewerModal({ isOpen, onClose, item }: MediaViewerModalProps) {
  const [liked, setLiked] = useState(false);
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media Area */}
        <div className={`aspect-square relative bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
          <Sparkles className="h-16 w-16 text-white/20 animate-pulse" />
          {item.type === "event" && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[var(--brand-4)] text-black text-[9px] font-black uppercase">
              Event Pass
            </div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Actions */}
        <div className="bg-[#0a0a12] border-t border-border p-4 flex items-center justify-between">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-1.5 text-sm font-bold transition-all ${liked ? "text-[var(--brand-1)]" : "text-foreground/60"}`}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-[var(--brand-1)]" : ""}`} />
            {item.likes + (liked ? 1 : 0)}
          </button>
          {item.caption && <p className="text-xs text-foreground/60 flex-1 mx-3 truncate">{item.caption}</p>}
          <p className="text-xs text-foreground/40 font-semibold">{item.comments} comments</p>
        </div>
      </div>
    </div>
  );
}
