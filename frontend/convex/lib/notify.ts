import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

type NotifType =
  | "CONNECTION_REQUEST" | "CONNECTION_ACCEPTED" | "VIEWING_REQUEST"
  | "VIEWING_CONFIRMED" | "VIEWING_REMINDER" | "VIEWING_CANCELLED"
  | "LISTING_STALE_WARNING" | "PROFILE_INCOMPLETE" | "SYSTEM";

/** Insert a notification (call directly inside mutations). */
export async function createNotification(
  ctx: MutationCtx,
  args: { userId: Id<"users">; type: NotifType; title: string; body: string; data?: unknown },
) {
  await ctx.db.insert("notifications", {
    userId: args.userId,
    type: args.type,
    title: args.title,
    body: args.body,
    data: args.data,
    isRead: false,
    createdAt: Date.now(),
  });
}
