"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header";
import LocationBar from "@/components/location/LocationBar";
import LeftSidebar from "./LeftSidebar";
import BottomNav from "./BottomNav";
import { 
  BookingModal, 
  NotificationsModal, 
  CreateEventModal 
} from "@/components/modals/HomeModals";

interface LayoutContextType {
  openBooking: (title: string, price: string) => void;
  openCreateEvent: () => void;
  currentLocation: string;
  radius: number;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Location States
  const [currentLocation, setCurrentLocation] = useState("Jaipur");
  const [radius, setRadius] = useState(10);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Modal States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{ title: string; price: string } | null>(null);

  // Exclude landing page and authentication screens from the global app shell
  const isAppRoute = pathname !== "/" && pathname !== "/signin" && pathname !== "/signup";

  // Auth guard: redirect unauthenticated users away from protected routes
  useEffect(() => {
    if (isAppRoute) {
      const token = localStorage.getItem("happnix_access_token");
      if (!token) {
        router.replace("/signin");
      }
    }
  }, [isAppRoute, router]);

  const openBooking = (title: string, price: string) => {
    setSelectedBooking({ title, price });
  };

  const openCreateEvent = () => {
    setIsCreateOpen(true);
  };

  if (!isAppRoute) {
    return <>{children}</>;
  }

  return (
    <LayoutContext.Provider value={{ openBooking, openCreateEvent, currentLocation, radius }}>
      <div className="min-h-screen flex flex-col relative bg-background text-foreground home-feed">
        {/* Background gradients/glow effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--brand-1)]/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--brand-3)]/10 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        </div>

        {/* Top Header */}
        <Header
          currentLocation={currentLocation}
          onLocationClick={() => setIsLocationModalOpen(true)}
          onNotificationsClick={() => setIsNotificationsOpen(true)}
        />

        {/* Location Bar Pill Card (Sticky below Header) - Hidden, Modal Only */}
        <LocationBar
          currentLocation={currentLocation}
          radius={radius}
          onLocationChange={setCurrentLocation}
          onRadiusChange={setRadius}
          isModalOpen={isLocationModalOpen}
          setIsModalOpen={setIsLocationModalOpen}
        />

        {/* Layout Grid */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:pb-6 w-full flex gap-6 relative z-10">
          {/* Left Sidebar (Desktop/Tablet Persistent Sidebar) */}
          <LeftSidebar
            onCreateClick={openCreateEvent}
            onNotificationsClick={() => setIsNotificationsOpen(true)}
            onMessagesClick={() => router.push("/messages")}
          />

          {/* Central page specific routing content */}
          <div className="flex-1 min-w-0 flex gap-6">
            {children}
          </div>
        </div>

        {/* Floating Action Button (Mobile Only) */}
        {/* <FloatingActionButton onCreateEventClick={openCreateEvent} /> */}

        {/* Bottom Mobile Navigation */}
        <BottomNav onCreateClick={openCreateEvent} />

        {/* Modals Portal Elements */}
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />

        <CreateEventModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />

        {selectedBooking && (
          <BookingModal
            isOpen={!!selectedBooking}
            onClose={() => setSelectedBooking(null)}
            eventTitle={selectedBooking.title}
            price={selectedBooking.price}
          />
        )}
      </div>
    </LayoutContext.Provider>
  );
}
