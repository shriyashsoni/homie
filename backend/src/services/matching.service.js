/**
 * FMH Matching Engine
 * 
 * Three-stage matching as defined in the product handbook:
 * Stage 1: Feasibility (hard constraints)
 * Stage 2: Compatibility scoring (lifestyle fit)
 * Stage 3: Ranking with explanations
 */

const ALGORITHM_VERSION = 'v1.0';

// ─── Stage 1: Feasibility ─────────────────────────────────────────────────────
/**
 * Returns { eligible: boolean, reason: string|null }
 */
function checkFeasibility(profile, listing) {
  const reasons = [];

  // City match (required)
  if (profile.cityArea && listing.city) {
    const profileCity = profile.cityArea.toLowerCase();
    const listingCity = listing.city.toLowerCase();
    if (!profileCity.includes(listingCity) && !listingCity.includes(profileCity)) {
      reasons.push(`City mismatch: seeker wants ${profile.cityArea}, listing is in ${listing.city}`);
    }
  }

  // Budget check (hard filter when budgetMax is set)
  if (profile.budgetMax) {
    const totalCost = listing.totalRecurring || listing.rent;
    if (totalCost > profile.budgetMax) {
      reasons.push(
        `Budget exceeded: listing costs ₹${totalCost}/month, seeker max is ₹${profile.budgetMax}`
      );
    }
  }

  // Move-in date overlap
  if (profile.moveInDate && listing.availableFrom) {
    const moveIn = new Date(profile.moveInDate);
    const flexDays = profile.moveInFlexDays || 7;
    const earliest = new Date(moveIn.getTime() - flexDays * 86400000);
    const latest = new Date(moveIn.getTime() + flexDays * 86400000);

    const available = new Date(listing.availableFrom);
    const until = listing.availableTo ? new Date(listing.availableTo) : null;

    if (available > latest) {
      reasons.push(`Room not available until ${listing.availableFrom.toDateString()}`);
    }
    if (until && until < earliest) {
      reasons.push(`Listing already unavailable by ${until.toDateString()}`);
    }
  }

  // Room type
  if (profile.roomType && listing.roomType && profile.roomType !== listing.roomType) {
    reasons.push(`Room type: seeker wants ${profile.roomType}, listing offers ${listing.roomType}`);
  }

  // Listing must be published and not filled
  if (listing.status !== 'PUBLISHED') {
    reasons.push('Listing is not currently available');
  }

  return {
    eligible: reasons.length === 0,
    reason: reasons.length > 0 ? reasons.join('; ') : null,
  };
}

// ─── Stage 2: Compatibility Scoring ─────────────────────────────────────────
/**
 * Returns scores object with overall compatibilityScore (0–1)
 */
