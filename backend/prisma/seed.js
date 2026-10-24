/**
 * FMH Database Seed
 * Seeds initial data for development: admin user, sample listings, sample seeker profiles
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FMH database...');

  // ── Admin User ────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@findmyhomie.in' },
    update: {},
    create: {
      email: 'admin@findmyhomie.in',
      passwordHash: adminHash,
      firstName: 'FMH',
      lastName: 'Admin',
      role: 'ADMIN',
      isAdmin: true,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // ── Sample Host ───────────────────────────────────────────────────────────
  const hostHash = await bcrypt.hash('Host@1234', 12);
  const host = await prisma.user.upsert({
    where: { email: 'host@demo.in' },
    update: {},
    create: {
      email: 'host@demo.in',
      passwordHash: hostHash,
      firstName: 'Priya',
      lastName: 'Nair',
      role: 'HOST',
      intent: 'FILL_ROOM',
      isActive: true,
      emailVerified: true,
      phone: '+919876543210',
    },
  });
  console.log('✅ Host user created:', host.email);

  // Create host profile
  await prisma.profile.upsert({
    where: { userId: host.id },
    update: {},
    create: {
      userId: host.id,
      status: 'PUBLISHED',
      bio: 'Working professional. Clean and respectful household.',
      cityArea: 'Bengaluru',
      preferredAreas: ['Indiranagar', 'Koramangala'],
      publishedAt: new Date(),
      profileCompletionScore: 80,
    },
  });

  // Sample listing in Indiranagar
  const listing1 = await prisma.listing.upsert({
    where: { id: 'seed-listing-001' },
    update: {},
    create: {
      id: 'seed-listing-001',
      hostId: host.id,
      status: 'PUBLISHED',
      title: 'Private room in 3BHK · Indiranagar',
      description: 'Spacious private room in a well-maintained 3BHK flat. WFH-friendly, fast WiFi, 2-min walk from 100ft road.',
      city: 'Bengaluru',
      area: 'Indiranagar',
      roomType: 'PRIVATE',
      totalBedrooms: 3,
      availableBeds: 1,
      currentOccupants: 2,
      maxOccupants: 3,
      furnished: true,
      amenities: ['WiFi', 'AC', 'Washing Machine', 'Parking', 'Power Backup'],
      rent: 16000,
      maintenance: 1500,
      deposit: 32000,
      brokerage: 0,
      utilitiesIncluded: false,
      utilitiesNote: 'Electricity split equally',
      depositNote: 'Two-month deposit, refundable within 30 days of vacating',
      brokerageNote: 'No brokerage',
      totalRecurring: 17500,
      totalUpfrontEstimate: 64500,
      availableFrom: new Date('2026-11-01'),
      leaseDurationMin: 6,
      householdVibe: 'Quiet/independent',
      houseRules: ['No parties', 'No smoking indoors', 'Guests with advance notice'],
      cookingRules: 'Vegetarian household. No non-veg cooking.',
      guestPolicy: 'ADVANCE_NOTICE',
      smokingAllowed: false,
      petsAllowed: false,
      posterIsAgent: false,
      posterAuthority: 'current-tenant',
      listingReviewed: true,
      reviewedFields: ['rent', 'deposit', 'area', 'availability'],
      lastConfirmedAt: new Date(),
      publishedAt: new Date(),
    },
  });
  console.log('✅ Sample listing created:', listing1.title);

  // Sample listing in Koramangala
  const listing2 = await prisma.listing.upsert({
    where: { id: 'seed-listing-002' },
    update: {},
    create: {
      id: 'seed-listing-002',
      hostId: host.id,
      status: 'PUBLISHED',
      title: 'Shared room in 2BHK · Koramangala 5th Block',
      description: 'Looking for a chill flatmate. Startup-friendly neighbourhood, lots of cafes and gyms nearby.',
      city: 'Bengaluru',
      area: 'Koramangala',
      roomType: 'SHARED',
      totalBedrooms: 2,
      availableBeds: 1,
      currentOccupants: 1,
      maxOccupants: 2,
      furnished: true,
      amenities: ['WiFi', 'Washing Machine', 'Gym nearby'],
      rent: 9500,
      maintenance: 800,
      deposit: 19000,
      brokerage: 9500,
      utilitiesIncluded: false,
      totalRecurring: 10300,
      totalUpfrontEstimate: 38800,
      availableFrom: new Date('2026-10-25'),
      leaseDurationMin: 3,
      householdVibe: 'Friendly but independent',
      houseRules: ['Occasional guests okay', 'Clean kitchen after use'],
      cookingRules: 'Any food welcome. Shared utensils okay.',
      guestPolicy: 'FLEXIBLE',
      smokingAllowed: false,
      petsAllowed: true,
      posterIsAgent: false,
      posterAuthority: 'owner',
      lastConfirmedAt: new Date(),
      publishedAt: new Date(),
    },
  });
  console.log('✅ Sample listing 2 created:', listing2.title);

  // ── Sample Seeker ─────────────────────────────────────────────────────────
  const seekerHash = await bcrypt.hash('Seeker@1234', 12);
  const seeker = await prisma.user.upsert({
    where: { email: 'seeker@demo.in' },
    update: {},
    create: {
      email: 'seeker@demo.in',
      passwordHash: seekerHash,
      firstName: 'Arjun',
      lastName: 'Mehta',
      role: 'SEEKER',
      intent: 'FIND_ROOM',
      isActive: true,
      emailVerified: true,
    },
  });

  await prisma.profile.upsert({
    where: { userId: seeker.id },
    update: {},
    create: {
      userId: seeker.id,
      status: 'PUBLISHED',
      bio: 'Software engineer, WFH 3 days a week. Early bird, vegetarian.',
      cityArea: 'Bengaluru',
      preferredAreas: ['Indiranagar', 'HSR Layout', 'Koramangala'],
      budgetMin: 12000,
      budgetMax: 18000,
      budgetIncludesAll: true,
      moveInDate: new Date('2026-11-01'),
      moveInFlexDays: 7,
      roomType: 'PRIVATE',
      durationMin: 6,
      sleepSchedule: 'EARLY_BIRD',
      cleanlinessLevel: 'VERY_CLEAN',
      socialLevel: 'MOSTLY_INDEPENDENT',
      workFromHome: true,
      wfhDaysPerWeek: 3,
      dietaryPreference: 'VEGETARIAN',
      cookingBoundary: 'No non-veg cooking',
      foodRuleType: 'STRONG_PREFERENCE',
      alcoholPreference: 'NO_PREFERENCE',
      smokingPreference: 'NO_INDOOR',
      guestPolicy: 'ADVANCE_NOTICE',
      pets: 'No pets',
      profileCompletionScore: 90,
      publishedAt: new Date(),
    },
  });
  console.log('✅ Sample seeker created:', seeker.email);

  // Add sample quiz answers for seeker
  const seekerProfile = await prisma.profile.findUnique({ where: { userId: seeker.id } });
  const quizData = [
    { questionId: 'F1', questionText: 'Dietary preference?', answerCode: 'VEGETARIAN', answerRaw: 'Vegetarian', strength: 'STRONG_PREFERENCE' },
    { questionId: 'L1', questionText: 'Sleep schedule?', answerCode: 'EARLY_BIRD', answerRaw: 'I usually sleep before 10:30 pm', strength: 'FLEXIBLE' },
    { questionId: 'L2', questionText: 'Cleanliness?', answerCode: 'VERY_CLEAN', answerRaw: 'I like a very clean home', strength: 'STRONG_PREFERENCE' },
    { questionId: 'S1', questionText: 'Social level?', answerCode: 'MOSTLY_INDEPENDENT', answerRaw: 'Mostly keep to myself but happy to chat', strength: 'FLEXIBLE' },
    { questionId: 'F6', questionText: 'Alcohol preference?', answerCode: 'NO_PREFERENCE', answerRaw: 'No preference for others', strength: 'FLEXIBLE' },
    { questionId: 'F7', questionText: 'Smoking preference?', answerCode: 'NO_INDOOR', answerRaw: 'No smoking indoors please', strength: 'MUST_HAVE' },
  ];

  for (const q of quizData) {
    await prisma.quizAnswer.upsert({
      where: { profileId_questionId: { profileId: seekerProfile.id, questionId: q.questionId } },
      update: {},
      create: { profileId: seekerProfile.id, ...q },
    });
  }

  console.log('\n🎉 Seeding complete!');
  console.log('─────────────────────────────────────────────');
  console.log('Admin:  admin@findmyhomie.in  / Admin@1234');
  console.log('Host:   host@demo.in          / Host@1234');
  console.log('Seeker: seeker@demo.in        / Seeker@1234');
  console.log('─────────────────────────────────────────────');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
