"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import {
  Camera,
  ChevronLeft,
  ChevronDown,
  Plus,
  Trash2,
  Check
} from "lucide-react";
import { UserProfile } from "@/components/modals/ProfileModals";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Button, PrimaryBtn } from "@/components/ui/button";

export default function EditProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [pronoun, setPronoun] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");

  // Dynamic social links state
  const [socialLinks, setSocialLinks] = useState<{ platform: string, url: string }[]>([]);

  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const MAX_BIO = 150;

  const PLATFORM_OPTIONS = [
    "Instagram",
    "X (Twitter)",
    "Facebook",
    "TikTok",
    "YouTube",
    "Website",
    "Other"
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data: any = await apiClient.get("/api/profile/me");
        if (data && data.success && data.profile) {
          initForm(data.profile);
        } else if (data && data.data) {
          initForm(data.data);
        }
      } catch (err: any) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const initForm = (data: UserProfile) => {
    setName(data.name || "");
    setUsername(data.username || "");
    setBio(data.bio || "");
    setPronoun(data.pronoun || "");
    setDob(data.dob || "");
    setGender(data.gender || "");
    setPreviewAvatar(data.avatar || null);

    // Convert existing socialLinks object to array for dynamic UI
    if (data.socialLinks && typeof data.socialLinks === 'object' && !Array.isArray(data.socialLinks)) {
      const mappedLinks = Object.entries(data.socialLinks).map(([k, v]) => {
        // map keys back to readable dropdown options if possible
        let platform = "Other";
        if (k.toLowerCase() === 'x') platform = "X (Twitter)";
        if (k.toLowerCase() === 'instagram') platform = "Instagram";
        if (k.toLowerCase() === 'facebook') platform = "Facebook";
        if (k.toLowerCase() === 'tiktok') platform = "TikTok";
        return { platform, url: v as string };
      });
      setSocialLinks(mappedLinks);
    } else if (Array.isArray(data.socialLinks)) {
      setSocialLinks(data.socialLinks);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddLink = () => {
    setSocialLinks([...socialLinks, { platform: "Instagram", url: "" }]);
  };

  const handleUpdateLink = (index: number, key: "platform" | "url", value: string) => {
    const newLinks = [...socialLinks];
    newLinks[index][key] = value;
    setSocialLinks(newLinks);
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = [...socialLinks];
    newLinks.splice(index, 1);
    setSocialLinks(newLinks);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert array back to object if backend expects it
      const socialLinksObj: Record<string, string> = {};
      socialLinks.forEach(link => {
        if (link.url.trim()) {
          let key = link.platform.toLowerCase();
          if (key === "x (twitter)") key = "x";
          socialLinksObj[key] = link.url.trim();
        }
      });

      const updates = {
        name,
        username,
        bio,
        avatar: previewAvatar,
        pronoun,
        dob,
        gender,
        socialLinks: socialLinksObj
      };

      // await apiClient.put("/api/profile/me", updates); // In real app

      // Go back to profile page
      router.push("/profile");
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 min-w-0 flex flex-col gap-0 mx-auto w-full items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-24 w-24 bg-foreground/10 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-foreground/10 rounded mb-2"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col gap-0 mx-auto w-full">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-black uppercase tracking-wide">Edit Profile</h1>
        </div>
        <PrimaryBtn
          onClick={handleSave}
          loading={saving}
          loadingText="Saving..."
          className="w-auto py-2 px-6 text-sm h-auto !rounded-full"
        >
          <span className="flex items-center gap-2">
            {!saving && <Check className="h-4 w-4" />} Save
          </span>
        </PrimaryBtn>
      </div>

      <div className="p-6 space-y-8 animate-in fade-in duration-300">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-background bg-brand-gradient flex items-center justify-center shadow-glow">
              {previewAvatar ? (
                <img src={previewAvatar} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-white">{name?.[0] || "?"}</span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <Button
            variant="link"
            onClick={() => fileRef.current?.click()}
            className="mt-3 text-sm font-bold"
          >
            Change Photo
          </Button>
        </div>

        <div className="space-y-5">
          {/* Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Name">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Username">
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Field>
          </div>

          {/* Bio */}
          <Field label="Bio">
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
              rows={3}
              placeholder="Write something about yourself..."
            />
            <p className={`text-[10px] text-right font-semibold ${bio.length >= MAX_BIO ? "text-red-400" : "text-foreground/40"}`}>
              {bio.length}/{MAX_BIO}
            </p>
          </Field>

          {/* Optional Fields Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Field label="Pronoun">
              <Input
                type="text"
                value={pronoun}
                onChange={(e) => setPronoun(e.target.value)}
                placeholder="e.g. they/them"
              />
            </Field>
            <Field label="Date of Birth">
              <Input
                type="date"
                value={dob}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split("T")[0]}
                onChange={(e) => setDob(e.target.value)}
                className="[color-scheme:dark]"
              />
            </Field>
            <Field label="Gender">
              <div className="relative">
                <Select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="" className="bg-[#0a0a0a] text-white">Select...</option>
                  <option value="male" className="bg-[#0a0a0a] text-white">Male</option>
                  <option value="female" className="bg-[#0a0a0a] text-white">Female</option>
                  <option value="non-binary" className="bg-[#0a0a0a] text-white">Non-binary</option>
                  <option value="prefer-not-to-say" className="bg-[#0a0a0a] text-white">Prefer not to say</option>
                </Select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
              </div>
            </Field>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[13px] font-medium text-white/60 uppercase tracking-widest">Social Links</label>
              <Button
                variant="link"
                size="sm"
                onClick={handleAddLink}
                className="flex items-center gap-1 text-xs font-bold px-0"
              >
                <Plus className="h-3 w-3" /> Add Link
              </Button>
            </div>

            {socialLinks.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-border rounded-lg text-foreground/50 text-sm">
                No social links added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {socialLinks.map((link, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="relative w-1/3">
                      <Select
                        value={link.platform}
                        onChange={(e) => handleUpdateLink(idx, "platform", e.target.value)}
                      >
                        {PLATFORM_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-[#0a0a0a] text-white">{opt}</option>)}
                      </Select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="url"
                        value={link.url}
                        onChange={(e) => handleUpdateLink(idx, "url", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLink(idx)}
                      className="p-4 mt-1 h-auto w-auto text-[#FF4FD8]/70 hover:bg-[#FF4FD8]/10 hover:text-[#FF4FD8] rounded-xl transition-colors shrink-0 liquid-glass liquid-edge"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
