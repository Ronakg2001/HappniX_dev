"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import {
  ArrowLeft,
  Lock,
  Globe,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Ban,
  EyeOff,
  Tag,
  AtSign,
  Crown,
  Baby,
  UserCog,
  Users,
  LogOut,
  Trash2,
  Check,
  ChevronRight,
  Bell,
  Smartphone,
  Moon,
  HelpCircle,
  FileText,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────
type Section =
  | "privacy"
  | "safety"
  | "social"
  | "family"
  | "notifications"
  | "appearance"
  | "account";

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

// ─── SETTING ROW ──────────────────────────────────────────────
function SettingRow({ icon, label, description, right, onClick, danger }: SettingRowProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${
        onClick ? "cursor-pointer hover:bg-foreground/5 active:bg-foreground/8" : ""
      } ${danger ? "hover:bg-red-400/5" : ""}`}
    >
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
        danger ? "bg-red-400/10 text-red-400" : "bg-foreground/8 text-foreground/60"
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? "text-red-400" : "text-foreground"}`}>{label}</p>
        {description && (
          <p className="text-[11px] text-foreground/45 mt-0.5 leading-snug">{description}</p>
        )}
      </div>
      {right ?? (onClick ? <ChevronRight className="h-4 w-4 text-foreground/30 shrink-0" /> : null)}
    </div>
  );
}


// ─── TOGGLE ───────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-all shrink-0 ${
        checked ? "bg-brand-gradient shadow-glow" : "bg-foreground/20"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="liquid-glass liquid-edge rounded-lg overflow-hidden">
      <div className="px-4 pt-4 pb-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{title}</p>
      </div>
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
}

