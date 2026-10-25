import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireAdmin, publicUser } from "./lib/getUser";
import { Doc } from "./_generated/dataModel";

// ── One-time admin bootstrap (run from the Convex CLI) ────
// Seeded credentials: admin@findmyhomie.in / Homie@Admin2025
const ADMIN_EMAIL = "admin@findmyhomie.in";
const ADMIN_HASH =
  "pbkdf2$100000$24bcd9808cd8d0ce745e2a8ac5870e38$52516a2029b317d936a55ab462062f8fc719071f5399f3681d0e3bf08c0ade1f";

/** Create (or reset) the platform admin account. Run: `npx convex run admin:seedAdmin` */
export const seedAdmin = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const existing = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", ADMIN_EMAIL)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        passwordHash: ADMIN_HASH, isAdmin: true, role: "ADMIN",
        isActive: true, emailVerified: true, updatedAt: now,
      });
      return { updated: true, email: ADMIN_EMAIL };
    }
    await ctx.db.insert("users", {
      email: ADMIN_EMAIL, passwordHash: ADMIN_HASH, firstName: "Platform", lastName: "Admin",
      role: "ADMIN", isActive: true, isAdmin: true, emailVerified: true, phoneVerified: false,
      preferredLanguage: "en", createdAt: now, updatedAt: now,
    });
    return { created: true, email: ADMIN_EMAIL };
  },
});

// Shared demo password hash → Homie@Demo2025
const DEMO_HASH =
  "pbkdf2$100000$6055b222e582305dda9fe3febcd1f3e9$72b94bb7a4e5d822b429b995d0ca4b1ed4bdcc5c8e464574e1e60e14cbd8fb8b";

/** Seed a normal demo user + a host + sample listings.
 *  Run: `npx convex run admin:seedDemo`
 *  Logins (password Homie@Demo2025): demo@findmyhomie.in, host@findmyhomie.in */
export const seedDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const upsertUser = async (email: string, firstName: string, lastName: string, role: string, intent: string) => {
      const found = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).unique();
      if (found) return found._id;
      return await ctx.db.insert("users", {
        email, passwordHash: DEMO_HASH, firstName, lastName,
        role: role as any, intent: intent as any, isActive: true, isAdmin: false,
        emailVerified: true, phoneVerified: false, preferredLanguage: "en",
        createdAt: now, updatedAt: now,
      });
    };

    const seekerId = await upsertUser("demo@findmyhomie.in", "Demo", "Seeker", "SEEKER", "FIND_ROOM");
    const hostId = await upsertUser("host@findmyhomie.in", "Meera", "Host", "HOST", "FILL_ROOM");

    // Published profile for the seeker
    const hasProfile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", seekerId)).unique();
    if (!hasProfile) {
      await ctx.db.insert("profiles", {
        userId: seekerId, status: "PUBLISHED", bio: "Designer looking for a calm, clean flat in south Bengaluru.",
        preferredAreas: ["Koramangala", "HSR Layout"], budgetMin: 12000, budgetMax: 20000,
        roomType: "PRIVATE", dietaryPreference: "VEGETARIAN", cleanlinessLevel: "VERY_CLEAN",
        sleepSchedule: "EARLY_BIRD", profileCompletionScore: 85, schemaVersion: "profile-v1.0",
        publishedAt: now, createdAt: now, updatedAt: now,
      } as any);
    }

    // Sample listings by the host
    const existingListings = await ctx.db.query("listings").withIndex("by_host", (q) => q.eq("hostId", hostId)).collect();
    if (existingListings.length === 0) {
      const base = {
        hostId, status: "PUBLISHED" as const, city: "Bengaluru", currentOccupants: 1,
        viewCount: 0, schemaVersion: "listing-v1.0", publishedAt: now, lastConfirmedAt: now,
        createdAt: now, updatedAt: now,
      };
      await ctx.db.insert("listings", { ...base, title: "Spacious private room in 3BHK", area: "Koramangala",
        roomType: "PRIVATE", availableBeds: 1, furnished: true, amenities: ["wifi", "ac"], rent: 18000,
        maintenance: 2000, deposit: 36000, availableFrom: now, householdVibe: "Friendly, working professionals." } as any);
      await ctx.db.insert("listings", { ...base, title: "Quiet room near Silk Board metro", area: "HSR Layout",
        roomType: "PRIVATE", availableBeds: 1, furnished: false, amenities: ["wifi", "parking"], rent: 15000,
        maintenance: 1500, deposit: 30000, availableFrom: now, householdVibe: "Calm, WFH-friendly." } as any);
    }

    return { ok: true, logins: ["demo@findmyhomie.in", "host@findmyhomie.in"], password: "Homie@Demo2025" };
  },
});

/** Create (or reset) an admin account with a given email + password hash + name.
 *  Run: npx convex run admin:createAdminUser '{"email":"x","passwordHash":"pbkdf2$...","firstName":"X"}' */
export const createAdminUser = internalMutation({
  args: { email: v.string(), passwordHash: v.string(), firstName: v.optional(v.string()), lastName: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const email = a.email.trim().toLowerCase();
    const now = Date.now();
    const existing = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        passwordHash: a.passwordHash, isAdmin: true, role: "ADMIN",
        isActive: true, emailVerified: true,
        firstName: a.firstName ?? existing.firstName, lastName: a.lastName ?? existing.lastName,
        updatedAt: now,
      });
      return { updated: true, email };
    }
    await ctx.db.insert("users", {
      email, passwordHash: a.passwordHash, firstName: a.firstName || "Shriyash", lastName: a.lastName,
      role: "ADMIN", isActive: true, isAdmin: true, emailVerified: true, phoneVerified: false,
      preferredLanguage: "en", createdAt: now, updatedAt: now,
    });
    return { created: true, email };
  },
});

