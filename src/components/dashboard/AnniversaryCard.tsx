import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Milestone } from '../../types';
import { getDaysSince, getUpcomingCelebrations } from '../../utils/milestone';

interface AnniversaryCardProps {
  anniversaryDate: string | null;
  myBirthday: string | null;
  partnerBirthday: string | null;
  myName: string;
  partnerName: string;
  onCelebration: (milestones: Milestone[]) => void;
}

function getMilestoneLabel(t: (key: string, opts?: Record<string, unknown>) => string, milestone: Milestone): string {
  if (milestone.kind === 'birthday') {
    return t('anniversary.birthday', { name: milestone.targetName });
  }
  if (milestone.kind === 'anniversary_days') {
    return t(`anniversary.days${milestone.value}`);
  }
  // anniversary_years
  if (milestone.value <= 5) {
    return t(`anniversary.year${milestone.value}`);
  }
  return t('anniversary.yearN', { n: milestone.value });
}

export default function AnniversaryCard({
  anniversaryDate,
  myBirthday,
  partnerBirthday,
  myName,
  partnerName,
  onCelebration,
}: AnniversaryCardProps) {
  const { t } = useTranslation();

  const daysSince = useMemo(
    () => anniversaryDate ? getDaysSince(anniversaryDate) : null,
    [anniversaryDate],
  );

  const upcoming = useMemo(
    () => getUpcomingCelebrations(anniversaryDate, myBirthday, partnerBirthday, myName, partnerName),
    [anniversaryDate, myBirthday, partnerBirthday, myName, partnerName],
  );

  const todayCelebrations = useMemo(
    () => upcoming.filter(m => m.daysFromNow === 0),
    [upcoming],
  );

  // 가장 가까운 이벤트 1개만
  const nextEvent = useMemo(
    () => upcoming.find(m => m.daysFromNow > 0) ?? null,
    [upcoming],
  );

  if (!anniversaryDate && !myBirthday && !partnerBirthday) return null;

  const hasCelebrationToday = todayCelebrations.length > 0;

  return (
    <div
      className={`rounded-xl p-4 shadow-sm ${
        hasCelebrationToday
          ? 'bg-gradient-to-r from-pink-50 to-rose-50 ring-2 ring-pink-200'
          : 'bg-white'
      }`}
    >
      {/* D+N Counter */}
      {daysSince !== null && (
        <div className={`flex items-center gap-2 ${hasCelebrationToday || nextEvent ? 'mb-3' : ''}`}>
          <span className="text-lg">❤️</span>
          <span className="text-sm font-semibold text-gray-800">
            {t('anniversary.daysCount', { days: daysSince.toLocaleString() })}
          </span>
        </div>
      )}

      {/* Today's celebrations */}
      {hasCelebrationToday && (
        <div className={nextEvent ? 'mb-3' : ''}>
          {todayCelebrations.map((m, i) => (
            <button
              key={i}
              onClick={() => onCelebration(todayCelebrations)}
              className="mb-1 flex w-full items-center gap-2 rounded-lg bg-pink-100 px-3 py-2 text-left text-sm font-medium text-pink-700 transition-colors hover:bg-pink-200"
            >
              <span>🎉</span>
              <span>
                {m.kind === 'birthday'
                  ? t('anniversary.birthdayToday', { name: m.targetName })
                  : t('anniversary.todayIs', { milestone: getMilestoneLabel(t, m) })}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 가장 가까운 이벤트 1개 */}
      {nextEvent && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {nextEvent.kind === 'birthday'
              ? t('anniversary.birthday', { name: nextEvent.targetName })
              : getMilestoneLabel(t, nextEvent)}
          </span>
          <span className="font-medium text-gray-600">
            {nextEvent.kind === 'birthday'
              ? t('anniversary.birthdayDays', { name: nextEvent.targetName, days: nextEvent.daysFromNow })
              : t('anniversary.nextMilestone', { milestone: getMilestoneLabel(t, nextEvent), days: nextEvent.daysFromNow })}
          </span>
        </div>
      )}
    </div>
  );
}
