import FeedClient from "@/components/FeedClient";
import { listings } from "@/lib/mock-data";

export default function FeedPage() {
  const newCount = listings.filter((l) => l.isNew).length;
  const passCount = listings.filter((l) => l.hardFilterStatus.passes).length;
  const topScore = Math.max(...listings.map((l) => l.score));

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 pb-8 border-b border-border-light">
        <h1 className="font-display text-[2.25rem] sm:text-5xl text-text-primary leading-tight tracking-tight">
          Your Feed
        </h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3">
          <span className="text-text-secondary text-sm">
            <span className="font-mono font-semibold text-text-primary">{listings.length}</span>
            {" "}listings found
          </span>
          <span className="text-border-light select-none">&middot;</span>
          <span className="text-sm">
            <span className="font-mono font-semibold text-accent">{passCount}</span>
            <span className="text-text-secondary"> pass all requirements</span>
          </span>
          <span className="text-border-light select-none">&middot;</span>
          <span className="text-sm">
            <span className="text-text-secondary">Top score </span>
            <span className="font-mono font-semibold text-accent">{topScore}</span>
          </span>
        </div>
      </div>

      <FeedClient listings={listings} />
    </div>
  );
}
