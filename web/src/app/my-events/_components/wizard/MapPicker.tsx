"use client";
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker assets in Webpack/Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number, address: string) => void;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [loading, setLoading] = useState(false);

  // Jaipur coordinates as fallback default
  const defaultLat = 26.9124;
  const defaultLng = 75.7873;

  const initialLat = lat || defaultLat;
  const initialLng = lng || defaultLng;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map
    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);
    mapRef.current = map;

    // Add OpenStreetMap Tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add Initial Marker
    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    const reverseGeocode = async (selectedLat: number, selectedLng: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedLat}&lon=${selectedLng}`
        );
        const data = await res.json();
        const address = data.display_name || `Coordinates: ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`;
        onChange(selectedLat, selectedLng, address);
      } catch (err) {
        console.error("Geocoding error:", err);
        onChange(selectedLat, selectedLng, `Location: ${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}`);
      } finally {
        setLoading(false);
      }
    };

    // On Marker Drag End
    marker.on("dragend", async () => {
      const position = marker.getLatLng();
      await reverseGeocode(position.lat, position.lng);
    });

    // On Map Click
    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      marker.setLatLng([clickLat, clickLng]);
      await reverseGeocode(clickLat, clickLng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-2">
      <div 
        ref={mapContainerRef} 
        className="h-64 w-full rounded-2xl border border-white/10 overflow-hidden z-10"
        style={{ minHeight: "260px" }}
      />
      <div className="flex justify-between items-center text-[10px] text-white/40">
        <span>Click on the map or drag the pin to set venue coordinates & address</span>
        {loading && <span className="text-[var(--brand-1)] font-bold animate-pulse">Reverse geocoding address...</span>}
      </div>
    </div>
  );
}
