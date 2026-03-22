/**
 * AI evaluation of listings using Claude API (direct HTTP, no SDK).
 * Uses tool_use for structured output extraction.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-20250414';

// ============================================================
// Text analysis
// ============================================================

const TEXT_ANALYSIS_TOOL = {
  name: 'extract_listing_details',
  description: 'Extract structured details from an apartment listing description.',
  input_schema: {
    type: 'object',
    properties: {
      parking_type: {
        type: 'string',
        enum: ['garage', 'driveway', 'street', 'lot', 'none', 'unknown'],
        description: 'Type of parking available',
      },
      laundry_type: {
        type: 'string',
        enum: ['in-unit', 'in-building', 'none', 'unknown'],
        description: 'Laundry availability',
      },
      ac_type: {
        type: 'string',
        enum: ['central', 'window', 'mini-split', 'none', 'unknown'],
        description: 'Air conditioning type',
      },
      pet_policy: {
        type: 'string',
        enum: ['cats-only', 'dogs-only', 'cats-and-dogs', 'no-pets', 'unknown'],
        description: 'Pet policy',
      },
      has_gym: { type: 'boolean', description: 'Whether the building has a gym/fitness center' },
      has_dishwasher: { type: 'boolean', description: 'Whether the unit has a dishwasher' },
      floor_number: { type: 'integer', description: 'Floor number of the unit, or null if unknown' },
      broker_fee: {
        type: 'number',
        description: 'Broker fee in months of rent (e.g. 1.0 for one month). 0 if no fee.',
      },
      lease_term: {
        type: 'integer',
        description: 'Lease term in months. 12 is standard.',
      },
      red_flags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Any red flags or concerns about the listing',
      },
      highlights: {
        type: 'array',
        items: { type: 'string' },
        description: 'Notable positive features',
      },
      summary: {
        type: 'string',
        description: 'Brief 1-2 sentence summary of the apartment',
      },
      confidence: {
        type: 'number',
        description: 'Confidence in the extraction from 0 to 1',
      },
    },
    required: ['parking_type', 'laundry_type', 'ac_type', 'pet_policy', 'has_gym', 'has_dishwasher', 'summary', 'confidence'],
  },
};

export async function analyzeListingText(description) {
  if (!ANTHROPIC_API_KEY) {
    console.log('[ai] No ANTHROPIC_API_KEY, skipping text analysis');
    return null;
  }

  if (!description || description.trim().length < 20) {
    return null;
  }

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        tools: [TEXT_ANALYSIS_TOOL],
        tool_choice: { type: 'tool', name: 'extract_listing_details' },
        messages: [
          {
            role: 'user',
            content: `Analyze this apartment listing description and extract structured details. If information is not mentioned, use "unknown" or null as appropriate.\n\nListing:\n${description}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ai] Claude API error ${response.status}: ${errText}`);
      return null;
    }

    const data = await response.json();

    // Extract tool_use result
    const toolUse = data.content?.find(block => block.type === 'tool_use');
    if (toolUse && toolUse.input) {
      return toolUse.input;
    }

    console.warn('[ai] No tool_use block in response');
    return null;
  } catch (err) {
    console.error('[ai] Text analysis error:', err.message);
    return null;
  }
}

// ============================================================
// Photo analysis
// ============================================================

const PHOTO_ANALYSIS_TOOL = {
  name: 'score_apartment_photos',
  description: 'Score apartment photos on various quality dimensions.',
  input_schema: {
    type: 'object',
    properties: {
      kitchen_modernity: {
        type: 'number',
        description: 'How modern the kitchen is (1-10). Consider countertops, cabinets, appliances.',
      },
      natural_light: {
        type: 'number',
        description: 'Amount of natural light (1-10). Consider window size, brightness.',
      },
      bathroom_quality: {
        type: 'number',
        description: 'Bathroom quality and condition (1-10).',
      },
      overall_condition: {
        type: 'number',
        description: 'Overall apartment condition (1-10). Consider flooring, walls, fixtures.',
      },
      bedroom_size_score: {
        type: 'number',
        description: 'Bedroom size adequacy (1-10).',
      },
      room_types: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of room types identified in photos (kitchen, bedroom, bathroom, living, etc.)',
      },
      red_flags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Visual red flags noticed (stains, damage, poor condition, etc.)',
      },
      notes: {
        type: 'string',
        description: 'Brief overall impression of the apartment from photos',
      },
    },
    required: ['kitchen_modernity', 'natural_light', 'bathroom_quality', 'overall_condition', 'bedroom_size_score'],
  },
};

export async function analyzeListingPhotos(photoUrls) {
  if (!ANTHROPIC_API_KEY) {
    console.log('[ai] No ANTHROPIC_API_KEY, skipping photo analysis');
    return null;
  }

  if (!photoUrls || photoUrls.length === 0) {
    return null;
  }

  // Limit to 5 photos to manage API costs
  const urls = photoUrls.slice(0, 5);

  try {
    // Build content blocks with images
    const content = [
      {
        type: 'text',
        text: 'Score these apartment photos on the quality dimensions using the tool. Rate each dimension 1-10 where 1 is terrible and 10 is exceptional. If a room type is not shown, estimate conservatively (5). Identify room types and any red flags.',
      },
    ];

    for (const url of urls) {
      content.push({
        type: 'image',
        source: {
          type: 'url',
          url,
        },
      });
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        tools: [PHOTO_ANALYSIS_TOOL],
        tool_choice: { type: 'tool', name: 'score_apartment_photos' },
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ai] Claude API error ${response.status}: ${errText}`);
      return null;
    }

    const data = await response.json();

    const toolUse = data.content?.find(block => block.type === 'tool_use');
    if (toolUse && toolUse.input) {
      return toolUse.input;
    }

    console.warn('[ai] No tool_use block in photo response');
    return null;
  } catch (err) {
    console.error('[ai] Photo analysis error:', err.message);
    return null;
  }
}

// ============================================================
// Composite scoring
// ============================================================

const WEIGHTS = {
  kitchen_modernity: 0.15,
  natural_light: 0.10,
  bathroom_quality: 0.10,
  overall_condition: 0.10,
  ac_score: 0.05,
  has_gym: 0.10,
  price_score: 0.15,
  walk_coffee: 0.03,
  walk_park: 0.03,
  walk_grocery: 0.05,
  walk_restaurant: 0.03,
  walk_library: 0.01,
  transit_access: 0.05,
  garage_parking: 0.03,
  bedroom_size: 0.02,
};

export function computeCompositeScore(scores) {
  let totalWeight = 0;
  let weightedSum = 0;

  // Visual scores (1-10 scale, normalize to 0-100)
  const visualScores = {
    kitchen_modernity: scores.kitchen_modernity,
    natural_light: scores.natural_light,
    bathroom_quality: scores.bathroom_quality,
    overall_condition: scores.overall_condition,
  };

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    let score = null;

    if (key in visualScores && visualScores[key] != null) {
      score = (visualScores[key] / 10) * 100;
    } else if (key === 'bedroom_size' && scores.bedroom_size_score != null) {
      score = (scores.bedroom_size_score / 10) * 100;
    } else if (key === 'ac_score') {
      // Score AC type
      const acScores = { 'central': 100, 'mini-split': 90, 'window': 50, 'none': 0, 'unknown': 30 };
      score = acScores[scores.ac_type] ?? 30;
    } else if (key === 'has_gym') {
      score = scores.has_gym ? 100 : 0;
    } else if (key === 'price_score') {
      // Lower price = higher score. $2500 = 100, $4500 = 0
      if (scores.price != null) {
        score = Math.max(0, Math.min(100, ((4500 - scores.price) / 2000) * 100));
      }
    } else if (key === 'walk_coffee' || key === 'walk_park' || key === 'walk_grocery' || key === 'walk_restaurant' || key === 'walk_library') {
      // Walk time in minutes. Under 5 min = 100, 15 min = 0
      const walkMin = scores[key];
      if (walkMin != null) {
        score = Math.max(0, Math.min(100, ((15 - walkMin) / 10) * 100));
      }
    } else if (key === 'transit_access') {
      // Walk to transit stop. Under 3 min = 100, 15 min = 0
      const transitMin = scores.walk_transit_stop;
      if (transitMin != null) {
        score = Math.max(0, Math.min(100, ((15 - transitMin) / 12) * 100));
      }
    } else if (key === 'garage_parking') {
      const parkingScores = { 'garage': 100, 'driveway': 70, 'lot': 60, 'street': 20, 'none': 0, 'unknown': 10 };
      score = parkingScores[scores.parking_type] ?? 10;
    }

    if (score !== null) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }

  // Normalize to account for any missing dimensions
  if (totalWeight === 0) return 0;

  return Math.round((weightedSum / totalWeight) * 10) / 10;
}
