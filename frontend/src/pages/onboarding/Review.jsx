import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Eye, Lock, Rocket } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import { profileApi } from '../../api';

export default function OnboardingReview() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    try {
      await profileApi.publish();
      await refreshUser();
      navigate('/dashboard');
    } catch {
      navigate('/dashboard');
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
          <div className="h-1.5 bg-brand-500 rounded-full flex-1" />
          <div className="h-1.5 bg-brand-500 rounded-full flex-1" />
          <div className="h-1.5 bg-brand-500 rounded-full flex-1" />
        </div>
        <p className="text-xs text-clay">Step 4 of 4 — Almost there!</p>
      </div>

      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={30} className="text-green-600" />
          </div>
          <span className="text-3xl font-black text-brand-500 tracking-tight">homie</span>
          <h1 className="text-2xl font-bold text-charcoal mt-3 mb-2">
            Your profile is ready, {user?.firstName}!
          </h1>
          <p className="text-sm text-clay">
            Review what will be shared, then publish to start discovering matches.
          </p>
        </div>

        {/* Profile card preview */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-brand-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0] || ''}
            </div>
            <div>
              <p className="font-bold text-charcoal">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-clay">Your Homie Card — private until you publish</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-sand/50 rounded-xl p-3">
              <p className="text-xs text-clay mb-1">Looking for</p>
              <p className="font-medium text-charcoal">
                {user?.intent === 'FIND_ROOM' ? 'A room' : user?.intent === 'FIND_PEOPLE' ? 'Flatmates first' : 'To fill a room'}
              </p>
            </div>
            <div className="bg-sand/50 rounded-xl p-3">
              <p className="text-xs text-clay mb-1">Location</p>
              <p className="font-medium text-charcoal">Bengaluru</p>
            </div>
          </div>
        </div>

        {/* Privacy note */}
        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
            <Eye size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">What's visible</p>
              <p className="text-xs text-green-700 mt-0.5">Your name, general location, lifestyle preferences (that you allowed) and housing needs.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-sand/50 rounded-xl">
            <Lock size={16} className="text-clay mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-charcoal">What stays private</p>
              <p className="text-xs text-clay mt-0.5">Your phone, email, exact address, religious practices (unless you chose to share) and full chat history.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={handlePublish} loading={loading} className="w-full py-4 text-base flex items-center justify-center gap-2">
            <Rocket size={18} />
            Publish my profile & start discovering
          </Button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full text-center text-sm text-clay hover:text-charcoal/80 py-2"
          >
            Save as draft, explore first
          </button>
        </div>
      </div>
    </div>
  );
}
