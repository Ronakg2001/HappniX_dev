"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { type User } from "@/types/user";
import { type DiscoverItem } from "@/types/event";
import { discoverApi, fixAvatarUrl } from "@/lib/api";

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
    if (!query.trim()) {
      setDebouncedQuery("");
      setStatus("idle");
      setAllUsers([]);
      setAllEvents([]);
      return;
    }
    
    setIsTyping(true);
    setStatus("loading");
    
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setIsTyping(false); // Finished typing
      setShowAll(false); // Reset to sliced view
    }, DEBOUNCE_MS);
    
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  // Fetch from Discover API
  useEffect(() => {
    if (!debouncedQuery) return;
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
          avatar: fixAvatarUrl(u.profile_picture_url),
          bio: u.bio || "",
          verified: !!u.verified,
          followers: u.follower_count || 0,
          mutuals: 0,
          isFollowing: !!u.is_following,
          tags: []
        }));
        
        const mappedEvents: DiscoverItem[] = (response.events || []).map((e: any) => ({
          id: String(e.id),
          type: "event",
          title: e.title || "",
          category: e.category || "",
          genre: "", // Missing from backend payload currently
          image: fixAvatarUrl(e.image) || "https://images.unsplash.com/photo-1540039155732-684735035727?w=800",
          hype: "HOT", // Static for now
          attending: "0",
          host: e.host_username || "Unknown",
          host_avatar: fixAvatarUrl(e.host_avatar),
          verified: false,
          price: e.price || "Free",
          venue: e.venue || "TBA",
        }));

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

  const toggleFollow = useCallback((id: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
