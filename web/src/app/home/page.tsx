"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import LocationBar from "@/components/location/LocationBar";
import FloatingActionButton from "@/components/shared/FloatingActionButton";
import { 
  SocialPostCard, 
  EventCard, 
  SponsoredEventCard, 
  SuggestedProfilesCard 
} from "@/components/feed/FeedCards";
import { 
  BookingModal, 
  NotificationsModal, 
  ProfilePreviewModal, 
  EventPreviewModal, 
  CreateEventModal 
} from "@/components/modals/HomeModals";
import { Compass, Sparkles, Flame, Users, Calendar, MessageCircle } from "lucide-react";

export default function HomePage() {
  // Location States
  const [currentLocation, setCurrentLocation] = useState("Jaipur");
  const [radius, setRadius] = useState(10);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Active Feed Tab
  const [activeTab, setActiveTab] = useState("all");

  // Modal States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{ title: string; price: string } | null>(null);
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

  // Quick Discovery / Stories data
  const stories = [
    { name: "Live Party", icon: Flame, color: "from-pink-500 to-rose-500" },
    { name: "Near Me", icon: Compass, color: "from-blue-500 to-indigo-500" },
    { name: "Squads", icon: Users, color: "from-purple-500 to-violet-500" },
    { name: "Next Week", icon: Calendar, color: "from-amber-500 to-orange-500" },
  ];

  const handleBookNow = (title: string, price: string) => {
    setSelectedBooking({ title, price });
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-background text-foreground overflow-x-hidden">
      {/* Top Header */}
      <Header
        currentLocation={currentLocation}
        onLocationClick={() => setIsLocationModalOpen(true)}
        onNotificationsClick={() => setIsNotificationsOpen(true)}
        onMessagesClick={() => alert("Messages route / inbox is situated in /messages")}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* Location Bar Pill Card (Sticky below Header) */}
      <LocationBar
        currentLocation={currentLocation}
        radius={radius}
        onLocationChange={setCurrentLocation}
        onRadiusChange={setRadius}
        isModalOpen={isLocationModalOpen}
        setIsModalOpen={setIsLocationModalOpen}
      />

      {/* Layout Grid */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex gap-6 relative z-10">
        {/* Left Sidebar (Desktop Only) */}
        <LeftSidebar
          onCreateClick={() => setIsCreateOpen(true)}
          onNotificationsClick={() => setIsNotificationsOpen(true)}
          onMessagesClick={() => alert("Redirecting to full messaging route")}
        />

        {/* Central Feed Content */}
        <main className="flex-1 min-w-0 max-w-2xl flex flex-col gap-6">
          {/* Stories strip */}
          {/* <section className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x">
            {stories.map((story, index) => {
              const Icon = story.icon;
              return (
                <button
                  key={index}
                  onClick={() => alert(`Showing discovery list: ${story.name}`)}
                  className="flex flex-col items-center gap-1.5 snap-start shrink-0"
                >
                  <div className={`h-14 w-14 rounded-full bg-gradient-to-tr ${story.color} p-[2px] hover:scale-105 active:scale-95 transition-all shadow-md`}>
                    <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-white/70 tracking-wide">{story.name}</span>
                </button>
              );
            })}
          </section> */}

          {/* Feed Filter Segmented Control */}
          <div className="w-full flex items-center justify-between pb-1 border-b border-white/5 scroll-x">
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
          </div>

          {/* Sponsored/Featured Event Card (Render always at the top of feed) */}
          {activeTab !== "posts" && (
            <SponsoredEventCard
              event={mockSponsoredEvent}
              onBookNow={() => handleBookNow(mockSponsoredEvent.title, mockSponsoredEvent.price)}
            />
          )}

          {/* Suggested Profiles Carousel Card */}
          {/* <SuggestedProfilesCard /> */}

          {/* Feed List */}
          <div className="flex flex-col">
            {/* Posts */}
            {(activeTab === "all" || activeTab === "posts" || activeTab === "nearby") && (
              mockPosts.map((post) => (
                <div key={post.id} onClick={() => setSelectedProfile(post.user.username)}>
                  <SocialPostCard post={post} />
                </div>
              ))
            )}

            {/* Events */}
            {(activeTab === "all" || activeTab === "events" || activeTab === "nearby") && (
              mockEvents.map((event) => (
                <div key={event.id} onClick={() => setSelectedEventPreview(event.title)}>
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
      </div>

      {/* Floating Action Button (Mobile Only) */}
      <FloatingActionButton onCreateEventClick={() => setIsCreateOpen(true)} />

      {/* Bottom Mobile Navigation */}
      <BottomNav onCreateClick={() => setIsCreateOpen(true)} />

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
    </div>
  );
}