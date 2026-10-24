import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./lib/getUser";

const ReportType = v.union(
  v.literal("SPAM"), v.literal("FAKE_LISTING"), v.literal("HARASSMENT"),
  v.literal("PAYMENT_SCAM"), v.literal("IMPERSONATION"), v.literal("OFFENSIVE_CONTENT"), v.literal("OTHER"),
);

/** File a report against a user or listing. */
export const create = mutation({
  args: {
    token: v.string(),
    reportType: ReportType,
    reportedUserId: v.optional(v.id("users")),
    reportedListingId: v.optional(v.id("listings")),
    description: v.optional(v.string()),
    evidence: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { token, ...data }) => {
    const user = await requireUser(ctx, token);
    const now = Date.now();
    const id = await ctx.db.insert("reports", {
      reportedById: user._id,
      reportedUserId: data.reportedUserId,
      reportedListingId: data.reportedListingId,
      reportType: data.reportType,
      status: "OPEN",
      description: data.description,
      evidence: data.evidence,
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  },
});
