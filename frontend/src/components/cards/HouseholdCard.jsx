import { Link } from 'react-router-dom';
import {
  IconPin, IconUsers, IconShield, IconSpark, IconArrowRight, IconCheck,
} from '../icons';
import RoomPhoto from './RoomPhoto';

/*
 * HouseholdCard — an EXISTING household with a vacant room.
 * This is the core unit of Find My Homie: real people who already
 * live somewhere and have a spot to fill. Demo flag kept explicit.
 */
export default function HouseholdCard({
  to = '/register', title, area, roomPhoto, tint = '#AA0003',
  members = [], rent, maint, deposit, available, rules = [], score,
  furnished, demo = true,
}) {
  const monthly = rent + (maint || 0);
  const high = score >= 85;
  return (
    <div className="group bg-white rounded-3xl border border-charcoal/[0.08] shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Room photo */}
      <div className="relative h-44 overflow-hidden">
        <div className="w-full h-full transition-transform duration-500 group-hover:scale-105">
          <RoomPhoto id={roomPhoto} tint={tint} alt={`Room in ${title}`} />
        </div>
        <span className="absolute top-3 left-3 bg-olive text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">Room available</span>
        <div className="absolute top-3 right-3 flex gap-1.5">
          {furnished && <span className="bg-charcoal/55 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">Furnished</span>}
          {demo && <span className="bg-white/90 text-charcoal text-[11px] font-semibold px-2.5 py-1 rounded-full">Demo</span>}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-semibold text-charcoal leading-snug">{title}</h3>
          {score != null && (
            <span className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${high ? 'bg-olive/12 text-olive' : 'bg-honey/15 text-[#A9741A]'}`}>
              <IconSpark size={11} /> {score}%
            </span>
          )}
        </div>
        <p className="flex items-center gap-1 text-[13px] text-clay mb-3"><IconPin size={12} /> {area}</p>

        {/* Current household */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex -space-x-2">
            {members.map((m, i) => (
              <span key={i} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-bold" style={{ background: m.tint }}>{m.initials}</span>
            ))}
          </div>
          <span className="text-[12px] text-clay">{members.length} current flatmate{members.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Cost */}
        <div className="bg-cream rounded-xl p-3 mb-3 border border-charcoal/[0.06] text-[13px]">
          <div className="flex justify-between py-0.5"><span className="text-clay">Rent (your share)</span><span className="font-medium text-charcoal">₹{rent.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between py-0.5"><span className="text-clay">Maintenance</span><span className="font-medium text-charcoal">{maint ? `₹${maint.toLocaleString('en-IN')}` : <span className="text-honey">Ask</span>}</span></div>
          <div className="flex justify-between py-0.5"><span className="text-clay">Deposit</span><span className="font-medium text-charcoal">₹{deposit.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between pt-1.5 mt-1 border-t border-charcoal/[0.08]"><span className="font-semibold text-charcoal">Est. monthly</span><span className="font-display font-semibold text-brand-500">₹{monthly.toLocaleString('en-IN')}</span></div>
        </div>

        {/* House rules */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {rules.map(r => <span key={r} className="text-[11px] font-medium text-clay bg-sand px-2.5 py-1 rounded-full">{r}</span>)}
        </div>

        <div className="mt-auto flex gap-2">
          <Link to={to} className="flex-1 flex items-center justify-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-full transition-all">
            View household <IconArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
