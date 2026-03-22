CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_id TEXT,
  title TEXT,
  price INTEGER,
  bedrooms REAL,
  bathrooms REAL,
  sqft INTEGER,
  address TEXT,
  neighborhood TEXT,
  lat REAL,
  lon REAL,
  description TEXT,
  floor INTEGER,
  available_date TEXT,
  lease_term_months INTEGER,
  broker_fee_months REAL,
  pet_policy TEXT,
  parking_type TEXT,
  laundry_type TEXT,
  ac_type TEXT,
  has_gym INTEGER DEFAULT 0,
  has_dishwasher INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new',
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  url TEXT NOT NULL,
  ordinal INTEGER,
  ai_room_type TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scores (
  listing_id TEXT PRIMARY KEY REFERENCES listings(id),
  composite_score REAL,
  passes_hard_filters INTEGER,
  fail_reasons TEXT,
  akhil_drive_min REAL,
  jayshree_transit_min REAL,
  jayshree_walk_min REAL,
  jayshree_transfers INTEGER,
  jayshree_transit_route TEXT,
  newton_drive_min REAL,
  kitchen_modernity REAL,
  natural_light REAL,
  bathroom_quality REAL,
  overall_condition REAL,
  bedroom_size_score REAL,
  walk_coffee REAL,
  walk_park REAL,
  walk_grocery REAL,
  walk_restaurant REAL,
  walk_library REAL,
  walk_transit_stop REAL,
  nearest_transit_stop TEXT,
  nearest_transit_route TEXT,
  ai_summary TEXT,
  ai_notes TEXT,
  ai_confidence REAL,
  scored_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  action TEXT NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_neighborhood ON listings(neighborhood);
CREATE INDEX IF NOT EXISTS idx_scores_composite ON scores(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
