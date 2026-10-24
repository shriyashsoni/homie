const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const analyticsService = require('../services/analytics.service');

// ─── Calculate Profile Completion Score ─────────────────────────────────────
const calculateCompletionScore = (profile) => {
  const fields = [
    profile.cityArea,
    profile.budgetMax,
    profile.moveInDate,
    profile.roomType,
    profile.sleepSchedule,
    profile.cleanlinessLevel,
    profile.socialLevel,
    profile.dietaryPreference,
    profile.alcoholPreference,
    profile.smokingPreference,
    profile.guestPolicy,
    profile.bio,
  ];
  const filled = fields.filter((f) => f !== null && f !== undefined).length;
  return Math.round((filled / fields.length) * 100);
};

// ─── Get My Profile ──────────────────────────────────────────────────────────
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
            email: true,
            phone: true,
            emailVerified: true,
            phoneVerified: true,
            preferredLanguage: true,
            verificationLabels: {
              select: { label: true, verifiedAt: true },
            },
          },
        },
        quizAnswers: true,
        profileFields: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!profile) {
      throw new AppError('Profile not found.', 404);
    }

    res.json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
};

// ─── Update My Profile ────────────────────────────────────────────────────────
const updateMyProfile = async (req, res, next) => {
  try {
    const {
      bio,
      homieCardText,
      cityArea,
      preferredAreas,
      budgetMin,
      budgetMax,
      budgetIncludesAll,
      moveInDate,
      moveInFlexDays,
      roomType,
      durationMin,
      durationMax,
      sleepSchedule,
      cleanlinessLevel,
      socialLevel,
      workFromHome,
      wfhDaysPerWeek,
      dietaryPreference,
      cookingBoundary,
      kitchenArrangement,
      foodRuleType,
      religiousPractice,
      alcoholPreference,
      smokingPreference,
      familyVisits,
      guestPolicy,
      guestPolicyDetail,
      domesticHelp,
      pets,
      otherDealbreakers,
      dealbreakersStrength,
    } = req.body;

    // Validate budget range
    if (budgetMin && budgetMax && budgetMin > budgetMax) {
      throw new AppError('budgetMin cannot be greater than budgetMax.', 400);
    }

    const updateData = {
      ...(bio !== undefined && { bio }),
      ...(homieCardText !== undefined && { homieCardText }),
      ...(cityArea !== undefined && { cityArea }),
      ...(preferredAreas !== undefined && { preferredAreas }),
      ...(budgetMin !== undefined && { budgetMin }),
      ...(budgetMax !== undefined && { budgetMax }),
      ...(budgetIncludesAll !== undefined && { budgetIncludesAll }),
      ...(moveInDate !== undefined && { moveInDate: new Date(moveInDate) }),
      ...(moveInFlexDays !== undefined && { moveInFlexDays }),
      ...(roomType !== undefined && { roomType }),
      ...(durationMin !== undefined && { durationMin }),
      ...(durationMax !== undefined && { durationMax }),
      ...(sleepSchedule !== undefined && { sleepSchedule }),
      ...(cleanlinessLevel !== undefined && { cleanlinessLevel }),
      ...(socialLevel !== undefined && { socialLevel }),
      ...(workFromHome !== undefined && { workFromHome }),
      ...(wfhDaysPerWeek !== undefined && { wfhDaysPerWeek }),
      ...(dietaryPreference !== undefined && { dietaryPreference }),
      ...(cookingBoundary !== undefined && { cookingBoundary }),
      ...(kitchenArrangement !== undefined && { kitchenArrangement }),
      ...(foodRuleType !== undefined && { foodRuleType }),
      ...(religiousPractice !== undefined && { religiousPractice }),
      ...(alcoholPreference !== undefined && { alcoholPreference }),
      ...(smokingPreference !== undefined && { smokingPreference }),
      ...(familyVisits !== undefined && { familyVisits }),
      ...(guestPolicy !== undefined && { guestPolicy }),
      ...(guestPolicyDetail !== undefined && { guestPolicyDetail }),
      ...(domesticHelp !== undefined && { domesticHelp }),
      ...(pets !== undefined && { pets }),
      ...(otherDealbreakers !== undefined && { otherDealbreakers }),
      ...(dealbreakersStrength !== undefined && { dealbreakersStrength }),
    };

    const profile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: updateData,
    });

    // Recalculate completion score
    const score = calculateCompletionScore(profile);
    const updatedProfile = await prisma.profile.update({
      where: { id: profile.id },
      data: { profileCompletionScore: score },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { profile: updatedProfile },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Publish Profile ─────────────────────────────────────────────────────────
const publishProfile = async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) throw new AppError('Profile not found.', 404);

    if (profile.profileCompletionScore < 30) {
      throw new AppError(
        'Your profile is less than 30% complete. Please fill in more details before publishing.',
        400
      );
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: profile.id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });

    analyticsService.track(req.user.id, 'profile_published', {
      completionScore: profile.profileCompletionScore,
    });

    res.json({
      success: true,
      message: 'Profile published successfully.',
      data: { profile: updatedProfile },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Unpublish Profile ────────────────────────────────────────────────────────
const unpublishProfile = async (req, res, next) => {
  try {
    const profile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: { status: 'PAUSED' },
    });

    analyticsService.track(req.user.id, 'profile_unpublished');

    res.json({ success: true, message: 'Profile paused.', data: { profile } });
  } catch (err) {
    next(err);
  }
};

// ─── Get Quiz Answers ────────────────────────────────────────────────────────
const getQuizAnswers = async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    if (!profile) throw new AppError('Profile not found.', 404);

    const answers = await prisma.quizAnswer.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: { answers } });
  } catch (err) {
    next(err);
  }
};

