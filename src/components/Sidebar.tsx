import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, Compass, Wallet, User, LogOut, Plus, Globe,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getInitials } from '../lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/trips', icon: Map, label: 'My Trips' },
  { to: '/explore', icon: Compass, label: 'Explore' },
];

export function Sidebar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside className="w-64 min-h-screen bg-ink-200 flex flex-col border-r border-ink-50 shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-ink-50">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-terracotta-gradient flex items-center justify-center">
            <Globe size={16} className="text-white" />
          </div>
          <span className="font-serif text-lg font-semibold text-white tracking-tight">
            GlobeTrotter
          </span>
        </Link>
      </div>

      {/* New Trip CTA */}
      <div className="px-4 pt-5 pb-2">
        <button
          onClick={() => navigate('/trips/new')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-terracotta-500 
                     text-white text-sm font-semibold rounded-lg hover:bg-terracotta-600 
                     active:scale-[0.98] transition-all duration-150 shadow-terracotta"
          id="sidebar-new-trip-btn"
        >
          <Plus size={16} />
          Plan New Trip
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="section-label px-3 mb-3 text-ink-50/40">Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            id={`sidebar-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive(to)
                ? 'bg-terracotta-500/15 text-terracotta-300 border border-terracotta-500/20'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}

        {profile?.is_admin && (
          <>
            <div className="h-px bg-white/10 my-3 mx-2" />
            <Link
              to="/admin"
              id="sidebar-nav-admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive('/admin')
                  ? 'bg-terracotta-500/15 text-terracotta-300 border border-terracotta-500/20'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard size={17} />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* Bottom: Profile */}
      <div className="px-4 py-4 border-t border-ink-50">
        <Link
          to="/profile"
          id="sidebar-profile-link"
          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-all duration-150 group"
        >
          <div className="w-8 h-8 rounded-full bg-terracotta-500/20 border border-terracotta-500/30 
                          flex items-center justify-center text-terracotta-300 text-xs font-bold shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(profile?.full_name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {profile?.full_name ?? 'Trotter Guest'}
            </p>
            <p className="text-white/40 text-xs truncate">View Profile</p>
          </div>
          <User size={14} className="text-white/30 group-hover:text-white/60 transition-colors" />
        </Link>

        <button
          onClick={signOut}
          id="sidebar-signout-btn"
          className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm 
                     text-white/40 hover:bg-dusty-500/10 hover:text-dusty-400 transition-all duration-150"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
