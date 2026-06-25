"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLayout } from "@/components/layout/AppLayout";
import RightSidebar from "@/components/layout/RightSidebar";
import { MOCK_SPONSORED_EVENT } from "@/constants/mockData";
import { ProfilePreviewModal } from "@/components/modals/HomeModals";
import { SponsoredEventCard } from "@/components/feed/FeedCards";
import { FeedItem } from "@/components/feed/FeedItem";
import { LiveNowCarousel } from "@/components/feed/LiveNowCarousel";
import { useFeed } from "@/hooks/useFeed";

export default function HomePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("all");
  const { openBooking, currentLocation } = useLayout();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  // Hook for feed
  const {
    feedItems,
    liveNow,
    isLoading,
    isFetchingNext,
    hasMore,
    loadMore,
    refresh,
    hasNewPosts
  } = useFeed();

  // Hole C fix: Filter feed items client-side based on the active tab
  const filteredItems = useMemo(() => {
    if (activeTab === "posts") return feedItems.filter(item => item.entityType === "FEED_POST");
    if (activeTab === "events") return feedItems.filter(item => item.entityType === "EVENT_CARD");
    // "all" and "nearby" show everything (nearby will be refined when live location is implemented)
    return feedItems;
  }, [feedItems, activeTab]);

  // Mock Sponsored Event
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
          <div onClick={() => router.push(`/event?id=${mockSponsoredEvent.id}`)} className="cursor-pointer">
            <SponsoredEventCard
              event={mockSponsoredEvent}
              onBookNow={(e) => handleBookNow(mockSponsoredEvent.title, mockSponsoredEvent.price, e)}
            />
          </div>
        )}

        {/* Live Now Carousel */}
        {(activeTab === "all" || activeTab === "events") && liveNow.length > 0 && (
          <LiveNowCarousel 
            events={liveNow} 
            onEventClick={(id) => router.push(`/event?id=${id}`)} 
          />
        )}

        {/* New Posts Bubble */}
        {hasNewPosts && (
          <div className="flex justify-center -mt-2 mb-4">
            <button 
              onClick={refresh}
              className="bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:bg-brand-secondary transition transform hover:scale-105 z-10"
            >
              New Posts
            </button>
          </div>
        )}

        {/* Feed List */}
        <div className="flex flex-col">
          {isLoading ? (
            <div className="flex justify-center p-8 text-white/50">Loading feed...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center p-8 text-white/50 border border-white/5 rounded-xl">
              {activeTab === "all" ? "No posts to show right now." : `No ${activeTab} to show right now.`}
            </div>
          ) : (
            filteredItems.map((item) => {
              // Hole J: Per-item error boundary via try/catch render
              try {
                return (
                  <FeedItem
                    key={`${item.entityType}-${item.postID || item.eventID}`}
                    item={item}
                    onProfileClick={setSelectedProfile}
                    onEventClick={(id) => router.push(`/event?id=${id}`)}
                    onBookNow={handleBookNow}
                  />
                );
              } catch (err) {
                console.error("Failed to render feed item", item, err);
                return null;
              }
            })
          )}

          {/* Load More Button (Infinite scroll proxy) */}
          {hasMore && (
            <div className="flex justify-center py-6">
              <button
                onClick={loadMore}
                disabled={isFetchingNext}
                className="px-6 py-2 rounded-full border border-white/20 text-white/70 hover:bg-white/5 hover:text-white transition disabled:opacity-50"
              >
                {isFetchingNext ? "Loading..." : "Load More"}
              </button>
            </div>
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
    </>
  );
}