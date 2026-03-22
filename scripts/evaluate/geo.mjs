/**
 * Geospatial evaluation: neighborhood checks, commute calculations,
 * walkability scoring, and transit access.
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ============================================================
// Neighborhood bounding boxes
// ============================================================

const NEIGHBORHOODS = {
  'Jamaica Plain': {
    latMin: 42.295, latMax: 42.325,
    lonMin: -71.13, lonMax: -71.10,
  },
  'Brookline': {
    latMin: 42.33, latMax: 42.35,
    lonMin: -71.16, lonMax: -71.12,
  },
  'South Huntington': {
    latMin: 42.325, latMax: 42.34,
    lonMin: -71.11, lonMax: -71.10,
  },
  'Roslindale': {
    latMin: 42.28, latMax: 42.30,
    lonMin: -71.14, lonMax: -71.11,
  },
};

export function isInTargetNeighborhood(lat, lon) {
  for (const [name, bounds] of Object.entries(NEIGHBORHOODS)) {
    if (
      lat >= bounds.latMin && lat <= bounds.latMax &&
      lon >= bounds.lonMin && lon <= bounds.lonMax
    ) {
      return name;
    }
  }
  return false;
}

// ============================================================
// Commute calculations via Google Routes API
// ============================================================

const COMMUTE_DESTINATIONS = {
  oreo_work: {
    address: '330 Brookline Ave, Boston, MA 02215', // Shapiro Center
    lat: 42.3380,
    lon: -71.1065,
  },
  sugar_cookie_work: {
    address: '216 Massachusetts Ave, Boston, MA 02115',
    lat: 42.3475,
    lon: -71.0868,
  },
  newton: {
    address: '80 [redacted] Rd, Newton, MA 02459',
    lat: 42.3290,
    lon: -71.2090,
  },
};

export async function calculateCommutes(lat, lon) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.log('[geo] No GOOGLE_MAPS_API_KEY, skipping commute calculation');
    return null;
  }

  try {
    const results = {};

    // Oreo: drive to Shapiro Center at 8am
    const oreoDrive = await getRouteTime(
      lat, lon,
      COMMUTE_DESTINATIONS.oreo_work.lat,
      COMMUTE_DESTINATIONS.oreo_work.lon,
      'DRIVE',
      '08:00'
    );
    results.oreo_drive_min = oreoDrive;

    // Sugar Cookie: transit to 216 Mass Ave
    const sugar_cookieTransit = await getRouteTime(
      lat, lon,
      COMMUTE_DESTINATIONS.sugar_cookie_work.lat,
      COMMUTE_DESTINATIONS.sugar_cookie_work.lon,
      'TRANSIT',
      '08:00'
    );
    results.sugar_cookie_transit_min = sugar_cookieTransit;

    // Approximate walking portion of transit (we can't get this from Routes API directly)
    // Estimate based on distance to nearest transit stop
    const transit = findNearestTransit(lat, lon);
    results.sugar_cookie_walk_min = transit ? transit.walk_minutes : null;
    results.sugar_cookie_transfers = null; // Routes API doesn't expose this easily
    results.sugar_cookie_transit_route = transit ? transit.route : null;

    // Newton: drive to [redacted] Rd
    const newtonDrive = await getRouteTime(
      lat, lon,
      COMMUTE_DESTINATIONS.newton.lat,
      COMMUTE_DESTINATIONS.newton.lon,
      'DRIVE',
      '10:00'
    );
    results.newton_drive_min = newtonDrive;

    return results;
  } catch (err) {
    console.error('[geo] Commute calculation error:', err.message);
    return null;
  }
}

async function getRouteTime(originLat, originLon, destLat, destLon, travelMode, departureTime) {
  // Use Google Directions API (more widely available than Routes API)
  const origin = `${originLat},${originLon}`;
  const destination = `${destLat},${destLon}`;

  // Build departure_time as next occurrence of the given time
  const now = new Date();
  const [hours, minutes] = departureTime.split(':').map(Number);
  const departure = new Date(now);
  departure.setHours(hours, minutes, 0, 0);
  if (departure <= now) {
    departure.setDate(departure.getDate() + 1);
  }
  // Skip to next weekday
  while (departure.getDay() === 0 || departure.getDay() === 6) {
    departure.setDate(departure.getDate() + 1);
  }
  const departureTimestamp = Math.floor(departure.getTime() / 1000);

  const mode = travelMode.toLowerCase();
  const params = new URLSearchParams({
    origin,
    destination,
    mode,
    departure_time: departureTimestamp.toString(),
    key: GOOGLE_MAPS_API_KEY,
  });

  const url = `https://maps.googleapis.com/maps/api/directions/json?${params}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
    console.warn(`[geo] Directions API returned ${data.status} for ${mode} route`);
    return null;
  }

  const leg = data.routes[0].legs[0];
  // Use duration_in_traffic for driving if available
  const duration = leg.duration_in_traffic || leg.duration;
  return Math.round(duration.value / 60);
}

// ============================================================
// Walkability via Overpass API (OpenStreetMap)
// ============================================================

const AMENITY_QUERIES = {
  coffee: ['cafe', 'coffee_shop'],
  park: ['park'],
  grocery: ['supermarket', 'grocery'],
  library: ['library'],
  restaurant: ['restaurant'],
};

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// Search radius in meters
const SEARCH_RADIUS = 1500;

// Walking speed in m/s
const WALK_SPEED = 1.34;

export async function calculateWalkability(lat, lon) {
  try {
    const results = {};

    for (const [key, amenityTypes] of Object.entries(AMENITY_QUERIES)) {
      try {
        const nearestDist = await findNearestAmenity(lat, lon, amenityTypes);
        // Convert meters to walk minutes
        if (nearestDist !== null) {
          results[`walk_${key}`] = Math.round((nearestDist / WALK_SPEED) / 60 * 10) / 10;
        } else {
          results[`walk_${key}`] = null;
        }
      } catch (err) {
        console.warn(`[geo] Error finding ${key}:`, err.message);
        results[`walk_${key}`] = null;
      }
    }

    return results;
  } catch (err) {
    console.error('[geo] Walkability calculation error:', err.message);
    return null;
  }
}

async function findNearestAmenity(lat, lon, amenityTypes) {
  // Build Overpass query for multiple amenity types
  const amenityFilters = amenityTypes.map(type => {
    if (type === 'park') {
      return `node["leisure"="park"](around:${SEARCH_RADIUS},${lat},${lon});
              way["leisure"="park"](around:${SEARCH_RADIUS},${lat},${lon});`;
    }
    if (type === 'grocery' || type === 'supermarket') {
      return `node["shop"="supermarket"](around:${SEARCH_RADIUS},${lat},${lon});
              node["shop"="grocery"](around:${SEARCH_RADIUS},${lat},${lon});
              node["shop"="convenience"](around:${SEARCH_RADIUS},${lat},${lon});`;
    }
    if (type === 'coffee_shop') {
      return `node["cuisine"="coffee"](around:${SEARCH_RADIUS},${lat},${lon});`;
    }
    return `node["amenity"="${type}"](around:${SEARCH_RADIUS},${lat},${lon});`;
  }).join('\n');

  const query = `
    [out:json][timeout:10];
    (
      ${amenityFilters}
    );
    out center body 5;
  `;

  const response = await fetch(OVERPASS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.elements || data.elements.length === 0) {
    return null;
  }

  // Find nearest element
  let minDist = Infinity;
  for (const el of data.elements) {
    const elLat = el.lat || el.center?.lat;
    const elLon = el.lon || el.center?.lon;
    if (elLat && elLon) {
      const dist = haversineDistance(lat, lon, elLat, elLon);
      if (dist < minDist) {
        minDist = dist;
      }
    }
  }

  return minDist === Infinity ? null : minDist;
}

// ============================================================
// Haversine distance (meters)
// ============================================================

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ============================================================
// Transit stop proximity
// ============================================================

const ROUTE_39_STOPS = [
  { name: 'Centre St @ Seaverns Ave', lat: 42.3169, lon: -71.1097, route: 'Route 39' },
  { name: 'Centre St @ Burroughs St', lat: 42.3140, lon: -71.1131, route: 'Route 39' },
  { name: 'S Huntington Ave @ Perkins St', lat: 42.3268, lon: -71.1068, route: 'Route 39' },
  { name: 'S Huntington Ave @ Huntington Ave', lat: 42.3325, lon: -71.1002, route: 'Route 39' },
  { name: 'Huntington Ave @ Longwood Ave', lat: 42.3380, lon: -71.1030, route: 'Route 39' },
];

const GREEN_LINE_STOPS = [
  { name: 'Brookline Village', lat: 42.3325, lon: -71.1168, route: 'Green Line D' },
  { name: 'Longwood', lat: 42.3418, lon: -71.1100, route: 'Green Line D' },
  { name: 'Coolidge Corner', lat: 42.3420, lon: -71.1312, route: 'Green Line C' },
  { name: 'Washington Square', lat: 42.3393, lon: -71.1361, route: 'Green Line C' },
  { name: 'Symphony', lat: 42.3427, lon: -71.0853, route: 'Green Line E' },
  { name: 'Prudential', lat: 42.3458, lon: -71.0820, route: 'Green Line E' },
  { name: 'Hynes', lat: 42.3480, lon: -71.0873, route: 'Green Line B/C/D' },
];

const ALL_TRANSIT_STOPS = [...ROUTE_39_STOPS, ...GREEN_LINE_STOPS];

export function findNearestTransit(lat, lon) {
  let nearest = null;
  let minDist = Infinity;

  for (const stop of ALL_TRANSIT_STOPS) {
    const dist = haversineDistance(lat, lon, stop.lat, stop.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = stop;
    }
  }

  if (!nearest) return null;

  const walkMinutes = Math.round((minDist / WALK_SPEED) / 60 * 10) / 10;

  return {
    stop_name: nearest.name,
    route: nearest.route,
    distance_meters: Math.round(minDist),
    walk_minutes: walkMinutes,
  };
}
