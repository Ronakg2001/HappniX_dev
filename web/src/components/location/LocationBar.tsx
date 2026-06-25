"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Search, X, CheckCircle, AlertCircle, Loader2, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useLocation } from "@/lib/locationStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-foreground/5 rounded-2xl">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-1)]" />
    </div>
  ),
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

async function safeJsonFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "Accept-Language": "en", "Accept": "application/json" },
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // Server returned HTML (rate-limit, CORS, etc.) instead of JSON
    throw new Error("Location service unavailable. Try again shortly.");
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const data = await safeJsonFetch<{
    display_name: string;
    address?: Record<string, string>;
  }>(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);

  const a = data.address || {};
  const parts = [
    a.neighbourhood || a.suburb || a.quarter,
    a.city || a.town || a.village || a.county,
    a.state,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : data.display_name;
}

async function searchLocations(query: string): Promise<NominatimResult[]> {
  const results = await safeJsonFetch<NominatimResult[]>(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`
  );
  if (!Array.isArray(results)) {
    throw new Error("Unexpected search response format.");
  }
  return results;
}


interface LocationBarProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  currentLocation?: string;
  radius?: number;
  onLocationChange?: (location: string) => void;
  onRadiusChange?: (radius: number) => void;
}

// Default Location Jaipur center
const DEFAULT_LAT = 26.9124;
const DEFAULT_LNG = 75.7873; 

export default function LocationBar({ isModalOpen, setIsModalOpen }: LocationBarProps) {
  const { locationState, setLocation, setEnabled, clearLocation, saveToLocalStorage } =
    useLocation();

  // Local map/UI state
  const [mapLat, setMapLat] = useState<number>(locationState.latitude ?? DEFAULT_LAT);
  const [mapLng, setMapLng] = useState<number>(locationState.longitude ?? DEFAULT_LNG);
  const [selectedAddress, setSelectedAddress] = useState<string>(locationState.address);
  const [pendingSource, setPendingSource] = useState<"gps" | "manual" | "search" | "">(
    locationState.source
  );

  // GPS / loading states
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [reverseLoading, setReverseLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Save feedback
  const [savedFlash, setSavedFlash] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync local state when panel opens
  useEffect(() => {
    if (isModalOpen) {
      setMapLat(locationState.latitude ?? DEFAULT_LAT);
      setMapLng(locationState.longitude ?? DEFAULT_LNG);
      setSelectedAddress(locationState.address);
      setGpsError(null);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isModalOpen, locationState]);

  // Dismiss search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModalOpen]);

  // GPS detection
  const detectGPS = useCallback(async () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMapLat(lat);
        setMapLng(lng);
        setPendingSource("gps");
        setGpsLoading(false);
        setReverseLoading(true);
        try {
          const addr = await reverseGeocode(lat, lng);
          setSelectedAddress(addr);
        } catch {
          setSelectedAddress("Unable to determine address.");
        } finally {
          setReverseLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError("Location permission denied. Please select manually.");
        } else if (err.code === 2) {
          setGpsError("Unable to fetch location. Try manual selection.");
        } else {
          setGpsError("Location unavailable. Try manual selection.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);


  const handleToggle = useCallback(async () => {
    const next = !locationState.enabled;
    setEnabled(next);
    // Persist the toggle state
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("userLocation");
        const existing = raw ? JSON.parse(raw) : {};
        localStorage.setItem("userLocation", JSON.stringify({ ...existing, enabled: next }));
      } catch { /* ignore */ }
    }
    if (next) {
      await detectGPS();
    }
  }, [locationState.enabled, setEnabled, detectGPS]);


  const handleMapSelect = useCallback(async (lat: number, lng: number) => {
    setMapLat(lat);
    setMapLng(lng);
    setPendingSource("manual");
    setReverseLoading(true);
    try {
      const addr = await reverseGeocode(lat, lng);
      setSelectedAddress(addr);
    } catch {
      setSelectedAddress("Unable to determine address.");
    } finally {
      setReverseLoading(false);
    }
  }, []);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchLocations(val);
        setSearchResults(results);
        setShowDropdown(true);
        if (results.length === 0) {
          setSearchError("No locations found.");
        }
      } catch {
        setSearchError("Search unavailable. Check internet connection.");
        setShowDropdown(false);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const handleSelectResult = useCallback(async (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMapLat(lat);
    setMapLng(lng);
    setPendingSource("search");
    setShowDropdown(false);
    setSearchQuery("");
    setReverseLoading(true);
    try {
      const addr = await reverseGeocode(lat, lng);
      setSelectedAddress(addr);
    } catch {
      // fallback to nominatim display_name
      const parts = result.display_name.split(", ").slice(0, 3).join(", ");
      setSelectedAddress(parts);
    } finally {
      setReverseLoading(false);
    }
  }, []);


  const handleSave = useCallback(() => {
    const payload = {
      address: selectedAddress,
      latitude: mapLat,
      longitude: mapLng,
      source: (pendingSource || "manual") as "gps" | "manual" | "search",
    };
    setLocation(payload);
    // Write directly to localStorage
    if (typeof window !== "undefined") {
      const toStore = {
        enabled: locationState.enabled,
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("userLocation", JSON.stringify(toStore));
    }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }, [selectedAddress, mapLat, mapLng, pendingSource, setLocation, locationState.enabled]);


  const handleClear = useCallback(() => {
    clearLocation();
    setSelectedAddress("");
    setMapLat(DEFAULT_LAT);
    setMapLng(DEFAULT_LNG);
    setSearchQuery("");
    setSearchResults([]);
    setPendingSource("");
    setGpsError(null);
  }, [clearLocation]);

  if (!isModalOpen) return null;

  const isLiveEnabled = locationState.enabled;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={() => setShowDropdown(false)}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg liquid-glass liquid-edge border border-border shadow-card max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
      >

        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-[var(--brand-1)]/15">
              <MapPin className="h-4 w-4 text-[var(--brand-1)]" />
            </div>
            <span className="font-bold text-sm text-foreground">Live Location</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Toggle */}
            <button
              onClick={handleToggle}
              disabled={gpsLoading}
              className="flex items-center gap-1.5 text-xs font-semibold transition-all"
              aria-label={isLiveEnabled ? "Disable live location" : "Enable live location"}
            >
              <span className={isLiveEnabled ? "text-[var(--brand-1)]" : "text-foreground/50"}>
                {isLiveEnabled ? "ON" : "OFF"}
              </span>
              {isLiveEnabled ? (
                <ToggleRight className="h-6 w-6 text-[var(--brand-1)]" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-foreground/40" />
              )}
            </button>
            <Button
              onClick={() => setIsModalOpen(false)}
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-foreground/50 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">

          <div className="flex items-start gap-2 px-3 py-2.5 rounded-sm bg-foreground/5 border border-border/50">
            {gpsLoading ? (
              <Loader2 className="h-4 w-4 text-[var(--brand-1)] animate-spin shrink-0 mt-0.5" />
            ) : (
              <MapPin className="h-4 w-4 text-[var(--brand-1)] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-0.5">
                {isLiveEnabled ? "Current Location" : "Saved Location"}
              </p>
              <p className="text-xs font-semibold text-foreground truncate">
                {gpsLoading
                  ? "Detecting location…"
                  : locationState.address || "Location not detected"}
              </p>
            </div>
          </div>

          {gpsError && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-2xl bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{gpsError}</p>
            </div>
          )}

          <div className="relative">
            <div className="relative flex items-center">
              {searchLoading ? (
                <Loader2 className="absolute left-4.5 h-4 w-4 text-[var(--brand-2)] animate-spin shrink-0 z-10" />
              ) : (
                <Search className="absolute left-4.5 h-4 w-4 text-foreground/40 shrink-0 z-10" />
              )}
              <Input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Search city, area, pincode…"
                className="pl-11 pr-10 text-xs py-2.5"
              />
              {searchQuery && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowDropdown(false);
                  }}
                  variant="ghost"
                  size="icon-xs"
                  className="absolute right-3 text-foreground/40 hover:text-foreground z-10"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Search Dropdown */}
            {showDropdown && (
              <div className="absolute top-full mt-1 left-0 right-0 z-[9999] rounded-sm border border-border overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                style={{
                  background: "rgba(10,10,20,0.92)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {searchError ? (
                  <p className="text-xs text-foreground/50 px-3 py-3">{searchError}</p>
                ) : (
                  searchResults.map((r) => {
                    const parts = r.display_name.split(", ").slice(0, 4).join(", ");
                    return (
                      <button
                        key={r.place_id}
                        onClick={() => handleSelectResult(r)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[var(--brand-1)]/10 transition-colors border-b border-border/30 last:border-0 flex items-center gap-2"
                      >
                        <MapPin className="h-3 w-3 text-[var(--brand-1)] shrink-0" />
                        <span className="text-xs text-foreground/80 truncate">{parts}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="relative rounded-sm overflow-hidden isolate z-0" style={{ height: "220px" }}>
            <LocationMap
              latitude={mapLat}
              longitude={mapLng}
              onMapClick={handleMapSelect}
            />
            {/* Map loading overlay for reverse geocode */}
            {reverseLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl z-10">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/70">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-1)]" />
                  <span className="text-xs text-white font-medium">Locating…</span>
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] text-foreground/40 text-center -mt-1">
            Click or drag the pin to select a location
          </p>

          {selectedAddress && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-sm bg-[var(--brand-1)]/8 border border-[var(--brand-1)]/20">
              <CheckCircle className="h-4 w-4 text-[var(--brand-1)] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-0.5">
                  Selected Location
                </p>
                <p className="text-xs font-semibold text-foreground">{selectedAddress}</p>
                {mapLat !== DEFAULT_LAT && (
                  <p className="text-[10px] text-foreground/30 mt-0.5">
                    {mapLat.toFixed(5)}, {mapLng.toFixed(5)}
                  </p>
                )}
              </div>
            </div>
          )}
 
          {isLiveEnabled && (
            <Button
              onClick={detectGPS}
              disabled={gpsLoading}
              variant="brand"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-xs text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-glow"
            >
              {gpsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              {gpsLoading ? "Detecting…" : "Detect Location"}
            </Button>
          )}

          <div className="flex gap-2 pb-1">
            <Button
              onClick={handleClear}
              variant="outline"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-semibold text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedAddress}
              variant={savedFlash ? "default" : "secondary"}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${
                savedFlash ? "bg-green-500/90 text-white border-transparent" : ""
              }`}
            >
              {savedFlash ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  Saved!
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5" />
                  Save Location
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
