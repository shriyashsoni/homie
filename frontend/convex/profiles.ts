import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserByToken, requireUser, publicUser } from "./lib/getUser";

// Coercion helpers — the UI sends numbers/dates as strings.
const num = (x: any) => (x === "" || x == null ? undefined : typeof x === "number" ? x : Number(x));
const ms  = (x: any) => (!x ? undefined : typeof x === "number" ? x : Date.parse(x) || undefined);
const bool = (x: any) => (x == null ? undefined : !!x);

const STRING_FIELDS = ["bio", "cityArea", "sleepSchedule", "cleanlinessLevel", "socialLevel",
  "dietaryPreference", "cookingBoundary", "alcoholPreference", "smokingPreference", "guestPolicy",
  "guestPolicyDetail", "religiousPractice", "pets", "otherDealbreakers", "roomType", "homieCardText",
  "familyVisits", "domesticHelp", "kitchenArrangement", "foodRuleType", "dealbreakersStrength"];
const NUMBER_FIELDS = ["budgetMin", "budgetMax", "moveInFlexDays", "wfhDaysPerWeek", "durationMin", "durationMax"];
const DATE_FIELDS = ["moveInDate"];
const BOOL_FIELDS = ["budgetIncludesAll", "workFromHome", "religiousPracticePublic", "dietPublic", "phonePublic", "bioPublic"];

/** Whitelist + coerce an arbitrary patch object into valid profile fields. */
function cleanPatch(patch: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const k of STRING_FIELDS) if (patch[k] !== undefined && patch[k] !== "") out[k] = String(patch[k]);
  for (const k of NUMBER_FIELDS) { const n = num(patch[k]); if (n !== undefined && !Number.isNaN(n)) out[k] = n; }
  for (const k of DATE_FIELDS)   { const d = ms(patch[k]); if (d !== undefined) out[k] = d; }
  for (const k of BOOL_FIELDS)   if (patch[k] !== undefined) out[k] = bool(patch[k]);
  if (Array.isArray(patch.preferredAreas)) out.preferredAreas = patch.preferredAreas.map(String);
  return out;
}

function completion(p: Record<string, any>): number {
  const keys = ["bio", "preferredAreas", "budgetMax", "moveInDate", "roomType",
    "dietaryPreference", "cleanlinessLevel", "sleepSchedule"];
  const filled = keys.filter((k) => {
    const val = p[k];
    return Array.isArray(val) ? val.length > 0 : val !== undefined && val !== null && val !== "";
  }).length;
  return Math.round((filled / keys.length) * 100);
}

/** Own profile. */
export const get = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    const user = await getUserByToken(ctx, token);
    if (!user) return { profile: null };
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return { profile };
  },
});

/** Another user's profile by profile id (published fields). */
export const getById = query({
  args: { id: v.id("profiles") },
  handler: async (ctx, { id }) => {
    const profile = await ctx.db.get(id);
    if (!profile) return { profile: null };
    const owner = await ctx.db.get(profile.userId);
    const verifications = owner
      ? await ctx.db.query("userVerifications").withIndex("by_user", (q) => q.eq("userId", owner._id)).collect()
      : [];
    return {
      profile: {
        ...profile,
        user: owner ? publicUser(owner) : null,
        verificationLabels: verifications.map((x) => ({ label: x.label })),
      },
    };
  },
});

/** Create or update the logged-in user's profile. */
export const update = mutation({
  args: { token: v.string(), patch: v.any() },
  handler: async (ctx, { token, patch }) => {
    const user = await requireUser(ctx, token);
    const clean = cleanPatch(patch || {});

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const now = Date.now();
    if (existing) {
      const merged = { ...existing, ...clean };
      await ctx.db.patch(existing._id, { ...clean, profileCompletionScore: completion(merged), updatedAt: now });
      return await ctx.db.get(existing._id);
    }
    const id = await ctx.db.insert("profiles", {
      userId: user._id,
      status: "DRAFT",
      profileCompletionScore: completion(clean),
      schemaVersion: "profile-v1.0",
      createdAt: now,
      updatedAt: now,
      ...clean,
    } as any);
    return await ctx.db.get(id);
  },
});

/** Save (upsert) a single quiz answer for the logged-in user's profile. */
export const saveQuiz = mutation({
  args: {
    token: v.string(),
    questionId: v.string(),
    questionText: v.optional(v.string()),
    answerRaw: v.optional(v.string()),
    answerCode: v.optional(v.string()),
    strength: v.optional(v.string()),
    isSkipped: v.optional(v.boolean()),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, { token, ...a }) => {
    const user = await requireUser(ctx, token);
    let profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", user._id)).unique();
    const now = Date.now();
    if (!profile) {
      const id = await ctx.db.insert("profiles", {
        userId: user._id, status: "DRAFT", profileCompletionScore: 0,
        schemaVersion: "profile-v1.0", createdAt: now, updatedAt: now,
      } as any);
      profile = await ctx.db.get(id);
    }
    const existing = (await ctx.db.query("quizAnswers").withIndex("by_profile", (q) => q.eq("profileId", profile!._id)).collect())
      .find((x) => x.questionId === a.questionId);
    const doc = {
      profileId: profile!._id,
      questionId: a.questionId,
      questionText: a.questionText ?? a.questionId,
      answerRaw: a.answerRaw,
      answerCode: a.answerCode,
      strength: a.strength as any,
      isSkipped: a.isSkipped ?? false,
      isPrivate: a.isPrivate ?? false,
      updatedAt: now,
    };
    if (existing) await ctx.db.patch(existing._id, doc);
    else await ctx.db.insert("quizAnswers", { ...doc, createdAt: now });
    return { ok: true };
  },
});

/** Publish the profile so it's discoverable. */
export const publish = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await requireUser(ctx, token);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (!profile) throw new Error("Create your profile first.");
    await ctx.db.patch(profile._id, { status: "PUBLISHED", publishedAt: Date.now(), updatedAt: Date.now() });
    return await ctx.db.get(profile._id);
  },
});
