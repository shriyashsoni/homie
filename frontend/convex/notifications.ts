import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/getUser";

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await requireUser(ctx, token);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);
    return { notifications: rows.map((n) => ({ ...n, id: n._id })) };
  },
});

export const markRead = mutation({
  args: { token: v.string(), id: v.id("notifications") },
  handler: async (ctx, { token, id }) => {
    const user = await requireUser(ctx, token);
    const n = await ctx.db.get(id);
    if (!n || n.userId !== user._id) throw new Error("Not allowed.");
    if (!n.isRead) await ctx.db.patch(id, { isRead: true, readAt: Date.now() });
    return { ok: true };
  },
});

export const markAllRead = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await requireUser(ctx, token);
    const unread = (await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", user._id)).collect())
      .filter((n) => !n.isRead);
    const now = Date.now();
    for (const n of unread) await ctx.db.patch(n._id, { isRead: true, readAt: now });
    return { marked: unread.length };
  },
});
