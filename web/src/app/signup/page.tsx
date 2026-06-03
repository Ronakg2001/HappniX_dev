"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuroraBackground from "@/components/landing/AuroraBackground";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Toast } from "@/components/ui/toast";
import { PrimaryBtn } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { strongPassword } from "@/constants/regex";
import Image from "next/image";

function isStrongPassword(v: string) {
  return strongPassword.test(v);
}

export default function SignupDetailsPage() {

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden bg-black font-sans text-white">
      <BrandSection />
      <SignUpCard />
    </div>
  );
}

const BrandSection = () => {
  return (
    <div className="hidden lg:flex flex-col justify-between w-[50%] p-16 relative overflow-hidden bg-[#050505] border-r border-white/5 select-none">
      <AuroraBackground />

      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-[30%] left-0 h-[1px] w-[55%] bg-gradient-to-r from-transparent via-[#FF4FD8]/20 to-transparent -rotate-[12deg] animate-light-beam"
          style={{ animation: "light-beam 12s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          <a href="/signin">
            <Image
              src="https://pub-4c14689c2e3349dd83f26b79045c7c84.r2.dev/Happnix.PNG"
              alt="Happnix Logo"
              width={400}
              height={100}
              className="w-[140px] h-auto object-contain"
              priority
            />
          </a>
        </div>

        <div className="max-w-[460px] my-auto">
          <h1 className="text-[44px] font-extrabold leading-[1.1] text-white">
            Discover, Host & <br />
            <span className="text-brand-gradient text-shadow-glow">Celebrate Together</span>
          </h1>
          <p className="text-[16px] text-white/50 mt-6 leading-relaxed">
            Happnix brings people together through real-world experiences. Explore local meetups, host your own parties, invite friends, and coordinate group bookings effortlessly.
          </p>

          <div className="flex flex-col gap-4 mt-8">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#FF4FD8] shadow-glow animate-pulse" />
              <span className="text-[14px] text-white/70">Explore Local Events & Gigs</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#72B7FF] shadow-glow animate-pulse" />
              <span className="text-[14px] text-white/70">Host Parties & Manage Guest Lists</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#C96CFF] shadow-glow animate-pulse" />
              <span className="text-[14px] text-white/70">Group Bookings & Real-time Chats</span>
            </div>
          </div>
        </div>

        <div className="text-[13px] text-white/30">
          © 2026 Happnix. All rights reserved.
        </div>
      </div>
    </div>
  )
}

const SignUpCard = () => {

  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    gender: "",
    dob: "",
    email: "",
  });
  const [mobile, setMobile] = useState("");
  const [region, setRegion] = useState("");
  const [dialCode, setDialCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"checking" | "available" | string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Load mobile & region from sessionStorage (set by signin flow) ─────────
  useEffect(() => {
    const m = sessionStorage.getItem('signup_mobile') ?? "";
    const r = sessionStorage.getItem('signup_region') ?? "";
    const d = sessionStorage.getItem('signup_dialCode') ?? "";
    setMobile(m);
    setRegion(r);
    setDialCode(d);
  }, []);

  useEffect(() => {
    const cleaned = form.username.trim();
    if (!cleaned) {
      setUsernameStatus("");
      return;
    }
    if (cleaned.length < 1) {
      setUsernameStatus("Too short (min 1 chars)");
      return;
    }
    if (cleaned.length > 30) {
      setUsernameStatus("Too long (max 30 chars)");
      return;
    }
    if (!/^(?!.*\.\.)(?!^\.)(?!.*\.$)[a-zA-Z0-9_.]{1,30}$/.test(cleaned)) {
      setUsernameStatus("Invalid characters or format");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const result = await apiClient.post<any, any>("/api/auth", { actionItem: "CheckUsername", username: cleaned });
        if ((result as { available: boolean }).available) {
          setUsernameStatus("available");
        } else {
          const suggestions = (result as { suggestions?: string[] }).suggestions ?? [];
          setUsernameStatus(`taken`);
        }
      } catch (err) {
        setUsernameStatus((err as Error).message ?? "Taken or unavailable");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [form.username]);


  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fullName.trim()) { setError("Full name is required."); return; }
    if (!form.username.trim()) { setError("Username is required."); return; }
    if (usernameStatus !== "available") { setError("Please choose an available username."); return; }
    if (!form.dob) { setError("Date of birth is required."); return; }
    const dobDate = new Date(form.dob);
    const today = new Date();
    if (isNaN(dobDate.getTime()) || dobDate >= today) { setError("Please enter a valid date of birth."); return; }
    const ageDiff = today.getFullYear() - dobDate.getFullYear();
    const beforeBirthday = today < new Date(today.getFullYear(), dobDate.getMonth(), dobDate.getDate());
    if (ageDiff < 13 || (ageDiff === 13 && beforeBirthday)) { setError("You must be at least 13 years old."); return; }
    if (!form.gender) { setError("Please select your gender."); return; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Enter a valid email address."); return;
    }
    if (!isStrongPassword(form.password)) {
      setError("Password needs 8+ chars with uppercase, lowercase, number, and special character.");
      return;
    }

    const computedDob = form.dob;

    setLoading(true);
    try {
      const result = await apiClient.post<any, any>("/api/auth", {
        actionItem: "RegisterUserDetails",
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        password: form.password,
        gender: form.gender,
        dateOfBirth: computedDob,
        email: form.email.trim(),
        mobile: mobile,
        region: region,
      });
      // Clean up sessionStorage after successful signup
      sessionStorage.removeItem('signup_mobile');
      sessionStorage.removeItem('signup_region');
      sessionStorage.removeItem('signup_dialCode');
      setSuccess((result.message ?? "Registration successful!") as string);
      setTimeout(() => {
        router.push("/home");
      }, 600);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center p-6 bg-black relative">
      <div className="absolute inset-0 block lg:hidden">
        <AuroraBackground />
      </div>

      <div className="absolute top-8 left-1/2 -translate-x-1/2 lg:hidden z-10">
        <span className="text-brand-gradient text-shadow-glow text-[26px] font-extrabold">Happnix</span>
      </div>

      <div className="relative z-10 w-full max-w-[480px] liquid-glass liquid-edge rounded-[28px] p-8 overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-[40%] bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -skew-x-12 pointer-events-none"
          style={{ animation: "shimmer 6s ease-in-out infinite" }} />

        <div className="mb-7">
          <h2 className="text-[24px] font-extrabold text-white leading-tight">Create Your Account</h2>
          <p className="text-[14px] text-white/45 mt-1">Enter your details to register.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* ── Read-only: mobile + region from signin flow ─────────────── */}
          {mobile && (
            <div className="flex gap-3">
              <div className="flex-none">
                <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">Region</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 text-[14px] select-none cursor-not-allowed">
                  <span className="text-[16px]">{dialCode}</span>
                  <span className="text-white/30">·</span>
                  <span>{region}</span>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">Mobile Number</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 text-[14px] select-none cursor-not-allowed">
                  <span>🔒</span>
                  <span>{mobile}</span>
                </div>
              </div>
            </div>
          )}

          <Field label="Username">
            <div className="relative">
              <Input
                type="text"
                placeholder="Choose a username"
                value={form.username}
                onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
                className="pr-20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-wider">
                {usernameStatus === "checking" && <span className="text-white/40">Checking...</span>}
                {usernameStatus === "available" && <span className="text-[#28c840]">✓ OK</span>}
                {usernameStatus !== "checking" && usernameStatus !== "available" && usernameStatus && (
                  <span className="text-[#FF4FD8]">✗ Taken</span>
                )}
              </span>
            </div>
          </Field>

          <Field label="Full Name">
            <Input
              type="text"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date of Birth">
              <Input
                type="date"
                value={form.dob}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split("T")[0]}
                onChange={(e) => set("dob", e.target.value)}
                className="[color-scheme:dark]"
              />
            </Field>

            <Field label="Gender">
              <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="" className="bg-[#0a0a0a]">Select</option>
                <option value="Male" className="bg-[#0a0a0a]">Male</option>
                <option value="Female" className="bg-[#0a0a0a]">Female</option>
                <option value="Other" className="bg-[#0a0a0a]">Other</option>
              </Select>
            </Field>
          </div>

          <Field label="Email Address">
            <Input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>

          <Field label="Password" hint="Min. 8 chars (uppercase, lowercase, number, symbol)">
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                placeholder="Create password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className="pr-14"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-white/40 hover:text-white/80 transition"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </Field>

          <Toast msg={error} type="error" />
          <Toast msg={success} type="success" />

          <PrimaryBtn type="submit" loading={loading} loadingText="Registering..." className="mt-2">
            Create Account →
          </PrimaryBtn>
        </form>
      </div>
    </div>
  )
}