// ─── RADIO GROUP ──────────────────────────────────────────────
function RadioGroup({
  options,
  value,
  onChange,
  color = "var(--brand-2)",
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 pb-3 pt-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="flex items-center gap-2.5 py-1.5"
        >
          <div
            className="h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
            style={{
              borderColor: value === opt.value ? color : "rgba(255,255,255,0.25)",
              backgroundColor: value === opt.value ? color : "transparent",
            }}
          >
            {value === opt.value && <Check className="h-2.5 w-2.5 text-white" />}
          </div>
          <span className="text-sm text-foreground/80">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

function UserList({ users, label, actionLabel, actionColor, onAction }: {
  users: string[];
  label: string;
  actionLabel: string;
  actionColor: string;
  onAction?: (username: string) => void;
}) {
  if (users.length === 0) {
    return (
      <p className="px-4 pb-3 text-xs text-foreground/35">No {label.toLowerCase()} users.</p>
    );
  }
  return (
    <div className="px-4 pb-3 flex flex-col gap-1">
      {users.map((u) => (
        <div key={u} className="flex items-center justify-between py-1">
          <p className="text-sm text-foreground/70">@{u}</p>
          <button onClick={() => onAction && onAction(u)} className="text-xs font-bold hover:underline cursor-pointer" style={{ color: actionColor }}>
            {actionLabel}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN SETTINGS PAGE ────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/home/logout", { actionItem: "Logout" });
    } catch (err) {}
    router.push("/signin");
  };

  // Privacy
  const [isPrivate, setIsPrivate] = useState(false);

  // Safety
  const [verified] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState(["shadow_x", "neon_ghost"]);
  const [restrictedUsers, setRestrictedUsers] = useState(["dj_phantom"]);

  // Social
  const [tagPermission, setTagPermission] = useState("followers");
  const [mentionPermission, setMentionPermission] = useState("everyone");

  // Family
  const [familyRole, setFamilyRole] = useState("member");

  // Notifications
  const [pushNotifs, setPushNotifs] = useState(true);
  const [followNotifs, setFollowNotifs] = useState(true);
  const [eventNotifs, setEventNotifs] = useState(true);
  const [messageNotifs, setMessageNotifs] = useState(false);

  // Appearance
  const [darkMode, setDarkMode] = useState(true);

  const permOptions = [
    { value: "everyone", label: "Everyone" },
    { value: "followers", label: "Followers only" },
    { value: "none", label: "No one" },
  ];

  const familyRoles = [
    { value: "member", label: "Member" },
    { value: "parent", label: "Parent" },
    { value: "child", label: "Child" },
    { value: "admin", label: "Admin" },
  ];

  return (
    <div className="flex-1 min-w-0 mx-auto w-full">
      {/* ── Page Header ────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/profile"
          className="p-2 rounded-lg bg-foreground/5 border border-border text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-foreground">Settings</h1>
          <p className="text-xs text-foreground/40 mt-0.5">Manage your account preferences</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">

        {/* ── PRIVACY ──────────────────────────────────── */}
        <SectionCard title="Privacy">
          <SettingRow
            icon={isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            label={isPrivate ? "Private Account" : "Public Account"}
            description={
              isPrivate
                ? "Only approved followers can see your content"
                : "Anyone can discover and view your profile"
            }
            right={<Toggle checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} />}
          />
          <SettingRow
            icon={<UserPlus className="h-4 w-4" />}
            label="Follow Requests"
            description={
              isPrivate
                ? "2 pending requests — review them in Notifications"
                : "Enable private account to manage requests"
            }
          />
        </SectionCard>

        {/* ── SAFETY ───────────────────────────────────── */}
        <SectionCard title="Safety & Verification">
          {/* Verification status */}
          <div className={`mx-4 my-3 p-3.5 rounded-lg border flex items-center gap-3 ${
            verified ? "bg-cyan-400/10 border-cyan-400/30" : "bg-red-400/10 border-red-400/30"
          }`}>
            {verified
              ? <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0" />
              : <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
            }
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">
                {verified ? "Aadhaar Verified" : "Identity Not Verified"}
              </p>
              <p className="text-[11px] text-foreground/50 mt-0.5">
                {verified
                  ? "Your identity is confirmed. Cyan badge is active."
                  : "Verify your Aadhaar to host and join parties."}
              </p>
            </div>
            {!verified && (
              <Link
                href="/profile"
                className="px-3 py-1.5 rounded-lg bg-brand-gradient text-white text-[11px] font-bold shadow-glow shrink-0"
              >
                Verify
              </Link>
            )}
          </div>

          {/* Blocked */}
          <div>
            <div className="flex items-center gap-3 px-4 py-3 border-t border-border/50">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-red-400/10 text-red-400 shrink-0">
                <Ban className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Blocked Users</p>
                <p className="text-[11px] text-foreground/45">{blockedUsers.length} blocked</p>
              </div>
            </div>
            <UserList 
              users={blockedUsers} 
              label="Blocked" 
              actionLabel="Unblock" 
              actionColor="#f87171" 
              onAction={(u) => {
                setBlockedUsers(blockedUsers.filter(x => x !== u));
                alert(`@${u} has been unblocked.`);
              }}
            />
          </div>

          {/* Restricted */}
          <div className="border-t border-border/50">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[var(--brand-4)]/10 text-[var(--brand-4)] shrink-0">
                <EyeOff className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Restricted Users</p>
                <p className="text-[11px] text-foreground/45">{restrictedUsers.length} restricted</p>
              </div>
            </div>
            <UserList 
              users={restrictedUsers} 
              label="Restricted" 
              actionLabel="Remove" 
              actionColor="var(--brand-4)" 
              onAction={(u) => {
                setRestrictedUsers(restrictedUsers.filter(x => x !== u));
                alert(`Restrictions removed for @${u}.`);
              }}
            />
          </div>
        </SectionCard>

        {/* ── SOCIAL PERMISSIONS ───────────────────────── */}
        <SectionCard title="Social Permissions">
          <div>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-foreground/8 text-foreground/60 shrink-0">
                <Tag className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-foreground">Who can tag me?</p>
            </div>
            <RadioGroup
              options={permOptions}
              value={tagPermission}
              onChange={setTagPermission}
              color="var(--brand-2)"
            />
          </div>
          <div className="border-t border-border/50">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-foreground/8 text-foreground/60 shrink-0">
                <AtSign className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-foreground">Who can mention me?</p>
            </div>
            <RadioGroup
              options={permOptions}
              value={mentionPermission}
              onChange={setMentionPermission}
              color="var(--brand-3)"
            />
          </div>
        </SectionCard>

        {/* ── FAMILY SUPERVISION ───────────────────────── */}
        <SectionCard title="Family & Roles">
          <div className="px-4 pt-2 pb-1">
            <p className="text-[11px] text-foreground/45 leading-relaxed mb-3">
              Family roles control supervision permissions and activity visibility within your family group.
            </p>
          </div>
          {familyRoles.map((r, i) => {
            const icons: Record<string, React.ReactNode> = {
              member: <Users className="h-4 w-4" />,
              parent: <Crown className="h-4 w-4" />,
              child: <Baby className="h-4 w-4" />,
              admin: <UserCog className="h-4 w-4" />,
            };
            const descs: Record<string, string> = {
              member: "Standard account access",
              parent: "Supervise child accounts",
              child: "Under parental supervision",
              admin: "Full platform management",
            };
            const isSelected = familyRole === r.value;
            return (
              <div key={r.value} className={i > 0 ? "border-t border-border/50" : ""}>
                <button
                  onClick={() => setFamilyRole(r.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${
                    isSelected ? "bg-foreground/5" : "hover:bg-foreground/5"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    isSelected ? "bg-brand-gradient text-white" : "bg-foreground/8 text-foreground/50"
                  }`}>
                    {icons[r.value]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{r.label}</p>
                    <p className="text-[11px] text-foreground/45 mt-0.5">{descs[r.value]}</p>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-[var(--brand-1)] shrink-0" />}
                </button>
              </div>
            );
          })}
        </SectionCard>

        {/* ── NOTIFICATIONS ────────────────────────────── */}
        <SectionCard title="Notifications">
          <SettingRow
            icon={<Bell className="h-4 w-4" />}
            label="Push Notifications"
            description="Receive alerts for activity on your account"
            right={<Toggle checked={pushNotifs} onChange={() => setPushNotifs(!pushNotifs)} />}
          />
          <SettingRow
            icon={<UserPlus className="h-4 w-4" />}
            label="Follow Requests"
            description="New followers and follow request activity"
            right={<Toggle checked={followNotifs} onChange={() => setFollowNotifs(!followNotifs)} />}
          />
          <SettingRow
            icon={<Crown className="h-4 w-4" />}
            label="Event Alerts"
            description="Ticket confirmations and event reminders"
            right={<Toggle checked={eventNotifs} onChange={() => setEventNotifs(!eventNotifs)} />}
          />
          <SettingRow
            icon={<AtSign className="h-4 w-4" />}
            label="Messages"
            description="New message notifications"
            right={<Toggle checked={messageNotifs} onChange={() => setMessageNotifs(!messageNotifs)} />}
          />
        </SectionCard>

        {/* ── APPEARANCE ───────────────────────────────── */}
        <SectionCard title="Appearance">
          <SettingRow
            icon={<Moon className="h-4 w-4" />}
            label="Dark Mode"
            description="Use dark theme across the app"
            right={<Toggle checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
          />
        </SectionCard>

        {/* ── SUPPORT ──────────────────────────────────── */}
        <SectionCard title="Support">
          <SettingRow
            icon={<HelpCircle className="h-4 w-4" />}
            label="Help & Support"
            description="FAQs, contact us, and troubleshooting"
            onClick={() => alert("Help Ticket Created! Support will contact you shortly.")}
          />
          <SettingRow
            icon={<FileText className="h-4 w-4" />}
            label="Privacy Policy"
            description="How we handle your data"
            onClick={() => alert("HappniX Privacy Policy is versioned under standard PWA safety guidelines. (V1.0.0)")}
          />
          <SettingRow
            icon={<Smartphone className="h-4 w-4" />}
            label="App Version"
            description="Happnix v1.0.0 (Build 42)"
          />
        </SectionCard>

        {/* ── ACCOUNT ACTIONS ──────────────────────────── */}
        <SectionCard title="Account">
          <SettingRow
            icon={<LogOut className="h-4 w-4" />}
            label="Sign Out"
            description="Log out of this device"
            onClick={handleLogout}
            danger
          />
          <SettingRow
            icon={<Trash2 className="h-4 w-4" />}
            label="Delete Account"
            description="Permanently remove your account and all data"
            onClick={async () => {
              if (confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
                try {
                  await apiClient.post("/api/profile/me", { actionItem: "deleteAccount" });
                  localStorage.clear();
                  alert("Account deleted successfully.");
                  router.push("/signup");
                } catch (err) {
                  alert("Failed to delete account. Please try again.");
                }
              }
            }}
            danger
          />
        </SectionCard>

        <p className="text-center text-[10px] text-foreground/25 pb-4">
          Happnix · Jaipur, India · 2025
        </p>
      </div>
    </div>
  );
}

/* 

# 5. Privacy System
Advanced account privacy management.

## Features
Users can switch between:
* Public account
* Private account

### Follow Request Approval
For private accounts:
* Users must request access
* Requests can be approved/rejected

---

# 8. People Management System
A built-in moderation/social management layer.
## Includes
### Search People

Users can:
* Search usernames
* Search display names

### Saved Profiles
Bookmark or save accounts.

### Blocked Accounts
Users can:
* Block unsafe people

### Restricted Accounts
Soft restrictions without full blocking. */
