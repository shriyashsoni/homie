import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, publicUser } from "./lib/getUser";
import { Doc } from "./_generated/dataModel";

function pub(u: Doc<"users"> | null) {
  return u ? { id: u._id, ...publicUser(u) } : null;
}

/** List the logged-in user's conversations with last message + other party. */
export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await requireUser(ctx, token);
    const [a, b] = await Promise.all([
      ctx.db.query("conversations").withIndex("by_userA", (q) => q.eq("userAId", user._id)).collect(),
      ctx.db.query("conversations").withIndex("by_userB", (q) => q.eq("userBId", user._id)).collect(),
    ]);
    const convs = [...a, ...b].sort((x, y) => y.updatedAt - x.updatedAt);
    const result = await Promise.all(convs.map(async (c) => {
      const otherId = c.userAId === user._id ? c.userBId : c.userAId;
      const other = await ctx.db.get(otherId);
      const last = (await ctx.db.query("messages").withIndex("by_conversation", (q) => q.eq("conversationId", c._id)).order("desc").take(1))[0];
      const lastMessage = last ? (last.content || (last.imageId ? "📷 Photo" : "")) : null;
      return { id: c._id, other: pub(other), lastMessage, updatedAt: c.updatedAt };
    }));
    return { conversations: result };
  },
});

/** A single conversation with messages (image URLs resolved) and both parties. */
export const getById = query({
  args: { token: v.string(), id: v.id("conversations") },
  handler: async (ctx, { token, id }) => {
    const user = await requireUser(ctx, token);
    const conv = await ctx.db.get(id);
    if (!conv) return { conversation: null };
    if (conv.userAId !== user._id && conv.userBId !== user._id) throw new Error("Not your conversation.");
    const [userA, userB, msgs] = await Promise.all([
      ctx.db.get(conv.userAId),
      ctx.db.get(conv.userBId),
      ctx.db.query("messages").withIndex("by_conversation", (q) => q.eq("conversationId", id)).order("asc").collect(),
    ]);
    const messages = await Promise.all(msgs.map(async (m) => ({
      id: m._id,
      senderId: m.senderId,
      content: m.content,
      imageUrl: m.imageId ? await ctx.storage.getUrl(m.imageId) : null,
      isRead: m.isRead,
      createdAt: m.createdAt,
    })));
    return {
      conversation: { id: conv._id, userA: pub(userA), userB: pub(userB), messages },
    };
  },
});

/** Get a short-lived URL the client POSTs an image file to (Convex file storage). */
export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireUser(ctx, token);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Send a message (text and/or an uploaded image) in a conversation. */
export const sendMessage = mutation({
  args: {
    token: v.string(),
    id: v.id("conversations"),
    content: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { token, id, content, imageId }) => {
    const user = await requireUser(ctx, token);
    const conv = await ctx.db.get(id);
    if (!conv) throw new Error("Conversation not found.");
    if (conv.userAId !== user._id && conv.userBId !== user._id) throw new Error("Not your conversation.");
    const text = (content || "").trim();
    if (!text && !imageId) throw new Error("Message is empty.");
    const now = Date.now();
    const msgId = await ctx.db.insert("messages", {
      conversationId: id, senderId: user._id, content: text, imageId, isRead: false, createdAt: now,
    });
    await ctx.db.patch(id, { updatedAt: now });
    return { id: msgId };
  },
});

/** Mark the other party's messages as read. */
export const markRead = mutation({
  args: { token: v.string(), id: v.id("conversations") },
  handler: async (ctx, { token, id }) => {
    const user = await requireUser(ctx, token);
    const conv = await ctx.db.get(id);
    if (!conv || (conv.userAId !== user._id && conv.userBId !== user._id)) throw new Error("Not allowed.");
    const unread = (await ctx.db.query("messages").withIndex("by_conversation", (q) => q.eq("conversationId", id)).collect())
      .filter((m) => m.senderId !== user._id && !m.isRead);
    const now = Date.now();
    for (const m of unread) await ctx.db.patch(m._id, { isRead: true, readAt: now });
    return { marked: unread.length };
  },
});
