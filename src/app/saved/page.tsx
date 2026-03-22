import Link from "next/link";

export default function SavedPage() {
  return (
    <div>
      <div className="mb-8 pb-8 border-b border-border-light">
        <h1 className="font-display text-[2.25rem] sm:text-5xl text-text-primary leading-tight tracking-tight">
          Saved Listings
        </h1>
        <p className="text-text-secondary mt-2 text-base">
          Your favorited apartments, all in one place
        </p>
      </div>

      {/* Beautiful empty state */}
      <div className="card-static rounded-2xl overflow-hidden border border-border-light">
        {/* Decorative header band */}
        <div
          className="h-2 w-full"
          style={{ background: "linear-gradient(90deg, #1B6B5A 0%, #C4872A 50%, #1B6B5A 100%)" }}
          aria-hidden="true"
        />

        <div className="py-20 px-8 text-center">
          {/* Illustration */}
          <div className="w-24 h-24 mx-auto mb-7 rounded-full bg-accent-light flex items-center justify-center">
            <svg
              className="w-11 h-11 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl text-text-primary mb-3">
            Nothing saved yet
          </h2>

          <p className="text-text-secondary max-w-sm mx-auto leading-relaxed text-[15px]">
            Tap the heart on any listing to save it here. Build your shortlist
            and compare your favorites side by side.
          </p>

          {/* Hint steps */}
          <div className="mt-10 mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto text-left">
            {[
              {
                step: "1",
                title: "Browse the feed",
                body: "Explore all listings scored for your commute and preferences.",
              },
              {
                step: "2",
                title: "Heart a listing",
                body: "Tap Save on any apartment detail page to add it here.",
              },
              {
                step: "3",
                title: "Compare &amp; decide",
                body: "View your shortlist side by side to make the call.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl bg-bg-primary border border-border-light p-4"
              >
                <div className="w-7 h-7 rounded-full bg-accent-light text-accent text-xs font-mono font-bold flex items-center justify-center mb-3">
                  {item.step}
                </div>
                <p className="text-sm font-semibold text-text-primary mb-1">
                  {item.title}
                </p>
                <p
                  className="text-xs text-text-muted leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.body }}
                />
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover transition-all duration-150 shadow-sm shadow-accent/20"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Browse listings
          </Link>
        </div>
      </div>
    </div>
  );
}
