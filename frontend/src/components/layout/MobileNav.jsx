import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Home, MessageCircle, User } from 'lucide-react';

const items = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Home' },
  { to: '/discover',    icon: Search,          label: 'Discover' },
  { to: '/listings',    icon: Home,            label: 'Rooms' },
  { to: '/messages',    icon: MessageCircle,   label: 'Chat' },
  { to: '/profile',     icon: User,            label: 'Profile' },
];

export default function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-md border-t border-charcoal/10">
      <div className="flex items-center justify-around h-16 px-1 pb-safe">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3.5 py-2 rounded-2xl transition-all duration-150 ${
                isActive ? '' : 'text-clay hover:text-charcoal/80'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`transition-all duration-150 ${isActive ? 'text-brand-500' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={`text-[9px] font-semibold tracking-wide transition-colors ${
                  isActive ? 'text-brand-500' : 'text-clay'
                }`}>
                  {label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
