"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PrimaryBtn } from "@/components/ui/button";
import CountryCodeDropdown, { type CountryInfo } from "./CountryCodeDropdown";

// ─── Default country (India) ────────────────────────────────────────────────
const INDIA_DEFAULT: CountryInfo = {
  name: "India",
  region_code: "IN",
  dial_code: "+91",
  mobile_number_pattern: "^[6-9]\\d{9}$",
  region_flag: "🇮🇳",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert the backend countries dict to a typed array. */
function parseCountries(raw: Record<string, unknown>): CountryInfo[] {
  return Object.entries(raw).map(([name, v]) => {
    const val = v as Record<string, string>;
    return {
      name,
      region_code: val.region_code ?? "",
      dial_code: val.dial_code ?? "",
      mobile_number_pattern: val.mobile_number_pattern ?? "",
      region_flag: val.region_flag ?? "🌐",
    };
  });
}

/** Validate the local phone number (without dial code) against the country pattern. */
function validateNumber(localNumber: string, pattern: string): boolean {
  if (!localNumber) return false;
  try {
    return new RegExp(pattern).test(localNumber);
  } catch {
    return false;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  /** Called with the full E.164 number once OTP is sent (e.g. "+919876543210"). */
  onOtpSent: (mobile: string) => void;
}

export default function MobileStep({ onOtpSent }: Props) {
  const [countries, setCountries] = useState<CountryInfo[]>([INDIA_DEFAULT]);
  const [selected, setSelected] = useState<CountryInfo>(INDIA_DEFAULT);
  const [localNumber, setLocalNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [error, setError] = useState("");

  // ── Derived state ──────────────────────────────────────────────────────────
  const isValid = validateNumber(localNumber, selected.mobile_number_pattern);
  const isDirty = localNumber.length > 0;
  const fullMobile = `${selected.dial_code}${localNumber}`;

  // ── Fetch country codes on mount ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.post<unknown, { success: boolean; countries: Record<string, unknown> }>(
          "/api/auth",
          { actionItem: "GetCountryCodes" }
        );
        if (!cancelled && res?.countries) {
          const list = parseCountries(res.countries);
          setCountries(list);
          // Keep India as default if it exists in the response
          const india = list.find((c) => c.region_code === "IN");
          if (india) setSelected(india);
        }
      } catch {
        // Non-fatal — stay with the local INDIA_DEFAULT
      } finally {
        if (!cancelled) setLoadingCountries(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleaned = localNumber.replace(/\D/g, "");
    if (!validateNumber(cleaned, selected.mobile_number_pattern)) {
      setError(`Enter a valid mobile number for ${selected.name}.`);
      return;
    }

    setError("");
    setLoading(true);

    try {
      await apiClient.post("/api/auth", {
        actionItem: "SendMobileOtp",
        mobile: fullMobile,   // full E.164: e.g. "+919876543210"
        region: selected.region_code,
      });
      onOtpSent(fullMobile);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Mobile Number" error={error}>
        {/* Row: country-code dropdown + number input */}
        <div className="flex gap-2.5 items-stretch">
          {/* Country dropdown — disabled while loading */}
          <div
            className={`transition-opacity duration-300 ${loadingCountries ? "opacity-40 pointer-events-none" : "opacity-100"}`}
          >
            <CountryCodeDropdown
              countries={countries}
              selected={selected}
              onChange={(c) => {
                setSelected(c);
                setLocalNumber("");
                setError("");
              }}
            />
          </div>

          {/* Phone number input */}
          <div className="flex-1 relative">
            <Input
              id="mobile-number-input"
              type="tel"
              inputMode="numeric"
              placeholder={`e.g. ${selected.region_code === "IN" ? "9876543210" : "mobile number"}`}
              value={localNumber}
              onChange={(e) => {
                setLocalNumber(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              maxLength={15}
              className="pr-8"
            />

            {/* Inline validation indicator */}
            {isDirty && (
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-[16px] transition-all duration-200 ${
                  isValid ? "opacity-100" : "opacity-60"
                }`}
              >
                {isValid ? "✅" : "❌"}
              </span>
            )}
          </div>
        </div>

        {/* Pattern hint */}
        {isDirty && !isValid && !error && (
          <p className="text-[11px] text-white/35 mt-1">
            Format: <span className="text-white/50 font-mono">{selected.mobile_number_pattern}</span>
          </p>
        )}

        {/* Full number preview */}
        {isDirty && isValid && (
          <p className="text-[11px] text-[#72B7FF]/70 mt-1 font-mono">
            {fullMobile}
          </p>
        )}
      </Field>

      <PrimaryBtn type="submit" loading={loading} disabled={!isValid}>
        Send OTP →
      </PrimaryBtn>
    </form>
  );
}