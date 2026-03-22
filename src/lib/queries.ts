import { getDb } from "./db";
import type { ListingWithScore, Photo, UserAction } from "./types";

export interface ListingFilters {
  status?: string;
  neighborhood?: string;
  minScore?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "score" | "price" | "date" | "price_desc";
  limit?: number;
  offset?: number;
}

export async function getListings(
  filters: ListingFilters = {}
): Promise<ListingWithScore[]> {
  const db = getDb();
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (filters.status) {
    conditions.push("l.status = ?");
    args.push(filters.status);
  }

  if (filters.neighborhood) {
    conditions.push("l.neighborhood = ?");
    args.push(filters.neighborhood);
  }

  if (filters.minScore !== undefined) {
    conditions.push("s.composite_score >= ?");
    args.push(filters.minScore);
  }

  if (filters.minPrice !== undefined) {
    conditions.push("l.price >= ?");
    args.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    conditions.push("l.price <= ?");
    args.push(filters.maxPrice);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy: string;
  switch (filters.sortBy) {
    case "score":
      orderBy = "ORDER BY s.composite_score DESC NULLS LAST";
      break;
    case "price":
      orderBy = "ORDER BY l.price ASC NULLS LAST";
      break;
    case "price_desc":
      orderBy = "ORDER BY l.price DESC NULLS LAST";
      break;
    case "date":
      orderBy = "ORDER BY l.first_seen_at DESC";
      break;
    default:
      orderBy = "ORDER BY s.composite_score DESC NULLS LAST";
  }

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const sql = `
    SELECT l.*, s.composite_score, s.passes_hard_filters, s.fail_reasons,
      s.akhil_drive_min, s.jayshree_transit_min, s.jayshree_walk_min,
      s.jayshree_transfers, s.jayshree_transit_route, s.newton_drive_min,
      s.kitchen_modernity, s.natural_light, s.bathroom_quality,
      s.overall_condition, s.bedroom_size_score,
      s.walk_coffee, s.walk_park, s.walk_grocery, s.walk_restaurant,
      s.walk_library, s.walk_transit_stop, s.nearest_transit_stop,
      s.nearest_transit_route, s.ai_summary, s.ai_notes, s.ai_confidence,
      s.scored_at
    FROM listings l
    LEFT JOIN scores s ON l.id = s.listing_id
    ${where}
    ${orderBy}
    LIMIT ? OFFSET ?
  `;

  args.push(limit, offset);

  const result = await db.execute({ sql, args });

  return result.rows.map((row) => ({
    ...(row as unknown as ListingWithScore),
    photos: [],
  }));
}

export async function getListing(
  id: string
): Promise<ListingWithScore | null> {
  const db = getDb();

  const listingResult = await db.execute({
    sql: `
      SELECT l.*, s.composite_score, s.passes_hard_filters, s.fail_reasons,
        s.akhil_drive_min, s.jayshree_transit_min, s.jayshree_walk_min,
        s.jayshree_transfers, s.jayshree_transit_route, s.newton_drive_min,
        s.kitchen_modernity, s.natural_light, s.bathroom_quality,
        s.overall_condition, s.bedroom_size_score,
        s.walk_coffee, s.walk_park, s.walk_grocery, s.walk_restaurant,
        s.walk_library, s.walk_transit_stop, s.nearest_transit_stop,
        s.nearest_transit_route, s.ai_summary, s.ai_notes, s.ai_confidence,
        s.scored_at
      FROM listings l
      LEFT JOIN scores s ON l.id = s.listing_id
      WHERE l.id = ?
    `,
    args: [id],
  });

  if (listingResult.rows.length === 0) return null;

  const photosResult = await db.execute({
    sql: "SELECT * FROM photos WHERE listing_id = ? ORDER BY ordinal ASC",
    args: [id],
  });

  return {
    ...(listingResult.rows[0] as unknown as ListingWithScore),
    photos: photosResult.rows as unknown as Photo[],
  };
}

export async function getFavorites(): Promise<ListingWithScore[]> {
  const db = getDb();

  const result = await db.execute({
    sql: `
      SELECT DISTINCT l.*, s.composite_score, s.passes_hard_filters, s.fail_reasons,
        s.akhil_drive_min, s.jayshree_transit_min, s.jayshree_walk_min,
        s.jayshree_transfers, s.jayshree_transit_route, s.newton_drive_min,
        s.kitchen_modernity, s.natural_light, s.bathroom_quality,
        s.overall_condition, s.bedroom_size_score,
        s.walk_coffee, s.walk_park, s.walk_grocery, s.walk_restaurant,
        s.walk_library, s.walk_transit_stop, s.nearest_transit_stop,
        s.nearest_transit_route, s.ai_summary, s.ai_notes, s.ai_confidence,
        s.scored_at
      FROM listings l
      LEFT JOIN scores s ON l.id = s.listing_id
      INNER JOIN user_actions ua ON l.id = ua.listing_id AND ua.action = 'favorite'
      ORDER BY s.composite_score DESC NULLS LAST
    `,
    args: [],
  });

  return result.rows.map((row) => ({
    ...(row as unknown as ListingWithScore),
    photos: [],
  }));
}

export async function addUserAction(
  listingId: string,
  action: string,
  note?: string
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: "INSERT INTO user_actions (listing_id, action, note) VALUES (?, ?, ?)",
    args: [listingId, action, note ?? null],
  });
}

export interface ListingStats {
  total: number;
  byStatus: Record<string, number>;
  avgScore: number | null;
  avgPrice: number | null;
  favoriteCount: number;
}

export async function getListingStats(): Promise<ListingStats> {
  const db = getDb();

  const [totalResult, statusResult, scoreResult, priceResult, favResult] =
    await Promise.all([
      db.execute("SELECT COUNT(*) as count FROM listings"),
      db.execute(
        "SELECT status, COUNT(*) as count FROM listings GROUP BY status"
      ),
      db.execute(
        "SELECT AVG(composite_score) as avg_score FROM scores WHERE composite_score IS NOT NULL"
      ),
      db.execute(
        "SELECT AVG(price) as avg_price FROM listings WHERE price IS NOT NULL"
      ),
      db.execute(
        "SELECT COUNT(DISTINCT listing_id) as count FROM user_actions WHERE action = 'favorite'"
      ),
    ]);

  const byStatus: Record<string, number> = {};
  for (const row of statusResult.rows) {
    const status = row.status as string;
    const count = row.count as number;
    byStatus[status] = count;
  }

  return {
    total: totalResult.rows[0].count as number,
    byStatus,
    avgScore: (scoreResult.rows[0].avg_score as number) ?? null,
    avgPrice: (priceResult.rows[0].avg_price as number) ?? null,
    favoriteCount: favResult.rows[0].count as number,
  };
}
