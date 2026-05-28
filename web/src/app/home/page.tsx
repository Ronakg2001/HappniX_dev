"use client";

import React, { useState } from "react";
import { useLayout } from "@/components/layout/AppLayout";
import RightSidebar from "@/components/layout/RightSidebar";
import { 
  SocialPostCard, 
  EventCard, 
  SponsoredEventCard, 
  SuggestedProfilesCard 
} from "@/components/feed/FeedCards";
import { 
  ProfilePreviewModal, 
  EventPreviewModal 
} from "@/components/modals/HomeModals";
import { Compass, Sparkles, Flame, Users, Calendar, MessageCircle } from "lucide-react";

export default function HomePage() {
  const { openBooking } = useLayout();

  // Active Feed Tab
  const [activeTab, setActiveTab] = useState("all");

  // Modal States
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedEventPreview, setSelectedEventPreview] = useState<string | null>(null);

  // Mock Feed Data
  const mockPosts = [
    {
      id: "p1",
      user: { name: "Aarav Mehta", username: "aaravm", avatar: "", verified: true },
      timestamp: "2 hours ago",
      privacy: "public" as const,
      content: "Just booked tickets for the Utopia DJ Set! Who else is going this Friday? The line-up looks insane! 🔥🎧",
      hashtags: ["UtopiaMusic", "JaipurGigs", "WeekendVibes"],
      mentions: ["sarahc", "shadowmix"],
      musicTag: "Utopia Underground - Techno Mix",
      moodTag: "Hyped Up",
      likes: 42,
      comments: 18,
      location: "Utopia Club, Jaipur",
      liked: true,
      saved: false
    },
    {
      id: "p2",
      user: { name: "Sneha Sen", username: "snehasen", avatar: "", verified: false },
      timestamp: "5 hours ago",
      privacy: "public" as const,
      content: "Chasing sunsets and acoustic vibes in Jaipur. If you love unplugged music, there's a cozy gathering happening tomorrow at C-Scheme.",
      hashtags: ["AcousticSession", "Unplugged", "JaipurDiaries"],
      mentions: [],
      musicTag: "Cozy Acoustic - Indie Cover",
      moodTag: "Chill & Relaxed",
      likes: 29,
      comments: 7,
      location: "Cafe Noir, C-Scheme",
      liked: false,
      saved: true
    }
  ];

  const mockEvents = [
    {
      id: "e1",
      organizer: "Utopia Entertainment",
      verifiedOrganizer: true,
      banner: "",
      title: "Club Utopia DJ Set",
      category: "Clubbing",
      musicGenre: "Techno / House",
      ageRestricted: true,
      date: "Friday, May 29",
      time: "9:00 PM - 3:00 AM",
      venue: "Utopia Club, C-Scheme, Jaipur",
      distance: "2.4 km away",
      ticketsLeft: 14,
      trending: true,
      friendsAttending: 6,
      price: "₹999"
    },
    {
      id: "e2",
      organizer: "Unplugged Nights",
      verifiedOrganizer: false,
      banner: "",
      title: "Rooftop Unplugged Gig",
      category: "Gig",
      musicGenre: "Acoustic / Indie",
      ageRestricted: false,
      date: "Saturday, May 30",
      time: "7:00 PM - 10:00 PM",
      venue: "Cafe Sky, Malviya Nagar, Jaipur",
      distance: "5.1 km away",
      ticketsLeft: 35,
      trending: false,
      friendsAttending: 2,
      price: "₹499"
    }
  ];

  const mockSponsoredEvent = {
    id: "sp1",
    organizer: "Happnix VIP Labs",
    verifiedOrganizer: true,
    banner: "",
    title: "Forbidden Forest Warehouse Party",
    category: "Party",
    musicGenre: "Industrial Techno",
    ageRestricted: true,
    date: "Saturday, June 6",
    time: "10:00 PM onwards",
    venue: "Warehouse 12, Industrial Area, Jaipur",
    distance: "9.2 km away",
    ticketsLeft: 5,
    trending: true,
    price: "₹1,999"
  };

  const handleBookNow = (title: string, price: string) => {
    openBooking(title, price);
  };

  return (
    <>
      {/* Central Feed Content */}
      <main className="flex-1 min-w-0 max-w-2xl flex flex-col gap-6">
        {/* Feed Filter Segmented Control */}
        {/* <div className="w-full flex items-center justify-between pb-1 border-b border-white/5 scroll-x">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
            {["all", "posts", "events", "nearby"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? "text-white text-shadow-glow" 
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-gradient shadow-glow rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div> */}

        {/* Sponsored/Featured Event Card (Render always at the top of feed) */}
        {activeTab !== "posts" && (
          <SponsoredEventCard
            event={mockSponsoredEvent}
            onBookNow={() => handleBookNow(mockSponsoredEvent.title, mockSponsoredEvent.price)}
          />
        )}

        {/* Feed List */}
        <div className="flex flex-col">
          {/* Posts */}
          {(activeTab === "all" || activeTab === "posts" || activeTab === "nearby") && (
            mockPosts.map((post) => (
              <div key={post.id} onClick={() => setSelectedProfile(post.user.username)} className="cursor-pointer">
                <SocialPostCard post={post} />
              </div>
            ))
          )}

          {/* Events */}
          {(activeTab === "all" || activeTab === "events" || activeTab === "nearby") && (
            mockEvents.map((event) => (
              <div key={event.id} onClick={() => setSelectedEventPreview(event.title)} className="cursor-pointer">
                <EventCard
                  event={event}
                  onBookNow={() => handleBookNow(event.title, event.price)}
                />
              </div>
            ))
          )}
        </div>
      </main>

      {/* Right Sidebar (Desktop Only) */}
      <RightSidebar onBookNow={handleBookNow} />

      {/* Page Specific Preview Modals */}
      {selectedProfile && (
        <ProfilePreviewModal
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          username={selectedProfile}
        />
      )}

      {selectedEventPreview && (
        <EventPreviewModal
          isOpen={!!selectedEventPreview}
          onClose={() => setSelectedEventPreview(null)}
          eventTitle={selectedEventPreview}
        />
      )}
    </>
  );
}