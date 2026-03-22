"use client";

// Shared input class
const inputClass =
  "w-full px-4 py-3 h-11 rounded-xl border border-border bg-bg-primary text-text-primary placeholder:text-text-muted transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent hover:border-text-muted";

const selectClass =
  "w-full px-4 py-3 h-11 rounded-xl border border-border bg-bg-primary text-text-primary appearance-none transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent hover:border-text-muted";

function FieldLabel({
  children,
  optional,
}: {
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-text-primary mb-2">
      {children}
      {optional && (
        <span className="text-text-muted font-normal ml-1.5 text-xs">optional</span>
      )}
    </label>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border-light" />
      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest shrink-0">
        {label}
      </span>
      <div className="h-px flex-1 bg-border-light" />
    </div>
  );
}

export default function AddListingPage() {
  return (
    <div>
      <div className="mb-8 pb-8 border-b border-border-light">
        <h1 className="font-display text-[2.25rem] sm:text-5xl text-text-primary leading-tight tracking-tight">
          Add Listing
        </h1>
        <p className="text-text-secondary mt-2 text-base">
          Manually add an apartment for AI evaluation
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="card p-6 sm:p-8">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-7">

            {/* Source */}
            <div>
              <FieldLabel optional>Listing URL</FieldLabel>
              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                </div>
                <input
                  type="url"
                  placeholder="https://zillow.com/..."
                  className={`${inputClass} pl-10`}
                />
              </div>
              <p className="mt-1.5 text-xs text-text-muted">
                Paste a Zillow, Redfin, or Craigslist URL to auto-fill details
              </p>
            </div>

            <SectionDivider label="Listing details" />

            {/* Title */}
            <div>
              <FieldLabel>Title</FieldLabel>
              <input
                type="text"
                placeholder="e.g. Sunny 2BR near Jamaica Pond"
                className={inputClass}
              />
            </div>

            {/* Price & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Rent</FieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">$</span>
                  <input
                    type="number"
                    placeholder="3500"
                    className={`${inputClass} pl-7 font-mono`}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Address</FieldLabel>
                <input
                  type="text"
                  placeholder="123 Main St, Jamaica Plain"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Beds, Baths, Sqft */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <FieldLabel>Beds</FieldLabel>
                <div className="relative">
                  <select className={selectClass}>
                    <option>1</option>
                    <option defaultValue="2">2</option>
                    <option>3</option>
                    <option>4</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <FieldLabel>Baths</FieldLabel>
                <div className="relative">
                  <select className={selectClass}>
                    <option defaultValue="1">1</option>
                    <option>1.5</option>
                    <option>2</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <FieldLabel optional>Sq Ft</FieldLabel>
                <input
                  type="number"
                  placeholder="900"
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <FieldLabel optional>Description</FieldLabel>
              <textarea
                rows={4}
                placeholder="Paste the listing description here..."
                className={`${inputClass} h-auto resize-none leading-relaxed py-3`}
              />
            </div>

            <SectionDivider label="Photos" />

            {/* Photo Upload */}
            <div>
              <label
                htmlFor="photo-upload"
                className="group block border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer transition-all duration-200 hover:border-accent/50 hover:bg-accent-light/20"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent-light flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                  <svg
                    className="w-7 h-7 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-text-secondary">
                  <span className="text-accent font-semibold">Click to upload</span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-text-muted mt-1.5">
                  PNG, JPG &mdash; up to 10 MB each
                </p>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                />
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full h-12 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover active:scale-[0.99] transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-accent/25 mt-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Evaluate with AI
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