function scoreCompatibility(profile, listing) {
  const scores = {};
  let totalWeight = 0;
  let weightedSum = 0;
  const positives = [];
  const tradeoffs = [];

  // ── Food/Diet ────────────────────────────────────────────────────────────
  let foodScore = null;
  if (profile.dietaryPreference && listing.cookingRules) {
    // Simple heuristic: if listing cooking rules mention restrictions that conflict
    foodScore = 0.7; // default moderate
    const diet = profile.dietaryPreference;
    const rules = listing.cookingRules.toLowerCase();

    if (diet === 'VEGETARIAN' || diet === 'JAIN' || diet === 'VEGAN') {
      if (rules.includes('no meat') || rules.includes('vegetarian only')) {
        foodScore = 1.0;
        positives.push('Vegetarian household matches your food preference');
      } else if (rules.includes('non-veg') || rules.includes('meat')) {
        foodScore = 0.3;
        tradeoffs.push('The household cooks non-vegetarian food; may need separate arrangement');
      }
    } else if (diet === 'NON_VEGETARIAN') {
      if (rules.includes('no meat')) {
        foodScore = 0.2;
        tradeoffs.push('No meat cooking allowed in this household');
      } else {
        foodScore = 0.9;
        positives.push('No food restrictions in this household');
      }
    }
  }
  if (foodScore !== null) {
    scores.foodScore = foodScore;
    totalWeight += 20;
    weightedSum += foodScore * 20;
  }

  // ── Smoking ───────────────────────────────────────────────────────────────
  let smokingScore = null;
  if (profile.smokingPreference !== null && listing.smokingAllowed !== null) {
    const pref = profile.smokingPreference;
    const allowed = listing.smokingAllowed;

    if (pref === 'NO_INDOOR' && !allowed) {
      smokingScore = 1.0;
      positives.push('No smoking policy matches your preference');
    } else if (pref === 'NO_INDOOR' && allowed) {
      smokingScore = 0.2;
      tradeoffs.push('Smoking is allowed in this home but you prefer no smoking');
    } else if (pref === 'NOT_COMFORTABLE' && allowed) {
      smokingScore = 0.0;
      tradeoffs.push('You are not comfortable with smoking but this home allows it');
    } else {
      smokingScore = 0.8;
    }
    scores.smokingScore = smokingScore;
    totalWeight += 15;
    weightedSum += smokingScore * 15;
  }

  // ── Pets ──────────────────────────────────────────────────────────────────
  let petsScore = null;
  if (profile.pets && listing.petsAllowed !== null) {
    const hasPet = profile.pets.toLowerCase().includes('have a pet');
    const wantsPetFree = profile.pets.toLowerCase().includes('avoid') || profile.pets.toLowerCase().includes('allerg');

    if (hasPet && !listing.petsAllowed) {
      petsScore = 0.1;
      tradeoffs.push('You have a pet but this listing does not allow pets');
    } else if (wantsPetFree && listing.petsAllowed) {
      petsScore = 0.3;
      tradeoffs.push('You prefer a pet-free home but pets are allowed here');
    } else {
      petsScore = 0.9;
    }
    scores.petsScore = petsScore;
    totalWeight += 10;
    weightedSum += petsScore * 10;
  }

  // ── Guest Policy ──────────────────────────────────────────────────────────
  let guestsScore = null;
  if (profile.guestPolicy && listing.guestPolicy) {
    if (profile.guestPolicy === listing.guestPolicy) {
      guestsScore = 1.0;
      positives.push('Guest policy is compatible');
    } else if (
      profile.guestPolicy === 'FLEXIBLE' ||
      listing.guestPolicy === 'FLEXIBLE' ||
      profile.guestPolicy === 'ADVANCE_NOTICE' ||
      listing.guestPolicy === 'ADVANCE_NOTICE'
    ) {
      guestsScore = 0.7;
    } else if (profile.guestPolicy === 'NO_OVERNIGHT' && listing.guestPolicy !== 'NO_OVERNIGHT') {
      guestsScore = 0.3;
      tradeoffs.push('Guest policies differ — clarify expectations before moving in');
    } else {
      guestsScore = 0.5;
      tradeoffs.push('Guest policies may need discussion');
    }
    scores.guestsScore = guestsScore;
    totalWeight += 10;
    weightedSum += guestsScore * 10;
  }

  // ── Social Level ──────────────────────────────────────────────────────────
  let socialScore = null;
  if (profile.socialLevel && listing.householdVibe) {
    const vibe = listing.householdVibe.toLowerCase();
    const seeker = profile.socialLevel;

    if (
      (seeker === 'MOSTLY_INDEPENDENT' && (vibe.includes('independent') || vibe.includes('quiet'))) ||
      (seeker === 'CLOSE_KNIT' && vibe.includes('social')) ||
      (seeker === 'REGULAR_MEALS_ACTIVITIES' && vibe.includes('friendly'))
    ) {
      socialScore = 0.9;
      positives.push('Household vibe matches your social preference');
    } else if (seeker === 'CLOSE_KNIT' && vibe.includes('independent')) {
      socialScore = 0.3;
      tradeoffs.push('You want a social household but this is more independent');
    } else {
      socialScore = 0.6;
    }
    scores.socialScore = socialScore;
    totalWeight += 15;
    weightedSum += socialScore * 15;
  }

  // ── Cleanliness (inferred from house rules) ───────────────────────────────
  // Placeholder for future quiz-driven matching

  // ── Budget fit (within range score, not hard cutoff) ──────────────────────
  if (profile.budgetMax && listing.totalRecurring) {
    const cost = listing.totalRecurring;
    const max = profile.budgetMax;
    const min = profile.budgetMin || 0;

    if (cost >= min && cost <= max) {
      scores.budgetScore = 1.0;
      positives.push(`Rent is within your budget (₹${cost}/month)`);
    } else if (cost > max && cost <= max * 1.1) {
      scores.budgetScore = 0.6;
      tradeoffs.push(`Rent is slightly above your max budget by ${cost - max}`);
    } else {
      scores.budgetScore = 0.3;
    }
    totalWeight += 25;
    weightedSum += scores.budgetScore * 25;
  }

  // ── Coverage score (how much data was available) ──────────────────────────
  const coverageScore = totalWeight > 0 ? Math.min(totalWeight / 100, 1.0) : 0;
  const compatibilityScore = totalWeight > 0 ? weightedSum / totalWeight : null;

  return {
    scores,
    compatibilityScore,
    coverageScore,
    confidenceScore: coverageScore * (compatibilityScore !== null ? 0.9 : 0),
    explanationPositive: positives.slice(0, 3),
    explanationTradeoffs: tradeoffs.slice(0, 2),
  };
}

