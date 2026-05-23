"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PrimaryBtn, GhostBtn } from "@/components/ui/button";

export default function PasswordStep({ onSuccess, onBack }: { onSuccess: (result: Record<string, unknown>) => void; onBack: () => void }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewUser, setShowNewUser] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier || !password) { setError("Please enter username and password."); return; }
    setError(""); setShowNewUser(false); setLoading(true);
    try {
      const result = await apiClient.post<any, any>("/api/auth", { actionItem: "LoginWithPassword", identifier, password });
      onSuccess(result);
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      if (msg.toLowerCase().includes("invalid")) setShowNewUser(true);
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Username or Email" error="">
        <Input type="text" placeholder="Enter username or email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
      </Field>
      <Field label="Password" error={error}>
        <div className="relative">
          <Input type={showPw ? "text" : "password"} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-12" />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition text-[13px]">
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
      </Field>
      <a href="/forgot-password" className="text-[13px] text-[#72B7FF] hover:text-white transition -mt-2 self-start">Forgot password?</a>
      {showNewUser && (
        <button type="button" onClick={onBack} className="text-[13px] text-[#FF4FD8] hover:underline -mt-2 self-start">
          New here? Sign in with mobile number instead →
        </button>
      )}
      <PrimaryBtn type="submit" loading={loading}>Sign In →</PrimaryBtn>
      <GhostBtn type="button" onClick={onBack}>← Sign in with Mobile</GhostBtn>
    </form>
  );
}