"use client";

import Link from "next/link";
import ScoreCircle from "./ScoreCircle";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  score: number;
  neighborhood: string;
  photoUrl: string;
  isNew: boolean;
  hasGym: boolean;
  hasLaundry: boolean;
  hasParking: boolean;
  petFriendly: boolean;
  sourceUrl?: string;
  hardFilterPasses?: boolean;
}

const amenityIcons: Record<string, { icon: React.ReactNode; label: string }> = {
  gym: {
    label: "Gym",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5h2.25M3 7.5v9m0-9L1.5 7.5M3 16.5h2.25m0-9v9m0-9h1.5m-1.5 9h1.5m3-9v9m0-9h1.5m-1.5 9h1.5m3-9v9m0-9h2.25M15.75 7.5v9m0-9h1.5m-1.5 9h1.5M21 7.5h-2.25M21 7.5v9m0-9l1.5 0M21 16.5h-2.25" />
      </svg>
    ),
  },
  laundry: {
    label: "Laundry",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  parking: {
    label: "Parking",
    icon: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z" />
      </svg>
    ),
  },
  petFriendly: {
    label: "Pets OK",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>
    ),
  },
};

export default function ListingCard({
  id,
  title,
  price,
  address,
  beds,
  baths,
  sqft,
  score,
  neighborhood,
  photoUrl,
  isNew,
  hasGym,
  hasLaundry,
  hasParking,
  petFriendly,
  sourceUrl,
  hardFilterPasses,
}: ListingCardProps) {
  const amenities = [
    hasGym && "gym",
    hasLaundry && "laundry",
    hasParking && "parking",
    petFriendly && "petFriendly",
  ].filter(Boolean) as string[];

  return (
    <Link href={`/listing/${id}`} className="block group">
      <article className="card overflow-hidden cursor-pointer">
        {/* Hero Image — 3:2 aspect ratio */}
        <div className="relative aspect-[3/2] overflow-hidden bg-border-light">
          <img
            src={photoUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />

          {/* Gradient scrim for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Price badge — bottom left over scrim */}
          <div className="absolute bottom-3 left-3">
            <span className="font-mono font-bold text-white text-lg leading-none">
              ${price.toLocaleString()}
            </span>
            <span className="text-white/70 text-sm ml-1">/mo</span>
          </div>

          {/* NEW badge */}
          {isNew && (
            <div className="absolute top-3 left-3 bg-accent text-white px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest shadow-sm">
              New
            </div>
          )}

          {/* Score circle — top right */}
          <div className="absolute top-3 right-3">
            <ScoreCircle score={score} size="sm" />
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title + address */}
          <div className="mb-3">
            <h3 className="font-display text-[19px] text-text-primary leading-snug group-hover:text-accent transition-colors duration-150 line-clamp-1">
              {title}
            </h3>
            <p className="text-text-muted text-sm mt-0.5 truncate">{address}</p>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-1 text-xs text-text-secondary mb-4">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-border-light">
              <span className="font-mono font-semibold text-text-primary">{beds}</span>
              <span>bed</span>
            </span>
            <span className="text-border px-0.5">&middot;</span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-border-light">
              <span className="font-mono font-semibold text-text-primary">{baths}</span>
              <span>bath</span>
            </span>
            <span className="text-border px-0.5">&middot;</span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-border-light">
              <span className="font-mono font-semibold text-text-primary">{sqft.toLocaleString()}</span>
              <span>sqft</span>
            </span>
          </div>

          {/* Neighborhood + Amenities */}
          <div className="flex items-center justify-between pt-3.5 border-t border-border-light">
            <div className="flex items-center gap-1.5">
              <span className="pill pill-accent text-[11px]">{neighborhood}</span>
              {hardFilterPasses === false && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                  Fails requirements
                </span>
              )}
            </div>

            {amenities.length > 0 && (
              <div className="flex items-center gap-1.5">
                {amenities.map((key) => {
                  const a = amenityIcons[key];
                  return (
                    <span
                      key={key}
                      title={a.label}
                      className="flex items-center justify-center w-6 h-6 rounded-md bg-border-light text-text-muted hover:bg-accent-light hover:text-accent transition-colors"
                    >
                      {a.icon}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
