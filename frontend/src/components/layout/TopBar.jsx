import { Menu, Bell, Search, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function TopBar({ onMenuClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
  const isHost = user?.role === 'HOST' || user?.role === 'BOTH';

  return (
    <header className="h-14 bg-cream/80 backdrop-blur-md border-b border-charcoal/10 flex items-center px-4 gap-3 sticky top-0 z-20">

      {/* Mobile hamburger */}
      <button
        className="lg:hidden p-2 rounded-xl hover:bg-sand text-clay hover:text-charcoal transition-colors"
        onClick={onMenuClick}
      >
        <Menu size={19} />
      </button>

      {/* Desktop search */}
      <div className="flex-1 hidden md:flex items-center">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay" />
          <input
            placeholder="Search listings, areas…"
            className="w-full h-9 pl-9 pr-4 bg-white rounded-xl text-sm border border-charcoal/12 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all placeholder-gray-400 text-charcoal"
          />
        </div>
      </div>

      {/* Mobile search overlay */}
      {showSearch && (
        <div className="absolute inset-0 bg-cream flex items-center px-4 gap-3 z-10 md:hidden">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay" />
            <input
              autoFocus
              placeholder="Search listings, areas…"
              className="w-full h-10 pl-9 pr-4 bg-white rounded-xl text-sm border border-charcoal/12 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 text-charcoal"
            />
          </div>
          <button onClick={() => setShowSearch(false)} className="p-1.5 text-clay">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1.5">

        {/* Mobile search trigger */}
        <button
          className="md:hidden p-2 rounded-xl hover:bg-sand text-clay hover:text-charcoal transition-colors"
          onClick={() => setShowSearch(true)}
        >
          <Search size={18} />
        </button>

        {/* Post room (hosts only) */}
        {isHost && (
          <button
            onClick={() => navigate('/listings/create')}
            className="hidden md:flex items-center gap-1.5 btn-primary text-xs h-8 px-3 py-0"
          >
            <Plus size={13} />
            Post Room
          </button>
        )}

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl hover:bg-sand text-clay hover:text-charcoal transition-colors"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-cream" />
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white font-black text-xs shadow-sm hover:scale-105 active:scale-95 transition-transform ml-0.5"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
