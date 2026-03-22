/**
 * Target building availability scrapers.
 * Best-effort scraping of specific buildings we're interested in.
 * If a building's site can't be scraped, we log and move on.
 */

const BUILDINGS = [
  {
    name: 'Bell Olmsted Park',
    url: 'https://www.bellolmstedpark.com/floor-plans',
    altUrls: [
      'https://www.bellolmstedpark.com/boston-ma-apartments/bell-olmsted-park/conventional/',
      'https://www.bellolmstedpark.com/floorplans',
    ],
    neighborhood: 'Jamaica Plain',
    address: '655 Centre St, Jamaica Plain, MA 02130',
    lat: 42.3135,
    lon: -71.1145,
  },
  {
    name: 'The Brookliner',
    url: 'https://www.thebrookliner.com/floor-plans',
    altUrls: [
      'https://www.thebrookliner.com/floorplans',
      'https://www.thebrookliner.com/availabilities',
    ],
    neighborhood: 'Brookline',
    address: '111 Centre St, Brookline, MA 02446',
    lat: 42.3348,
    lon: -71.1215,
  },
  {
    name: 'Marion Square',
    url: 'https://www.marionsquare.net/floor-plans',
    altUrls: [
      'https://www.marionsquare.net/floorplans',
      'https://www.marionsquare.net/availabilities',
    ],
    neighborhood: 'Brookline',
    address: '22 Marion St, Brookline, MA 02446',
    lat: 42.3410,
    lon: -71.1250,
  },
  {
    name: 'Serenity',
    url: 'https://www.liveatserenity.com/floor-plans',
    altUrls: [
      'https://www.liveatserenity.com/floorplans',
    ],
    neighborhood: 'Jamaica Plain',
    address: '101 S Huntington Ave, Jamaica Plain, MA 02130',
    lat: 42.3265,
    lon: -71.1065,
  },
];

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

async function fetchWithFallbacks(building) {
  const urls = [building.url, ...(building.altUrls || [])];
  for (const url of urls) {
    try {
      const html = await fetchPage(url);
      return { html, url };
    } catch (err) {
      // Try next URL
    }
  }
  throw new Error(`All URLs failed for ${building.name}`);
}

/**
 * Extract 2BR listings from HTML using pattern matching.
 * Different buildings use different formats, so we try several strategies.
 */
