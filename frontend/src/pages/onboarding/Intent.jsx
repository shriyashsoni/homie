import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Home, Users, PlusSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../api';

const intents = [
  {
    value: 'FIND_ROOM',
    icon: Home,
    title: 'I need a room',
    desc: 'Find a room that matches your budget, area and the kind of household you want to live in.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    value: 'FIND_PEOPLE',
    icon: Users,
    title: 'I want flatmates first',
    desc: 'Meet compatible people before choosing a place. Build your group, then search for homes together.',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  {
    value: 'FILL_ROOM',
    icon: PlusSquare,
    title: 'I have a room to fill',
    desc: 'Create a listing, share your household preferences and get matched with suitable applicants.',
    color: 'text-brand-600',
    bg: 'bg-brand-50',
    border: 'border-brand-200',
  },
];

export default function OnboardingIntent() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(user?.intent || '');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await userApi.update({ intent: selected });
      await refreshUser();
      navigate('/onboarding/essentials');
    } catch {
      navigate('/onboarding/essentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 bg-brand-500 rounded-full flex-1" />
          <div className="h-1.5 bg-sand rounded-full flex-1" />
          <div className="h-1.5 bg-sand rounded-full flex-1" />
          <div className="h-1.5 bg-sand rounded-full flex-1" />
        </div>
        <p className="text-xs text-clay">Step 1 of 4</p>
      </div>

      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-3xl font-black text-brand-500 tracking-tight">homie</span>
          <h1 className="text-2xl font-bold text-charcoal mt-4 mb-2">What are you looking for?</h1>
          <p className="text-sm text-clay">You can always change this later.</p>
        </div>

        <div className="space-y-3 mb-8">
          {intents.map(({ value, icon: Icon, title, desc, color, bg, border }) => (
            <button
              key={value}
              onClick={() => setSelected(value)}
              className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                selected === value
                  ? 'border-brand-500 bg-brand-50 shadow-sm'
                  : `border-charcoal/12 bg-white hover:border-charcoal/20`
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${selected === value ? 'bg-brand-100' : bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={selected === value ? 'text-brand-600' : color} />
                </div>
                <div>
                  <p className="font-semibold text-charcoal mb-1">{title}</p>
                  <p className="text-xs text-clay leading-relaxed">{desc}</p>
                </div>
                {selected === value && (
                  <div className="ml-auto w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Continue'}
          {!loading && <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  );
}
