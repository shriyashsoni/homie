import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, Home, User, Link2, Calendar,
  Bell, Settings, Shield, LogOut, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discover',      icon: Search,          label: 'Discover' },
  { to: '/listings',      icon: Home,            label: 'Listings' },
  { to: '/connections',   icon: Link2,           label: 'Connections' },
  { to: '/viewings',      icon: Calendar,        label: 'Viewings' },
  { to: '/profile',       icon: User,            label: 'My Profile' },
  { to: '/notifications', icon: Bell,            label: 'Notifications' },
  { to: '/settings',      icon: Settings,        label: 'Settings' },
];

function NavItem({ to, icon: Icon, label, onClose }) {
  return (
    <NavLink
      to={to}
      onClick={onClose}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-brand-gradient text-white shadow-sm'
            : 'text-clay hover:text-charcoal hover:bg-sand/80'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={17} className={isActive ? 'text-white' : 'text-clay group-hover:text-charcoal'} />
          <span className="flex-1">{label}</span>
          {isActive && <ChevronRight size={13} className="text-white/50" />}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ mobile, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`
      ${mobile ? 'w-72 h-full' : 'hidden lg:flex w-60 h-screen fixed top-0 left-0 z-30'}
      flex-col bg-cream border-r border-charcoal/10
    `}>
      {/* Logo row */}
      <div className="px-5 h-14 flex items-center justify-between border-b border-charcoal/[0.06]">
        <NavLink to="/dashboard">
          <span className="text-xl font-black text-brand-500 tracking-tight">homie</span>
        </NavLink>
        {mobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-sand/60 text-clay hover:text-charcoal transition-colors">
            <X size={17} />
          </button>
        )}
      </div>

      {/* User card */}
      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-charcoal/[0.06] shadow-xs hover:shadow-card transition-all duration-200 cursor-pointer group"
          onClick={() => { navigate('/profile'); onClose?.(); }}>
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-cream" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-charcoal truncate leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-2xs text-clay truncate mt-0.5">
              {user?.role === 'HOST' ? 'Room Host' : user?.role === 'BOTH' ? 'Host & Seeker' : 'Room Seeker'}
            </p>
          </div>
          <ChevronRight size={13} className="text-clay/50 group-hover:text-clay flex-shrink-0 transition-colors" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5 pb-3">
        <p className="section-label px-3 py-2 mt-1">Menu</p>
        {navItems.map(({ to, icon, label }) => (
          <NavItem key={to} to={to} icon={icon} label={label} onClose={onClose} />
        ))}

        {user?.isAdmin && (
          <>
            <div className="h-px bg-sand my-2 mx-1" />
            <p className="section-label px-3 py-2">Admin</p>
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-charcoal text-white shadow-sm'
                    : 'text-clay hover:text-charcoal hover:bg-sand/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Shield size={17} className={isActive ? 'text-white' : 'text-clay'} />
                  <span className="flex-1">Admin Panel</span>
                  {isActive && <ChevronRight size={13} className="text-white/50" />}
                </>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-charcoal/[0.06]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-clay hover:text-brand-500 hover:bg-red-50 transition-all duration-150 group"
        >
          <LogOut size={17} className="group-hover:text-brand-500 transition-colors" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
