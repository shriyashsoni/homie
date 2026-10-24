import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { profileApi } from '../../api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { heroRoom, avatarFor } from '../../assets/photos';
import {
  IconShield, IconCheck, IconPin, IconWallet, IconCalendar, IconRoom,
  IconUtensils, IconBroom, IconMoon, IconUsers, IconSpark, IconChat,
} from '../../components/icons';

const titleCase = (s) =>
  (s || '').toString().toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const DIET = {
  VEGETARIAN: 'Vegetarian', VEGETARIAN_EGGS_OKAY: 'Veg + eggs',
  NON_VEGETARIAN: 'Non-vegetarian', VEGAN: 'Vegan', JAIN: 'Jain',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};

/* Small labelled fact */
function Fact({ Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-sand flex items-center justify-center text-clay flex-shrink-0 mt-0.5">
        <Icon size={15} stroke={1.7} />
      </div>
      <div className="min-w-0">
        <p className="text-2xs text-clay font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-charcoal truncate">{value || <span className="text-clay/60 font-normal">Not set</span>}</p>
      </div>
    </div>
  );
}

export default function ProfileView() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwn = !id || id === user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['profile', id || 'me'],
    queryFn: () => (isOwn ? profileApi.get() : profileApi.getById(id)),
    retry: false,
  });

  const profile = data?.data?.data?.profile;
  const person  = isOwn ? user : (profile?.user || {});
  const name    = `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || 'Member';

  if (isLoading) return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="skeleton h-52 rounded-3xl" />
      <div className="skeleton h-40 rounded-3xl" />
      <div className="skeleton h-40 rounded-3xl" />
    </div>
  );

  const intentLabel = person?.intent === 'FIND_ROOM' ? 'Looking for a room'
    : person?.intent === 'FIND_PEOPLE' ? 'Looking for roommates'
    : person?.intent === 'FILL_ROOM' ? 'Has a room to fill' : 'Member';

  const budget = profile?.budgetMax
    ? `${profile.budgetMin ? `₹${profile.budgetMin.toLocaleString('en-IN')}–` : 'Up to ₹'}${profile.budgetMax.toLocaleString('en-IN')}`
    : null;

  const lifestyle = [
    { Icon: IconUtensils, label: 'Diet',        value: DIET[profile?.dietaryPreference] },
    { Icon: IconBroom,    label: 'Cleanliness', value: profile?.cleanlinessLevel && titleCase(profile.cleanlinessLevel) },
    { Icon: IconMoon,     label: 'Routine',     value: profile?.sleepSchedule && titleCase(profile.sleepSchedule) },
    { Icon: IconUsers,    label: 'Guests',      value: profile?.guestPolicy && titleCase(profile.guestPolicy) },
    { Icon: IconSpark,    label: 'Alcohol',     value: profile?.alcoholPreference && titleCase(profile.alcoholPreference) },
    { Icon: IconShield,   label: 'Smoking',     value: profile?.smokingPreference && titleCase(profile.smokingPreference) },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Compatibility banner (other profiles) */}
      {!isOwn && profile?.compatibilityScore != null && (
        <div className="flex items-center gap-3 bg-brand-gradient text-white rounded-2xl px-5 py-4 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <IconSpark size={20} />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold">{Math.round(profile.compatibilityScore)}% compatible with you</p>
            <p className="text-xs text-white/75">Based on your lifestyle quiz answers</p>
          </div>
        </div>
      )}

      {/* ── Hero card ── */}
      <div className="card overflow-hidden">
        <div className="relative h-32 md:h-40">
          <img src={heroRoom(1200, 360)} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/55 via-charcoal/10 to-transparent" />
          {isOwn && (
            <button onClick={() => navigate('/profile/edit')}
              className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-charcoal text-xs font-bold px-3 py-2 rounded-full hover:bg-white transition-all">
              <Edit size={13} /> Edit profile
            </button>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4 gap-4">
            <div className="flex items-end gap-4 min-w-0">
              <img src={avatarFor(person)} alt={name}
                className="w-24 h-24 rounded-3xl ring-4 ring-card object-cover shadow-sm flex-shrink-0" />
              <div className="pb-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-2xl font-bold text-charcoal leading-tight">{name}</h1>
                  {person?.emailVerified && <Badge color="blue"><IconShield size={10} /> Verified</Badge>}
                </div>
                <p className="text-sm text-clay mt-0.5 flex items-center gap-1.5">
                  {intentLabel}
                  {profile?.preferredAreas?.[0] && <><span className="text-clay/40">·</span><IconPin size={12} /> {profile.preferredAreas[0]}</>}
                </p>
              </div>
            </div>
            {!isOwn && (
              <Button onClick={() => navigate('/connections')} className="flex-shrink-0">
                <IconChat size={15} /> Connect
              </Button>
            )}
          </div>

          {/* Quick facts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 rule-t">
            <Fact Icon={IconWallet}   label="Budget"   value={budget && `${budget}/mo`} />
            <Fact Icon={IconRoom}     label="Room type" value={profile?.roomType && titleCase(profile.roomType)} />
            <Fact Icon={IconCalendar} label="Move-in"  value={profile?.moveInDate
              ? new Date(profile.moveInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Flexible'} />
          </div>

          {/* Own: status + completion */}
          {isOwn && (
            <div className="mt-5 pt-5 rule-t space-y-3">
              <div className="flex items-center gap-2">
                {profile?.status === 'PUBLISHED' ? (
                  <><span className="w-2 h-2 bg-olive rounded-full" /><p className="text-xs text-clay">Profile is <strong className="text-charcoal">published</strong> and discoverable</p></>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-honey rounded-full" />
                    <p className="text-xs text-clay">Profile is a <strong className="text-charcoal">draft</strong> — not yet visible in search</p>
                    <Button size="sm" onClick={() => profileApi.publish().then(() => window.location.reload())} className="ml-auto !px-3 !py-1.5 text-xs">Publish now</Button>
                  </>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-clay">Profile completion</span>
                  <span className="text-xs font-bold text-brand-500">{profile?.profileCompletionScore || 0}%</span>
                </div>
                <div className="h-2 bg-sand rounded-full overflow-hidden">
                  <div className="h-full bg-brand-gradient rounded-full transition-all duration-500" style={{ width: `${profile?.profileCompletionScore || 0}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── About ── */}
      <div className="card p-6">
        <h3 className="font-display text-base font-bold text-charcoal mb-2">About {isOwn ? 'me' : name.split(' ')[0]}</h3>
        <p className="text-sm text-clay leading-relaxed">
          {profile?.bio || (isOwn
            ? 'Add a short bio so potential flatmates get a sense of who you are, your routine, and what you’re looking for in a home. Tap “Edit profile” to add one.'
            : `${name.split(' ')[0]} hasn’t added a bio yet.`)}
        </p>
      </div>

      {/* ── Lifestyle ── */}
      <div className="card p-6">
        <h3 className="font-display text-base font-bold text-charcoal mb-5">Lifestyle &amp; household</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {lifestyle.map((item) => <Fact key={item.label} {...item} />)}
        </div>
      </div>

      {/* ── Preferred areas ── */}
      {profile?.preferredAreas?.length > 0 && (
        <div className="card p-6">
          <h3 className="font-display text-base font-bold text-charcoal mb-4 flex items-center gap-2">
            <IconPin size={16} className="text-brand-500" /> Preferred areas
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.preferredAreas.map((a) => (
              <span key={a} className="px-3 py-1.5 bg-sand text-charcoal rounded-full text-sm font-medium">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Verification ── */}
      {person?.verificationLabels?.length > 0 && (
        <div className="card p-6">
          <h3 className="font-display text-base font-bold text-charcoal mb-4 flex items-center gap-2">
            <IconShield size={16} className="text-brand-500" /> Verified details
          </h3>
          <div className="flex flex-wrap gap-2">
            {person.verificationLabels.map(({ label }) => (
              <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate/12 text-slate rounded-full text-sm font-semibold">
                <IconCheck size={13} /> {titleCase(label)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!profile && isOwn && (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 bg-sand rounded-3xl flex items-center justify-center mx-auto mb-4">
            <IconSpark size={24} className="text-clay" />
          </div>
          <p className="font-display font-bold text-charcoal mb-1.5">Let’s set up your profile</p>
          <p className="text-sm text-clay mb-5 max-w-xs mx-auto">Complete your details so we can match you with the right rooms and roommates.</p>
          <Button onClick={() => navigate('/onboarding/essentials')}>Complete profile</Button>
        </div>
      )}
    </div>
  );
}
