import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** helper: build a union-of-literals validator for enums */
const lit = (...vals: string[]) =>
  v.union(...(vals.map((s) => v.literal(s)) as [any, any, ...any[]]));

// ── Enums (mirrors Prisma) ────────────────────────────────
const UserRole        = lit("SEEKER", "HOST", "BOTH", "ADMIN");
const UserIntent      = lit("FIND_ROOM", "FIND_PEOPLE", "FILL_ROOM");
const ProfileStatus   = lit("DRAFT", "PUBLISHED", "PAUSED", "DELETED");
const ListingStatus   = lit("DRAFT", "PUBLISHED", "PAUSED", "FILLED", "STALE", "DELETED");
const ConnectionStatus= lit("PENDING", "ACCEPTED", "DECLINED", "CANCELLED", "BLOCKED");
const ViewingStatus   = lit("REQUESTED", "CONFIRMED", "CANCELLED", "RESCHEDULED", "ATTENDED", "NO_SHOW");
const VerificationLabel = lit("PHONE_VERIFIED","EMAIL_VERIFIED","SOCIAL_LINKED","LISTING_REVIEWED","POSTER_AUTHORITY_DECLARED","IDENTITY_CHECKED","NOT_VERIFIED");
const PreferenceStrength = lit("MUST_HAVE", "STRONG_PREFERENCE", "FLEXIBLE");
const RoomType        = lit("PRIVATE", "SHARED", "STUDIO", "ENTIRE_FLAT");
const DietaryPreference = lit("VEGETARIAN","VEGETARIAN_EGGS_OKAY","EGGS_OKAY_NO_MEAT","NON_VEGETARIAN","VEGAN","JAIN","OTHER","PREFER_NOT_TO_SAY");
const AlcoholPreference = lit("NO_ALCOHOL_IN_HOME","OKAY_OUTSIDE_NOT_AT_HOME","OCCASIONAL_OKAY","OKAY_WITH_BOUNDARIES","NO_PREFERENCE");
const SmokingPreference = lit("NO_INDOOR","OUTDOORS_ONLY","DESIGNATED_AREA_OKAY","NOT_COMFORTABLE","NO_PREFERENCE");
const GuestPolicy     = lit("NO_OVERNIGHT","ADVANCE_NOTICE","AGREED_FREQUENCY","FLEXIBLE","OTHER");
const SleepSchedule   = lit("EARLY_BIRD","STANDARD","NIGHT_OWL","SHIFT_WORK","VARIABLE");
const CleanlinessLevel= lit("VERY_CLEAN","REASONABLY_CLEAN","RELAXED","FLEXIBLE");
const SocialLevel     = lit("MOSTLY_INDEPENDENT","OCCASIONAL_SHARED_NO_PRESSURE","REGULAR_MEALS_ACTIVITIES","CLOSE_KNIT");
const MeetingMode     = lit("IN_PERSON", "VIDEO_CALL", "EITHER");
const ReportType      = lit("SPAM","FAKE_LISTING","HARASSMENT","PAYMENT_SCAM","IMPERSONATION","OFFENSIVE_CONTENT","OTHER");
const ReportStatus    = lit("OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED");
const NotificationType= lit("CONNECTION_REQUEST","CONNECTION_ACCEPTED","VIEWING_REQUEST","VIEWING_CONFIRMED","VIEWING_REMINDER","VIEWING_CANCELLED","LISTING_STALE_WARNING","PROFILE_INCOMPLETE","SYSTEM");

