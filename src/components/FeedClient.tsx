"use client";

import { useState, useMemo } from "react";
import ListingCard from "./ListingCard";
import type { Listing } from "@/lib/mock-data";

const neighborhoods = ["All", "JP", "Brookline", "Roslindale"];
const sortOptions = [
  { label: "Best Match", value: "score" },
  { label: "Price: Low", value: "price-asc" },
  { label: "Price: High", value: "price-desc" },
  { label: "Newest", value: "newest" },
];

interface FeedClientProps {
  listings: Listing[];
}

// Shared styled select class
const selectClass =
  "h-9 text-sm bg-bg-primary border border-border rounded-lg px-3 pr-8 text-text-secondary appearance-none cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent hover:border-text-muted";

export default function FeedClient({ listings }: FeedClientProps) {
  const [activeNeighborhood, setActiveNeighborhood] = useState("All");
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState("score");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  const filtered = useMemo(() => {
    let result = listings.filter((l) => {
      if (activeNeighborhood !== "All" && l.neighborhood !== activeNeighborhood)
        return false;
      if (l.score < minScore) return false;
      if (l.price < priceRange[0] || l.price > priceRange[1]) return false;
      return true;
    });

    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default:
        result.sort((a, b) => b.score - a.score);
    }

    return result;
  }, [listings, activeNeighborhood, minScore, sortBy, priceRange]);

  const hasActiveFilters =
    activeNeighborhood !== "All" || minScore > 0 || priceRange[0] > 0 || priceRange[1] < 10000;

  return (
    <div>
      {/* Filter bar */}
      <div className="card-static rounded-xl p-4 sm:p-5 mb-8 border border-border-light">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Neighborhood pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {neighborhoods.map((n) => (
              <button
                key={n}
                onClick={() => setActiveNeighborhood(n)}
                className={`h-9 px-4 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                  activeNeighborhood === n
                    ? "bg-accent text-white shadow-sm"
                    : "bg-border-light text-text-secondary hover:bg-border hover:text-text-primary"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Right-side controls */}
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            {/* Score filter */}
            <div className="relative">
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className={selectClass}
                aria-label="Minimum score filter"
              >
                <option value={0}>Any Score</option>
                <option value={60}>60+</option>
                <option value={70}>70+</option>
                <option value={80}>80+</option>
                <option value={90}>90+</option>
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Price range */}
            <div className="relative">
              <select
                value={`${priceRange[0]}-${priceRange[1]}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split("-").map(Number);
                  setPriceRange([min, max]);
                }}
                className={selectClass}
                aria-label="Price range filter"
              >
                <option value="0-10000">Any Price</option>
                <option value="0-3500">Under $3,500</option>
                <option value="3500-4000">$3,500 – $4,000</option>
                <option value="4000-10000">$4,000+</option>
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={selectClass}
                aria-label="Sort order"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Active filter count */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
            <p className="text-xs text-text-muted">
              <span className="font-mono font-semibold text-text-primary">{filtered.length}</span> of {listings.length} listings
            </p>
            <button
              onClick={() => {
                setActiveNeighborhood("All");
                setMinScore(0);
                setPriceRange([0, 10000]);
              }}
              className="text-xs text-accent hover:text-accent-hover font-medium transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card-static rounded-xl py-20 px-8 text-center border border-border-light">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-border-light flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h3 className="font-display text-xl text-text-primary mb-2">No matches found</h3>
          <p className="text-text-muted text-sm max-w-xs mx-auto leading-relaxed">
            Try loosening your filters to see more listings.
          </p>
          <button
            onClick={() => {
              setActiveNeighborhood("All");
              setMinScore(0);
              setPriceRange([0, 10000]);
            }}
            className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 bg-accent-light text-accent rounded-lg text-sm font-medium hover:bg-accent hover:text-white transition-all duration-150 cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} {...listing} hardFilterPasses={listing.hardFilterStatus.passes} />
          ))}
        </div>
      )}
    </div>
  );
}
