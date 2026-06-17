"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Flame, TrendingUp, Clock, X, ArrowLeft, ShieldCheck, Compass, Play, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DISCOVER_ITEMS, CATEGORY_PILLS, TRENDING_SEARCHES } from "@/constants/mockData";
import { UsersSearchPanel } from "./components/UsersSearchPanel";
import { DiscoverPageFallback } from "./components/DiscoverPageFallback";

type SearchTab = "Top" | "Events" | "Users";

function DiscoverPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeSearchTab, setActiveSearchTab] = useState<SearchTab>(
    (searchParams.get("tab") as SearchTab) ?? "Top"
  );

  const syncURL = useCallback((q: string, tab: SearchTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) {
        params.set("q", q);
        params.set("tab", tab);
      } else {
        params.delete("q");
        params.delete("tab");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    // Load history from localStorage
    const history = localStorage.getItem("happnix_search_history");
    if (history) {
      setSearchHistory(JSON.parse(history));
    } else {
      // only for mock, remove later
      const defaultHistory = ["Techno nights", "Jaipur Gigs", "DJ Shadow", "Acoustic Cover"];
      setSearchHistory(defaultHistory);
      localStorage.setItem("happnix_search_history", JSON.stringify(defaultHistory));
    }
  }, []);

  const handleSearchSubmit = useCallback((query: string) => {
      if (!query.trim()) return;
      const trimmed = query.trim();
      setSearchQuery(trimmed);
      setSearchFocused(false);
      const updated = [trimmed, ...searchHistory.filter((h) => h !== trimmed)].slice(0, 6);
      setSearchHistory(updated);
      localStorage.setItem("happnix_search_history", JSON.stringify(updated));
      syncURL(trimmed, activeSearchTab);
    }, [searchHistory, activeSearchTab]
  );

  const deleteHistoryItem = useCallback((e: React.MouseEvent, item: string) => {
      e.stopPropagation();
      const updated = searchHistory.filter((h) => h !== item);
      setSearchHistory(updated);
      localStorage.setItem("happnix_search_history", JSON.stringify(updated));
    }, [searchHistory]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchFocused(true);
    syncURL("", activeSearchTab);
    searchInputRef.current?.focus();
  }, [activeSearchTab]);

  const handleTabChange = useCallback((tab: SearchTab) => {
      setActiveSearchTab(tab);
      if (searchQuery) syncURL(searchQuery, tab);
    }, [searchQuery, syncURL]
  );

  const filteredItems = DISCOVER_ITEMS.filter((item) => {
    if (activeCategory !== "All" && item.genre !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.host.toLowerCase().includes(q) ||
        item.genre.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 min-w-0 w-full overflow-hidden flex flex-col gap-5 select-none animate-in fade-in duration-300 min-h-screen pb-16">

      <div className="flex items-center gap-3 w-full sticky top-0 bg-background/95 backdrop-blur-md pt-2 pb-3 z-30">
        {searchFocused && (
          <Button
            onClick={() => setSearchFocused(false)}
            variant="ghost"
            size="icon"
            aria-label="Close search"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1 relative">
          <Input
            ref={searchInputRef}
            id="discover-search-input"
            placeholder="Search events, users, genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(searchQuery); }}
            aria-label="Search discover"
            aria-controls="discover-results"
            className="pl-11 pr-10 h-11 rounded-xl text-xs font-semibold focus:border-[var(--brand-2)] bg-white/[0.04] border-white/10 placeholder-white/35"
          />
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-white/35" aria-hidden="true" />
          {searchQuery && (
            <Button
              onClick={clearSearch}
              variant="ghost"
              size="icon"
              aria-label="Clear search"
              className="absolute right-2 top-1.5 h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {searchFocused ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">

          {/* Recent Searches */}
          {searchHistory.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-white/30 flex items-center gap-1.5 px-1">
                <Clock className="h-3 w-3" aria-hidden="true" /> Recent Searches
              </h4>
              <div className="flex flex-col rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                {searchHistory.map((item, idx) => (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    aria-label={`Search for ${item}`}
                    onClick={() => handleSearchSubmit(item)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(item)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-3.5 w-3.5 text-white/30 group-hover:text-[var(--brand-2)] transition-colors" aria-hidden="true" />
                      <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                        {item}
                      </span>
                    </div>
                    <Button
                      onClick={(e) => deleteHistoryItem(e, item)}
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${item} from history`}
                      className="h-7 w-7 rounded-lg text-white/30 hover:text-white hover:bg-white/10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* You May Like / Trending Queries */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-white/30 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-[var(--brand-1)]" aria-hidden="true" /> You may like
              </h4>
              <Button
                onClick={() => handleSearchSubmit(TRENDING_SEARCHES[Math.floor(Math.random() * TRENDING_SEARCHES.length)])}
                variant="link"
                className="h-auto p-0 text-[9px] font-black uppercase text-[var(--brand-3)] tracking-wider hover:text-white"
                aria-label="Shuffle trending searches"
              >
                Shuffle
              </Button>
            </div>
            <div className="flex flex-col rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
              {TRENDING_SEARCHES.map((query, idx) => (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  aria-label={`Search trending: ${query}`}
                  onClick={() => handleSearchSubmit(query)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(query)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`text-xs font-black w-4.5 ${idx < 3 ? "text-[var(--brand-1)]" : "text-white/30"}`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors truncate">
                      {query}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-white/30 group-hover:text-[var(--brand-1)] transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-wider">Trending</span>
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Category Pills */}
          <div
            className="w-full flex items-center gap-2 pb-2 overflow-x-auto scrollbar-none scroll-smooth"
            role="tablist"
            aria-label="Event category filters"
          >
            {CATEGORY_PILLS.map((pill) => (
              <Button
                key={pill}
                role="tab"
                aria-selected={activeCategory === pill}
                onClick={() => setActiveCategory(pill)}
                variant={activeCategory === pill ? "default" : "outline"}
                size="xs"
                className={`rounded-full text-[10px] uppercase tracking-wider whitespace-nowrap border-white border-2 shrink-0 ${
                  activeCategory === pill ? "bg-white text-black" : "text-white/70"
                }`}
              >
                {pill}
              </Button>
            ))}
          </div>

          {/* Search Sub-tabs */}
          {searchQuery && (
            <div
              className="flex gap-4 border-b border-white/5 pb-1 animate-in fade-in duration-200"
              role="tablist"
              aria-label="Search result categories"
            >
              {(["Top", "Events", "Users"] as SearchTab[]).map((tab) => (
                <Button
                  key={tab}
                  role="tab"
                  aria-selected={activeSearchTab === tab}
                  onClick={() => handleTabChange(tab)}
                  variant="ghost"
                  className={`pb-2.5 h-auto p-0 rounded-none text-xs uppercase tracking-wider transition-all relative ${
                    activeSearchTab === tab ? "text-white" : "text-white/50"
                  }`}
                >
                  {tab}
                  {activeSearchTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-gradient shadow-glow rounded-full" />
                  )}
                </Button>
              ))}
            </div>
          )}

          <div id="discover-results">
            {searchQuery && activeSearchTab === "Users" ? (
              <div className="animate-in fade-in duration-200">
                <UsersSearchPanel query={searchQuery} />
              </div>
            ) : (
              <>
                {filteredItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[45vh] bg-white/[0.01] border border-white/5 rounded-[24px]">
                    <Compass className="h-10 w-10 text-white/30 animate-pulse mb-3" aria-hidden="true" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      No matching results
                    </h3>
                    <p className="text-[11px] text-white/40 mt-1 max-w-xs leading-relaxed">
                      We couldn&apos;t find any events or posts matching &ldquo;{searchQuery}&rdquo;. Try
                      editing your keyword or filter.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-3">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        role="article"
                        aria-label={item.title}
                        onClick={() =>
                          item.type === "event"
                            ? router.push(`/events/${item.id}`)
                            : alert("Opening highlight clip...")
                        }
                        className="group relative flex flex-col rounded-sm overflow-hidden hover:-translate-y-1 cursor-pointer transition-all duration-300"
                      >
                        <div className="relative w-full h-40 min-[390px]:h-44 sm:h-48 bg-black/40 overflow-hidden shrink-0">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-black/20 to-transparent" />
                          {item.type === "social" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                                <Play className="h-4 w-4 fill-white ml-0.5" />
                              </div>
                            </div>
                          )}
                          <div className="absolute top-3 left-3 z-10 flex gap-1.5">
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-wider border border-white/10">
                              <Flame className="h-2.5 w-2.5 text-[var(--brand-1)]" aria-hidden="true" /> {item.hype}
                            </span>
                          </div>
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
                              <MapPin className="h-2.5 w-2.5" aria-hidden="true" /> {item.venue.split(",")[0]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-t border-white/5 pt-2 mt-0.5">
                            <div className="h-5 w-5 rounded-full bg-brand-gradient flex items-center justify-center font-black text-[8px] text-white select-none">
                              {item.host[0]}
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
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverPageFallback />}>
      <DiscoverPageInner />
    </Suspense>
  );
}
