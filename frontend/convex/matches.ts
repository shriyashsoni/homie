import { v } from "convex/values";
import { query } from "./_generated/server";
import { getUserByToken } from "./lib/getUser";

/**
 * Lightweight match feed: published listings the user doesn't host,
 * scored against their profile (budget + area overlap). Enough to power
 * the dashboard; the full matching engine can replace this later.
 */
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
      .take(60);
    if (user) listings = listings.filter((l) => l.hostId !== user._id);

    const scored = listings.map((l) => {
      let score = 60;
      if (profile?.budgetMax && l.rent <= profile.budgetMax) score += 20;
      if (profile?.budgetMax && l.rent > profile.budgetMax) score -= 25;
      if (profile?.preferredAreas?.includes(l.area)) score += 18;
      if (profile?.roomType && profile.roomType === l.roomType) score += 8;
      score = Math.max(35, Math.min(98, score));
      return {
        id: l._id,
        compatibilityScore: score,
        listing: { id: l._id, title: l.title, area: l.area, city: l.city, rent: l.rent, roomType: l.roomType },
      };
    });
    scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    return { matches: scored.slice(0, limit ?? 6) };
  },
});
