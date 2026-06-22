"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Compass, ChevronDown, MapPin, ShieldCheck, Flame, Play } from "lucide-react";

import { useDiscoverSearch } from "../hooks/useDiscoverSearch";
import { UserCard } from "./UserCard";
import { UserCardSkeleton } from "./UserCardSkeleton";
import { UsersEmptyState } from "./UsersEmptyState";
import { UsersErrorState } from "./UsersErrorState";
import { Button } from "@/components/ui/button";

interface DiscoverSearchPanelProps {
  query: string;
  onSeeMoreUsers?: () => void;
  onSeeMoreEvents?: () => void;
  showOnlyEvents?: boolean;
  showOnlyUsers?: boolean;
}

export function DiscoverSearchPanel({ query, onSeeMoreUsers, onSeeMoreEvents, showOnlyEvents, showOnlyUsers }: DiscoverSearchPanelProps) {
  const {
    users,
    events,
    followedIds,
    toggleFollow,
    status,
    error,
    hasMoreUsers,
    hasMoreEvents,
    loadAll,
    setQuery,
  } = useDiscoverSearch(query);

  const router = useRouter();

  useEffect(() => {
    setQuery(query);
  }, [query, setQuery]);

  const handleNavigateUser = useCallback((id: string) => {
    router.push(`/user?id=${id}`);
  }, [router]);

  const handleNavigateEvent = useCallback((id: string) => {
    router.push(`/event?id=${id}`);
  }, [router]);

  const handleRetry = useCallback(() => {
    setQuery("");
    setTimeout(() => setQuery(query), 50);
  }, [query, setQuery]);

  if (status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[30vh]">
        <Compass className="h-9 w-9 text-white/15 mb-3" />
        <p className="text-xs text-white/30 font-semibold">
          Search for events and people on HappniX
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Loading search results">
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <UserCardSkeleton key={`loading-user-${i}`} />
          ))}
        </div>
      </div>
    );
  }

  if (status === "error" && error) {
    return <UsersErrorState error={error} onRetry={handleRetry} />;
  }

  if (status === "success" && users.length === 0 && events.length === 0) {
    return <UsersEmptyState query={query} />;
  }

  return (
    <div className="flex flex-col gap-6" role="list" aria-label="Discover search results">
      {/* EVENTS SECTION */}
      {!showOnlyUsers && events.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-white/50">Events</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {events.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => handleNavigateEvent(item.id)}
                className="group relative flex flex-col rounded-sm overflow-hidden hover:-translate-y-1 cursor-pointer transition-all duration-300"
              >
                <div className="relative w-full h-40 bg-black/40 overflow-hidden shrink-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-black/20 to-transparent" />
                  <div className="absolute top-1 right-3 z-10">
                    <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-wider border border-white/5">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-2.5 flex flex-col gap-1.5 relative z-10 bg-[#08080c]">
                  <h4 className="text-[11px] font-black text-white leading-tight uppercase tracking-wider line-clamp-1 group-hover:text-[var(--brand-3)] transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[9px] font-bold text-white/50">
                    <span className="flex items-center gap-0.5 text-[var(--brand-1)]">
                      {item.price}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" /> {item.venue.split(",")[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-t border-white/5 pt-2 mt-0.5">
                    <div className="h-5 w-5 rounded-full bg-brand-gradient flex items-center justify-center font-black text-[8px] text-white select-none overflow-hidden shrink-0">
                      {item.host_avatar ? (
                        <img src={item.host_avatar} alt={item.host} className="h-full w-full object-cover" />
                      ) : (
                        item.host[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-1">
                      <span className="text-[9px] font-bold text-white/80 truncate">{item.host}</span>
                      {item.verified && (
                        <ShieldCheck className="h-2.5 w-2.5 text-[var(--brand-3)] shrink-0" aria-label="Verified host" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasMoreEvents && (
            <Button 
              variant="ghost" 
              onClick={() => {
                loadAll();
                if (onSeeMoreEvents) onSeeMoreEvents();
              }}
              className="w-full text-xs font-bold text-white/40 hover:text-white"
            >
              See more events <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* USERS SECTION */}
      {!showOnlyEvents && users.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 mb-1">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-white/50">Users</h4>
          </div>
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isFollowing={followedIds.has(user.id)}
              onFollow={toggleFollow}
              onNavigate={handleNavigateUser}
            />
          ))}
          {hasMoreUsers && (
            <Button 
              variant="ghost" 
              onClick={() => {
                loadAll();
                if (onSeeMoreUsers) onSeeMoreUsers();
              }}
              className="w-full mt-1 text-xs font-bold text-white/40 hover:text-white"
            >
              See more users <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
