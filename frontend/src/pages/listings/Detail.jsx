import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin, IndianRupee, Calendar, Home, User, Shield,
  AlertTriangle, Heart, ChevronLeft, Clock, CheckCircle
} from 'lucide-react';
import { listingApi, connectionApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { photoForListing, portrait } from '../../assets/photos';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showConnect, setShowConnect] = useState(false);
  const [message, setMessage] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingApi.getById(id),
  });

  const listing = data?.data?.data?.listing;

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connectionApi.send({ receiverId: listing.hostId, listingId: id, message });
      setConnected(true);
      setShowConnect(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not send request.');
    } finally {
      setConnecting(false);
    }
  };

  if (isLoading) return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="h-64 bg-sand rounded-2xl" />
      <div className="card p-6 space-y-3">
        <div className="h-5 bg-sand rounded w-2/3" />
        <div className="h-4 bg-sand rounded w-1/3" />
      </div>
    </div>
  );

  if (error || !listing) return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-10 text-center">
        <p className="text-clay">Listing not found or no longer available.</p>
        <Button size="sm" className="mt-4" onClick={() => navigate('/listings')}>Back to listings</Button>
      </div>
    </div>
  );

  const isOwner = listing.hostId === user?.id;
  const totalMonthly = (listing.rent || 0) + (listing.maintenance || 0);
  const totalUpfront = (listing.deposit || 0) + (listing.brokerage || 0);

  // Real photo gallery (uses listing photos if present, else deterministic stock)
  const apiPhotos = listing.photos?.map((p) => p.url).filter(Boolean) || [];
  const gallery = apiPhotos.length
    ? apiPhotos.slice(0, 4)
    : [photoForListing(listing.id, 1100, 760), photoForListing(`${listing.id}-2`, 500, 380), photoForListing(`${listing.id}-3`, 500, 380), photoForListing(`${listing.id}-4`, 500, 380)];
  const host = listing.host || {};
  const hostName = `${host.firstName || 'Verified'} ${host.lastName || 'Host'}`.trim();
  const hostImg = host.avatarUrl || portrait(/^[a-m]/i.test(host.firstName || 'h') ? 'f' : 'm', ((host.id || listing.id || '').toString().length * 7) % 90);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-clay hover:text-charcoal transition-colors">
        <ChevronLeft size={16} /> Back
      </button>

      {/* Photo gallery */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-64 md:h-96 rounded-3xl overflow-hidden relative">
        <div className="col-span-4 md:col-span-2 row-span-2 relative overflow-hidden group">
          <img src={gallery[0]} alt={listing.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge color={listing.status === 'PUBLISHED' ? 'green' : 'orange'}>
              {listing.status === 'PUBLISHED' ? '● Available' : listing.status}
            </Badge>
            {listing.listingReviewed && <Badge color="blue">✓ Reviewed</Badge>}
          </div>
          {listing.lastConfirmedAt && (
            <div className="absolute bottom-4 left-4">
              <Badge color="gray" className="bg-black/50 text-white border-0">
                <Clock size={10} />
                Confirmed {new Date(listing.lastConfirmedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Badge>
            </div>
          )}
        </div>
        {gallery.slice(1, 4).map((src, i) => (
          <div key={i} className={`hidden md:block relative overflow-hidden group ${i === 0 ? 'col-span-2' : ''}`}>
            <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            {i === 2 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-bold">
                +{Math.max(gallery.length - 4, 6)} photos
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Host card */}
      <div className="card p-4 flex items-center gap-3">
        <img src={hostImg} alt={hostName} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-charcoal text-sm truncate">{hostName}</p>
            <Shield size={13} className="text-slate flex-shrink-0" />
          </div>
          <p className="text-xs text-clay">Host · Usually responds within a day</p>
        </div>
        {!isOwner && (
          <button onClick={() => setShowConnect(true)} className="text-xs font-bold text-brand-500 hover:underline flex-shrink-0">
            Message
          </button>
        )}
      </div>

      {/* Main info */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-xl font-bold text-charcoal">{listing.title}</h1>
            <div className="flex items-center gap-1.5 text-sm text-clay mt-1">
              <MapPin size={14} />
              {listing.area}, {listing.city}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-black text-brand-500">₹{listing.rent?.toLocaleString()}</p>
            <p className="text-xs text-clay">per month</p>
          </div>
        </div>

        {/* Room specs */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge color="gray">{listing.roomType?.replace('_', ' ')}</Badge>
          {listing.furnished && <Badge color="green">Furnished</Badge>}
          {listing.bathroomType && <Badge color="gray">{listing.bathroomType}</Badge>}
          {listing.availableBeds > 0 && <Badge color="blue">{listing.availableBeds} bed(s) available</Badge>}
        </div>

        {listing.description && (
          <p className="text-sm text-charcoal/80 leading-relaxed">{listing.description}</p>
        )}
      </div>

      {/* Costs */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-charcoal mb-4 flex items-center gap-2">
          <IndianRupee size={16} className="text-brand-500" />
          Full cost breakdown
        </h2>
        <div className="space-y-2 text-sm">
          {[
            { label: 'Monthly rent', value: listing.rent, required: true },
            { label: 'Maintenance', value: listing.maintenance, note: listing.maintenanceNote },
            { label: 'Utilities included', value: listing.utilitiesIncluded ? 'Yes' : 'Separate', isText: true },
            { label: 'Security deposit', value: listing.deposit, note: listing.depositNote },
            { label: 'Brokerage', value: listing.brokerage, note: listing.brokerageNote || (listing.posterIsAgent ? 'Broker listed' : null) },
          ].map(({ label, value, note, required, isText }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-charcoal/[0.05] last:border-0">
              <span className="text-clay">{label}</span>
              <span className={`font-medium ${required ? 'text-charcoal' : 'text-charcoal/80'}`}>
                {value == null ? <span className="text-clay/50 text-xs">Not stated</span>
                  : isText ? value
                  : `₹${value.toLocaleString()}`}
                {note && <span className="text-xs text-clay ml-1">({note})</span>}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2 bg-brand-50 rounded-xl px-3 mt-2">
            <span className="font-semibold text-charcoal">Est. monthly total</span>
            <span className="font-bold text-brand-500">₹{totalMonthly.toLocaleString()}</span>
          </div>
          {totalUpfront > 0 && (
            <div className="flex items-center justify-between py-2 bg-orange-50 rounded-xl px-3">
              <span className="font-semibold text-charcoal">Est. upfront total</span>
              <span className="font-bold text-orange-600">₹{totalUpfront.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Availability */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-charcoal mb-4 flex items-center gap-2">
          <Calendar size={16} className="text-brand-500" />
          Availability
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-clay mb-1">Available from</p>
            <p className="font-medium text-charcoal">
              {listing.availableFrom
                ? new Date(listing.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Immediately'}
            </p>
          </div>
          <div>
            <p className="text-xs text-clay mb-1">Minimum duration</p>
            <p className="font-medium text-charcoal">
              {listing.leaseDurationMin ? `${listing.leaseDurationMin} months` : 'Flexible'}
            </p>
          </div>
        </div>
      </div>

      {/* Household */}
      {(listing.householdVibe || listing.houseRules?.length > 0 || listing.cookingRules || listing.guestPolicy) && (
        <div className="card p-6">
          <h2 className="text-sm font-bold text-charcoal mb-4 flex items-center gap-2">
            <Home size={16} className="text-brand-500" />
            Household
          </h2>
          {listing.householdVibe && (
            <p className="text-sm text-charcoal/80 mb-3">{listing.householdVibe}</p>
          )}
          {listing.houseRules?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {listing.houseRules.map((rule) => (
                <span key={rule} className="px-2.5 py-1 bg-sand rounded-full text-xs text-charcoal/80">{rule}</span>
              ))}
            </div>
          )}
          {listing.cookingRules && (
            <p className="text-xs text-clay bg-orange-50 rounded-xl p-3">
              🍳 Kitchen: {listing.cookingRules}
            </p>
          )}
        </div>
      )}

      {/* Safety note */}
      <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl text-xs text-orange-700">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <p>
          Never pay a deposit before viewing in person. FMH does not collect payments.
          Verify all details and meet the host before transferring any money.
        </p>
      </div>

      {/* CTA */}
      {!isOwner && (
        <div className="sticky bottom-20 lg:bottom-4 card p-4 flex gap-3 shadow-lg">
          {connected ? (
            <div className="flex-1 flex items-center gap-2 text-sm text-green-700 font-medium">
              <CheckCircle size={16} className="text-green-600" />
              Connection request sent!
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => listingApi.save(id).catch(() => {})}
              >
                <Heart size={14} />
                Save
              </Button>
              <Button className="flex-1" onClick={() => setShowConnect(true)}>
                Request viewing / connect
              </Button>
            </>
          )}
        </div>
      )}

      {isOwner && (
        <div className="card p-4 flex gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(`/listings/${id}/edit`)}>
            Edit listing
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/listings/mine')}>
            Manage my listings
          </Button>
        </div>
      )}

      {/* Connect Modal */}
      <Modal open={showConnect} onClose={() => setShowConnect(false)} title="Send a connection request">
        <div className="space-y-4">
          <p className="text-sm text-clay">
            Add a short message to help the host understand your interest.
          </p>
          <textarea
            className="input-field h-24 resize-none"
            placeholder="e.g. I can move in during your availability window and your household rules work well for me…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowConnect(false)}>Cancel</Button>
            <Button className="flex-1" loading={connecting} onClick={handleConnect}>
              Send request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
