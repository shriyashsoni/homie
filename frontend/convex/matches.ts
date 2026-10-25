import { v } from "convex/values";
import { query } from "./_generated/server";
import { getUserByToken } from "./lib/getUser";
import { Doc } from "./_generated/dataModel";

/**
 * Compatibility engine. Scores a published listing against a seeker's profile
 * across several weighted dimensions, returns an overall 0–100 score plus
 * human-readable reasons. Works for any city/country (location-agnostic).
 */
const WEIGHTS = {
  budget: 0.30,
  location: 0.25,
  roomType: 0.10,
  smoking: 0.12,
  pets: 0.08,
  freshness: 0.15,
};

function sameCity(a?: string, b?: string) {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function scoreListing(profile: Doc<"profiles"> | null, listing: Doc<"listings">) {
  const pos: string[] = [];
  const neg: string[] = [];
  let feasible = true;

  // ── Budget ──
  let budget = 0.6;
  if (profile?.budgetMax) {
    if (listing.rent <= profile.budgetMax) { budget = 1; pos.push("Within your budget"); }
    else if (listing.rent <= profile.budgetMax * 1.1) { budget = 0.55; neg.push("Slightly over your max budget"); }
    else { budget = 0.1; feasible = false; neg.push("Over your budget"); }
    if (profile.budgetMin && listing.rent < profile.budgetMin * 0.6) { neg.push("Much cheaper than your range — verify it fits your needs"); }
  }

  // ── Location (area or city) ──
  let location = 0.5;
  const prefAreas = profile?.preferredAreas || [];
  if (prefAreas.some((a) => a.trim().toLowerCase() === listing.area.trim().toLowerCase())) {
    location = 1; pos.push(`In ${listing.area}, one of your preferred areas`);
  } else if (sameCity(profile?.cityArea, listing.city) || sameCity(profile?.cityArea, listing.area)) {
    location = 0.7; pos.push(`In ${listing.city}`);
  } else {
    location = 0.4;
  }

  // ── Room type ──
  let roomType = 0.6;
  if (profile?.roomType && profile.roomType === listing.roomType) { roomType = 1; pos.push("Matches your room type"); }

  // ── Smoking ──
  let smoking = 0.7;
  if (profile?.smokingPreference === "NO_INDOOR" || profile?.smokingPreference === "NOT_COMFORTABLE") {
    if (listing.smokingAllowed === false) { smoking = 1; pos.push("Non-smoking household"); }
    else if (listing.smokingAllowed === true) { smoking = 0.2; neg.push("Smoking is allowed here"); }
  }

  // ── Pets ──
  let pets = 0.7;
  if (listing.petsAllowed === true) pets = 0.85;

  // ── Freshness ──
  const days = listing.lastConfirmedAt ? (Date.now() - listing.lastConfirmedAt) / 86400000 : 999;
  const freshness = days <= 7 ? 1 : days <= 21 ? 0.7 : days <= 45 ? 0.4 : 0.2;
  if (days <= 7) pos.push("Recently confirmed available");
  else if (days > 45) neg.push("Not confirmed in a while");

  const overall =
    WEIGHTS.budget * budget +
    WEIGHTS.location * location +
    WEIGHTS.roomType * roomType +
    WEIGHTS.smoking * smoking +
    WEIGHTS.pets * pets +
    WEIGHTS.freshness * freshness;

  const score = Math.round(Math.max(0, Math.min(1, overall)) * 100);
  return {
    score, feasible,
    explanationPositive: pos.slice(0, 3),
    explanationTradeoffs: neg.slice(0, 2),
    sub: { budget, location, roomType, smoking, pets, freshness },
  };
}

export const list = query({
  args: { token: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, { token, limit }) => {
    const user = await getUserByToken(ctx, token);
    const profile = user
      ? await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", user._id)).unique()
      : null;

    let listings = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
      .order("desc")
      .take(120);
    if (user) listings = listings.filter((l) => l.hostId !== user._id);

    const scored = listings.map((l) => {
      const r = scoreListing(profile, l);
      return {
        id: l._id,
        compatibilityScore: r.score,
        isFeasible: r.feasible,
        explanationPositive: r.explanationPositive,
        explanationTradeoffs: r.explanationTradeoffs,
        listing: { id: l._id, title: l.title, area: l.area, city: l.city, rent: l.rent, roomType: l.roomType },
      };
    });

    // feasible first, then by score
    scored.sort((a, b) => (Number(b.isFeasible) - Number(a.isFeasible)) || (b.compatibilityScore - a.compatibilityScore));
    return { matches: scored.slice(0, limit ?? 12) };
  },
});

/** Score a single listing for the logged-in seeker (used on the detail page). */
export const scoreFor = query({
  args: { token: v.optional(v.string()), listingId: v.id("listings") },
  handler: async (ctx, { token, listingId }) => {
    const user = await getUserByToken(ctx, token);
    const listing = await ctx.db.get(listingId);
    if (!listing) return null;
    const profile = user
      ? await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", user._id)).unique()
      : null;
    const r = scoreListing(profile, listing);
    return {
      compatibilityScore: r.score,
      isFeasible: r.feasible,
      explanationPositive: r.explanationPositive,
      explanationTradeoffs: r.explanationTradeoffs,
    };
  },
});
