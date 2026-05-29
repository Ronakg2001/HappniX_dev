"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuroraBackground from "@/components/landing/AuroraBackground";
import MobileStep from "./components/MobileView";
import OtpStep from "./components/OTPView";
import PasswordStep from "./components/PasswordView";

type View = "mobile" | "otp" | "password";

export default function SignInPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("mobile");
  const [mobile, setMobile] = useState("");

  function handleAuthResult(result: Record<string, unknown>) {
    const { success, message, userStatus } = result;
    if (!success) {
      alert(message);
      return;
    }

    if (userStatus === 'new') {
      router.push('/signup');
    } else {
      router.push('/home');
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black font-sans text-white">
      <AuroraBackground />

      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-[30%] left-0 h-[1px] w-[55%] bg-gradient-to-r from-transparent via-[#FF4FD8]/40 to-transparent -rotate-[12deg]"
          style={{ animation: "light-beam 12s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10 w-full max-w-[440px] mx-auto px-6 py-12">
        <a href="/" className="block text-center mb-8">
          <span className="text-brand-gradient text-shadow-glow text-[28px] font-extrabold leading-none">Happnix</span>
        </a>

        <div className="relative rounded-[28px]">
          {/* Background Layer with Overflow Hidden for Shimmer */}
          <div className="absolute inset-0 liquid-glass liquid-edge rounded-[28px] pointer-events-none z-0">
            <div className="absolute top-0 left-0 h-full w-[40%] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-12"
              style={{ animation: "shimmer 5s ease-in-out infinite" }} />
          </div>

          {/* Content Layer (allows dropdown overflow) */}
          <div className="relative z-10 p-8">
            <div className="mb-7">
              <h1 className="text-[24px] font-extrabold text-white leading-tight">
                {view === "mobile" && "Continue with mobile"}
                {view === "otp" && "Verify your number"}
                {view === "password" && "Sign in"}
              </h1>
              <p className="text-[14px] text-white/45 mt-1.5">
                {view === "mobile" && "Enter your phone number to get an OTP."}
                {view === "otp" && "Enter the 6-digit code we sent you."}
                {view === "password" && "Enter your username/email and password."}
              </p>
            </div>

            {view === "mobile" && (
              <MobileStep onOtpSent={(m) => { setMobile(m); setView("otp"); }} />
            )}
            {view === "otp" && (
              <OtpStep mobile={mobile} onVerified={handleAuthResult} onBack={() => setView("mobile")} />
            )}
            {view === "password" && (
              <PasswordStep onSuccess={handleAuthResult} onBack={() => setView("mobile")} />
            )}

            {view === "mobile" && (
              <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
                <button onClick={() => setView("password")}
                  className="text-[13px] text-white/45 hover:text-[#72B7FF] transition duration-200">
                  Sign in with Username / Email instead →
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[12px] text-white/25 mt-6">
          By continuing, you agree to Happnix&apos;s{" "}
          <a href="/terms" className="text-white/40 hover:text-white underline">Terms</a> and{" "}
          <a href="/privacy" className="text-white/40 hover:text-white underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