/** Promote an existing registered user to admin by email.
 *  Run: `npx convex run admin:makeAdmin '{"email":"you@example.com"}'` */
export const makeAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const u = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email.trim().toLowerCase())).unique();
    if (!u) throw new Error("No user with that email — register in the app first.");
    await ctx.db.patch(u._id, { isAdmin: true, role: "ADMIN", updatedAt: Date.now() });
    return { ok: true, email: u.email };
  },
});

const page = <T>(rows: T[], p = 1, limit = 20) => rows.slice((p - 1) * limit, (p - 1) * limit + limit);

/** Platform overview counts. */
export const getStats = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const [users, listings, connections, viewings, reports] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("listings").collect(),
      ctx.db.query("connections").collect(),
      ctx.db.query("viewingRequests").collect(),
      ctx.db.query("reports").collect(),
    ]);
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => (u.lastActiveAt ?? u.createdAt) > monthAgo).length,
      totalListings: listings.length,
      publishedListings: listings.filter((l) => l.status === "PUBLISHED").length,
      staleListings: listings.filter((l) => l.status === "STALE").length,
      totalConnections: connections.length,
      acceptedConnections: connections.filter((c) => c.status === "ACCEPTED").length,
      totalViewings: viewings.length,
      openReports: reports.filter((r) => r.status === "OPEN").length,
    };
  },
});

export const getUsers = query({
  args: { token: v.string(), search: v.optional(v.string()), role: v.optional(v.string()), page: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, { token, search, role, page: p, limit }) => {
    await requireAdmin(ctx, token);
    let rows = (await ctx.db.query("users").collect()).sort((a, b) => b.createdAt - a.createdAt);
    if (role && role !== "all") rows = rows.filter((u) => u.role === role);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((u) => u.email.toLowerCase().includes(s)
        || `${u.firstName} ${u.lastName ?? ""}`.toLowerCase().includes(s));
    }
    const total = rows.length;
    const users = page(rows, p, limit).map((u) => ({ id: u._id, ...publicUser(u) }));
    return { users, total };
  },
});

export const updateUser = mutation({
  args: { token: v.string(), userId: v.id("users"), isAdmin: v.optional(v.boolean()) },
  handler: async (ctx, { token, userId, isAdmin }) => {
    await requireAdmin(ctx, token);
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (isAdmin !== undefined) {
      patch.isAdmin = isAdmin;
      if (isAdmin) patch.role = "ADMIN";
    }
    await ctx.db.patch(userId, patch);
    return { ok: true };
  },
});

export const setUserActive = mutation({
  args: { token: v.string(), userId: v.id("users"), isActive: v.boolean() },
  handler: async (ctx, { token, userId, isActive }) => {
    const admin = await requireAdmin(ctx, token);
    if (userId === admin._id && !isActive) throw new Error("You can't deactivate yourself.");
    await ctx.db.patch(userId, { isActive, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const getListings = query({
  args: { token: v.string(), search: v.optional(v.string()), status: v.optional(v.string()), page: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, { token, search, status, page: p, limit }) => {
    await requireAdmin(ctx, token);
    let rows = (await ctx.db.query("listings").collect()).sort((a, b) => b.createdAt - a.createdAt);
    if (status && status !== "all") rows = rows.filter((l) => l.status === status);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((l) => l.title.toLowerCase().includes(s) || l.area.toLowerCase().includes(s));
    }
    const total = rows.length;
    const slice = page(rows, p, limit);
    const listings = await Promise.all(slice.map(async (l: Doc<"listings">) => {
      const host = await ctx.db.get(l.hostId);
      return { ...l, id: l._id, host: host ? publicUser(host) : null };
    }));
    return { listings, total };
  },
});

export const updateListing = mutation({
  args: { token: v.string(), id: v.id("listings"), status: v.string() },
  handler: async (ctx, { token, id, status }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { status: status as any, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const getReports = query({
  args: { token: v.string(), status: v.optional(v.string()), page: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, { token, status, page: p, limit }) => {
    await requireAdmin(ctx, token);
    let rows: Doc<"reports">[];
    if (status && status !== "all") {
      rows = await ctx.db.query("reports").withIndex("by_status", (q) => q.eq("status", status as any)).collect();
    } else {
      rows = await ctx.db.query("reports").collect();
    }
    rows.sort((a, b) => b.createdAt - a.createdAt);
    const total = rows.length;
    const slice = page(rows, p, limit);
    const reports = await Promise.all(slice.map(async (r) => {
      const [by, ru] = await Promise.all([
        ctx.db.get(r.reportedById),
        r.reportedUserId ? ctx.db.get(r.reportedUserId) : null,
      ]);
      return { ...r, id: r._id, reportedBy: by ? publicUser(by) : null, reportedUser: ru ? publicUser(ru) : null };
    }));
    return { reports, total };
  },
});

export const updateReport = mutation({
  args: { token: v.string(), id: v.id("reports"), status: v.string(), adminNote: v.optional(v.string()) },
  handler: async (ctx, { token, id, status, adminNote }) => {
    await requireAdmin(ctx, token);
    const patch: Record<string, unknown> = { status, updatedAt: Date.now() };
    if (adminNote !== undefined) patch.adminNote = adminNote;
    if (status === "RESOLVED" || status === "DISMISSED") patch.resolvedAt = Date.now();
    await ctx.db.patch(id, patch);
    return { ok: true };
  },
});
