import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, publicUser } from "./lib/getUser";
import { createNotification } from "./lib/notify";
import { Doc } from "./_generated/dataModel";

async function hydrate(ctx: any, c: Doc<"connections">) {
  const [sender, receiver, listing, conversation] = await Promise.all([
    ctx.db.get(c.senderId),
    ctx.db.get(c.receiverId),
    c.listingId ? ctx.db.get(c.listingId) : null,
    ctx.db.query("conversations").withIndex("by_connection", (q: any) => q.eq("connectionId", c._id)).unique(),
  ]);
  return {
    ...c,
    id: c._id,
    sender: sender ? publicUser(sender) : null,
    receiver: receiver ? publicUser(receiver) : null,
    listing: listing ? { id: listing._id, title: listing.title, area: listing.area } : null,
    conversation: conversation ? { id: conversation._id } : null,
  };
}

/** All connections involving the logged-in user (sent + received). */
export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await requireUser(ctx, token);
    const [sent, received] = await Promise.all([
      ctx.db.query("connections").withIndex("by_sender", (q) => q.eq("senderId", user._id)).collect(),
      ctx.db.query("connections").withIndex("by_receiver", (q) => q.eq("receiverId", user._id)).collect(),
    ]);
    const all = [...sent, ...received].sort((a, b) => b.createdAt - a.createdAt);
    const connections = await Promise.all(all.map((c) => hydrate(ctx, c)));
    return { connections };
  },
});

/** Send a connection request. */
export const send = mutation({
  args: {
    token: v.string(),
    receiverId: v.id("users"),
    listingId: v.optional(v.id("listings")),
    message: v.optional(v.string()),
  },
  handler: async (ctx, { token, receiverId, listingId, message }) => {
    const user = await requireUser(ctx, token);
    if (receiverId === user._id) throw new Error("You can't connect with yourself.");

    // de-dupe existing pending/accepted request from this user re: same listing
    const existing = (await ctx.db
      .query("connections")
      .withIndex("by_sender", (q) => q.eq("senderId", user._id))
      .collect())
      .find((c) => c.receiverId === receiverId && (c.listingId ?? null) === (listingId ?? null)
        && (c.status === "PENDING" || c.status === "ACCEPTED"));
    if (existing) return { connection: existing, duplicate: true };

    const now = Date.now();
    const id = await ctx.db.insert("connections", {
      senderId: user._id, receiverId, listingId, status: "PENDING",
      message, createdAt: now, updatedAt: now,
    });
    await createNotification(ctx, {
      userId: receiverId, type: "CONNECTION_REQUEST",
      title: "New connection request",
      body: `${user.firstName} wants to connect${listingId ? " about your listing" : ""}.`,
      data: { connectionId: id },
    });
    return { connection: await ctx.db.get(id) };
  },
});

export const accept = mutation({
  args: { token: v.string(), id: v.id("connections") },
  handler: async (ctx, { token, id }) => {
    const user = await requireUser(ctx, token);
    const conn = await ctx.db.get(id);
    if (!conn) throw new Error("Request not found.");
    if (conn.receiverId !== user._id) throw new Error("Not your request to accept.");
    const now = Date.now();
    await ctx.db.patch(id, { status: "ACCEPTED", contactRevealedAt: now, updatedAt: now });

    // create the conversation if not present
    let conv = await ctx.db.query("conversations").withIndex("by_connection", (q) => q.eq("connectionId", id)).unique();
    if (!conv) {
      const convId = await ctx.db.insert("conversations", {
        connectionId: id, userAId: conn.senderId, userBId: conn.receiverId,
        isActive: true, createdAt: now, updatedAt: now,
      });
      conv = await ctx.db.get(convId);
    }
    await createNotification(ctx, {
      userId: conn.senderId, type: "CONNECTION_ACCEPTED",
      title: "Connection accepted",
      body: `${user.firstName} accepted your request. Say hello!`,
      data: { connectionId: id, conversationId: conv!._id },
    });
    return { connection: await ctx.db.get(id), conversationId: conv!._id };
  },
});

export const decline = mutation({
  args: { token: v.string(), id: v.id("connections"), reason: v.optional(v.string()) },
  handler: async (ctx, { token, id, reason }) => {
    const user = await requireUser(ctx, token);
    const conn = await ctx.db.get(id);
    if (!conn || conn.receiverId !== user._id) throw new Error("Not allowed.");
    await ctx.db.patch(id, { status: "DECLINED", declineReason: reason, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const cancel = mutation({
  args: { token: v.string(), id: v.id("connections") },
  handler: async (ctx, { token, id }) => {
    const user = await requireUser(ctx, token);
    const conn = await ctx.db.get(id);
    if (!conn || conn.senderId !== user._id) throw new Error("Not allowed.");
    await ctx.db.patch(id, { status: "CANCELLED", updatedAt: Date.now() });
    return { ok: true };
  },
});
