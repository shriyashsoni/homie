import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Home, Flag, ArrowLeft, Shield } from 'lucide-react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/listings', icon: Home, label: 'Listings' },
  { to: '/admin/reports', icon: Flag, label: 'Reports' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-charcoal flex">
      {/* Admin Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-[#111] border-r border-white/10 fixed h-screen z-10">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-brand-400" />
            <span className="text-lg font-black text-white tracking-tight">homie</span>
          </div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            Back to app
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 lg:ml-60">
        {/* Mobile admin header */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-[#111] border-b border-white/10">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-brand-400" />
            <span className="font-black text-white">homie admin</span>
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-xs text-gray-400">← App</button>
        </div>
        {/* Mobile admin nav */}
        <div className="lg:hidden flex overflow-x-auto border-b border-white/10 bg-[#111]">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-all ${
                  isActive ? 'border-brand-500 text-white' : 'border-transparent text-gray-400'
                }`
              }
            >
              <Icon size={13} /> {label}
            </NavLink>
          ))}
        </div>

        <main className="p-5 md:p-8 min-h-screen bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
