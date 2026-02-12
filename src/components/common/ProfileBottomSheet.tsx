import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile } from '../../services/supabase';
import type { Currency, Language } from '../../types';
import { CURRENCIES } from '../../types';

interface ProfileBottomSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileBottomSheet({ open, onClose }: ProfileBottomSheetProps) {
  const { t, i18n } = useTranslation();
  const { user, profile, logout, refreshProfile } = useAuth();

  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setDisplayName(profile.displayName);
  }, [profile]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setEditingName(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function handleSaveName() {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { displayName: displayName.trim() });
      await refreshProfile();
      setEditingName(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleLanguageChange(lang: Language) {
    if (!user) return;
    await updateProfile(user.id, { preferredLanguage: lang });
    i18n.changeLanguage(lang);
    await refreshProfile();
  }

  async function handleCurrencyChange(currency: Currency) {
    if (!user) return;
    await updateProfile(user.id, { homeCurrency: currency });
    await refreshProfile();
  }

  function handleLogout() {
    onClose();
    logout();
  }

  if (!open || !profile) return null;

  const initials = profile.displayName
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg animate-slide-up rounded-t-2xl bg-white pb-8 sm:mb-4 sm:rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Profile info */}
        <div className="flex items-center gap-3 px-6 pb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border px-2 py-1 text-sm"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                >
                  {t('settings.save')}
                </button>
              </div>
            ) : (
              <p className="truncate font-semibold text-gray-900">{profile.displayName}</p>
            )}
            <p className="truncate text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Menu items */}
        <div className="px-6 py-2">
          {/* Edit nickname */}
          <button
            onClick={() => setEditingName(true)}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100"
          >
            <span className="w-5 text-center text-base">&#9998;</span>
            {t('profile.editName')}
          </button>

          {/* Language */}
          <div className="flex items-center gap-3 rounded-lg px-2 py-3">
            <span className="w-5 text-center text-base">&#127760;</span>
            <span className="flex-1 text-sm text-gray-700">{t('profile.languageSetting')}</span>
            <select
              value={profile.preferredLanguage}
              onChange={e => handleLanguageChange(e.target.value as Language)}
              className="rounded-lg border bg-white px-2 py-1 text-sm text-gray-700"
            >
              <option value="ko">한국어</option>
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Currency */}
          <div className="flex items-center gap-3 rounded-lg px-2 py-3">
            <span className="w-5 text-center text-base">&#128177;</span>
            <span className="flex-1 text-sm text-gray-700">{t('profile.currencySetting')}</span>
            <select
              value={profile.homeCurrency}
              onChange={e => handleCurrencyChange(e.target.value as Currency)}
              className="rounded-lg border bg-white px-2 py-1 text-sm text-gray-700"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Logout */}
        <div className="px-6 pt-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100"
          >
            <span className="w-5 text-center text-base">&#10140;</span>
            {t('auth.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
