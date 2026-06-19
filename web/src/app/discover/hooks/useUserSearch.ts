"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MOCK_USERS } from "@/constants/mockData";
import { type User } from "@/types/user";

import { userApi } from "@/lib/api";

const DEBOUNCE_MS = 350;
const PAGE_SIZE = 6;

export type UserSearchStatus = "idle" | "loading" | "success" | "error";

export interface UseUserSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: User[];
  followedIds: Set<string>;
  toggleFollow: (id: string) => void;
  status: UserSearchStatus;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
}

export function useUserSearch(initialQuery: string = ""): UseUserSearchReturn {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [allResults, setAllResults] = useState<User[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [followedIds, setFollowedIds] = useState<Set<string>>(() => {
    return new Set(MOCK_USERS.filter((u) => u.isFollowing).map((u) => u.id));
  });
  const [status, setStatus] = useState<UserSearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!query.trim()) {
      setDebouncedQuery("");
      setStatus("idle");
      setAllResults([]);
      setVisibleCount(PAGE_SIZE);
      return;
    }
    setStatus("loading");
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) return;
    setStatus("loading");
    setError(null);
    setVisibleCount(PAGE_SIZE);

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (controller.signal.aborted) return;
      try {
        const response: any = await userApi.search(debouncedQuery);
        const mappedUsers: User[] = (response.users || []).map((u: any) => {
          const baseUrl = process.env.NEXT_PUBLIC_R2_USERMEDIA_BUCKET_PUB || "https://happnix-dev-new.ronakgo1.workers.dev/";
          const cleanAvatar = u.profile_picture_url && u.profile_picture_url !== baseUrl ? u.profile_picture_url : null;
          return {
            id: String(u.id),
            name: u.name || "",
            username: u.username || "",
            avatar: cleanAvatar,
            bio: u.bio || "",
            verified: !!u.verified,
            followers: u.follower_count || 0,
            mutuals: 0,
            isFollowing: !!u.is_following,
            tags: []
          };
        });
        setAllResults(mappedUsers);
        setStatus("success");
      } catch {
        setError("Something went wrong. Please try again.");
        setStatus("error");
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timer);
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

  const loadMore = useCallback(() => {
    if (isLoadingMore || visibleCount >= allResults.length) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, allResults.length));
      setIsLoadingMore(false);
    }, 600);
  }, [isLoadingMore, visibleCount, allResults.length]);

  const results = allResults.slice(0, visibleCount);
  const hasMore = visibleCount < allResults.length;

  return {
    query,
    setQuery,
    results,
    followedIds,
    toggleFollow,
    status,
    error,
    hasMore,
    loadMore,
    isLoadingMore,
  };
}
