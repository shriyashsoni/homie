import { Link } from 'react-router-dom';
import { MapPin, Wifi, Wind, Car, ChevronRight, Zap, CheckCircle } from 'lucide-react';
import { photoForListing } from '../../assets/photos';

const AMENITY_ICONS = { wifi: Wifi, ac: Wind, parking: Car };

export default function ListingCard({ listing, score }) {
  const initials = listing.host
    ? `${listing.host.firstName?.[0] || ''}${listing.host.lastName?.[0] || ''}`
    : '?';
  const photo = listing.photos?.[0]?.url || listing.coverPhoto || photoForListing(listing.id || listing.title || listing.area);

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group block bg-card rounded-2xl border border-charcoal/[0.07] shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 overflow-hidden"
    >
      {/* Real photo */}
      <div className="relative h-44 overflow-hidden">
        <img src={photo} alt={listing.title} loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {listing.status === 'PUBLISHED' && (
              <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                Available
              </span>
            )}
            {listing.isFurnished && (
              <span className="bg-black/30 text-white text-[10px] font-medium px-2 py-1 rounded-lg backdrop-blur-sm">
                Furnished
              </span>
            )}
          </div>
          {score != null && (
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-sm">
              <Zap size={10} className="fill-yellow-300 text-yellow-300" />
              {Math.round(score)}% fit
            </div>
          )}
        </div>

        {/* Room type label */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-black/40 text-white text-[10px] font-medium px-2 py-1 rounded-md backdrop-blur-sm capitalize">
            {listing.roomType?.toLowerCase().replace(/_/g, ' ') || 'Room'}
          </span>
        </div>

        {/* Host avatar */}
        <div className="absolute bottom-3 right-3">
          <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-charcoal text-[10px] font-black shadow-sm border border-white">
            {initials}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-charcoal text-sm leading-snug line-clamp-1 flex-1">
            {listing.title}
          </h3>
          <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-500 mt-0.5 flex-shrink-0 group-hover:translate-x-0.5 transition-all" />
        </div>

        <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
          <MapPin size={11} className="flex-shrink-0" />
          <span className="truncate">{listing.area}{listing.city ? `, ${listing.city}` : ''}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-black text-charcoal">
              ₹{listing.rent?.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-gray-400 font-normal">/mo</span>
          </div>
          {listing.maintenance && (
            <span className="text-2xs text-gray-400">
              +₹{listing.maintenance?.toLocaleString('en-IN')} maint.
            </span>
          )}
        </div>

        {/* Amenities */}
        {listing.amenities?.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50">
            {listing.amenities.slice(0, 3).map((a) => {
              const Icon = AMENITY_ICONS[a.toLowerCase()] || CheckCircle;
              return (
                <div key={a} className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1 text-gray-500">
                  <Icon size={10} />
                  <span className="text-2xs font-medium capitalize">{a}</span>
                </div>
              );
            })}
            {listing.amenities.length > 3 && (
              <span className="text-2xs text-gray-400 ml-auto">+{listing.amenities.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
