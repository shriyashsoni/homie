import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, publicUser } from "./lib/getUser";
import { createNotification } from "./lib/notify";
import { Doc } from "./_generated/dataModel";

async function hydrate(ctx: any, vr: Doc<"viewingRequests">) {
  const [listing, slot, seeker, host] = await Promise.all([
    ctx.db.get(vr.listingId),
    vr.slotId ? ctx.db.get(vr.slotId) : null,
    ctx.db.get(vr.seekerId),
    ctx.db.get(vr.hostId),
  ]);
  return {
    ...vr, id: vr._id,
    listing: listing ? { id: listing._id, title: listing.title, area: listing.area } : null,
    slot: slot ? { id: slot._id, startTime: slot.startTime, endTime: slot.endTime } : null,
    seeker: seeker ? publicUser(seeker) : null,
    host: host ? publicUser(host) : null,
  };
}

/** Viewing requests where the user is seeker or host. */
export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await requireUser(ctx, token);
    const [asSeeker, asHost] = await Promise.all([
      ctx.db.query("viewingRequests").withIndex("by_seeker", (q) => q.eq("seekerId", user._id)).collect(),
      ctx.db.query("viewingRequests").withIndex("by_host", (q) => q.eq("hostId", user._id)).collect(),
    ]);
    const all = [...asSeeker, ...asHost].sort((a, b) => b.createdAt - a.createdAt);
    const viewings = await Promise.all(all.map((vr) => hydrate(ctx, vr)));
    return { viewings };
  },
});

/** Seeker requests a viewing for a listing. */
export const request = mutation({
  args: {
    token: v.string(),
    listingId: v.id("listings"),
    slotId: v.optional(v.id("viewingSlots")),
    proposedTime: v.optional(v.number()),
    meetingMode: v.optional(v.union(v.literal("IN_PERSON"), v.literal("VIDEO_CALL"), v.literal("EITHER"))),
    message: v.optional(v.string()),
  },
  handler: async (ctx, { token, listingId, slotId, proposedTime, meetingMode, message }) => {
    const user = await requireUser(ctx, token);
    const listing = await ctx.db.get(listingId);
    if (!listing) throw new Error("Listing not found.");
    if (listing.hostId === user._id) throw new Error("You can't request a viewing on your own listing.");
    const now = Date.now();
    const id = await ctx.db.insert("viewingRequests", {
      seekerId: user._id, hostId: listing.hostId, listingId, slotId,
      status: "REQUESTED", meetingMode, message, proposedTime,
      rescheduleCount: 0, createdAt: now, updatedAt: now,
    });
    await createNotification(ctx, {
      userId: listing.hostId, type: "VIEWING_REQUEST",
      title: "New viewing request",
      body: `${user.firstName} requested a viewing for "${listing.title}".`,
      data: { viewingId: id },
    });
    return { viewing: await ctx.db.get(id) };
  },
});

export const confirm = mutation({
  args: { token: v.string(), id: v.id("viewingRequests"), confirmedTime: v.optional(v.number()) },
  handler: async (ctx, { token, id, confirmedTime }) => {
    const user = await requireUser(ctx, token);
    const vr = await ctx.db.get(id);
    if (!vr || vr.hostId !== user._id) throw new Error("Not allowed.");
    const now = Date.now();
    await ctx.db.patch(id, { status: "CONFIRMED", confirmedTime: confirmedTime ?? vr.proposedTime, updatedAt: now });
    await createNotification(ctx, {
      userId: vr.seekerId, type: "VIEWING_CONFIRMED",
      title: "Viewing confirmed",
      body: "Your viewing request was confirmed.",
      data: { viewingId: id },
    });
    return { viewing: await ctx.db.get(id) };
  },
});

export const cancel = mutation({
  args: { token: v.string(), id: v.id("viewingRequests"), reason: v.optional(v.string()) },
  handler: async (ctx, { token, id, reason }) => {
    const user = await requireUser(ctx, token);
    const vr = await ctx.db.get(id);
    if (!vr || (vr.seekerId !== user._id && vr.hostId !== user._id)) throw new Error("Not allowed.");
    await ctx.db.patch(id, { status: "CANCELLED", cancelReason: reason, updatedAt: Date.now() });
    const notifyId = vr.seekerId === user._id ? vr.hostId : vr.seekerId;
    await createNotification(ctx, {
      userId: notifyId, type: "VIEWING_CANCELLED",
      title: "Viewing cancelled", body: "A viewing was cancelled.", data: { viewingId: id },
    });
    return { ok: true };
  },
});

/** Host adds an available viewing slot. */
export const addSlot = mutation({
  args: {
    token: v.string(), listingId: v.id("listings"),
    startTime: v.number(), endTime: v.number(), capacity: v.optional(v.number()),
    meetingMode: v.optional(v.union(v.literal("IN_PERSON"), v.literal("VIDEO_CALL"), v.literal("EITHER"))),
  },
  handler: async (ctx, { token, listingId, startTime, endTime, capacity, meetingMode }) => {
    const user = await requireUser(ctx, token);
    const listing = await ctx.db.get(listingId);
    if (!listing || listing.hostId !== user._id) throw new Error("Not allowed.");
    const now = Date.now();
    const id = await ctx.db.insert("viewingSlots", {
      listingId, startTime, endTime, capacity: capacity ?? 1, bookedCount: 0,
      bufferMinutes: 15, minNoticeHours: 2, meetingMode: meetingMode ?? "IN_PERSON",
      timezone: "Asia/Kolkata", isAvailable: true, createdAt: now, updatedAt: now,
    });
    return { id };
  },
});
