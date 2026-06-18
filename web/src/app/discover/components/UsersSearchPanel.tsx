"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, RefreshCw, ChevronDown } from "lucide-react";

import { useUserSearch } from "../hooks/useUserSearch";
import { UserCard } from "./UserCard";
import { UserCardSkeleton } from "./UserCardSkeleton";
import { UsersEmptyState } from "./UsersEmptyState";
import { UsersErrorState } from "./UsersErrorState";
import { Button } from "@/components/ui/button";

interface UsersSearchPanelProps {
  query: string;
}

export function UsersSearchPanel({ query }: UsersSearchPanelProps) {
  const {
    results,
    followedIds,
    toggleFollow,
    status,
    error,
    hasMore,
    loadMore,
    isLoadingMore,
    setQuery,
  } = useUserSearch(query);

  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(query);
  }, [query, setQuery]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || status !== "success") return;
    const observer = new IntersectionObserver((entries) => 
      { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, status, loadMore]);

  const handleNavigate = useCallback((username: string) => {
      router.push(`/user?username=${username}`);
    }, [router]
  );

  const handleRetry = useCallback(() => {
    setQuery("");
    setTimeout(() => setQuery(query), 50);
  }, [query, setQuery]);

  if (status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[30vh]">
        <Users className="h-9 w-9 text-white/15 mb-3" />
        <p className="text-xs text-white/30 font-semibold">
          Search for people on HappniX
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div
        className="flex flex-col gap-2"
        role="status"
        aria-label="Loading users"
        aria-live="polite"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <UserCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error" && error) {
    return <UsersErrorState error={error} onRetry={handleRetry} />;
  }

  if (status === "success" && results.length === 0) {
    return <UsersEmptyState query={query} />;
  }

  return (
    <div className="flex flex-col gap-2" role="list" aria-label="User search results">
      {results.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          isFollowing={followedIds.has(user.id)}
          onFollow={toggleFollow}
          onNavigate={handleNavigate}
        />
      ))}

      {hasMore && (
        <div ref={sentinelRef} className="py-2 flex justify-center">
          {isLoadingMore ? (
            <div
              className="flex items-center gap-2 text-[10px] text-white/30 font-semibold"
              aria-live="polite"
              aria-label="Loading more users"
            >
              <RefreshCw className="h-3 w-3 animate-spin" />
              Loading more…
            </div>
          ) : (
            <Button
              onClick={loadMore}
              aria-label="Load more users"
              size="sm"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Show more
            </Button>
          )}
        </div>
      )}

      {!hasMore && results.length > 0 && (
        <p className="text-center text-[10px] text-white/30 py-3 font-semibold">
          {results.length} user{results.length !== 1 ? "s" : ""} found
        </p>
      )}
    </div>
  );
}
