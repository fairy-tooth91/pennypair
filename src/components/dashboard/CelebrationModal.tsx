import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Milestone } from '../../types';

interface CelebrationModalProps {
  milestones: Milestone[];
  onClose: () => void;
}

function getMilestoneEmoji(milestone: Milestone): string {
  if (milestone.kind === 'birthday') return '🎂';
  if (milestone.kind === 'anniversary_years') return '💍';
  // anniversary_days
  if (milestone.value >= 1000) return '🏆';
  return '💕';
}

function getMilestoneMessage(
  t: (key: string, opts?: Record<string, unknown>) => string,
  milestone: Milestone,
): string {
  if (milestone.kind === 'birthday') {
    return t('anniversary.birthdayToday', { name: milestone.targetName });
  }
  if (milestone.kind === 'anniversary_days') {
    return t('anniversary.todayIs', { milestone: t(`anniversary.days${milestone.value}`) });
  }
  // anniversary_years
  if (milestone.value <= 5) {
    return t('anniversary.todayIs', { milestone: t(`anniversary.year${milestone.value}`) });
  }
  return t('anniversary.todayIs', { milestone: t('anniversary.yearN', { n: milestone.value }) });
}

export default function CelebrationModal({ milestones, onClose }: CelebrationModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (milestones.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      {/* Particle effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="absolute animate-bounce text-2xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1.5 + Math.random() * 2}s`,
              opacity: 0.7 + Math.random() * 0.3,
            }}
          >
            {['❤️', '💕', '✨', '🎉', '💖', '⭐'][i % 6]}
          </span>
        ))}
      </div>

      {/* Modal content */}
      <div
        className="relative z-10 mx-4 max-w-sm animate-pulse-once rounded-2xl bg-white p-8 text-center shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 text-5xl">
          {getMilestoneEmoji(milestones[0])}
        </div>

        <h2 className="mb-2 text-xl font-bold text-gray-800">
          {t('anniversary.celebration')}
        </h2>

        <div className="mb-6 space-y-2">
          {milestones.map((m, i) => (
            <p key={i} className="text-lg font-medium text-pink-600">
              {getMilestoneMessage(t, m)}
            </p>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          {t('common.confirm')}
        </button>
      </div>

      <style>{`
        @keyframes pulseOnce {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pulse-once {
          animation: pulseOnce 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
