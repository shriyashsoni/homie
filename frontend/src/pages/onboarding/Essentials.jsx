import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, MapPin, IndianRupee, Calendar } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { profileApi } from '../../api';

const BENGALURU_AREAS = [
  'Indiranagar', 'Koramangala', 'HSR Layout', 'BTM Layout', 'Whitefield',
  'Bellandur', 'Sarjapur', 'Electronic City', 'Marathahalli', 'JP Nagar',
  'Jayanagar', 'Banashankari', 'Hebbal', 'Yelahanka', 'Rajajinagar',
  'Malleshwaram', 'Domlur', 'Brookefield', 'CV Raman Nagar', 'Mahadevapura',
];

export default function OnboardingEssentials() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    selectedAreas: [],
    budgetMin: '',
    budgetMax: '',
    budgetIncludesAll: false,
    moveInDate: '',
    moveInFlexDays: '7',
    roomType: '',
  });

  const toggleArea = (area) => {
    setForm((f) => ({
      ...f,
      selectedAreas: f.selectedAreas.includes(area)
        ? f.selectedAreas.filter((a) => a !== area)
        : [...f.selectedAreas, area],
    }));
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      await profileApi.update({
        preferredAreas: form.selectedAreas,
        cityArea: form.selectedAreas[0] || '',
        budgetMin: parseInt(form.budgetMin) || null,
        budgetMax: parseInt(form.budgetMax) || null,
        budgetIncludesAll: form.budgetIncludesAll,
        moveInDate: form.moveInDate ? new Date(form.moveInDate).toISOString() : null,
        moveInFlexDays: parseInt(form.moveInFlexDays) || 7,
        roomType: form.roomType || null,
      });
      navigate('/onboarding/quiz');
    } catch {
      navigate('/onboarding/quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center p-4 pt-8">
      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 bg-brand-500 rounded-full flex-1" />
          <div className="h-1.5 bg-brand-500 rounded-full flex-1" />
          <div className="h-1.5 bg-sand rounded-full flex-1" />
          <div className="h-1.5 bg-sand rounded-full flex-1" />
        </div>
        <p className="text-xs text-clay">Step 2 of 4</p>
      </div>

      <div className="w-full max-w-lg">
        <div className="mb-8">
          <span className="text-3xl font-black text-brand-500 tracking-tight">homie</span>
          <h1 className="text-2xl font-bold text-charcoal mt-4 mb-2">The basics</h1>
          <p className="text-sm text-clay">These are the practical filters. Take your time — you can edit all of this later.</p>
        </div>

        <div className="space-y-6">
          {/* Areas */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-brand-500" />
              Which areas in Bengaluru work for you?
            </label>
            <div className="flex flex-wrap gap-2">
              {BENGALURU_AREAS.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleArea(area)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.selectedAreas.includes(area)
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-charcoal/80 border-charcoal/12 hover:border-brand-300'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
            {form.selectedAreas.length > 0 && (
              <p className="mt-2 text-xs text-brand-500">{form.selectedAreas.length} area(s) selected</p>
            )}
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-3 flex items-center gap-2">
              <IndianRupee size={16} className="text-brand-500" />
              Monthly budget
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Minimum (₹)"
                type="number"
                placeholder="8000"
                value={form.budgetMin}
                onChange={(e) => setForm((f) => ({ ...f, budgetMin: e.target.value }))}
              />
              <Input
                label="Maximum (₹)"
                type="number"
                placeholder="18000"
                value={form.budgetMax}
                onChange={(e) => setForm((f) => ({ ...f, budgetMax: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.budgetIncludesAll}
                onChange={(e) => setForm((f) => ({ ...f, budgetIncludesAll: e.target.checked }))}
                className="accent-brand-500 w-4 h-4 rounded"
              />
              <span className="text-xs text-charcoal/80">My max includes maintenance & utilities (total monthly)</span>
            </label>
          </div>

          {/* Move-in */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-brand-500" />
              When do you want to move in?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Move-in date"
                type="date"
                value={form.moveInDate}
                onChange={(e) => setForm((f) => ({ ...f, moveInDate: e.target.value }))}
              />
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Flexibility</label>
                <select
                  value={form.moveInFlexDays}
                  onChange={(e) => setForm((f) => ({ ...f, moveInFlexDays: e.target.value }))}
                  className="input-field"
                >
                  <option value="0">Exact date</option>
                  <option value="7">±1 week</option>
                  <option value="14">±2 weeks</option>
                  <option value="30">±1 month</option>
                  <option value="60">Very flexible</option>
                </select>
              </div>
            </div>
          </div>

          {/* Room type */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-3">Room type preference</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'PRIVATE', label: '🚪 Private room' },
                { value: 'SHARED', label: '👥 Shared room' },
                { value: 'STUDIO', label: '🏢 Studio / 1BHK' },
                { value: 'ENTIRE_FLAT', label: '🏠 Entire flat' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setForm((f) => ({ ...f, roomType: f.roomType === value ? '' : value }))}
                  className={`p-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                    form.roomType === value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-charcoal/12 hover:border-charcoal/20 text-charcoal/80 bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <Button variant="ghost" onClick={() => navigate('/onboarding/intent')} className="flex items-center gap-2">
            <ArrowLeft size={16} /> Back
          </Button>
          <Button onClick={handleContinue} loading={loading} className="flex-1 flex items-center justify-center gap-2">
            Continue <ArrowRight size={16} />
          </Button>
        </div>

        <button
          onClick={() => navigate('/onboarding/quiz')}
          className="w-full text-center text-xs text-clay hover:text-charcoal/80 mt-3 py-2"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
