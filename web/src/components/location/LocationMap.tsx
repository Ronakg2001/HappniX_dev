"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Fix Leaflet default icon URLs broken in Next.js bundling ────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const brandIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  onMapClick: (lat: number, lng: number) => void;
}

export default function LocationMap({ latitude, longitude, onMapClick }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onMapClickRef = useRef(onMapClick);

  // Sync callback ref to avoid re-triggering map initialization effect
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create map instance
    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });
    mapRef.current = map;

    // Add TileLayer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add Draggable Marker
    const marker = L.marker([latitude, longitude], {
      draggable: true,
      icon: brandIcon,
    }).addTo(map);
    markerRef.current = marker;

    // Click handler
    map.on("click", (e) => {
      onMapClickRef.current(e.latlng.lat, e.latlng.lng);
    });

    // Drag handler
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onMapClickRef.current(pos.lat, pos.lng);
    });

    // Cleanup on unmount
    return () => {
      marker.off();
      map.off();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // Only runs once on mount

  // Sync external coordinates changes (GPS detect, search selected)
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;

    if (map && marker) {
      const currentMarkerPos = marker.getLatLng();
      if (currentMarkerPos.lat !== latitude || currentMarkerPos.lng !== longitude) {
        marker.setLatLng([latitude, longitude]);
        map.flyTo([latitude, longitude], map.getZoom() < 13 ? 14 : map.getZoom(), {
          animate: true,
          duration: 1,
        });
      }
    }
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
    />
  );
}
