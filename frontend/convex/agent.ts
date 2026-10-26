import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/* ════════════════════════════════════════════════════════
 * WhatsApp AI agent — Claude drives a conversation over
 * WhatsApp and calls our Convex functions as tools to find
 * rooms, save preferences, and connect with hosts.
 * ════════════════════════════════════════════════════════ */

const num = (x: any) => (x === "" || x == null ? undefined : typeof x === "number" ? x : Number(x) || undefined);

// ── Tool executors (internal) ─────────────────────────────
export const resolveUserByPhone = internalMutation({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    const existing = await ctx.db.query("users").withIndex("by_phone", (q) => q.eq("phone", phone)).unique();
    if (existing) return existing._id;
    const now = Date.now();
    return await ctx.db.insert("users", {
      email: `wa_${phone}@whatsapp.local`, phone, passwordHash: "whatsapp-oauth",
      firstName: "WhatsApp", lastName: "User", role: "SEEKER", intent: "FIND_ROOM",
      isActive: true, isAdmin: false, emailVerified: false, phoneVerified: true,
      preferredLanguage: "en", createdAt: now, updatedAt: now,
    });
  },
});

export const savePrefs = internalMutation({
  args: { userId: v.id("users"), location: v.optional(v.string()), minBudget: v.optional(v.any()),
    maxBudget: v.optional(v.any()), roomType: v.optional(v.string()), diet: v.optional(v.string()), cleanliness: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const now = Date.now();
    let profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", a.userId)).unique();
    const patch: Record<string, any> = { updatedAt: now };
    if (a.location) { patch.preferredAreas = [a.location]; patch.cityArea = a.location; }
    if (num(a.minBudget) !== undefined) patch.budgetMin = num(a.minBudget);
    if (num(a.maxBudget) !== undefined) patch.budgetMax = num(a.maxBudget);
    if (a.roomType && ["PRIVATE","SHARED","STUDIO","ENTIRE_FLAT"].includes(a.roomType)) patch.roomType = a.roomType;
    if (a.diet) patch.dietaryPreference = a.diet.toUpperCase().replace(/[^A-Z_]/g, "_");
    if (a.cleanliness) patch.cleanlinessLevel = a.cleanliness.toUpperCase().replace(/[^A-Z_]/g, "_");
    if (profile) { await ctx.db.patch(profile._id, patch); }
    else {
      await ctx.db.insert("profiles", { userId: a.userId, status: "DRAFT", profileCompletionScore: 40,
        schemaVersion: "profile-v1.0", createdAt: now, ...patch } as any);
    }
    return { ok: true, saved: Object.keys(patch).filter((k) => k !== "updatedAt") };
  },
});

export const searchRooms = internalQuery({
  args: { userId: v.id("users"), location: v.optional(v.string()), maxBudget: v.optional(v.any()), roomType: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", a.userId)).unique();
    const location = (a.location || profile?.preferredAreas?.[0] || profile?.cityArea || "").toLowerCase();
    const maxBudget = num(a.maxBudget) ?? profile?.budgetMax;
    const roomType = a.roomType || profile?.roomType;

    let rows = await ctx.db.query("listings").withIndex("by_status", (q) => q.eq("status", "PUBLISHED")).order("desc").take(120);
    rows = rows.filter((l) => l.hostId !== a.userId);
    if (location) rows = rows.filter((l) => l.area.toLowerCase().includes(location) || l.city.toLowerCase().includes(location));
    if (maxBudget) rows = rows.filter((l) => l.rent <= maxBudget * 1.05);
    if (roomType) rows = rows.filter((l) => l.roomType === roomType);
    rows.sort((x, y) => x.rent - y.rent);
    return {
      count: rows.length,
      rooms: rows.slice(0, 5).map((l) => ({
        id: l._id, title: l.title, area: l.area, city: l.city, rent: l.rent,
        roomType: l.roomType, furnished: !!l.furnished,
      })),
    };
  },
});

export const listingDetail = internalQuery({
  args: { listingId: v.id("listings") },
  handler: async (ctx, { listingId }) => {
    const l = await ctx.db.get(listingId);
    if (!l) return { error: "Listing not found" };
    const host = await ctx.db.get(l.hostId);
    return {
      id: l._id, title: l.title, area: l.area, city: l.city, rent: l.rent,
      maintenance: l.maintenance ?? null, deposit: l.deposit ?? null, roomType: l.roomType,
      furnished: !!l.furnished, amenities: l.amenities ?? [], description: l.description ?? "",
      householdVibe: l.householdVibe ?? "", host: host?.firstName ?? "Host",
    };
  },
});

export const requestConnection = internalMutation({
  args: { userId: v.id("users"), listingId: v.id("listings"), message: v.optional(v.string()) },
  handler: async (ctx, { userId, listingId, message }) => {
    const l = await ctx.db.get(listingId);
    if (!l) return { error: "Listing not found" };
    if (l.hostId === userId) return { error: "That's your own listing" };
    const now = Date.now();
    const dupe = (await ctx.db.query("connections").withIndex("by_sender", (q) => q.eq("senderId", userId)).collect())
      .find((c) => c.receiverId === l.hostId && c.listingId === listingId && (c.status === "PENDING" || c.status === "ACCEPTED"));
    if (dupe) return { ok: true, alreadySent: true };
    await ctx.db.insert("connections", { senderId: userId, receiverId: l.hostId, listingId,
      status: "PENDING", message: message || "Hi! I'm interested in your room (via WhatsApp).", createdAt: now, updatedAt: now });
    const host = await ctx.db.get(l.hostId);
    await ctx.db.insert("notifications", { userId: l.hostId, type: "CONNECTION_REQUEST",
      title: "New connection request", body: `Someone is interested in "${l.title}" (via WhatsApp).`, isRead: false, createdAt: now });
    return { ok: true, host: host?.firstName ?? "the host" };
  },
});

