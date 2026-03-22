/**
 * Craigslist RSS fetcher for Boston apartment listings.
 * Fetches and parses RSS feeds for JP, Brookline, and Roslindale.
 */

const BASE_URL = 'https://boston.craigslist.org/search/apa';

const SEARCH_PARAMS = {
  format: 'rss',
  min_price: '2500',
  max_price: '4500',
  min_bedrooms: '2',
  max_bedrooms: '2',
  min_bathrooms: '1',
};

// Craigslist neighborhood query values for Boston
// These correspond to neighborhood IDs in the Craigslist system.
// We also do coordinate-based filtering as a fallback.
const NEIGHBORHOOD_QUERIES = [
  { name: 'Jamaica Plain', query: 'jamaica+plain' },
  { name: 'Brookline', query: 'brookline' },
  { name: 'Roslindale', query: 'roslindale' },
];

// Bounding boxes for post-fetch filtering (if Craigslist doesn't filter well)
const NEIGHBORHOOD_BOUNDS = {
  'Jamaica Plain': { latMin: 42.295, latMax: 42.325, lonMin: -71.13, lonMax: -71.10 },
  'Brookline': { latMin: 42.33, latMax: 42.35, lonMin: -71.16, lonMax: -71.12 },
  'Roslindale': { latMin: 42.28, latMax: 42.30, lonMin: -71.14, lonMax: -71.11 },
  'South Huntington': { latMin: 42.325, latMax: 42.34, lonMin: -71.11, lonMax: -71.10 },
};

function buildFeedUrl(neighborhoodQuery) {
  const params = new URLSearchParams(SEARCH_PARAMS);
  if (neighborhoodQuery) {
    params.set('query', neighborhoodQuery);
  }
  return `${BASE_URL}?${params.toString()}`;
}

/**
 * Simple XML parser for Craigslist RSS items.
 * Craigslist RSS uses <item> elements with standard RSS fields
 * plus some RDF/dc extensions.
 */
function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const item = {};

    // Extract standard fields
    item.title = extractTag(content, 'title');
    item.link = extractTag(content, 'link');
    item.description = extractTag(content, 'description');
    item.date = extractTag(content, 'dc:date') || extractTag(content, 'pubDate');

    // Extract geo coordinates if present
    // Craigslist sometimes includes geo:lat and geo:long
    const lat = extractTag(content, 'geo:lat');
    const lon = extractTag(content, 'geo:long');
    if (lat && lon) {
      item.lat = parseFloat(lat);
      item.lon = parseFloat(lon);
    }

    // Try to extract price from title (e.g., "$3,200 / 2br")
    const priceMatch = item.title?.match(/\$([0-9,]+)/);
    if (priceMatch) {
      item.price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
    }

    // Try to extract bedrooms from title
    const brMatch = item.title?.match(/(\d+)\s*br/i);
    if (brMatch) {
      item.bedrooms = parseInt(brMatch[1], 10);
    }

    // Try to extract location from title (text in parentheses at end)
    const locMatch = item.title?.match(/\(([^)]+)\)\s*$/);
    if (locMatch) {
      item.location = locMatch[1].trim();
    }

    items.push(item);
  }

  return items;
}

function extractTag(xml, tag) {
  // Handle CDATA sections
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle regular content
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  if (match) return match[1].trim();

  // Handle self-closing or content after tag (for <link>)
  const linkRegex = new RegExp(`<${tag}[^>]*>([^<]+)`, 'i');
  const linkMatch = xml.match(linkRegex);
  if (linkMatch) return linkMatch[1].trim();

  return null;
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function isInAnyNeighborhood(lat, lon) {
  for (const [name, bounds] of Object.entries(NEIGHBORHOOD_BOUNDS)) {
    if (
      lat >= bounds.latMin && lat <= bounds.latMax &&
      lon >= bounds.lonMin && lon <= bounds.lonMax
    ) {
      return name;
    }
  }
  return null;
}

export async function fetchCraigslistListings() {
  const allListings = [];
  const seenUrls = new Set();

  for (const neighborhood of NEIGHBORHOOD_QUERIES) {
    const url = buildFeedUrl(neighborhood.query);
    console.log(`[craigslist] Fetching: ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AptBot/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      });

      if (!response.ok) {
        console.warn(`[craigslist] HTTP ${response.status} for ${neighborhood.name}`);
        continue;
      }

      const xml = await response.text();
      const items = parseRssItems(xml);
      console.log(`[craigslist] ${neighborhood.name}: ${items.length} raw items`);

      for (const item of items) {
        if (!item.link || seenUrls.has(item.link)) continue;
        seenUrls.add(item.link);

        // Determine neighborhood from coordinates or query context
        let detectedNeighborhood = neighborhood.name;
        if (item.lat && item.lon) {
          const geoNeighborhood = isInAnyNeighborhood(item.lat, item.lon);
          if (geoNeighborhood) {
            detectedNeighborhood = geoNeighborhood;
          }
        }

        allListings.push({
          source: 'craigslist',
          source_url: item.link,
          source_id: item.link.match(/\/(\d+)\.html/)?.[1] || null,
          title: item.title ? stripHtml(item.title) : null,
          price: item.price || null,
          bedrooms: item.bedrooms || 2,
          bathrooms: null, // Craigslist RSS doesn't reliably provide this
          sqft: null,
          address: item.location || null,
          neighborhood: detectedNeighborhood,
          lat: item.lat || null,
          lon: item.lon || null,
          description: item.description ? stripHtml(item.description) : null,
          photos: [], // Would need to fetch individual pages for photos
        });
      }
    } catch (err) {
      console.error(`[craigslist] Error fetching ${neighborhood.name}:`, err.message);
    }
  }

  console.log(`[craigslist] Total unique listings: ${allListings.length}`);
  return allListings;
}
