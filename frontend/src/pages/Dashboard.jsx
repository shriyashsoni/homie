import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, Home, Search, PlusCircle, Bell, Calendar,
  Users, TrendingUp, CheckCircle, AlertCircle, Zap,
  Clock, MapPin, ChevronRight, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { matchApi, notificationApi, viewingApi } from '../api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { photoForListing } from '../assets/photos';

/* ─── Stat card ─── */
function StatCard({ icon: Icon, label, value, sub, gradient, index = 0 }) {
  const delays = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'];
  return (
    <div className={`card p-5 animate-fade-up opacity-0 ${delays[index] || ''}`} style={{ animationFillMode: 'forwards' }}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${gradient} shadow-sm`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-2xl font-black text-charcoal leading-none mb-1">{value ?? '—'}</p>
      <p className="text-xs text-clay">{label}</p>
      {sub && <p className="text-2xs text-clay mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─── Quick action tile ─── */
function ActionTile({ icon: Icon, label, sub, color, onClick }) {
  const colors = {
    red:    { bg: 'bg-red-50 hover:bg-red-100',    icon: 'text-brand-500' },
    blue:   { bg: 'bg-blue-50 hover:bg-blue-100',  icon: 'text-blue-600' },
    green:  { bg: 'bg-green-50 hover:bg-green-100',icon: 'text-green-600' },
    purple: { bg: 'bg-purple-50 hover:bg-purple-100', icon: 'text-purple-600' },
  };
  const c = colors[color] || colors.red;

  return (
    <button
      onClick={onClick}
      className={`group p-4 rounded-2xl border border-transparent transition-all duration-200 text-left hover:shadow-card hover:border-charcoal/[0.06] ${c.bg}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-white shadow-xs ${c.icon}`}>
        <Icon size={17} />
      </div>
      <p className="font-semibold text-sm text-charcoal">{label}</p>
      <p className="text-xs text-clay mt-0.5">{sub}</p>
    </button>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: matchData } = useQuery({
    queryKey: ['matches'],
    queryFn: () => matchApi.getMatches({ limit: 6 }),
    retry: false,
  });
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list(),
    retry: false,
  });
  const { data: viewingData } = useQuery({
    queryKey: ['viewings'],
    queryFn: () => viewingApi.list(),
    retry: false,
  });

  const matches  = matchData?.data?.data?.matches || [];
  const unread   = notifData?.data?.data?.notifications?.filter((n) => !n.isRead).length || 0;
  const upcoming = viewingData?.data?.data?.viewings?.filter((v) => v.status === 'CONFIRMED') || [];
  const isHost   = user?.role === 'HOST' || user?.role === 'BOTH';
  const needsProfile = !user?.profile?.status || user?.profile?.status === 'DRAFT';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ─── Welcome header ─── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label mb-1.5">Dashboard</p>
          <h1 className="text-2xl md:text-3xl font-black text-charcoal tracking-tight">
            {greeting}, {user?.firstName} 👋
          </h1>
          <p className="text-clay text-sm mt-1.5">
            {needsProfile
              ? 'Finish your profile to start getting matches.'
              : `You have ${matches.length} potential match${matches.length !== 1 ? 'es' : ''} waiting.`}
          </p>
        </div>
        <button
          onClick={() => navigate('/discover')}
          className="hidden sm:flex items-center gap-2 btn-primary text-xs px-4 py-2.5"
        >
          <Search size={14} /> Discover
        </button>
      </div>

      {/* ─── Profile incomplete banner ─── */}
      {needsProfile && (
        <div className="relative overflow-hidden bg-brand-gradient rounded-2xl p-5 flex items-center justify-between gap-4 shadow-glow">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}
          />
          <div className="relative flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles size={17} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Complete your profile to get matched</p>
              <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                Your profile is in draft — publish it to appear in search results and start receiving matches.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/profile/edit')}
            className="relative flex-shrink-0 bg-white !text-brand-500 hover:bg-brand-50 border-0 shadow-sm"
          >
            Complete
          </Button>
        </div>
      )}

      {/* ─── Stats row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard index={0} icon={Zap}         label="New matches"  value={matches.length || 0}  gradient="from-brand-500 to-brand-400" />
        <StatCard index={1} icon={Bell}        label="Notifications" value={unread}               sub="Unread"  gradient="from-orange-500 to-amber-400" />
        <StatCard index={2} icon={Calendar}    label="Viewings"     value={upcoming.length}       sub="Upcoming" gradient="from-green-500 to-teal-400" />
        <StatCard index={3} icon={TrendingUp}  label="Profile"      value={needsProfile ? 'Draft' : 'Live'} gradient="from-blue-500 to-indigo-400" />
      </div>

      {/* ─── Quick actions ─── */}
      <div>
        <h2 className="text-sm font-bold text-charcoal mb-3 flex items-center gap-2">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionTile icon={Search}     label="Discover"    sub="Browse rooms & people" color="red"    onClick={() => navigate('/discover')} />
          <ActionTile icon={Home}       label="All rooms"   sub="Active listings"       color="blue"   onClick={() => navigate('/listings')} />
          {isHost
            ? <ActionTile icon={PlusCircle} label="Post room"  sub="List your space"       color="green"  onClick={() => navigate('/listings/create')} />
            : <ActionTile icon={Users}      label="Flatmates"  sub="Find compatible people" color="green"  onClick={() => navigate('/discover?tab=people')} />
          }
          <ActionTile icon={Calendar}   label="Viewings"    sub="Schedule & manage"     color="purple" onClick={() => navigate('/viewings')} />
        </div>
      </div>

      {/* ─── Upcoming viewings strip ─── */}
      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-charcoal">Upcoming viewings</h2>
            <Link to="/viewings" className="text-xs text-brand-500 font-semibold flex items-center gap-1 hover:gap-1.5 transition-all">
              All <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {upcoming.slice(0, 3).map((v) => (
              <div key={v.id} className="card p-4 min-w-[200px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                    <Calendar size={13} className="text-green-600" />
                  </div>
                  <Badge color="green">Confirmed</Badge>
                </div>
                <p className="font-semibold text-sm text-charcoal truncate">{v.listing?.title || 'Viewing'}</p>
                <div className="flex items-center gap-1 text-xs text-clay mt-1">
                  <Clock size={11} />
                  {v.slot?.startTime
                    ? new Date(v.slot.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : 'TBD'}
                </div>
                {v.listing?.area && (
                  <div className="flex items-center gap-1 text-xs text-clay mt-0.5">
                    <MapPin size={11} />
                    {v.listing.area}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Your matches ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-charcoal">Your matches</h2>
          <Link to="/discover" className="text-xs text-brand-500 font-semibold flex items-center gap-1 hover:gap-1.5 transition-all">
            See all <ArrowRight size={11} />
          </Link>
        </div>

        {matches.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-brand-300" />
            </div>
            <p className="font-bold text-charcoal mb-1.5">No matches yet</p>
            <p className="text-sm text-clay mb-5 max-w-xs mx-auto leading-relaxed">
              {needsProfile
                ? 'Publish your profile first — then our algorithm will find your best matches.'
                : 'Discover rooms and people to start building your matches.'}
            </p>
            <Button size="sm" onClick={() => navigate(needsProfile ? '/profile/edit' : '/discover')}>
              {needsProfile ? 'Complete profile' : 'Start discovering'}
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.slice(0, 6).map((match) => {
              const score = match.compatibilityScore;
              return (
                <Link
                  key={match.id}
                  to={`/listings/${match.listing?.id}`}
                  className="group bg-card rounded-2xl border border-charcoal/[0.07] shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 overflow-hidden cursor-pointer"
                >
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={photoForListing(match.listing?.id || match.id, 500, 320)}
                      alt={match.listing?.title || 'Match'}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {score != null && (
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1 text-2xs font-bold px-2 py-1 rounded-lg bg-white/92 backdrop-blur-sm text-charcoal shadow-sm">
                        <Zap size={10} className={`fill-current ${score > 80 ? 'text-olive' : 'text-honey'}`} />
                        {Math.round(score)}% match
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-sm text-charcoal line-clamp-1 mb-1">
                      {match.listing?.title || 'Listing'}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-clay mb-2">
                      <MapPin size={10} /> {match.listing?.area}
                    </div>
                    <p className="font-display text-sm font-bold text-brand-500">
                      ₹{match.listing?.rent?.toLocaleString('en-IN')}
                      <span className="text-xs text-clay font-normal">/mo</span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
