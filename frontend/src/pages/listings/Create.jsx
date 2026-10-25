import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import LocationSearch from '../../components/ui/LocationSearch';
import { listingApi } from '../../api';

const STEPS = ['Location & Room', 'Costs', 'Availability', 'Household'];


export default function ListingCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    city: 'Bengaluru',
    area: '',
    roomType: 'PRIVATE',
    furnished: false,
    bathroomType: '',
    availableBeds: '1',
    amenities: [],
    rent: '',
    maintenance: '',
    maintenanceNote: '',
    utilitiesIncluded: false,
    deposit: '',
    depositNote: '',
    brokerage: '',
    brokerageNote: '',
    availableFrom: '',
    leaseDurationMin: '',
    currentOccupants: '0',
    householdVibe: '',
    houseRules: [],
    cookingRules: '',
    guestPolicy: '',
    smokingAllowed: false,
    petsAllowed: false,
    posterIsAgent: false,
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (publish = false) => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        rent: parseInt(form.rent),
        maintenance: form.maintenance ? parseInt(form.maintenance) : undefined,
        deposit: form.deposit ? parseInt(form.deposit) : undefined,
        brokerage: form.brokerage ? parseInt(form.brokerage) : undefined,
        availableBeds: parseInt(form.availableBeds),
        currentOccupants: parseInt(form.currentOccupants),
        leaseDurationMin: form.leaseDurationMin ? parseInt(form.leaseDurationMin) : undefined,
        availableFrom: form.availableFrom ? new Date(form.availableFrom).toISOString() : new Date().toISOString(),
        status: publish ? 'PUBLISHED' : 'DRAFT',
      };
      const { data } = await listingApi.create(payload);
      navigate(`/listings/${data.data.listing.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  const amenityOptions = ['WiFi', 'AC', 'Parking', 'Gym', 'Security', 'Lift', 'Power backup', 'CCTV'];
  const ruleOptions = ['No smoking', 'No pets', 'No overnight guests', 'Quiet after 10pm', 'No loud music', 'Vegetarian kitchen', 'Non-veg allowed', 'No alcohol'];

  const toggleArr = (key, val) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val],
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)} className="p-2 rounded-xl hover:bg-sand transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="page-title text-xl">Post a room</h1>
          <p className="text-xs text-clay mt-0.5">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-brand-500' : 'bg-sand'}`} />
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div className="card p-6 space-y-5">
        {/* Step 0: Location */}
        {step === 0 && (
          <>
            <Input
              label="Listing title *"
              placeholder="e.g. Cozy private room in Koramangala"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Location * <span className="text-clay font-normal">(any city / area)</span></label>
              <LocationSearch
                value={form.area}
                placeholder="Search your city or neighbourhood…"
                onChange={(t) => set('area', t)}
                onSelect={(r) => { if (r) { set('area', r.area || r.city); set('city', r.city || r.area); } }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Room type *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'PRIVATE', label: '🚪 Private room' },
                  { value: 'SHARED', label: '👥 Shared room' },
                  { value: 'STUDIO', label: '🏢 Studio / 1BHK' },
                  { value: 'ENTIRE_FLAT', label: '🏠 Entire flat' },
                ].map(({ value, label }) => (
                  <button key={value} onClick={() => set('roomType', value)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${form.roomType === value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-charcoal/12 hover:border-charcoal/20 text-charcoal/80 bg-white'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.furnished} onChange={(e) => set('furnished', e.target.checked)} className="accent-brand-500 w-4 h-4" />
                <span className="text-sm text-charcoal">Furnished</span>
              </label>
              <Input
                label="Available beds"
                type="number"
                value={form.availableBeds}
                onChange={(e) => set('availableBeds', e.target.value)}
                className="w-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map((a) => (
                  <button key={a} onClick={() => toggleArr('amenities', a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.amenities.includes(a) ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-charcoal/80 border-charcoal/12 hover:border-charcoal/20'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Description (optional)</label>
              <textarea
                className="input-field h-24 resize-none"
                placeholder="Describe the room, building and neighbourhood…"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </>
        )}

        {/* Step 1: Costs */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Monthly rent (₹) *" type="number" placeholder="15000" value={form.rent} onChange={(e) => set('rent', e.target.value)} />
              <Input label="Maintenance (₹)" type="number" placeholder="2000" value={form.maintenance} onChange={(e) => set('maintenance', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Security deposit (₹)" type="number" placeholder="50000" value={form.deposit} onChange={(e) => set('deposit', e.target.value)} />
              <Input label="Brokerage (₹)" type="number" placeholder="0" value={form.brokerage} onChange={(e) => set('brokerage', e.target.value)} />
            </div>
            <Input label="Deposit terms" placeholder="e.g. Refundable within 30 days" value={form.depositNote} onChange={(e) => set('depositNote', e.target.value)} />
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.utilitiesIncluded} onChange={(e) => set('utilitiesIncluded', e.target.checked)} className="accent-brand-500 w-4 h-4" />
                <span className="text-sm text-charcoal">Utilities included in rent</span>
              </label>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.posterIsAgent} onChange={(e) => set('posterIsAgent', e.target.checked)} className="accent-brand-500 w-4 h-4" />
              <span className="text-sm text-charcoal">I am a broker / agent listing on behalf of owner</span>
            </label>
          </>
        )}

        {/* Step 2: Availability */}
        {step === 2 && (
          <>
            <Input
              label="Available from *"
              type="date"
              value={form.availableFrom}
              onChange={(e) => set('availableFrom', e.target.value)}
            />
            <Input
              label="Minimum lease (months)"
              type="number"
              placeholder="e.g. 6"
              value={form.leaseDurationMin}
              onChange={(e) => set('leaseDurationMin', e.target.value)}
            />
            <Input
              label="Current occupants"
              type="number"
              placeholder="0"
              value={form.currentOccupants}
              onChange={(e) => set('currentOccupants', e.target.value)}
            />
          </>
        )}

        {/* Step 3: Household */}
        {step === 3 && (
          <>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Household vibe</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'quiet_independent', label: '🤫 Quiet & independent' },
                  { value: 'friendly', label: '😊 Friendly, occasional shared time' },
                  { value: 'social', label: '🎉 Lively & social' },
                  { value: 'regular_meals', label: '🍽️ Regular meals together' },
                ].map(({ value, label }) => (
                  <button key={value} onClick={() => set('householdVibe', value)}
                    className={`p-3 rounded-xl border-2 text-xs font-medium text-left transition-all ${form.householdVibe === value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-charcoal/12 hover:border-charcoal/20 text-charcoal/80 bg-white'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">House rules</label>
              <div className="flex flex-wrap gap-2">
                {ruleOptions.map((r) => (
                  <button key={r} onClick={() => toggleArr('houseRules', r)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.houseRules.includes(r) ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-charcoal/80 border-charcoal/12 hover:border-charcoal/20'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Kitchen / cooking rules</label>
              <textarea
                className="input-field h-20 resize-none"
                placeholder="e.g. Vegetarian kitchen, shared utensils…"
                value={form.cookingRules}
                onChange={(e) => set('cookingRules', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Guest policy</label>
              <select value={form.guestPolicy} onChange={(e) => set('guestPolicy', e.target.value)} className="input-field">
                <option value="">Select…</option>
                <option value="NO_OVERNIGHT">No overnight guests</option>
                <option value="ADVANCE_NOTICE">Advance notice required</option>
                <option value="AGREED_FREQUENCY">Agreed frequency</option>
                <option value="FLEXIBLE">Flexible</option>
              </select>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.smokingAllowed} onChange={(e) => set('smokingAllowed', e.target.checked)} className="accent-brand-500 w-4 h-4" />
                <span className="text-sm text-charcoal">Smoking allowed</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.petsAllowed} onChange={(e) => set('petsAllowed', e.target.checked)} className="accent-brand-500 w-4 h-4" />
                <span className="text-sm text-charcoal">Pets allowed</span>
              </label>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 && (!form.title || !form.area || !form.roomType)}
            className="flex-1 flex items-center justify-center gap-2"
          >
            Next <ChevronRight size={16} />
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => handleSubmit(false)} loading={loading}>
              Save draft
            </Button>
            <Button onClick={() => handleSubmit(true)} loading={loading} className="flex-1 flex items-center justify-center gap-2">
              <CheckCircle size={16} />
              Publish listing
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
