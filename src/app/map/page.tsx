"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div
          className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-3"
          aria-label="Loading map"
        />
        <p className="text-text-muted text-sm">Loading map&hellip;</p>
      </div>
    </div>
  ),
});

const legendItems = [
  { color: "#1B6B5A", label: "Score 80+", sublabel: "Great match" },
  { color: "#C4872A", label: "Score 60–79", sublabel: "Good match" },
  { color: "#9C9590", label: "Score under 60", sublabel: "Average match" },
  { color: "#1A1714", label: "Key location", sublabel: "Workplace / family" },
];

export default function MapPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="mb-5 shrink-0">
        <h1 className="font-display text-[2.25rem] sm:text-5xl text-text-primary leading-tight tracking-tight">
          Map View
        </h1>
        <p className="text-text-secondary mt-2 text-base">
          Explore listings across JP, Brookline &amp; Roslindale
        </p>
      </div>

      {/* Map container — fills remaining height */}
      <div className="card overflow-hidden flex-1 relative min-h-[400px]">
        <MapView />

        {/* Legend overlay — bottom-right */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-border-light p-4 min-w-[180px]">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">
            Score Legend
          </p>
          <ul className="space-y-2.5">
            {legendItems.map((item) => (
              <li key={item.label} className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white shadow-sm"
                  style={{ background: item.color }}
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold text-text-primary leading-tight">
                    {item.label}
                  </span>
                  <span className="block text-[10px] text-text-muted leading-tight">
                    {item.sublabel}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