function extract2brListings(html, building) {
  const listings = [];

  // Strategy 1: Look for sections with "2 bed" or "2 BR" or "two bedroom"
  const twoBedroomPatterns = [
    /2\s*(?:bed(?:room)?s?|br|BD)/gi,
    /two\s*bedroom/gi,
    /2BR/gi,
    /B\d+[^<]*2\s*(?:bed|br)/gi,
  ];

  let hasTwoBedroom = false;
  for (const pattern of twoBedroomPatterns) {
    if (pattern.test(html)) {
      hasTwoBedroom = true;
      break;
    }
  }

  if (!hasTwoBedroom) {
    return listings;
  }

  // Try to extract price information near 2BR mentions
  // Common patterns: "$3,200", "from $3,200", "starting at $3,200"
  const pricePattern = /\$([0-9,]+)/g;
  const prices = [];
  let priceMatch;
  while ((priceMatch = pricePattern.exec(html)) !== null) {
    const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
    if (price >= 1500 && price <= 7000) {
      prices.push(price);
    }
  }

  // Try to extract sqft near 2BR
  const sqftPattern = /([0-9,]+)\s*(?:sq\.?\s*ft|sqft|SF)/gi;
  const sqfts = [];
  let sqftMatch;
  while ((sqftMatch = sqftPattern.exec(html)) !== null) {
    const sqft = parseInt(sqftMatch[1].replace(/,/g, ''), 10);
    if (sqft >= 500 && sqft <= 3000) {
      sqfts.push(sqft);
    }
  }

  // Try to find availability dates
  const datePattern = /(?:available|avail\.?|move[- ]?in)\s*[:.]?\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\w+\s+\d{1,2}(?:,?\s*\d{4})?|now|immediately)/gi;
  const dates = [];
  let dateMatch;
  while ((dateMatch = datePattern.exec(html)) !== null) {
    dates.push(dateMatch[1].trim());
  }

  // Try to extract specific floor plan sections
  // Many apartment sites use card-based layouts with data attributes
  const floorPlanSectionPattern = /(?:class="[^"]*(?:floor-?plan|unit|availability|plan-card)[^"]*"[^>]*>)([\s\S]*?)(?=class="[^"]*(?:floor-?plan|unit|availability|plan-card)|$)/gi;
  let sectionMatch;
  const sections = [];
  while ((sectionMatch = floorPlanSectionPattern.exec(html)) !== null) {
    const section = sectionMatch[1];
    // Check if this section mentions 2BR
    for (const pattern of twoBedroomPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(section)) {
        sections.push(section);
        break;
      }
    }
  }

  if (sections.length > 0) {
    // We found specific 2BR sections, extract data from each
    for (const section of sections) {
      const sectionPrice = section.match(/\$([0-9,]+)/);
      const sectionSqft = section.match(/([0-9,]+)\s*(?:sq\.?\s*ft|sqft|SF)/i);
      const sectionBath = section.match(/(\d+(?:\.\d)?)\s*(?:bath|ba|BA)/i);

      const listing = {
        source: 'building',
        source_url: building.url,
        source_id: `${building.name.toLowerCase().replace(/\s+/g, '-')}-2br`,
        title: `${building.name} - 2 Bedroom`,
        price: sectionPrice ? parseInt(sectionPrice[1].replace(/,/g, ''), 10) : (prices[0] || null),
        bedrooms: 2,
        bathrooms: sectionBath ? parseFloat(sectionBath[1]) : null,
        sqft: sectionSqft ? parseInt(sectionSqft[1].replace(/,/g, ''), 10) : null,
        address: building.address,
        neighborhood: building.neighborhood,
        lat: building.lat,
        lon: building.lon,
        description: `2 bedroom apartment at ${building.name}. ${dates.length > 0 ? `Available: ${dates[0]}` : ''}`.trim(),
        photos: [],
      };

      listings.push(listing);
    }
  } else if (hasTwoBedroom) {
    // Generic: we know 2BR exists but can't parse specific units
    // Create a single generic listing
    const bathMatch = html.match(/2\s*(?:bed|br|BD)[^<]*?(\d+(?:\.\d)?)\s*(?:bath|ba|BA)/i);

    const listing = {
      source: 'building',
      source_url: building.url,
      source_id: `${building.name.toLowerCase().replace(/\s+/g, '-')}-2br`,
      title: `${building.name} - 2 Bedroom`,
      price: prices.length > 0 ? Math.min(...prices) : null,
      bedrooms: 2,
      bathrooms: bathMatch ? parseFloat(bathMatch[1]) : null,
      sqft: sqfts.length > 0 ? sqfts[0] : null,
      address: building.address,
      neighborhood: building.neighborhood,
      lat: building.lat,
      lon: building.lon,
      description: `2 bedroom apartment at ${building.name}. ${dates.length > 0 ? `Available: ${dates[0]}` : ''}`.trim(),
      photos: [],
    };

    listings.push(listing);
  }

  // Extract photo URLs
  const imgPattern = /(?:src|data-src)="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi;
  const photos = [];
  let imgMatch;
  while ((imgMatch = imgPattern.exec(html)) !== null) {
    const imgUrl = imgMatch[1];
    // Filter out tiny icons/logos
    if (!imgUrl.includes('logo') && !imgUrl.includes('icon') && !imgUrl.includes('favicon')) {
      photos.push(imgUrl);
    }
  }

  // Attach photos to listings (shared across units for same building)
  for (const listing of listings) {
    listing.photos = photos.slice(0, 10); // Cap at 10 photos
  }

  return listings;
}

export async function fetchBuildingListings() {
  const allListings = [];

  for (const building of BUILDINGS) {
    console.log(`[buildings] Checking ${building.name}...`);

    try {
      const { html, url } = await fetchWithFallbacks(building);
      console.log(`[buildings] ${building.name}: fetched ${html.length} bytes from ${url}`);

      const listings = extract2brListings(html, building);

      if (listings.length > 0) {
        console.log(`[buildings] ${building.name}: found ${listings.length} potential 2BR listing(s)`);
        allListings.push(...listings);
      } else {
        console.log(`[buildings] ${building.name}: no 2BR availability detected`);
      }
    } catch (err) {
      console.warn(`[buildings] ${building.name}: could not scrape (${err.message})`);
    }
  }

  return allListings;
}
