import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc } from "../_generated/dataModel";
import { sha256Hex } from "./password";

type Ctx = QueryCtx | MutationCtx;

/** Resolve the logged-in user from an opaque session token, or null. */
export async function getUserByToken(
  ctx: Ctx,
  token: string | undefined | null,
): Promise<Doc<"users"> | null> {
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("tokenHash", tokenHash))
    .unique();
  if (!session || session.expiresAt < Date.now()) return null;
  const user = await ctx.db.get(session.userId);
  if (!user || !user.isActive) return null;
  return user;
}

/** Like getUserByToken but throws when unauthenticated. */
export async function requireUser(ctx: Ctx, token: string | undefined | null): Promise<Doc<"users">> {
  const user = await getUserByToken(ctx, token);
  if (!user) throw new Error("Not authenticated");
  return user;
}

/** Requires an active admin user. */
export async function requireAdmin(ctx: Ctx, token: string | undefined | null): Promise<Doc<"users">> {
  const user = await requireUser(ctx, token);
  if (!user.isAdmin) throw new Error("Admin access required");
  return user;
}

/** Strip sensitive fields before returning a user to the client; expose `id`. */
export function publicUser(user: Doc<"users">) {
  const { passwordHash, ...safe } = user;
  return { id: user._id, ...safe };
}
