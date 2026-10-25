import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Home, Users, Sparkles, MapPin, ChevronDown } from 'lucide-react';
import { listingApi } from '../api';
import ListingCard from '../components/cards/ListingCard';
import Button from '../components/ui/Button';
import LocationSearch from '../components/ui/LocationSearch';

const AREAS = [
  'Indiranagar', 'Koramangala', 'HSR Layout', 'BTM Layout', 'Whitefield',
  'Bellandur', 'Sarjapur Road', 'Electronic City', 'Marathahalli',
  'JP Nagar', 'Jayanagar', 'Hebbal', 'Yelahanka', 'Bannerghatta Road',
  'Domlur', 'Kadugodi', 'Banashankari', 'Rajajinagar',
];

const ROOM_TYPES = [
  { value: 'PRIVATE',     label: 'Private room' },
  { value: 'SHARED',      label: 'Shared room' },
  { value: 'STUDIO',      label: 'Studio / 1BHK' },
  { value: 'ENTIRE_FLAT', label: 'Entire flat' },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-charcoal/[0.06] overflow-hidden">
      <div className="h-40 skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 skeleton rounded-full w-3/4" />
        <div className="h-3 skeleton rounded-full w-1/2" />
        <div className="h-5 skeleton rounded-full w-1/3" />
      </div>
    </div>
  );
}

export default function Discover() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tab, setTab]               = useState(searchParams.get('tab') === 'people' ? 'people' : 'rooms');
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch]         = useState('');
  const [filters, setFilters]       = useState({ area: '', budgetMax: '', roomType: '' });

  const params = {
    status: 'PUBLISHED',
    ...(filters.area      && { area: filters.area }),
    ...(filters.budgetMax && { budgetMax: filters.budgetMax }),
    ...(filters.roomType  && { roomType: filters.roomType }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['listings', params],
    queryFn: () => listingApi.list(params),
    retry: false,
  });

  const listings = data?.data?.data?.listings || [];

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const clearFilters = () => setFilters({ area: '', budgetMax: '', roomType: '' });

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <p className="section-label mb-1.5">Explore</p>
        <h1 className="text-2xl md:text-3xl font-black text-charcoal tracking-tight">Discover</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-sand rounded-2xl p-1 w-fit">
        <button
          onClick={() => setTab('rooms')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
            tab === 'rooms'
              ? 'bg-white shadow-card text-charcoal'
              : 'text-clay hover:text-charcoal'
          }`}
        >
          <Home size={15} />
          Rooms
        </button>
        <button
          onClick={() => setTab('people')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
            tab === 'people'
              ? 'bg-white shadow-card text-charcoal'
              : 'text-clay hover:text-charcoal'
          }`}
        >
          <Users size={15} />
          People
        </button>
      </div>

      {/* ─── Rooms tab ─── */}
      {tab === 'rooms' && (
        <>
          {/* International location search + filter toggle */}
          <div className="flex gap-2.5">
            <div className="flex-1">
              <LocationSearch
                value={filters.area}
                placeholder="Search any city or area worldwide…"
                onChange={(t) => setFilters((f) => ({ ...f, area: t }))}
                onSelect={(r) => setFilters((f) => ({ ...f, area: r ? (r.city || r.area) : '' }))}
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`h-12 flex items-center gap-2 px-4 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                showFilters || filters.budgetMax || filters.roomType
                  ? 'bg-brand-50 border-brand-300 text-brand-600'
                  : 'bg-white border-charcoal/12 text-charcoal/80 hover:border-charcoal/20'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filters
              <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="card p-5 animate-fade-up">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="section-label mb-2 block">Max budget (₹/mo)</label>
                  <input
                    type="number"
                    placeholder="e.g. 25000"
                    value={filters.budgetMax}
                    onChange={(e) => setFilters((f) => ({ ...f, budgetMax: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="section-label mb-2 block">Room type</label>
                  <select
                    value={filters.roomType}
                    onChange={(e) => setFilters((f) => ({ ...f, roomType: e.target.value }))}
                    className="input-field text-sm"
                  >
                    <option value="">Any type</option>
                    {ROOM_TYPES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters}
                  className="mt-4 text-xs text-brand-500 font-semibold flex items-center gap-1.5 hover:underline">
                  <X size={12} /> Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Results meta */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-clay">
              {isLoading
                ? 'Searching…'
                : `${listings.length} listing${listings.length !== 1 ? 's' : ''} found`}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-brand-500 flex items-center gap-1 hover:underline">
                <X size={11} /> Clear filters
              </button>
            )}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="card p-14 text-center">
              <div className="w-14 h-14 bg-sand rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🔍</div>
              <p className="font-bold text-charcoal mb-2">No listings found</p>
              <p className="text-sm text-clay mb-5 max-w-xs mx-auto">
                Try adjusting your filters or broadening your area search.
              </p>
              {activeFilterCount > 0 && (
                <Button size="sm" variant="outline" onClick={clearFilters}>Clear filters</Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── People tab ─── */}
      {tab === 'people' && (
        <div className="card p-14 text-center">
          <div className="w-16 h-16 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Sparkles size={28} className="text-purple-500" />
          </div>
          <h3 className="font-black text-lg text-charcoal mb-2">People discovery</h3>
          <p className="text-sm text-clay max-w-sm mx-auto leading-relaxed mb-6">
            Browse compatible flatmates based on your lifestyle quiz answers. Complete your profile first so the algorithm can find your best matches.
          </p>
          <Button onClick={() => navigate('/profile/edit')}>
            Complete my profile
          </Button>
        </div>
      )}
    </div>
  );
}
