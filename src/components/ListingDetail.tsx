"use client";

import { useState } from "react";
import Link from "next/link";
import ScoreCircle from "./ScoreCircle";
import type { Listing } from "@/lib/mock-data";

// ─── Commute Bar ────────────────────────────────────────────────────────────

function CommuteBar({
  label,
  minutes,
  maxMin = 45,
}: {
  label: string;
  minutes: number;
  maxMin?: number;
}) {
  const pct = Math.min((minutes / maxMin) * 100, 100);
  const isGreat = minutes <= 15;
  const isGood = minutes <= 30 && !isGreat;

  const barColor = isGreat
    ? "bg-score-great"
    : isGood
      ? "bg-score-good"
      : "bg-score-mid";

  const badgeColor = isGreat
    ? "bg-[#E8F5F0] text-score-great"
    : isGood
      ? "bg-[#FBF0E0] text-score-good"
      : "bg-border-light text-text-secondary";

  const label2 = isGreat ? "Great" : isGood ? "Good" : "Long";

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-text-secondary w-40 shrink-0 leading-tight">
        {label}
      </span>
      <div className="flex-1 h-2 bg-border-light rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} bar-animate`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-sm font-semibold text-text-primary w-12 text-right">
          {minutes} min
        </span>
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${badgeColor}`}>
          {label2}
        </span>
      </div>
    </div>
  );
}

// ─── Score Bar ───────────────────────────────────────────────────────────────

function ScoreBar({ label, score }: { label: string; score: number }) {
  const isGreat = score >= 80;
  const isGood = score >= 60 && !isGreat;

  const barColor = isGreat
    ? "bg-score-great"
    : isGood
      ? "bg-score-good"
      : "bg-score-mid";

  const scoreColor = isGreat
    ? "text-score-great"
    : isGood
      ? "text-score-good"
      : "text-score-mid";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-text-secondary w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-border-light rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} bar-animate`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`font-mono text-sm font-bold w-8 text-right ${scoreColor}`}>
        {score}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ListingDetail({ listing }: { listing: Listing }) {
  const [mainPhoto, setMainPhoto] = useState(listing.photos[0]);
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <div>
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-6 text-sm group"
      >
        <svg
          className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to feed
      </Link>

      {/* Photo Gallery */}
      <div className="card overflow-hidden mb-8">
        <div className="aspect-[3/2] sm:aspect-[16/7] overflow-hidden bg-border-light">
          <img
            src={mainPhoto}
            alt={listing.title}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        </div>
        {listing.photos.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto bg-white">
            {listing.photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setMainPhoto(photo)}
                className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  mainPhoto === photo
                    ? "border-accent ring-1 ring-accent/30 opacity-100"
                    : "border-transparent opacity-50 hover:opacity-100 hover:border-border"
                }`}
              >
                <img
                  src={photo}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Left Column ── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Header card */}
          <div className="card p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <span className="pill pill-accent text-[11px] mb-3 inline-flex">
                  {listing.neighborhood}
                </span>
                <h1 className="font-display text-[2rem] sm:text-[2.5rem] text-text-primary leading-tight tracking-tight">
                  {listing.title}
                </h1>
                <p className="text-text-secondary mt-1.5 text-base">{listing.address}</p>
                {listing.sourceUrl && (
                  <a
                    href={listing.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors mt-2"
                  >
                    View Original Listing
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                )}
              </div>
              <div className="text-right shrink-0 mt-1">
                <div className="font-mono text-3xl font-bold text-text-primary leading-none">
                  ${listing.price.toLocaleString()}
                </div>
                <span className="text-text-muted text-sm">/month</span>
              </div>
            </div>

            {/* Stats strip */}
            <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-border-light divide-x divide-border-light">
              {[
                { value: listing.beds, label: "Beds" },
                { value: listing.baths, label: "Baths" },
                { value: listing.sqft.toLocaleString(), label: "Sq Ft" },
              ].map(({ value, label }) => (
                <div key={label} className="flex-1 text-center py-4 bg-bg-primary/50">
                  <div className="font-mono text-xl font-bold text-text-primary leading-none">
                    {value}
                  </div>
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commute Times */}
          <section className="card p-6 sm:p-8">
            <h2 className="section-title flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-accent-light flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </span>
              Commute Times
            </h2>
            <div className="space-y-5">
              <CommuteBar label="Oreo (drive)" minutes={listing.commute.oreoDrive} />
              <CommuteBar label="Sugar Cookie (transit)" minutes={listing.commute.sugarCookieTransit} />
              <CommuteBar label="Family / Newton (drive)" minutes={listing.commute.newtonDrive} />
            </div>
          </section>

          {/* Walkability */}
          <section className="card p-6 sm:p-8">
            <h2 className="section-title flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-accent-light flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </span>
              Walkability
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(listing.walkability).map(([key, { name, walkMin }]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-bg-primary border border-border-light"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                    <p className="text-xs text-text-muted capitalize mt-0.5">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-sm font-bold text-text-primary">
                      {walkMin}
                    </span>
                    <span className="text-xs text-text-muted ml-1">min</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* About */}
          <section className="card p-6 sm:p-8">
            <h2 className="section-title">About This Listing</h2>
            <p className="text-text-secondary leading-[1.75] text-[15px]">
              {listing.description}
            </p>
          </section>

          {/* Details */}
          <section className="card p-6 sm:p-8">
            <h2 className="section-title">Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
              {Object.entries(listing.details).map(([key, value]) => (
                <div key={key}>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  <p className="text-sm font-medium text-text-primary">{value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Right Column (sticky) ── */}
        <div className="lg:w-[360px] shrink-0">
          <div className="lg:sticky lg:top-8 space-y-5">

            {/* Composite Score card */}
            <div className="card p-6 sm:p-8">
              <div className="flex flex-col items-center mb-7">
                <ScoreCircle score={listing.score} size="lg" />
                <p className="text-xs text-text-muted uppercase tracking-widest mt-3 font-medium">
                  Match Score
                </p>
              </div>

              {/* Score breakdown — categories */}
              <div className="space-y-3.5 mb-6">
                <ScoreBar label="Unit Quality" score={listing.categoryScores.unitQuality} />
                <ScoreBar label="Commute" score={listing.categoryScores.commute} />
                <ScoreBar label="Walkability" score={listing.categoryScores.walkability} />
                <ScoreBar label="Amenities" score={listing.categoryScores.amenities} />
                <ScoreBar label="Value" score={listing.categoryScores.value} />
              </div>

              {/* AI Photo scores — 1-10 scale */}
              <p className="text-[10px] text-text-muted uppercase tracking-widest mb-3 font-medium">
                Photo Analysis (1–10)
              </p>
              <div className="space-y-2.5">
                <ScoreBar label="Kitchen" score={listing.aiScores.kitchenModernity * 10} />
                <ScoreBar label="Natural Light" score={listing.aiScores.naturalLight * 10} />
                <ScoreBar label="Bathroom" score={listing.aiScores.bathroomQuality * 10} />
                <ScoreBar label="Condition" score={listing.aiScores.overallCondition * 10} />
                <ScoreBar label="Bedroom Size" score={listing.aiScores.bedroomSize * 10} />
              </div>

              {/* Hard filter status */}
              {!listing.hardFilterStatus.passes && (
                <div className="mt-5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
                  <p className="text-xs font-semibold text-[#DC2626] uppercase tracking-wider mb-2">
                    Hard Filter Failures
                  </p>
                  <ul className="space-y-1.5">
                    {listing.hardFilterStatus.failures.map((f, i) => (
                      <li key={i} className="text-xs text-[#991B1B] flex items-start gap-2">
                        <span className="mt-1 shrink-0">✕</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* AI Summary */}
            <div className="card p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  AI Summary
                </h3>
              </div>
              <blockquote className="border-l-2 border-accent/40 pl-4 text-text-secondary leading-relaxed italic text-[15px]">
                {listing.aiSummary}
              </blockquote>
            </div>

            {/* Resident Reviews */}
            {listing.reviews && (
              <div className="card p-6 sm:p-8" style={{ background: "#EFF6FF" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-md bg-[#DBEAFE] flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-[#3B82F6]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-semibold text-[#3B82F6] uppercase tracking-wider">
                    Resident Reviews
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-4 h-4"
                      fill={star <= Math.round(listing.reviews!.rating) ? "#FBBF24" : "none"}
                      stroke="#FBBF24"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                  <span className="text-sm font-mono font-semibold text-text-primary ml-1">
                    {listing.reviews.rating.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-text-muted mb-3">
                  {listing.reviews.count} reviews on {listing.reviews.source}
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {listing.reviews.summary}
                </p>
              </div>
            )}

            {/* Notes & Flags */}
            {listing.aiNotes.length > 0 && (
              <div className="card p-6 sm:p-8" style={{ background: "#FFFBF4" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-md bg-[#FBF0E0] flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-score-good" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-semibold text-score-good uppercase tracking-wider">
                    Notes &amp; Flags
                  </h3>
                </div>
                <ul className="space-y-2.5">
                  {listing.aiNotes.map((note, i) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-score-good/60 mt-2 shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isFavorited
                    ? "bg-accent text-white shadow-sm shadow-accent/30"
                    : "bg-accent-light text-accent hover:bg-accent hover:text-white"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill={isFavorited ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                {isFavorited ? "Saved" : "Save"}
              </button>
              <button
                title="Skip listing"
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-border-light text-text-muted hover:bg-[#FBEAEA] hover:text-[#C0392B] transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                title="Edit notes"
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-border-light text-text-muted hover:bg-accent-light hover:text-accent transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
