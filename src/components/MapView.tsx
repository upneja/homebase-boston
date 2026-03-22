"use client";

import { useEffect, useRef } from "react";
import { listings, keyLocations } from "@/lib/mock-data";

function getScoreColor(score: number) {
  if (score >= 80) return "#1B6B5A";
  if (score >= 60) return "#C4872A";
  return "#9C9590";
}

function getScoreBg(score: number) {
  if (score >= 80) return "#E8F5F0";
  if (score >= 60) return "#FBF0E0";
  return "#F0ECEC";
}

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up any existing map instance first to prevent "already initialized" error
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([L]) => {
      if (!mapRef.current) return;

      const map = L.default.map(mapRef.current, {
        zoomControl: false,
      }).setView([42.32, -71.12], 13);

      mapInstanceRef.current = map;

      // Add zoom control to bottom-left to avoid overlapping legend
      L.default.control.zoom({ position: "bottomleft" }).addTo(map);

      // Tile layer — using a slightly warmer OSM style
      L.default
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        })
        .addTo(map);

      // Listing markers
      listings.forEach((listing) => {
        const color = getScoreColor(listing.score);
        const scoreBg = getScoreBg(listing.score);

        const marker = L.default
          .circleMarker([listing.lat, listing.lon], {
            radius: 11,
            fillColor: color,
            fillOpacity: 1,
            color: "#ffffff",
            weight: 2.5,
          })
          .addTo(map);

        marker.bindPopup(
          `<div style="
            font-family: 'DM Sans', -apple-system, sans-serif;
            min-width: 210px;
            padding: 2px;
          ">
            <div style="
              border-radius: 8px;
              overflow: hidden;
              margin-bottom: 10px;
              background: #F0ECE8;
              aspect-ratio: 3/2;
            ">
              <img
                src="${listing.photoUrl}"
                style="width: 100%; height: 100%; object-fit: cover; display: block;"
                alt="${listing.title}"
              />
            </div>
            <div style="
              font-family: 'Instrument Serif', Georgia, serif;
              font-size: 15px;
              color: #1A1A1A;
              margin-bottom: 3px;
              line-height: 1.3;
            ">${listing.title}</div>
            <div style="
              font-size: 12px;
              color: #9C9590;
              margin-bottom: 8px;
            ">${listing.address}</div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="
                font-family: 'JetBrains Mono', monospace;
                font-weight: 700;
                font-size: 15px;
                color: #1A1A1A;
              ">$${listing.price.toLocaleString()}<span style="font-size:11px;font-weight:400;color:#9C9590;">/mo</span></span>
              <span style="
                font-family: 'JetBrains Mono', monospace;
                font-weight: 700;
                font-size: 13px;
                color: ${color};
                background: ${scoreBg};
                padding: 3px 9px;
                border-radius: 99px;
              ">${listing.score}</span>
            </div>
            <div style="
              font-size: 11px;
              color: #9C9590;
              margin-top: 5px;
              padding-top: 5px;
              border-top: 1px solid #F0ECE8;
            ">${listing.beds} bd &middot; ${listing.baths} ba &middot; ${listing.sqft.toLocaleString()} sqft &middot; ${listing.neighborhood}</div>
          </div>`,
          { maxWidth: 240 }
        );
      });

      // Key location markers
      keyLocations.forEach((loc) => {
        const icon = L.default.divIcon({
          html: `<div style="
            width: 30px;
            height: 30px;
            background: #1A1714;
            border: 3px solid #FAF8F5;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.1);
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#FAF8F5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>`,
          className: "",
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        L.default
          .marker([loc.lat, loc.lon], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="
              font-family: 'DM Sans', -apple-system, sans-serif;
              font-size: 13px;
              font-weight: 600;
              color: #1A1A1A;
              padding: 2px;
            ">${loc.name}</div>`
          );
      });

      // Fix map size after render
      setTimeout(() => map.invalidateSize(), 150);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} className="w-full h-full" />;
}
