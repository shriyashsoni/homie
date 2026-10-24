import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser, publicUser } from "./lib/getUser";

const UserIntent = v.union(v.literal("FIND_ROOM"), v.literal("FIND_PEOPLE"), v.literal("FILL_ROOM"));

/** Update the logged-in user's own account fields. */
export const updateMe = mutation({
  args: {
    token: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    intent: v.optional(UserIntent),
    preferredLanguage: v.optional(v.string()),
  },
  handler: async (ctx, { token, ...patch }) => {
    const user = await requireUser(ctx, token);
    const clean: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, val] of Object.entries(patch)) {
      if (val !== undefined) clean[k] = val;
    }
    // Switching intent to FILL_ROOM promotes a seeker to host.
    if (patch.intent === "FILL_ROOM" && user.role === "SEEKER") clean.role = "HOST";
    await ctx.db.patch(user._id, clean);
    const updated = await ctx.db.get(user._id);
    return publicUser(updated!);
  },
});