export default defineSchema({
  // ── Users & Auth ────────────────────────────────────────
  users: defineTable({
    email: v.string(),
    phone: v.optional(v.string()),
    passwordHash: v.string(),          // "pbkdf2$<iter>$<saltB64>$<hashB64>"
    firstName: v.string(),
    lastName: v.optional(v.string()),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: UserRole,
    intent: v.optional(UserIntent),
    isActive: v.boolean(),
    isAdmin: v.boolean(),
    emailVerified: v.boolean(),
    phoneVerified: v.boolean(),
    preferredLanguage: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastActiveAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_phone", ["phone"]),

  sessions: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(),             // sha-256 of the raw token
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["tokenHash"])
    .index("by_user", ["userId"]),

  // ── Profile ─────────────────────────────────────────────
  profiles: defineTable({
    userId: v.id("users"),
    status: ProfileStatus,
    bio: v.optional(v.string()),
    homieCardText: v.optional(v.string()),
    cityArea: v.optional(v.string()),
    preferredAreas: v.optional(v.array(v.string())),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    budgetIncludesAll: v.optional(v.boolean()),
    moveInDate: v.optional(v.number()),
    moveInFlexDays: v.optional(v.number()),
    roomType: v.optional(RoomType),
    durationMin: v.optional(v.number()),
    durationMax: v.optional(v.number()),
    sleepSchedule: v.optional(SleepSchedule),
    cleanlinessLevel: v.optional(CleanlinessLevel),
    socialLevel: v.optional(SocialLevel),
    workFromHome: v.optional(v.boolean()),
    wfhDaysPerWeek: v.optional(v.number()),
    dietaryPreference: v.optional(DietaryPreference),
    cookingBoundary: v.optional(v.string()),
    kitchenArrangement: v.optional(v.string()),
    foodRuleType: v.optional(PreferenceStrength),
    religiousPractice: v.optional(v.string()),
    alcoholPreference: v.optional(AlcoholPreference),
    smokingPreference: v.optional(SmokingPreference),
    familyVisits: v.optional(v.string()),
    guestPolicy: v.optional(GuestPolicy),
    guestPolicyDetail: v.optional(v.string()),
    domesticHelp: v.optional(v.string()),
    pets: v.optional(v.string()),
    otherDealbreakers: v.optional(v.string()),
    dealbreakersStrength: v.optional(PreferenceStrength),
    religiousPracticePublic: v.optional(v.boolean()),
    dietPublic: v.optional(v.boolean()),
    phonePublic: v.optional(v.boolean()),
    bioPublic: v.optional(v.boolean()),
    profileCompletionScore: v.number(),
    schemaVersion: v.string(),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_cityArea", ["cityArea"]),

  quizAnswers: defineTable({
    profileId: v.id("profiles"),
    questionId: v.string(),
    questionText: v.string(),
    answerRaw: v.optional(v.string()),
    answerCode: v.optional(v.string()),
    strength: v.optional(PreferenceStrength),
    isSkipped: v.boolean(),
    isPrivate: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_profile", ["profileId"]),

  // ── Listings ────────────────────────────────────────────
  listings: defineTable({
    hostId: v.id("users"),
    status: ListingStatus,
    title: v.string(),
    description: v.optional(v.string()),
    city: v.string(),
    area: v.string(),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    googleMapsLink: v.optional(v.string()),
    roomType: RoomType,
    totalBedrooms: v.optional(v.number()),
    availableBeds: v.number(),
    bathroomType: v.optional(v.string()),
    furnished: v.optional(v.boolean()),
    amenities: v.optional(v.array(v.string())),
    rent: v.number(),
    rentIncludes: v.optional(v.string()),
    maintenance: v.optional(v.number()),
    maintenanceNote: v.optional(v.string()),
    utilitiesIncluded: v.optional(v.boolean()),
    utilitiesNote: v.optional(v.string()),
    deposit: v.optional(v.number()),
    depositNote: v.optional(v.string()),
    brokerage: v.optional(v.number()),
    brokerageNote: v.optional(v.string()),
    brokerPays: v.optional(v.string()),
    otherFees: v.optional(v.number()),
    otherFeesNote: v.optional(v.string()),
    totalUpfrontEstimate: v.optional(v.number()),
    totalRecurring: v.optional(v.number()),
    availableFrom: v.number(),
    availableTo: v.optional(v.number()),
    leaseDurationMin: v.optional(v.number()),
    leaseDurationMax: v.optional(v.number()),
    currentOccupants: v.number(),
    maxOccupants: v.optional(v.number()),
    householdVibe: v.optional(v.string()),
    houseRules: v.optional(v.array(v.string())),
    cookingRules: v.optional(v.string()),
    guestPolicy: v.optional(GuestPolicy),
    smokingAllowed: v.optional(v.boolean()),
    petsAllowed: v.optional(v.boolean()),
    posterIsAgent: v.optional(v.boolean()),
    posterAuthority: v.optional(v.string()),
    listingReviewed: v.optional(v.boolean()),
    reviewedFields: v.optional(v.array(v.string())),
    lastConfirmedAt: v.optional(v.number()),
    staleWarningAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    filledAt: v.optional(v.number()),
    viewCount: v.number(),
    schemaVersion: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_host", ["hostId"])
    .index("by_status", ["status"])
    .index("by_area", ["area"])
    .index("by_city_area", ["city", "area"]),

  listingPhotos: defineTable({
    listingId: v.id("listings"),
    url: v.string(),
    caption: v.optional(v.string()),
    order: v.number(),
    createdAt: v.number(),
  }).index("by_listing", ["listingId"]),

  // ── Viewings ────────────────────────────────────────────
  viewingSlots: defineTable({
    listingId: v.id("listings"),
    startTime: v.number(),
    endTime: v.number(),
    capacity: v.number(),
    bookedCount: v.number(),
    bufferMinutes: v.number(),
    minNoticeHours: v.number(),
    meetingMode: MeetingMode,
    timezone: v.string(),
    isAvailable: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_listing", ["listingId"]),

  viewingRequests: defineTable({
    seekerId: v.id("users"),
    hostId: v.id("users"),
    listingId: v.id("listings"),
    slotId: v.optional(v.id("viewingSlots")),
    status: ViewingStatus,
    meetingMode: v.optional(MeetingMode),
    message: v.optional(v.string()),
    proposedTime: v.optional(v.number()),
    confirmedTime: v.optional(v.number()),
    cancelReason: v.optional(v.string()),
    rescheduleCount: v.number(),
    reminderSentAt: v.optional(v.number()),
    attendedAt: v.optional(v.number()),
    noShowAt: v.optional(v.number()),
    outcomeNote: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_seeker", ["seekerId"])
    .index("by_host", ["hostId"])
    .index("by_listing", ["listingId"]),

  // ── Connections / Conversations / Messages ──────────────
  connections: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    listingId: v.optional(v.id("listings")),
    status: ConnectionStatus,
    message: v.optional(v.string()),
    contactRevealedAt: v.optional(v.number()),
    declineReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_status", ["status"]),

  conversations: defineTable({
    connectionId: v.id("connections"),
    userAId: v.id("users"),
    userBId: v.id("users"),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_connection", ["connectionId"])
    .index("by_userA", ["userAId"])
    .index("by_userB", ["userBId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    imageId: v.optional(v.id("_storage")),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  // ── Matches ─────────────────────────────────────────────
  matches: defineTable({
    seekerProfileId: v.id("profiles"),
    listingId: v.id("listings"),
    isFeasible: v.boolean(),
    feasibilityReason: v.optional(v.string()),
    compatibilityScore: v.optional(v.number()),
    coverageScore: v.optional(v.number()),
    confidenceScore: v.optional(v.number()),
    freshnessFactor: v.optional(v.number()),
    overallRank: v.optional(v.number()),
    explanationPositive: v.optional(v.array(v.string())),
    explanationTradeoffs: v.optional(v.array(v.string())),
    budgetScore: v.optional(v.number()),
    areaScore: v.optional(v.number()),
    foodScore: v.optional(v.number()),
    routineScore: v.optional(v.number()),
    socialScore: v.optional(v.number()),
    guestsScore: v.optional(v.number()),
    smokingScore: v.optional(v.number()),
    petsScore: v.optional(v.number()),
    algorithmVersion: v.string(),
    computedAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_seekerProfile", ["seekerProfileId"])
    .index("by_listing", ["listingId"]),

  // ── Saves / Blocks / Verifications ──────────────────────
  savedListings: defineTable({
    userId: v.id("users"),
    listingId: v.id("listings"),
    savedAt: v.number(),
  }).index("by_user", ["userId"]).index("by_user_listing", ["userId", "listingId"]),

  savedProfiles: defineTable({
    userId: v.id("users"),
    savedProfileId: v.id("profiles"),
    savedAt: v.number(),
  }).index("by_user", ["userId"]),

  blocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
    createdAt: v.number(),
  }).index("by_blocker", ["blockerId"]),

  socialVerifications: defineTable({
    userId: v.id("users"),
    platform: v.string(),
    platformUserId: v.optional(v.string()),
    profileUrl: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  userVerifications: defineTable({
    userId: v.id("users"),
    label: VerificationLabel,
    verifiedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    provider: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // ── Reports / Notifications / Analytics ─────────────────
  reports: defineTable({
    reportedById: v.id("users"),
    reportedUserId: v.optional(v.id("users")),
    reportedListingId: v.optional(v.id("listings")),
    reportType: ReportType,
    status: ReportStatus,
    description: v.optional(v.string()),
    evidence: v.optional(v.array(v.string())),
    adminNote: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_reportedBy", ["reportedById"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: NotificationType,
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  analyticsEvents: defineTable({
    userId: v.optional(v.id("users")),
    event: v.string(),
    properties: v.optional(v.any()),
    sessionId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_event", ["event"]),

  // ── Buddy groups ────────────────────────────────────────
  buddyGroups: defineTable({
    ownerId: v.id("users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    maxSize: v.number(),
    city: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  buddyGroupMembers: defineTable({
    groupId: v.id("buddyGroups"),
    userId: v.id("users"),
    joinedAt: v.number(),
  }).index("by_group", ["groupId"]).index("by_user", ["userId"]),

  // WhatsApp AI agent conversation memory (one thread per phone number)
  agentThreads: defineTable({
    phone: v.string(),
    userId: v.optional(v.id("users")),
    history: v.array(v.object({ role: v.string(), content: v.string() })),
    updatedAt: v.number(),
  }).index("by_phone", ["phone"]),
});
