import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, publicUser } from "./lib/getUser";
import { Doc } from "./_generated/dataModel";

const RoomType = v.union(v.literal("PRIVATE"), v.literal("SHARED"), v.literal("STUDIO"), v.literal("ENTIRE_FLAT"));

async function withHost(ctx: any, listing: Doc<"listings">) {
  const host = await ctx.db.get(listing.hostId);
  return { ...listing, id: listing._id, host: host ? publicUser(host) : null };
}

/** Browse published listings with optional filters. */
export const list = query({
  args: {
    status: v.optional(v.string()),
    area: v.optional(v.string()),
    budgetMax: v.optional(v.number()),
    roomType: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const status = args.status || "PUBLISHED";
    let rows = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", status as any))
      .order("desc")
      .take(200);

    if (args.area) rows = rows.filter((l) => l.area === args.area);
    if (args.roomType) rows = rows.filter((l) => l.roomType === args.roomType);
    if (args.budgetMax) rows = rows.filter((l) => l.rent <= args.budgetMax!);
    if (args.search) {
      const s = args.search.toLowerCase();
      rows = rows.filter((l) => l.title.toLowerCase().includes(s) || l.area.toLowerCase().includes(s));
    }
    rows = rows.slice(0, args.limit ?? 60);
    const listings = await Promise.all(rows.map((l) => withHost(ctx, l)));
    return { listings, total: listings.length };
  },
});

/** Full listing detail with host + photos. */
export const getById = query({
  args: { id: v.id("listings") },
  handler: async (ctx, { id }) => {
    const listing = await ctx.db.get(id);
    if (!listing) return { listing: null };
    const host = await ctx.db.get(listing.hostId);
    const photos = await ctx.db
      .query("listingPhotos")
      .withIndex("by_listing", (q) => q.eq("listingId", id))
      .collect();
    return { listing: { ...listing, id: listing._id, host: host ? publicUser(host) : null, photos } };
  },
});

/** The logged-in host's own listings. */
export const mine = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await requireUser(ctx, token);
    const rows = await ctx.db
      .query("listings")
      .withIndex("by_host", (q) => q.eq("hostId", user._id))
      .order("desc")
      .collect();
    return { listings: rows.map((l) => ({ ...l, id: l._id })) };
  },
});

const num = (x: any, d?: number) => (x === "" || x == null ? d : typeof x === "number" ? x : Number(x) || d);
const ms = (x: any, d: number) => (!x ? d : typeof x === "number" ? x : Date.parse(x) || d);

export const create = mutation({
  args: { token: v.string(), data: v.any() },
  handler: async (ctx, { token, data }) => {
    const user = await requireUser(ctx, token);
    const now = Date.now();
    const d = data || {};
    const publish = !!d.publish;
    const roomType = ["PRIVATE", "SHARED", "STUDIO", "ENTIRE_FLAT"].includes(d.roomType) ? d.roomType : "PRIVATE";
    if (!d.title || !d.area) throw new Error("Title and area are required.");
    const id = await ctx.db.insert("listings", {
      hostId: user._id,
      status: publish ? "PUBLISHED" : "DRAFT",
      title: String(d.title),
      description: d.description ? String(d.description) : undefined,
      city: d.city || "Bengaluru",
      area: String(d.area),
      roomType,
      availableBeds: num(d.availableBeds, 1)!,
      furnished: d.furnished == null ? undefined : !!d.furnished,
      amenities: Array.isArray(d.amenities) ? d.amenities.map(String) : undefined,
      rent: num(d.rent, 0)!,
      maintenance: num(d.maintenance),
      deposit: num(d.deposit),
      brokerage: num(d.brokerage),
      availableFrom: ms(d.availableFrom, now),
      currentOccupants: 0,
      householdVibe: d.householdVibe ? String(d.householdVibe) : undefined,
      houseRules: Array.isArray(d.houseRules) ? d.houseRules.map(String) : undefined,
      cookingRules: d.cookingRules ? String(d.cookingRules) : undefined,
      smokingAllowed: d.smokingAllowed == null ? undefined : !!d.smokingAllowed,
      petsAllowed: d.petsAllowed == null ? undefined : !!d.petsAllowed,
      viewCount: 0,
      schemaVersion: "listing-v1.0",
      publishedAt: publish ? now : undefined,
      lastConfirmedAt: publish ? now : undefined,
      createdAt: now,
      updatedAt: now,
    } as any);
    if (user.role === "SEEKER") await ctx.db.patch(user._id, { role: "BOTH", updatedAt: now });
    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("listings"),
    patch: v.any(),
  },
  handler: async (ctx, { token, id, patch }) => {
    const user = await requireUser(ctx, token);
    const listing = await ctx.db.get(id);
    if (!listing) throw new Error("Listing not found.");
    if (listing.hostId !== user._id && !user.isAdmin) throw new Error("Not your listing.");
    const allowed = ["title", "description", "area", "rent", "maintenance", "deposit",
      "brokerage", "cookingRules", "householdVibe", "furnished", "amenities", "status"];
    const clean: Record<string, unknown> = { updatedAt: Date.now() };
    for (const k of allowed) if (patch[k] !== undefined) clean[k] = patch[k];
    await ctx.db.patch(id, clean);
    return await ctx.db.get(id);
  },
});

/** Host confirms a listing is still available (freshness). */
export const confirmFresh = mutation({
  args: { token: v.string(), id: v.id("listings") },
  handler: async (ctx, { token, id }) => {
    const user = await requireUser(ctx, token);
    const listing = await ctx.db.get(id);
    if (!listing || (listing.hostId !== user._id && !user.isAdmin)) throw new Error("Not allowed.");
    await ctx.db.patch(id, {
      lastConfirmedAt: Date.now(),
      status: listing.status === "STALE" ? "PUBLISHED" : listing.status,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

export const setStatus = mutation({
  args: { token: v.string(), id: v.id("listings"), status: v.string() },
  handler: async (ctx, { token, id, status }) => {
    const user = await requireUser(ctx, token);
    const listing = await ctx.db.get(id);
    if (!listing || (listing.hostId !== user._id && !user.isAdmin)) throw new Error("Not allowed.");
    const now = Date.now();
    await ctx.db.patch(id, {
      status: status as any,
      filledAt: status === "FILLED" ? now : listing.filledAt,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

/** Toggle-save a listing for the logged-in user. */
export const save = mutation({
  args: { token: v.string(), id: v.id("listings") },
  handler: async (ctx, { token, id }) => {
    const user = await requireUser(ctx, token);
    const existing = await ctx.db
      .query("savedListings")
      .withIndex("by_user_listing", (q) => q.eq("userId", user._id).eq("listingId", id))
      .unique();
    if (existing) { await ctx.db.delete(existing._id); return { saved: false }; }
    await ctx.db.insert("savedListings", { userId: user._id, listingId: id, savedAt: Date.now() });
    return { saved: true };
  },
});
