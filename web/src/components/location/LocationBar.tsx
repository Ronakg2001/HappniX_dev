"use client";

import React, { useState } from "react";
import { MapPin, Compass, Search, Navigation, X } from "lucide-react";

interface LocationBarProps {
  currentLocation: string;
  radius: number;
  onLocationChange: (location: string) => void;
  onRadiusChange: (radius: number) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export default function LocationBar({
  currentLocation,
  radius,
  onLocationChange,
  onRadiusChange,
  isModalOpen,
  setIsModalOpen
}: LocationBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingGeo, setLoadingGeo] = useState(false);

  const popularCities = ["Jaipur", "Mumbai", "Delhi", "Bengaluru", "Goa", "Pune"];
  const searchResults = searchQuery
    ? popularCities.filter(city => city.toLowerCase().includes(searchQuery.toLowerCase()))
    : popularCities;

  const detectLocation = () => {
    setLoadingGeo(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Simulate fetching city from coords
          setTimeout(() => {
            onLocationChange("Jaipur (My Location)");
            setLoadingGeo(false);
            setIsModalOpen(false);
          }, 1000);
        },
        () => {
          alert("Unable to retrieve location. Defaulting to Jaipur.");
          setLoadingGeo(false);
          setIsModalOpen(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setLoadingGeo(false);
    }
  };

  return (
    <>
      {/* Sticky Location Bar Pill */}
      <div className="w-full flex justify-center py-2 px-4 sticky top-16 z-30 bg-background/80 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-2 rounded-full liquid-glass liquid-edge text-xs font-semibold max-w-md w-full justify-between shadow-card hover:scale-[1.01] transition-transform">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-white/90"
          >
            <MapPin className="h-4 w-4 text-[var(--brand-1)] shrink-0" />
            <span className="truncate">{currentLocation}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-white/40">|</span>
            <span className="text-white/60">Radius:</span>
            <select
              value={radius}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="bg-transparent text-[var(--brand-3)] font-bold focus:outline-none cursor-pointer"
            >
              <option value={5} className="bg-[#12121a] text-white">5 km</option>
              <option value={10} className="bg-[#12121a] text-white">10 km</option>
              <option value={25} className="bg-[#12121a] text-white">25 km</option>
              <option value={50} className="bg-[#12121a] text-white">50 km</option>
            </select>
          </div>
        </div>
      </div>

      {/* Location Picker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl liquid-glass liquid-edge border border-white/10 p-6 shadow-card max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="text-[var(--brand-1)] h-5 w-5" />
                Select Location
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Detect Current Location */}
            <button
              onClick={detectLocation}
              disabled={loadingGeo}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-gradient text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all mb-4 disabled:opacity-50 disabled:pointer-events-none shadow-glow"
            >
              <Navigation className={`h-4 w-4 ${loadingGeo ? 'animate-spin' : ''}`} />
              {loadingGeo ? "Detecting location..." : "Use Current Location"}
            </button>

            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Search city or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--brand-2)] transition-colors placeholder-white/30"
              />
            </div>

            {/* Popular/Suggested Locations */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
                Suggested Cities
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {searchResults.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      onLocationChange(city);
                      setIsModalOpen(false);
                    }}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all text-left flex items-center gap-2 ${
                      currentLocation === city
                        ? "bg-[var(--brand-1)]/10 border-[var(--brand-1)] text-white"
                        : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Compass className="h-4 w-4 text-[var(--brand-3)] shrink-0" />
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