export const getThread = internalQuery({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    const t = await ctx.db.query("agentThreads").withIndex("by_phone", (q) => q.eq("phone", phone)).unique();
    return t?.history ?? [];
  },
});

export const saveThread = internalMutation({
  args: { phone: v.string(), userId: v.id("users"), history: v.array(v.object({ role: v.string(), content: v.string() })) },
  handler: async (ctx, { phone, userId, history }) => {
    const trimmed = history.slice(-20);
    const t = await ctx.db.query("agentThreads").withIndex("by_phone", (q) => q.eq("phone", phone)).unique();
    if (t) await ctx.db.patch(t._id, { userId, history: trimmed, updatedAt: Date.now() });
    else await ctx.db.insert("agentThreads", { phone, userId, history: trimmed, updatedAt: Date.now() });
  },
});

// ── Agent brain (Claude tool-use loop) ────────────────────
const SYSTEM = `You are "homie", a warm, concise WhatsApp assistant that helps people find rooms and compatible flatmates in any city worldwide.
Rules:
- Keep replies short and friendly — this is WhatsApp. Use line breaks and the occasional emoji.
- First understand what they want: their city/area, monthly budget, and room type (private/shared/studio/entire flat). Ask only for what's missing, one or two questions at a time.
- When you have enough, call save_preferences, then search_rooms. Present up to 5 options as a numbered list: "1. <title> — <area>, ₹<rent>/mo". Keep each line short.
- If they pick one (e.g. "tell me about 2"), call get_listing for its id and summarize cost + vibe.
- If they want to proceed (e.g. "connect me with 2"), call request_connection for that listing's id and confirm the host will be notified.
- Never invent listings, prices, or ids — only use what the tools return. If no rooms match, say so and suggest widening budget or area.
- Currency: show ₹ for Indian cities, otherwise just the number with the local context the data implies.`;

const TOOLS = [
  { name: "save_preferences", description: "Save/update the user's room-search preferences.",
    input_schema: { type: "object", properties: {
      location: { type: "string", description: "city or area, e.g. 'Koramangala' or 'Berlin'" },
      minBudget: { type: "number" }, maxBudget: { type: "number" },
      roomType: { type: "string", enum: ["PRIVATE", "SHARED", "STUDIO", "ENTIRE_FLAT"] },
      diet: { type: "string" }, cleanliness: { type: "string" } } } },
  { name: "search_rooms", description: "Search available rooms; omitted args fall back to saved preferences.",
    input_schema: { type: "object", properties: {
      location: { type: "string" }, maxBudget: { type: "number" }, roomType: { type: "string" } } } },
  { name: "get_listing", description: "Full details of one listing by its id.",
    input_schema: { type: "object", properties: { listingId: { type: "string" } }, required: ["listingId"] } },
  { name: "request_connection", description: "Send an interest/connection request to a listing's host.",
    input_schema: { type: "object", properties: { listingId: { type: "string" }, message: { type: "string" } }, required: ["listingId"] } },
];

async function execTool(ctx: any, userId: any, name: string, input: any): Promise<any> {
  try {
    switch (name) {
      case "save_preferences": return await ctx.runMutation(internal.agent.savePrefs, { userId, ...input });
      case "search_rooms":     return await ctx.runQuery(internal.agent.searchRooms, { userId, ...input });
      case "get_listing":      return await ctx.runQuery(internal.agent.listingDetail, { listingId: input.listingId });
      case "request_connection": return await ctx.runMutation(internal.agent.requestConnection, { userId, listingId: input.listingId, message: input.message });
      default: return { error: `Unknown tool ${name}` };
    }
  } catch (e: any) {
    return { error: e?.message || "Tool failed — the id may be invalid." };
  }
}

export const handleMessage = internalAction({
  args: { phone: v.string(), text: v.string() },
  handler: async (ctx, { phone, text }): Promise<string> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return "The assistant isn't configured yet (missing ANTHROPIC_API_KEY).";
    const model = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

    const userId = await ctx.runMutation(internal.agent.resolveUserByPhone, { phone });
    const history = await ctx.runQuery(internal.agent.getThread, { phone });

    const messages: any[] = [
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: "user", content: text },
    ];

    let finalText = "";
    for (let step = 0; step < 6; step++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model, max_tokens: 1024, system: SYSTEM, tools: TOOLS, messages }),
      });
      if (!res.ok) {
        console.error("Anthropic error", res.status, await res.text());
        return "Sorry, I hit a snag. Please try again in a moment.";
      }
      const data: any = await res.json();
      if (data.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: data.content });
        const toolResults: any[] = [];
        for (const block of data.content) {
          if (block.type === "tool_use") {
            const result = await execTool(ctx, userId, block.name, block.input || {});
            toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
          }
        }
        messages.push({ role: "user", content: toolResults });
        continue;
      }
      finalText = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
      break;
    }
    if (!finalText) finalText = "Could you rephrase that? I can help you find a room or flatmate.";

    await ctx.runMutation(internal.agent.saveThread, {
      phone, userId,
      history: [...history, { role: "user", content: text }, { role: "assistant", content: finalText }],
    });
    return finalText;
  },
});
