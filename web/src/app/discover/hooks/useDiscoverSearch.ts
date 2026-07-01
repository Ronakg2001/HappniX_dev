"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { type User } from "@/types/user";
import { type DiscoverItem } from "@/types/event";
import { discoverApi, userApi, fixAvatarUrl } from "@/lib/api";

const DEBOUNCE_MS = 350;
const TYPING_PAGE_SIZE = 5;
const ENTER_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export type DiscoverSearchStatus = "idle" | "loading" | "success" | "error";

export interface UseDiscoverSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  isTyping: boolean;
  setIsTyping: (t: boolean) => void;
  users: User[];
  events: DiscoverItem[];
  followedIds: Set<string>;
  toggleFollow: (id: string) => void;
  status: DiscoverSearchStatus;
  error: string | null;
  hasMoreUsers: boolean;
  hasMoreEvents: boolean;
  loadAll: () => void;
}

export function useDiscoverSearch(initialQuery: string = ""): UseDiscoverSearchReturn {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allEvents, setAllEvents] = useState<DiscoverItem[]>([]);
  
  const [isTyping, setIsTyping] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<DiscoverSearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync debounced query
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setIsTyping(true);
    setStatus("loading");
    
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setIsTyping(false);
      setShowAll(false);
    }, DEBOUNCE_MS);
    
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  // Fetch from Discover API
  useEffect(() => {
    if (debouncedQuery === null || debouncedQuery === undefined) return;
    setStatus("loading");
    setError(null);

    const controller = new AbortController();
    const fetchSearch = async () => {
      if (controller.signal.aborted) return;
      try {
        const response: any = await discoverApi.search(debouncedQuery, 50);
        
        const mappedUsers: User[] = (response.users || []).map((u: any) => ({
          id: String(u.id),
          name: u.name || "",
          username: u.username || "",
          avatar: fixAvatarUrl(u.profile_picture_url || u.profilePictureUrl || u.avatar),
          bio: u.bio || "",
          verified: !!u.verified,
          followers: u.follower_count || 0,
          mutuals: 0,
          isFollowing: !!u.is_following,
          tags: []
        }));
        
        const initialFollowed = new Set<string>();
        mappedUsers.forEach((u) => {
          if (u.isFollowing) initialFollowed.add(u.id);
        });
        setFollowedIds(initialFollowed);
        
        let mappedEvents: DiscoverItem[] = (response.events || []).map((e: any) => ({
          id: String(e.id || e.eventID),
          type: "event",
          title: e.title || "",
          category: e.category || "General",
          genre: e.category || "",
          image: fixAvatarUrl(e.image || e.coverImageUrl || e.cover_image) || "https://images.unsplash.com/photo-1540039155732-684735035727?w=800",
          hype: "HOT",
          attending: "0",
          host: e.host_username || e.hostName || "Host",
          host_avatar: fixAvatarUrl(e.host_avatar || e.host_profilePictureUrl),
          verified: false,
          price: e.price || "Free",
          venue: e.venue || e.locationName || "TBA",
        }));

        try {
          const localEventsRaw = localStorage.getItem("happnix_created_events_v4");
          if (localEventsRaw) {
            const parsed = JSON.parse(localEventsRaw);
            if (Array.isArray(parsed)) {
              const localMapped: DiscoverItem[] = parsed
                .filter((e: any) => {
                  if (!debouncedQuery) return true;
                  const q = debouncedQuery.toLowerCase();
                  return (
                    (e.title || "").toLowerCase().includes(q) ||
                    (e.category || "").toLowerCase().includes(q) ||
                    (e.description || "").toLowerCase().includes(q)
                  );
                })
                .map((e: any) => ({
                  id: String(e.id || e.eventID),
                  type: "event",
                  title: e.title || "Untitled Event",
                  category: e.category || "General",
                  genre: e.category || "",
                  image: fixAvatarUrl(e.coverImageUrl || e.image) || "https://images.unsplash.com/photo-1540039155732-684735035727?w=800",
                  hype: "NEW",
                  attending: "1",
                  host: e.hostName || e.host_username || "You",
                  host_avatar: fixAvatarUrl(e.hostAvatar || e.host_profilePictureUrl),
                  verified: true,
                  price: e.basePrice ? `₹${e.basePrice}` : "Free",
                  venue: e.locationName || e.venue || "TBA",
                }));
              const seenIds = new Set(mappedEvents.map((m) => m.id));
              const seenTitles = new Set(mappedEvents.map((m) => (m.title || "").toLowerCase().trim()));
              localMapped.forEach((le) => {
                const t = (le.title || "").toLowerCase().trim();
                if (!seenIds.has(le.id) && (!t || !seenTitles.has(t))) {
                  mappedEvents.unshift(le);
                  seenIds.add(le.id);
                  if (t) seenTitles.add(t);
                }
              });
            }
          }
        } catch {}

        try {
          const cachedRaw = localStorage.getItem("happnix_cached_feed_events");
          if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw);
            if (Array.isArray(parsed)) {
              const cachedMapped: DiscoverItem[] = parsed
                .filter((e: any) => {
                  if (!debouncedQuery) return true;
                  const q = debouncedQuery.toLowerCase();
                  return (
                    (e.title || "").toLowerCase().includes(q) ||
                    (e.eventCategory || e.category || "").toLowerCase().includes(q) ||
                    (e.description || "").toLowerCase().includes(q) ||
                    (e.hostUserName || e.hostName || "").toLowerCase().includes(q)
                  );
                })
                .map((e: any) => ({
                  id: String(e.id || e.eventID),
                  type: "event",
                  title: e.title || "Untitled Event",
                  category: e.eventCategory || e.category || "General",
                  genre: e.eventCategory || e.category || "",
                  image: fixAvatarUrl(e.coverImageUrl || e.image) || "https://images.unsplash.com/photo-1540039155732-684735035727?w=800",
                  hype: "HOT",
                  attending: "0",
                  host: e.hostUserName || e.hostName || e.host_username || "Host",
                  host_avatar: fixAvatarUrl(e.hostAvatar || e.host_profilePictureUrl),
                  verified: !!e.hostVerified,
                  price: e.basePrice ? `₹${e.basePrice}` : e.price || "Free",
                  venue: e.locationName || e.venue || "TBA",
                }));
              const seenIds = new Set(mappedEvents.map((m) => m.id));
              const seenTitles = new Set(mappedEvents.map((m) => (m.title || "").toLowerCase().trim()));
              cachedMapped.forEach((ce) => {
                const t = (ce.title || "").toLowerCase().trim();
                if (!seenIds.has(ce.id) && (!t || !seenTitles.has(t))) {
                  mappedEvents.push(ce);
                  seenIds.add(ce.id);
                  if (t) seenTitles.add(t);
                }
              });
            }
          }
        } catch {}

        setAllUsers(mappedUsers);
        setAllEvents(mappedEvents);
        setStatus("success");
      } catch {
        if (!controller.signal.aborted) {
          setError("Something went wrong. Please try again.");
          setStatus("error");
        }
      }
    };
    
    fetchSearch();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  const toggleFollow = useCallback(async (id: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    try {
      await userApi.toggleFollow(id);
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    }
  }, []);

  const loadAll = useCallback(() => {
    setShowAll(true);
  }, []);

  // Compute sliced results based on typing/enter state
  const currentLimit = showAll ? MAX_PAGE_SIZE : (isTyping ? TYPING_PAGE_SIZE : ENTER_PAGE_SIZE);

  const visibleUsers = allUsers.slice(0, currentLimit);
  const visibleEvents = allEvents.slice(0, currentLimit);
  
  const hasMoreUsers = allUsers.length > visibleUsers.length;
  const hasMoreEvents = allEvents.length > visibleEvents.length;

  return {
    query,
    setQuery,
    isTyping,
    setIsTyping,
    users: visibleUsers,
    events: visibleEvents,
    followedIds,
    toggleFollow,
    status,
    error,
    hasMoreUsers,
    hasMoreEvents,
    loadAll,
  };
}
