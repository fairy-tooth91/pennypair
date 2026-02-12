import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from '../services/supabase';
import type { Currency, Language } from '../types';
import { CURRENCIES } from '../types';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('KRW');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setLanguage(profile.preferredLanguage);
      setCurrency(profile.homeCurrency);
    }
  }, [profile]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaved(false);

    try {
      await updateProfile(user.id, {
        displayName,
        preferredLanguage: language,
        homeCurrency: currency,
      });
      i18n.changeLanguage(language);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{t('settings.title')}</h2>

      <div className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700">{t('settings.profile')}</h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('settings.displayName')}</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('settings.language')}</label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value as Language)}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="ko">한국어</option>
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('settings.currency')}</label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as Currency)}
            className="w-full rounded-lg border px-3 py-2"
          >
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? t('common.loading') : saved ? t('settings.saved') : t('settings.save')}
        </button>
      </div>
    </div>
  );
}
