"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { GhostBtn, PrimaryBtn } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

export default function OtpStep({ mobile, onVerified, onBack }: { mobile: string; onVerified: (result: Record<string, unknown>) => void; onBack: () => void }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) { setError("Enter a valid 6-digit OTP."); return; }
    setError(""); setLoading(true);
    try {
      const result = await apiClient.post<any, any>("/api/auth", { actionItem: "VerifyMobileOtp", mobile, otp });
      setSuccess("Mobile verified!");
      onVerified(result);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function handleResend() {
    setResending(true); setError(""); setSuccess("");
    try {
      await apiClient.post("/api/auth", { actionItem: "ResendMobileOtp", mobile });
      setSuccess(`OTP resent to ${mobile}.`);
    } catch (err) { setError((err as Error).message); }
    finally { setResending(false); }
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-5">
      <p className="text-[14px] text-white/50">OTP sent to <span className="text-white font-medium">{mobile}</span></p>
      <Field label="OTP Code" error={error}>
        {/* 6-box OTP feel */}
        <Input
          type="text" inputMode="numeric" placeholder="Enter OTP"
          maxLength={6} value={otp}
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
          className=" text-center text-[20px] font-bold"
        />
      </Field>
      {success && <Toast msg={success} type="success" />}
      <PrimaryBtn type="submit" loading={loading}>Verify OTP →</PrimaryBtn>
      <div className="flex gap-3">
        <GhostBtn type="button" onClick={handleResend} disabled={resending}>{resending ? "Resending..." : "Resend OTP"}</GhostBtn>
        <GhostBtn type="button" onClick={onBack}>← Back</GhostBtn>
      </div>
    </form>
  );
}