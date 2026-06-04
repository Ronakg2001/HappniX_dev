"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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

interface TicketType {
  id: string;
  eventTitle: string;
  date: string;
  time: string;
  seat: string;
}

interface LayoutContextType {
  openBooking: (title: string, price: string) => void;
  openCreateEvent: () => void;
  currentLocation: string;
  radius: number;
  bookedTickets: TicketType[];
  addTicket: (title: string, price: string) => void;
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

  // Tickets State
  const [bookedTickets, setBookedTickets] = useState<TicketType[]>([]);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLoc = localStorage.getItem("happnix_location");
      if (savedLoc) setCurrentLocation(savedLoc);

      const savedRadius = localStorage.getItem("happnix_radius");
      if (savedRadius) setRadius(Number(savedRadius));

      const savedTickets = localStorage.getItem("happnix_booked_tickets");
      if (savedTickets) {
        const parsed = JSON.parse(savedTickets);
        // If they only have the old 1-pass layout default, upgrade it to the multiple default list
        if (parsed.length === 1 && parsed[0].id === "t1") {
          const defaultTickets = [
            { id: "t1", eventTitle: "Neon Nights Party", date: "May 28", time: "9:00 PM", seat: "VIP Entry" },
            { id: "t2", eventTitle: "Rooftop Unplugged Gig", date: "May 30", time: "7:00 PM", seat: "General Entry" },
            { id: "t3", eventTitle: "Forbidden Forest Warehouse Party", date: "Jun 06", time: "10:00 PM", seat: "VIP Access Pass" }
          ];
          setBookedTickets(defaultTickets);
          localStorage.setItem("happnix_booked_tickets", JSON.stringify(defaultTickets));
        } else {
          setBookedTickets(parsed);
        }
      } else {
        const defaultTickets = [
          { id: "t1", eventTitle: "Neon Nights Party", date: "May 28", time: "9:00 PM", seat: "VIP Entry" },
          { id: "t2", eventTitle: "Rooftop Unplugged Gig", date: "May 30", time: "7:00 PM", seat: "General Entry" },
          { id: "t3", eventTitle: "Forbidden Forest Warehouse Party", date: "Jun 06", time: "10:00 PM", seat: "VIP Access Pass" }
        ];
        setBookedTickets(defaultTickets);
        localStorage.setItem("happnix_booked_tickets", JSON.stringify(defaultTickets));
      }
    }
  }, []);

  const handleLocationChange = (loc: string) => {
    setCurrentLocation(loc);
    localStorage.setItem("happnix_location", loc);
  };

  const handleRadiusChange = (rad: number) => {
    setRadius(rad);
    localStorage.setItem("happnix_radius", String(rad));
  };

  const addTicket = (title: string, price: string) => {
    const newTicket: TicketType = {
      id: `t_${Date.now()}`,
      eventTitle: title,
      date: "Jun 06", // Simulated date
      time: "9:00 PM",
      seat: "General Entry"
    };
    const updated = [newTicket, ...bookedTickets];
    setBookedTickets(updated);
    localStorage.setItem("happnix_booked_tickets", JSON.stringify(updated));
  };

  // Modal States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{ title: string; price: string } | null>(null);

  // Exclude landing page and authentication screens from the global app shell
  const isAppRoute = pathname !== "/" && pathname !== "/signin" && pathname !== "/signup";

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
    <LayoutContext.Provider value={{ openBooking, openCreateEvent, currentLocation, radius, bookedTickets, addTicket }}>
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
          onLocationChange={handleLocationChange}
          onRadiusChange={handleRadiusChange}
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
