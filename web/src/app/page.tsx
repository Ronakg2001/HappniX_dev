import AuroraBackground from "@/components/landing/AuroraBackground";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import SocialProofStrip from "@/components/landing/SocialProofStrip";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductVisual from "@/components/landing/ProductVisual";
import CommunitySection from "@/components/landing/CommunitySection";
import ForHosts from "@/components/landing/ForHosts";
import CTABanner from "@/components/landing/CTABanner";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-black font-sans text-white">
      {/* Fixed aurora drifting behind everything */}
      <AuroraBackground />

      {/* Page content */}
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <SocialProofStrip />
        <FeaturesGrid />
        <HowItWorks />
        <ProductVisual />
        <CommunitySection />
        <ForHosts />
        <CTABanner />
        <Footer />
      </div>
    </main>
  );
}
