import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { fetchCraigslistListings } from './sources/craigslist.mjs';
import { fetchBuildingListings } from './sources/buildings.mjs';
import { isInTargetNeighborhood, calculateCommutes, calculateWalkability, findNearestTransit } from './evaluate/geo.mjs';
import { analyzeListingText, analyzeListingPhotos, computeCompositeScore } from './evaluate/ai.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TURSO_URL = process.env.TURSO_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

const HARD_FILTER_MIN_PRICE = 0;
const HARD_FILTER_MAX_PRICE = 4500;
const HARD_FILTER_BEDROOMS = 2;
const HARD_FILTER_MIN_BATHROOMS = 1.5;

function generateId() {
  return crypto.randomUUID();
}

function nowISO() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

async function initDatabase(db) {
  const schemaPath = join(__dirname, '..', 'src', 'lib', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  // Split on semicolons and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  for (const stmt of statements) {
    await db.execute(stmt + ';');
  }
  console.log('[init] Database schema initialized');
}

function applyHardFilters(listing) {
  const reasons = [];

  if (listing.price != null) {
    if (listing.price < HARD_FILTER_MIN_PRICE || listing.price > HARD_FILTER_MAX_PRICE) {
      reasons.push(`price ${listing.price} outside ${HARD_FILTER_MIN_PRICE}-${HARD_FILTER_MAX_PRICE}`);
    }
  }

  if (listing.bedrooms != null && listing.bedrooms !== HARD_FILTER_BEDROOMS) {
    reasons.push(`bedrooms ${listing.bedrooms} != ${HARD_FILTER_BEDROOMS}`);
  }

  if (listing.bathrooms != null && listing.bathrooms < HARD_FILTER_MIN_BATHROOMS) {
    reasons.push(`bathrooms ${listing.bathrooms} < ${HARD_FILTER_MIN_BATHROOMS}`);
  }

  // Check neighborhood via coordinates if available
  if (listing.lat != null && listing.lon != null) {
    if (!isInTargetNeighborhood(listing.lat, listing.lon)) {
      reasons.push(`location (${listing.lat}, ${listing.lon}) not in target neighborhoods`);
    }
  }

  return {
    passes: reasons.length === 0,
    reasons,
  };
}

async function deduplicateListings(db, listings) {
  const newListings = [];
  const now = nowISO();

  for (const listing of listings) {
    const existing = await db.execute({
      sql: 'SELECT id FROM listings WHERE source_url = ?',
      args: [listing.source_url],
    });

    if (existing.rows.length > 0) {
      // Update last_seen_at for existing listing
      await db.execute({
        sql: 'UPDATE listings SET last_seen_at = ? WHERE id = ?',
        args: [now, existing.rows[0].id],
      });
    } else {
      newListings.push(listing);
    }
  }

  return newListings;
}