// ─── Stage 3: Ranking ─────────────────────────────────────────────────────────
function computeRankScore(match, listing) {
  const compatibility = match.compatibilityScore ?? 0.5;
  const coverage = match.coverageScore ?? 0.5;

  // Freshness factor (higher if confirmed recently)
  let freshness = 0.5;
  if (listing.lastConfirmedAt) {
    const daysSince = (Date.now() - new Date(listing.lastConfirmedAt).getTime()) / (1000 * 3600 * 24);
    freshness = Math.max(0, 1 - daysSince / 30); // decay over 30 days
  }

  const rankScore = compatibility * 0.6 + coverage * 0.2 + freshness * 0.2;
  return { rankScore, freshnessFactor: freshness };
}

// ─── Main: Run Full Match ─────────────────────────────────────────────────────
function computeMatch(profile, listing) {
  const feasibility = checkFeasibility(profile, listing);

  if (!feasibility.eligible) {
    return {
      isFeasible: false,
      feasibilityReason: feasibility.reason,
      compatibilityScore: null,
      coverageScore: null,
      confidenceScore: null,
      freshnessFactor: null,
      overallRank: null,
      explanationPositive: [],
      explanationTradeoffs: [feasibility.reason],
      algorithmVersion: ALGORITHM_VERSION,
      ...getEmptyScores(),
    };
  }

  const compatibility = scoreCompatibility(profile, listing);
  const { rankScore, freshnessFactor } = computeRankScore(compatibility, listing);

  return {
    isFeasible: true,
    feasibilityReason: null,
    compatibilityScore: compatibility.compatibilityScore,
    coverageScore: compatibility.coverageScore,
    confidenceScore: compatibility.confidenceScore,
    freshnessFactor,
    rankScore,
    explanationPositive: compatibility.explanationPositive,
    explanationTradeoffs: compatibility.explanationTradeoffs,
    algorithmVersion: ALGORITHM_VERSION,
    ...compatibility.scores,
  };
}

function getEmptyScores() {
  return {
    budgetScore: null,
    areaScore: null,
    foodScore: null,
    routineScore: null,
    socialScore: null,
    guestsScore: null,
    smokingScore: null,
    petsScore: null,
  };
}

module.exports = { computeMatch, checkFeasibility, scoreCompatibility };
