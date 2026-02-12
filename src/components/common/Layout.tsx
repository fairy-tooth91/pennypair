import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import ProfileBottomSheet from './ProfileBottomSheet';

const navItems = [
  { to: '/', icon: '📊', key: 'nav.dashboard' },
  { to: '/transactions', icon: '💳', key: 'nav.transactions' },
  { to: '/settlement', icon: '🤝', key: 'nav.settlement' },
  { to: '/settings', icon: '⚙️', key: 'nav.settings' },
] as const;

export default function Layout() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = profile
    ? profile.displayName
        .split(/\s+/)
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-indigo-600">PennyPair</h1>
          {profile && (
            <button
              onClick={() => setProfileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-200 active:bg-indigo-300"
            >
              {initials}
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t bg-white">
        <div className="mx-auto flex max-w-lg">
          {navItems.map(({ to, icon, key }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center py-2 text-xs ${
                  isActive ? 'text-indigo-600 font-semibold' : 'text-gray-400'
                }`
              }
            >
              <span className="text-lg">{icon}</span>
              <span>{t(key)}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Profile Bottom Sheet */}
      <ProfileBottomSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
