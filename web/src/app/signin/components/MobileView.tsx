"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PrimaryBtn } from "@/components/ui/button";

export default function MobileStep({ onOtpSent }: { onOtpSent: (mobile: string) => void }) {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = mobile.replace(/\D/g, "");
    if (!/^\d{10}$/.test(cleaned)) { setError("Enter a valid 10-digit mobile number."); return; }
    setError(""); setLoading(true);
    try {
      await apiClient.post("/api/auth", { actionItem: "SendMobileOtp", mobile: cleaned });
      onOtpSent(cleaned);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Mobile Number" error={error}>
        <Input
          type="tel" placeholder="10-digit mobile number"
          value={mobile} onChange={(e) => { setMobile(e.target.value); setError(""); }}
          maxLength={14}
        />
      </Field>
      <PrimaryBtn type="submit" loading={loading}>Send OTP →</PrimaryBtn>
    </form>
  );
}