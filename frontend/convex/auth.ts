import { v } from "convex/values";
import { jwtVerify, createRemoteJWKSet } from "jose";
import {
  action, mutation, query, internalMutation, internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { hashPassword, verifyPassword, randomTokenHex, sha256Hex } from "./lib/password";
import { getUserByToken, publicUser } from "./lib/getUser";

const SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Firebase project that issues the Google ID tokens we accept.
const FIREBASE_PROJECT_ID = "homie-7ac90";
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

// ── Internal db helpers (called from actions) ─────────────
export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  },
});

export const getUserPublic = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const u = await ctx.db.get(userId);
    return u ? publicUser(u) : null;
  },
});

export const insertUser = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    intent: v.optional(v.union(v.literal("FIND_ROOM"), v.literal("FIND_PEOPLE"), v.literal("FILL_ROOM"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const role = args.intent === "FILL_ROOM" ? "HOST" : "SEEKER";
    return await ctx.db.insert("users", {
      email: args.email,
      phone: args.phone,
      passwordHash: args.passwordHash,
      firstName: args.firstName,
      lastName: args.lastName,
      role,
      intent: args.intent,
      isActive: true,
      isAdmin: false,
      emailVerified: false,
      phoneVerified: false,
      preferredLanguage: "en",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createSession = internalMutation({
  args: { userId: v.id("users"), tokenHash: v.string(), expiresAt: v.number() },
  handler: async (ctx, { userId, tokenHash, expiresAt }) => {
    await ctx.db.insert("sessions", { userId, tokenHash, expiresAt, createdAt: Date.now() });
  },
});

export const upsertOAuthUser = internalMutation({
  args: { email: v.string(), firstName: v.string(), lastName: v.optional(v.string()), avatarUrl: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const now = Date.now();
    const existing = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", a.email)).unique();
    if (existing) {
      const patch: Record<string, unknown> = { emailVerified: true, updatedAt: now };
      if (a.avatarUrl && !existing.avatarUrl) patch.avatarUrl = a.avatarUrl;
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("users", {
      email: a.email, passwordHash: "google-oauth", firstName: a.firstName, lastName: a.lastName,
      avatarUrl: a.avatarUrl, role: "SEEKER", isActive: true, isAdmin: false,
      emailVerified: true, phoneVerified: false, preferredLanguage: "en",
      createdAt: now, updatedAt: now,
    });
  },
});

// ── Public auth endpoints ─────────────────────────────────
export const signUp = action({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    intent: v.optional(v.union(v.literal("FIND_ROOM"), v.literal("FIND_PEOPLE"), v.literal("FILL_ROOM"))),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const existing = await ctx.runQuery(internal.auth.getUserByEmail, { email });
    if (existing) throw new Error("An account with this email already exists.");

    const passwordHash = await hashPassword(args.password);
    const userId = await ctx.runMutation(internal.auth.insertUser, {
      email, passwordHash, firstName: args.firstName.trim(),
      lastName: args.lastName?.trim(), phone: args.phone?.trim(), intent: args.intent,
    });

    const token = randomTokenHex();
    await ctx.runMutation(internal.auth.createSession, {
      userId, tokenHash: await sha256Hex(token), expiresAt: Date.now() + SESSION_MS,
    });
    const user = await ctx.runQuery(internal.auth.getUserPublic, { userId });
    return { token, user };
  },
});

export const signIn = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const user = await ctx.runQuery(internal.auth.getUserByEmail, { email });
    if (!user || !user.isActive) throw new Error("Incorrect email or password.");
    const ok = await verifyPassword(args.password, user.passwordHash);
    if (!ok) throw new Error("Incorrect email or password.");

    const token = randomTokenHex();
    await ctx.runMutation(internal.auth.createSession, {
      userId: user._id, tokenHash: await sha256Hex(token), expiresAt: Date.now() + SESSION_MS,
    });
    const safe = await ctx.runQuery(internal.auth.getUserPublic, { userId: user._id });
    return { token, user: safe };
  },
});

/** Sign in with a Firebase Google ID token → verify → issue our session. */
export const googleSignIn = action({
  args: { idToken: v.string() },
  handler: async (ctx, { idToken }) => {
    let payload: any;
    try {
      ({ payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
        issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
        audience: FIREBASE_PROJECT_ID,
      }));
    } catch {
      throw new Error("Could not verify your Google sign-in. Please try again.");
    }
    const email = String(payload.email || "").toLowerCase();
    if (!email) throw new Error("Your Google account has no email address.");
    const name = String(payload.name || email.split("@")[0]);
    const [firstName, ...rest] = name.split(" ");
    const userId = await ctx.runMutation(internal.auth.upsertOAuthUser, {
      email,
      firstName: firstName || "Homie",
      lastName: rest.join(" ") || undefined,
      avatarUrl: payload.picture ? String(payload.picture) : undefined,
    });
    const token = randomTokenHex();
    await ctx.runMutation(internal.auth.createSession, {
      userId, tokenHash: await sha256Hex(token), expiresAt: Date.now() + SESSION_MS,
    });
    const user = await ctx.runQuery(internal.auth.getUserPublic, { userId });
    return { token, user };
  },
});

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const tokenHash = await sha256Hex(token);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (session) await ctx.db.delete(session._id);
    return { ok: true };
  },
});

export const me = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    const user = await getUserByToken(ctx, token);
    if (!user) return null;
    // attach profile summary + verification labels
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const verifications = await ctx.db
      .query("userVerifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return {
      ...publicUser(user),
      profile: profile ? { status: profile.status, profileCompletionScore: profile.profileCompletionScore } : null,
      verificationLabels: verifications.map((x) => ({ label: x.label })),
    };
  },
});
