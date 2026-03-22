export interface Listing {
  id: string;
  source: string;
  source_url: string;
  source_id: string | null;
  title: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  address: string | null;
  neighborhood: string | null;
  lat: number | null;
  lon: number | null;
  description: string | null;
  floor: number | null;
  available_date: string | null;
  lease_term_months: number | null;
  broker_fee_months: number | null;
  pet_policy: string | null;
  parking_type: string | null;
  laundry_type: string | null;
  ac_type: string | null;
  has_gym: number;
  has_dishwasher: number;
  status: string;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
}

export interface Photo {
  id: number;
  listing_id: string;
  url: string;
  ordinal: number | null;
  ai_room_type: string | null;
  created_at: string;
}

export interface Score {
  listing_id: string;
  composite_score: number | null;
  passes_hard_filters: number | null;
  fail_reasons: string | null;
  akhil_drive_min: number | null;
  jayshree_transit_min: number | null;
  jayshree_walk_min: number | null;
  jayshree_transfers: number | null;
  jayshree_transit_route: string | null;
  newton_drive_min: number | null;
  kitchen_modernity: number | null;
  natural_light: number | null;
  bathroom_quality: number | null;
  overall_condition: number | null;
  bedroom_size_score: number | null;
  walk_coffee: number | null;
  walk_park: number | null;
  walk_grocery: number | null;
  walk_restaurant: number | null;
  walk_library: number | null;
  walk_transit_stop: number | null;
  nearest_transit_stop: string | null;
  nearest_transit_route: string | null;
  ai_summary: string | null;
  ai_notes: string | null;
  ai_confidence: number | null;
  scored_at: string;
}

export interface UserAction {
  id: number;
  listing_id: string;
  action: string;
  note: string | null;
  created_at: string;
}

export interface ListingWithScore extends Listing {
  composite_score: number | null;
  passes_hard_filters: number | null;
  fail_reasons: string | null;
  akhil_drive_min: number | null;
  jayshree_transit_min: number | null;
  jayshree_walk_min: number | null;
  jayshree_transfers: number | null;
  jayshree_transit_route: string | null;
  newton_drive_min: number | null;
  kitchen_modernity: number | null;
  natural_light: number | null;
  bathroom_quality: number | null;
  overall_condition: number | null;
  bedroom_size_score: number | null;
  walk_coffee: number | null;
  walk_park: number | null;
  walk_grocery: number | null;
  walk_restaurant: number | null;
  walk_library: number | null;
  walk_transit_stop: number | null;
  nearest_transit_stop: string | null;
  nearest_transit_route: string | null;
  ai_summary: string | null;
  ai_notes: string | null;
  ai_confidence: number | null;
  scored_at: string | null;
  photos: Photo[];
}