// ─── Save Quiz Answers ────────────────────────────────────────────────────────
const saveQuizAnswers = async (req, res, next) => {
  try {
    const { answers } = req.body;
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    if (!profile) throw new AppError('Profile not found.', 404);

    // Upsert all answers
    const savedAnswers = await Promise.all(
      answers.map((a) =>
        prisma.quizAnswer.upsert({
          where: { profileId_questionId: { profileId: profile.id, questionId: a.questionId } },
          create: {
            profileId: profile.id,
            questionId: a.questionId,
            questionText: a.questionText,
            answerRaw: a.answerRaw,
            answerCode: a.answerCode,
            strength: a.strength,
            isSkipped: a.isSkipped || false,
            isPrivate: a.isPrivate || false,
          },
          update: {
            answerRaw: a.answerRaw,
            answerCode: a.answerCode,
            strength: a.strength,
            isSkipped: a.isSkipped,
            isPrivate: a.isPrivate,
          },
        })
      )
    );

    // Track quiz completion
    const totalAnswered = await prisma.quizAnswer.count({
      where: { profileId: profile.id, isSkipped: false },
    });
    if (totalAnswered >= 10) {
      analyticsService.track(req.user.id, 'quiz_completed', { answeredCount: totalAnswered });
    } else {
      analyticsService.track(req.user.id, 'quiz_answered', { count: answers.length });
    }

    res.json({ success: true, message: 'Quiz answers saved.', data: { answers: savedAnswers } });
  } catch (err) {
    next(err);
  }
};

// ─── Get Public Profile ───────────────────────────────────────────────────────
const getPublicProfile = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const viewerId = req.user.id;

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            displayName: true,
            avatarUrl: true,
            verificationLabels: {
              select: { label: true, verifiedAt: true },
            },
          },
        },
        quizAnswers: {
          where: { isPrivate: false },
          select: { questionId: true, questionText: true, answerRaw: true, answerCode: true, strength: true },
        },
      },
    });

    if (!profile || profile.status !== 'PUBLISHED') {
      throw new AppError('Profile not found or not public.', 404);
    }

    // Check if viewer is blocked
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: profile.user.id, blockedId: viewerId },
          { blockerId: viewerId, blockedId: profile.user.id },
        ],
      },
    });
    if (blocked) throw new AppError('Profile not found.', 404);

    // Redact private fields per privacy settings
    const publicProfile = {
      ...profile,
      bio: profile.bioPublic ? profile.bio : undefined,
      dietaryPreference: profile.dietPublic ? profile.dietaryPreference : undefined,
      religiousPractice: profile.religiousPracticePublic ? profile.religiousPractice : undefined,
      user: {
        ...profile.user,
        phone: profile.phonePublic ? profile.user.phone : undefined,
      },
    };

    analyticsService.track(viewerId, 'profile_viewed', { profileId });

    res.json({ success: true, data: { profile: publicProfile } });
  } catch (err) {
    next(err);
  }
};

// ─── Get Profile Fields ───────────────────────────────────────────────────────
const getProfileFields = async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    if (!profile) throw new AppError('Profile not found.', 404);

    const fields = await prisma.profileField.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { fields } });
  } catch (err) {
    next(err);
  }
};

// ─── Update Profile Field ─────────────────────────────────────────────────────
const updateProfileField = async (req, res, next) => {
  try {
    const { fieldKey } = req.params;
    const { value, confirmationStatus, consentScope } = req.body;

    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    if (!profile) throw new AppError('Profile not found.', 404);

    const field = await prisma.profileField.upsert({
      where: {
        // We need to handle this differently since fieldKey isn't unique alone
        // Using a compound findFirst + upsert pattern
        id: (
          await prisma.profileField.findFirst({
            where: { profileId: profile.id, fieldKey },
            select: { id: true },
          })
        )?.id || 'new',
      },
      create: {
        profileId: profile.id,
        fieldKey,
        value,
        sourceChannel: 'manual_form',
        confirmationStatus: confirmationStatus || 'CONFIRMED',
        consentScope,
        confidence: 1.0,
      },
      update: {
        value,
        ...(confirmationStatus && { confirmationStatus }),
        ...(consentScope && { consentScope }),
        sourceChannel: 'manual_form',
        confidence: 1.0,
      },
    });

    res.json({ success: true, message: 'Field updated.', data: { field } });
  } catch (err) {
    next(err);
  }
};

// ─── Get Privacy Settings ─────────────────────────────────────────────────────
const getPrivacySettings = async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
      select: {
        religiousPracticePublic: true,
        dietPublic: true,
        phonePublic: true,
        bioPublic: true,
      },
    });

    if (!profile) throw new AppError('Profile not found.', 404);
    res.json({ success: true, data: { privacy: profile } });
  } catch (err) {
    next(err);
  }
};

// ─── Update Privacy Settings ──────────────────────────────────────────────────
const updatePrivacySettings = async (req, res, next) => {
  try {
    const { religiousPracticePublic, dietPublic, phonePublic, bioPublic } = req.body;

    const profile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: {
        ...(religiousPracticePublic !== undefined && { religiousPracticePublic }),
        ...(dietPublic !== undefined && { dietPublic }),
        ...(phonePublic !== undefined && { phonePublic }),
        ...(bioPublic !== undefined && { bioPublic }),
      },
      select: {
        religiousPracticePublic: true,
        dietPublic: true,
        phonePublic: true,
        bioPublic: true,
      },
    });

    res.json({ success: true, message: 'Privacy settings updated.', data: { privacy: profile } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  publishProfile,
  unpublishProfile,
  getQuizAnswers,
  saveQuizAnswers,
  getPublicProfile,
  getProfileFields,
  updateProfileField,
  getPrivacySettings,
  updatePrivacySettings,
};
