"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Flame, 
  TrendingUp, 
  Clock, 
  X, 
  ArrowLeft, 
  ShieldCheck, 
  Users, 
  Compass, 
  Play, 
  MapPin, 
  ChevronRight,
  Sparkles
} from "lucide-react";

// Mock database matching home and events
const DISCOVER_ITEMS = [
  {
    id: "e1",
    type: "event",
    title: "Club Utopia DJ Set",
    category: "Clubbing",
    genre: "Techno & House",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80",
    hype: "2.8M Hype",
    attending: "6 friends",
    host: "Utopia Entertainment",
    verified: true,
    price: "₹999",
    venue: "C-Scheme, Jaipur"
  },
  {
    id: "e2",
    type: "event",
    title: "Rooftop Unplugged Gig",
    category: "Acoustic Gig",
    genre: "Indie / Folk",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80",
    hype: "4.2M Hype",
    attending: "2 friends",
    host: "Unplugged Nights",
    verified: false,
    price: "₹499",
    venue: "Malviya Nagar, Jaipur"
  },
  {
    id: "sp1",
    type: "event",
    title: "Forbidden Forest Warehouse Rave",
    category: "Private Party",
    genre: "Industrial Techno",
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=400&q=80",
    hype: "5.1M Hype",
    attending: "3 friends",
    host: "Happnix VIP Labs",
    verified: true,
    price: "₹1,999",
    venue: "Industrial Area, Jaipur"
  },
  {
    id: "m4",
    type: "social",
    title: "Late Night Boiler Room Session Jaipur edit",
    category: "Rave",
    genre: "Acid Techno",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
    hype: "2.5M Hype",
    attending: "18 attending",
    host: "Circuit Breaker",
    verified: false,
    price: "Free Entry",
    venue: "Sector 5, Jaipur"
  },
  {
    id: "m5",
    type: "social",
    title: "Soundcheck with Sneha unplugged folk cover",
    category: "Acoustic",
    genre: "Folk / Indie",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80",
    hype: "16M Views",
    attending: "Local Session",
    host: "Sneha Sen",
    verified: true,
    price: "Invite Only",
    venue: "C-Scheme, Jaipur"
  },
  {
    id: "m6",
    type: "event",
    title: "Eclipse Deep House pool gig",
    category: "Pool Party",
    genre: "Deep House",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=400&q=80",
    hype: "2.8M Hype",
    attending: "5 friends",
    host: "Shadowmix Lab",
    verified: true,
    price: "₹799",
    venue: "Amer Road, Jaipur"
  }
];

const CATEGORY_PILLS = [
  "All", 
  "Techno & House", 
  "Acoustic Gigs", 
  "Warehouse Raves", 
  "Pool Parties", 
  "Deep House", 
  "Indie / Folk"
];

const TRENDING_SEARCHES = [
  "Forbidden Forest Warehouse Party",
  "Utopia Techno DJ set",
  "Rooftop Acoustic Sneha Sen",
  "Pool gig Amer Road",
  "Industrial Beats Jaipur",
  "Squad chat invites"
];

