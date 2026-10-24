import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Save, ChevronLeft } from 'lucide-react';
import { profileApi } from '../../api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const AREAS = ['Indiranagar', 'Koramangala', 'HSR Layout', 'BTM Layout', 'Whitefield', 'Bellandur', 'Sarjapur', 'Electronic City', 'Marathahalli', 'JP Nagar', 'Jayanagar', 'Hebbal'];

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);

  const { data } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileApi.get(),
    retry: false,
  });

  useEffect(() => {
    const p = data?.data?.data?.profile;
    if (p) {
      setForm({
        bio: p.bio || '',
        preferredAreas: p.preferredAreas || [],
        budgetMin: p.budgetMin?.toString() || '',
        budgetMax: p.budgetMax?.toString() || '',
        budgetIncludesAll: p.budgetIncludesAll || false,
        moveInDate: p.moveInDate ? new Date(p.moveInDate).toISOString().split('T')[0] : '',
        roomType: p.roomType || '',
        dietaryPreference: p.dietaryPreference || '',
        cookingBoundary: p.cookingBoundary || '',
        alcoholPreference: p.alcoholPreference || '',
        smokingPreference: p.smokingPreference || '',
        guestPolicy: p.guestPolicy || '',
        cleanlinessLevel: p.cleanlinessLevel || '',
        socialLevel: p.socialLevel || '',
        religiousPractice: p.religiousPractice || '',
        religiousPracticePublic: p.religiousPracticePublic || false,
      });
    } else if (!p && data) {
      setForm({
        bio: '', preferredAreas: [], budgetMin: '', budgetMax: '',
        budgetIncludesAll: false, moveInDate: '', roomType: '',
        dietaryPreference: '', cookingBoundary: '', alcoholPreference: '',
        smokingPreference: '', guestPolicy: '', cleanlinessLevel: '',
        socialLevel: '', religiousPractice: '', religiousPracticePublic: false,
      });
    }
  }, [data]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleArea = (area) => {
    setForm((f) => ({
      ...f,
      preferredAreas: f.preferredAreas.includes(area)
        ? f.preferredAreas.filter((a) => a !== area)
        : [...f.preferredAreas, area],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await profileApi.update({
        ...form,
        budgetMin: form.budgetMin ? parseInt(form.budgetMin) : null,
        budgetMax: form.budgetMax ? parseInt(form.budgetMax) : null,
        moveInDate: form.moveInDate ? new Date(form.moveInDate).toISOString() : null,
      });
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!form) return <div className="max-w-2xl mx-auto card h-64 animate-pulse" />;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/profile')} className="p-2 rounded-xl hover:bg-sand">
          <ChevronLeft size={20} />
        </button>
        <h1 className="page-title text-xl">Edit Profile</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

      {/* About */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-bold text-charcoal">About you</h2>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1.5">Bio</label>
          <textarea
            className="input-field h-24 resize-none"
            placeholder="Tell potential flatmates a bit about yourself…"
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
          />
        </div>
      </div>

      {/* Housing */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-bold text-charcoal">Housing requirements</h2>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">Preferred areas</label>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((area) => (
              <button key={area} onClick={() => toggleArea(area)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  form.preferredAreas.includes(area) ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-charcoal/80 border-charcoal/12 hover:border-brand-300'}`}>
                {area}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Budget min (₹)" type="number" value={form.budgetMin} onChange={(e) => set('budgetMin', e.target.value)} placeholder="8000" />
          <Input label="Budget max (₹)" type="number" value={form.budgetMax} onChange={(e) => set('budgetMax', e.target.value)} placeholder="20000" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.budgetIncludesAll} onChange={(e) => set('budgetIncludesAll', e.target.checked)} className="accent-brand-500 w-4 h-4" />
          <span className="text-sm text-charcoal">Max budget includes all costs</span>
        </label>
        <Input label="Move-in date" type="date" value={form.moveInDate} onChange={(e) => set('moveInDate', e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">Room type</label>
          <select value={form.roomType} onChange={(e) => set('roomType', e.target.value)} className="input-field">
            <option value="">Any</option>
            <option value="PRIVATE">Private room</option>
            <option value="SHARED">Shared room</option>
            <option value="STUDIO">Studio / 1BHK</option>
            <option value="ENTIRE_FLAT">Entire flat</option>
          </select>
        </div>
      </div>

      {/* Lifestyle */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-bold text-charcoal">Lifestyle & household</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Dietary preference</label>
            <select value={form.dietaryPreference} onChange={(e) => set('dietaryPreference', e.target.value)} className="input-field">
              <option value="">Prefer not to say</option>
              <option value="VEGETARIAN">Vegetarian</option>
              <option value="VEGETARIAN_EGGS_OKAY">Vegetarian + eggs</option>
              <option value="NON_VEGETARIAN">Non-vegetarian</option>
              <option value="VEGAN">Vegan</option>
              <option value="JAIN">Jain</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Kitchen rule</label>
            <select value={form.cookingBoundary} onChange={(e) => set('cookingBoundary', e.target.value)} className="input-field">
              <option value="">Open to discuss</option>
              <option value="ANY">Anything</option>
              <option value="NO_MEAT">No meat cooked</option>
              <option value="NO_NON_VEG">No non-veg in home</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Alcohol</label>
            <select value={form.alcoholPreference} onChange={(e) => set('alcoholPreference', e.target.value)} className="input-field">
              <option value="">No preference</option>
              <option value="NO_ALCOHOL_IN_HOME">No alcohol at home</option>
              <option value="OKAY_OUTSIDE_NOT_AT_HOME">Outside only</option>
              <option value="OCCASIONAL_OKAY">Occasional okay</option>
              <option value="NO_PREFERENCE">No preference</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Smoking</label>
            <select value={form.smokingPreference} onChange={(e) => set('smokingPreference', e.target.value)} className="input-field">
              <option value="">No preference</option>
              <option value="NO_INDOOR">No smoking indoors</option>
              <option value="OUTDOORS_ONLY">Outdoors only</option>
              <option value="NO_PREFERENCE">No preference</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Cleanliness</label>
            <select value={form.cleanlinessLevel} onChange={(e) => set('cleanlinessLevel', e.target.value)} className="input-field">
              <option value="">Not specified</option>
              <option value="VERY_CLEAN">Very clean</option>
              <option value="REASONABLY_CLEAN">Reasonably clean</option>
              <option value="RELAXED">Relaxed</option>
              <option value="FLEXIBLE">Flexible</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Guest policy</label>
            <select value={form.guestPolicy} onChange={(e) => set('guestPolicy', e.target.value)} className="input-field">
              <option value="">Not specified</option>
              <option value="NO_OVERNIGHT">No overnight</option>
              <option value="ADVANCE_NOTICE">Advance notice</option>
              <option value="AGREED_FREQUENCY">Agreed frequency</option>
              <option value="FLEXIBLE">Flexible</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1.5">
            Religious / cultural practices <span className="text-clay">(optional)</span>
          </label>
          <textarea
            className="input-field h-20 resize-none"
            placeholder="e.g. Prayer space needed, fasting on certain days… Keep blank if you prefer privacy."
            value={form.religiousPractice}
            onChange={(e) => set('religiousPractice', e.target.value)}
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input type="checkbox" checked={form.religiousPracticePublic} onChange={(e) => set('religiousPracticePublic', e.target.checked)} className="accent-brand-500 w-4 h-4" />
            <span className="text-xs text-charcoal/80">Share this on my public profile</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => navigate('/profile')}>Cancel</Button>
        <Button loading={loading} onClick={handleSave} className="flex-1 flex items-center justify-center gap-2">
          <Save size={14} /> Save profile
        </Button>
      </div>
    </div>
  );
}
