"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLayout } from "@/components/layout/AppLayout";
import RightSidebar from "@/components/layout/RightSidebar";
import { MOCK_POSTS, MOCK_FEED_EVENTS, MOCK_SPONSORED_EVENT } from "@/constants/mockData";
import { ProfilePreviewModal, EventPreviewModal } from "@/components/modals/HomeModals";
import { SocialPostCard, EventCard, SponsoredEventCard } from "@/components/feed/FeedCards";

export default function HomePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("all");
  const { openBooking, currentLocation } = useLayout();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedEventPreview, setSelectedEventPreview] = useState<string | null>(null);

  // Mock Feed Data
  const mockPosts = MOCK_POSTS;
  const mockEvents = MOCK_FEED_EVENTS;
  const mockSponsoredEvent = MOCK_SPONSORED_EVENT;

  const handleBookNow = (title: string, price: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    openBooking(title, price);
  };

  return (
    <>
      {/* Central Feed Content */}
      <main className="flex-1 min-w-0 max-w-2xl flex flex-col gap-6">
        {/* Feed Filter Segmented Control */}
        <div className="w-full flex items-center justify-between pb-1 border-b border-white/5 scroll-x">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
            {["all", "posts", "events", "nearby"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab
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
        </div>

        {/* Sponsored/Featured Event Card (Render always at the top of feed) */}
        {activeTab !== "posts" && (activeTab !== "nearby" || mockSponsoredEvent.venue.toLowerCase().includes(currentLocation.toLowerCase())) && (
          <div onClick={() => router.push(`/events/${mockSponsoredEvent.id}`)} className="cursor-pointer">
            <SponsoredEventCard
              event={mockSponsoredEvent}
              onBookNow={(e) => handleBookNow(mockSponsoredEvent.title, mockSponsoredEvent.price, e)}
            />
          </div>
        )}

        {/* Feed List */}
        <div className="flex flex-col">
          {/* Posts */}
          {(activeTab === "all" || activeTab === "posts" || (activeTab === "nearby" && currentLocation)) && (
            mockPosts
              .filter(post => activeTab !== "nearby" || post.location?.toLowerCase().includes(currentLocation.toLowerCase()))
              .map((post) => (
                <div key={post.id} onClick={() => setSelectedProfile(post.user.username)} className="cursor-pointer">
                  <SocialPostCard post={post} />
                </div>
              ))
          )}

          {/* Events */}
          {(activeTab === "all" || activeTab === "events" || (activeTab === "nearby" && currentLocation)) && (
            mockEvents
              .filter(event => activeTab !== "nearby" || event.venue.toLowerCase().includes(currentLocation.toLowerCase()))
              .map((event) => (
                <div key={event.id} onClick={() => router.push(`/events/${event.id}`)} className="cursor-pointer">
                  <EventCard
                    event={event}
                    onBookNow={(e) => handleBookNow(event.title, event.price, e)}
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