async function saveListing(db, listing, scores) {
  const now = nowISO();
  const id = listing.id || generateId();

  await db.execute({
    sql: `INSERT OR REPLACE INTO listings (
      id, source, source_url, source_id, title, price, bedrooms, bathrooms,
      sqft, address, neighborhood, lat, lon, description, floor,
      available_date, lease_term_months, broker_fee_months, pet_policy,
      parking_type, laundry_type, ac_type, has_gym, has_dishwasher,
      status, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id, listing.source, listing.source_url, listing.source_id || null,
      listing.title || null, listing.price || null, listing.bedrooms || null,
      listing.bathrooms || null, listing.sqft || null, listing.address || null,
      listing.neighborhood || null, listing.lat || null, listing.lon || null,
      listing.description || null, listing.floor || null,
      listing.available_date || null, listing.lease_term_months || null,
      listing.broker_fee_months || null, listing.pet_policy || null,
      listing.parking_type || null, listing.laundry_type || null,
      listing.ac_type || null, listing.has_gym ? 1 : 0,
      listing.has_dishwasher ? 1 : 0, 'new', now, now,
    ],
  });

  // Save photos if any
  if (listing.photos && listing.photos.length > 0) {
    for (let i = 0; i < listing.photos.length; i++) {
      await db.execute({
        sql: 'INSERT INTO photos (listing_id, url, ordinal) VALUES (?, ?, ?)',
        args: [id, listing.photos[i], i],
      });
    }
  }

  // Save scores
  if (scores) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO scores (
        listing_id, composite_score, passes_hard_filters, fail_reasons,
        akhil_drive_min, jayshree_transit_min, jayshree_walk_min,
        jayshree_transfers, jayshree_transit_route, newton_drive_min,
        kitchen_modernity, natural_light, bathroom_quality, overall_condition,
        bedroom_size_score, walk_coffee, walk_park, walk_grocery,
        walk_restaurant, walk_library, walk_transit_stop,
        nearest_transit_stop, nearest_transit_route,
        ai_summary, ai_notes, ai_confidence, scored_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, scores.composite_score, scores.passes_hard_filters ? 1 : 0,
        scores.fail_reasons || null,
        scores.akhil_drive_min || null, scores.jayshree_transit_min || null,
        scores.jayshree_walk_min || null, scores.jayshree_transfers || null,
        scores.jayshree_transit_route || null, scores.newton_drive_min || null,
        scores.kitchen_modernity || null, scores.natural_light || null,
        scores.bathroom_quality || null, scores.overall_condition || null,
        scores.bedroom_size_score || null, scores.walk_coffee || null,
        scores.walk_park || null, scores.walk_grocery || null,
        scores.walk_restaurant || null, scores.walk_library || null,
        scores.walk_transit_stop || null, scores.nearest_transit_stop || null,
        scores.nearest_transit_route || null,
        scores.ai_summary || null, scores.ai_notes || null,
        scores.ai_confidence || null, now,
      ],
    });
  }

  return id;
}

async function run() {
  console.log('=== Apartment Pipeline Started ===');
  console.log(`Time: ${new Date().toISOString()}`);

  // Initialize database
  const db = createClient({
    url: TURSO_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  await initDatabase(db);

  // Step 1: Fetch listings from all sources
  console.log('\n[fetch] Fetching listings from sources...');

  let allListings = [];

  try {
    const craigslistListings = await fetchCraigslistListings();
    console.log(`[fetch] Craigslist: ${craigslistListings.length} listings`);
    allListings = allListings.concat(craigslistListings);
  } catch (err) {
    console.error('[fetch] Craigslist fetch failed:', err.message);
  }

  try {
    const buildingListings = await fetchBuildingListings();
    console.log(`[fetch] Buildings: ${buildingListings.length} listings`);
    allListings = allListings.concat(buildingListings);
  } catch (err) {
    console.error('[fetch] Buildings fetch failed:', err.message);
  }

  console.log(`[fetch] Total raw listings: ${allListings.length}`);

  // Step 2: Deduplicate
  const newListings = await deduplicateListings(db, allListings);
  console.log(`[dedup] New listings: ${newListings.length} (${allListings.length - newListings.length} duplicates skipped)`);

  // Step 3: Apply hard filters
  const passing = [];
  const failing = [];

  for (const listing of newListings) {
    const { passes, reasons } = applyHardFilters(listing);
    if (passes) {
      passing.push(listing);
    } else {
      failing.push({ listing, reasons });
    }
  }

  console.log(`[filter] Passing hard filters: ${passing.length}`);
  console.log(`[filter] Failing hard filters: ${failing.length}`);

  // Save failing listings with fail reasons but no full evaluation
  for (const { listing, reasons } of failing) {
    await saveListing(db, listing, {
      passes_hard_filters: false,
      fail_reasons: reasons.join('; '),
      composite_score: 0,
    });
  }

  // Step 4: Geo evaluation + AI evaluation + scoring for passing listings
  let scored = 0;
  let errors = 0;

  for (const listing of passing) {
    try {
      const scores = { passes_hard_filters: true };

      // Geo evaluation
      if (listing.lat != null && listing.lon != null) {
        // Commutes
        const commutes = await calculateCommutes(listing.lat, listing.lon);
        if (commutes) {
          scores.akhil_drive_min = commutes.akhil_drive_min;
          scores.jayshree_transit_min = commutes.jayshree_transit_min;
          scores.jayshree_walk_min = commutes.jayshree_walk_min;
          scores.jayshree_transfers = commutes.jayshree_transfers;
          scores.jayshree_transit_route = commutes.jayshree_transit_route;
          scores.newton_drive_min = commutes.newton_drive_min;
        }

        // Walkability
        const walkability = await calculateWalkability(listing.lat, listing.lon);
        if (walkability) {
          scores.walk_coffee = walkability.walk_coffee;
          scores.walk_park = walkability.walk_park;
          scores.walk_grocery = walkability.walk_grocery;
          scores.walk_restaurant = walkability.walk_restaurant;
          scores.walk_library = walkability.walk_library;
        }

        // Transit
        const transit = findNearestTransit(listing.lat, listing.lon);
        if (transit) {
          scores.walk_transit_stop = transit.walk_minutes;
          scores.nearest_transit_stop = transit.stop_name;
          scores.nearest_transit_route = transit.route;
        }
      }

      // AI text analysis
      if (listing.description) {
        const textAnalysis = await analyzeListingText(listing.description);
        if (textAnalysis) {
          // Merge extracted amenity data back into listing for saving
          if (textAnalysis.parking_type) listing.parking_type = textAnalysis.parking_type;
          if (textAnalysis.laundry_type) listing.laundry_type = textAnalysis.laundry_type;
          if (textAnalysis.ac_type) listing.ac_type = textAnalysis.ac_type;
          if (textAnalysis.pet_policy) listing.pet_policy = textAnalysis.pet_policy;
          if (textAnalysis.has_gym != null) listing.has_gym = textAnalysis.has_gym;
          if (textAnalysis.has_dishwasher != null) listing.has_dishwasher = textAnalysis.has_dishwasher;
          if (textAnalysis.floor_number) listing.floor = textAnalysis.floor_number;
          if (textAnalysis.broker_fee != null) listing.broker_fee_months = textAnalysis.broker_fee;
          if (textAnalysis.lease_term) listing.lease_term_months = textAnalysis.lease_term;

          scores.ai_summary = textAnalysis.summary || null;
          scores.ai_notes = textAnalysis.red_flags
            ? JSON.stringify({ red_flags: textAnalysis.red_flags, highlights: textAnalysis.highlights })
            : null;
          scores.ai_confidence = textAnalysis.confidence || null;
        }
      }

      // AI photo analysis
      if (listing.photos && listing.photos.length > 0) {
        const photoAnalysis = await analyzeListingPhotos(listing.photos);
        if (photoAnalysis) {
          scores.kitchen_modernity = photoAnalysis.kitchen_modernity;
          scores.natural_light = photoAnalysis.natural_light;
          scores.bathroom_quality = photoAnalysis.bathroom_quality;
          scores.overall_condition = photoAnalysis.overall_condition;
          scores.bedroom_size_score = photoAnalysis.bedroom_size_score;
        }
      }

      // Compute composite
      scores.composite_score = computeCompositeScore({
        kitchen_modernity: scores.kitchen_modernity,
        natural_light: scores.natural_light,
        bathroom_quality: scores.bathroom_quality,
        overall_condition: scores.overall_condition,
        bedroom_size_score: scores.bedroom_size_score,
        ac_type: listing.ac_type,
        has_gym: listing.has_gym,
        price: listing.price,
        walk_coffee: scores.walk_coffee,
        walk_park: scores.walk_park,
        walk_grocery: scores.walk_grocery,
        walk_restaurant: scores.walk_restaurant,
        walk_library: scores.walk_library,
        walk_transit_stop: scores.walk_transit_stop,
        parking_type: listing.parking_type,
      });

      await saveListing(db, listing, scores);
      scored++;
      console.log(`[score] ${listing.title || listing.source_url}: ${scores.composite_score.toFixed(1)}`);
    } catch (err) {
      console.error(`[error] Failed to evaluate listing ${listing.source_url}:`, err.message);
      // Save without scores
      await saveListing(db, listing, { passes_hard_filters: true, composite_score: 0 });
      errors++;
    }
  }

  // Step 5: Summary
  console.log('\n=== Pipeline Summary ===');
  console.log(`Total fetched:        ${allListings.length}`);
  console.log(`New listings:         ${newListings.length}`);
  console.log(`Passed hard filters:  ${passing.length}`);
  console.log(`Failed hard filters:  ${failing.length}`);
  console.log(`Scored successfully:  ${scored}`);
  console.log(`Scoring errors:       ${errors}`);
  console.log('=== Pipeline Complete ===\n');
}

run().catch(err => {
  console.error('Pipeline fatal error:', err);
  process.exit(1);
});