export default function DiscoverPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSearchTab, setActiveSearchTab] = useState("Top");
  
  // History state
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    // Load history from localStorage
    const history = localStorage.getItem("happnix_search_history");
    if (history) {
      setSearchHistory(JSON.parse(history));
    } else {
      const defaultHistory = ["Techno nights", "Jaipur Gigs", "DJ Shadow", "Acoustic Cover"];
      setSearchHistory(defaultHistory);
      localStorage.setItem("happnix_search_history", JSON.stringify(defaultHistory));
    }
  }, []);

  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    setSearchQuery(query);
    setSearchFocused(false);
    
    // Add to history
    const updated = [query, ...searchHistory.filter(h => h !== query)].slice(0, 6);
    setSearchHistory(updated);
    localStorage.setItem("happnix_search_history", JSON.stringify(updated));
  };

  const deleteHistoryItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = searchHistory.filter(h => h !== item);
    setSearchHistory(updated);
    localStorage.setItem("happnix_search_history", JSON.stringify(updated));
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchFocused(true);
    searchInputRef.current?.focus();
  };

  // Filter Items
  const filteredItems = DISCOVER_ITEMS.filter(item => {
    // Category Pill Filter
    if (activeCategory !== "All" && item.genre !== activeCategory) {
      return false;
    }
    // Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchHost = item.host.toLowerCase().includes(query);
      const matchGenre = item.genre.toLowerCase().includes(query);
      return matchTitle || matchHost || matchGenre;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col gap-5 select-none animate-in fade-in duration-300 min-h-screen pb-16">
      
      {/* Search Header Row */}
      <div className="flex items-center gap-3 w-full sticky top-0 bg-background/95 backdrop-blur-md pt-2 pb-3 z-30">
        {searchFocused && (
          <button 
            onClick={() => setSearchFocused(false)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white cursor-pointer active:scale-95 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        
        {/* Input Wrap */}
        <div className="flex-1 relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search events, music genres, hosts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(searchQuery)}
            className="w-full h-11 pl-11 pr-10 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs font-semibold placeholder-white/35 focus:bg-white/[0.07] focus:border-[var(--brand-2)] focus:outline-none focus:shadow-[0_0_15px_rgba(201,108,255,0.15)] transition-all duration-300"
          />
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-white/35" />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute right-3.5 top-3.5 p-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Conditional Layout: Active Search Overlay vs Main Grid */}
      {searchFocused ? (
        <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-200">
          
          {/* Recent Searches (Reference Image 2 Right Panel) */}
          {searchHistory.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-white/30 flex items-center gap-1.5 px-1">
                <Clock className="h-3 w-3" /> Recent Searches
              </h4>
              <div className="flex flex-col rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                {searchHistory.map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleSearchSubmit(item)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-3.5 w-3.5 text-white/30 group-hover:text-[var(--brand-2)] transition-colors" />
                      <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">{item}</span>
                    </div>
                    <button 
                      onClick={(e) => deleteHistoryItem(e, item)}
                      className="p-1 rounded hover:bg-white/15 text-white/30 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* You May Like / Trending Queries (Reference Image 2 Right Panel) */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-white/30 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-[var(--brand-1)]" /> You may like
              </h4>
              <button 
                onClick={() => handleSearchSubmit(TRENDING_SEARCHES[Math.floor(Math.random() * TRENDING_SEARCHES.length)])}
                className="text-[9px] font-black uppercase text-[var(--brand-3)] tracking-wider hover:text-white transition-colors cursor-pointer"
              >
                Shuffle
              </button>
            </div>

            <div className="flex flex-col rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
              {TRENDING_SEARCHES.map((query, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSearchSubmit(query)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`text-xs font-black w-4.5 ${idx < 3 ? "text-[var(--brand-1)]" : "text-white/30"}`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors truncate">{query}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-white/30 group-hover:text-[var(--brand-1)] transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-wider">Trending</span>
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Horizontal Category Pill Bar (Reference Image 1 Top Row) */}
          <div className="w-full flex items-center gap-2 pb-1 border-b border-white/5 scroll-x overflow-x-auto scrollbar-none">
            {CATEGORY_PILLS.map((pill) => (
              <button
                key={pill}
                onClick={() => setActiveCategory(pill)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                  activeCategory === pill 
                    ? "bg-white text-black border-white shadow-glow" 
                    : "bg-white/5 text-white/50 border-white/5 hover:border-white/20 hover:text-white"
                }`}
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Search Result Filtering Subtabs (Reference Image 2 Left panel) */}
          {searchQuery && (
            <div className="flex gap-4 border-b border-white/5 pb-1 animate-in fade-in duration-200">
              {["Top", "Events", "Squads", "Hosts"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSearchTab(tab)}
                  className={`pb-2.5 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
                    activeSearchTab === tab 
                      ? "text-white text-shadow-glow" 
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {tab}
                  {activeSearchTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-gradient shadow-glow rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Explore Grid of Visual Cards (Reference Image 1 Layout Grid) */}
          {filteredItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[45vh] bg-white/[0.01] border border-white/5 rounded-[24px]">
              <Compass className="h-10 w-10 text-white/30 animate-pulse mb-3" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">No matching results</h3>
              <p className="text-[11px] text-white/40 mt-1 max-w-xs leading-relaxed">
                We couldn't find any events or posts matching "{searchQuery}". Try editing your keyword or filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4.5">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => item.type === "event" ? router.push(`/events/${item.id}`) : alert("Opening highlight clip...")}
                  className="group relative flex flex-col rounded-[20px] overflow-hidden border border-white/10 bg-gradient-to-b from-[#14141d] to-[#08080c] shadow-glow hover:shadow-[0_0_25px_rgba(201,108,255,0.15)] hover:border-white/20 hover:-translate-y-1 cursor-pointer transition-all duration-300 min-h-[290px]"
                >
                  {/* Vertical Image Card Cover */}
                  <div className="relative flex-1 bg-black/40 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Dark gradient mapping overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-black/35 to-transparent" />
                    
                    {/* Play button indicator overlay for social/clips */}
                    {item.type === "social" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                          <Play className="h-4 w-4 fill-white ml-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Stat overlays (Ref: ❤️ 2.8M) */}
                    <div className="absolute top-3 left-3 z-10 flex gap-1.5">
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-wider border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                        <Flame className="h-2.5 w-2.5 text-[var(--brand-1)]" /> {item.hype}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2 py-0.5 rounded bg-white/10 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-wider border border-white/5">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Descriptive overlay text & title info */}
                  <div className="p-3.5 flex flex-col gap-2 relative z-10 bg-[#08080c]">
                    <h4 className="text-xs font-black text-white leading-tight uppercase tracking-wider line-clamp-2 min-h-[2.5rem] group-hover:text-[var(--brand-3)] transition-colors">
                      {item.title}
                    </h4>

                    {/* Meta details */}
                    <div className="flex items-center justify-between text-[9px] font-bold text-white/50">
                      <span className="flex items-center gap-0.5 text-[var(--brand-1)]">
                        {item.price}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" /> {item.venue.split(",")[0]}
                      </span>
                    </div>

                    {/* Host user info at footer */}
                    <div className="flex items-center gap-2 border-t border-white/5 pt-2.5 mt-1">
                      <div className="h-6 w-6 rounded-full bg-brand-gradient flex items-center justify-center font-black text-[9px] text-white select-none">
                        {item.host[0]}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center gap-1">
                        <span className="text-[10px] font-bold text-white/80 truncate">{item.host}</span>
                        {item.verified && (
                          <ShieldCheck className="h-3 w-3 text-[var(--brand-3)] shrink-0" />
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
  );
}
