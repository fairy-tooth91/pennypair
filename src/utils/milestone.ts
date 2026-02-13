import type { Milestone } from '../types';

// ============================================
// 상수
// ============================================

const DAY_MILESTONES = [100, 200, 1000];
const MAX_YEAR_MILESTONES = 50;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const STORAGE_PREFIX = 'pennypair_celebration_';

// ============================================
// 날짜 헬퍼
// ============================================

function today(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function diffDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

// ============================================
// D+N 계산
// ============================================

export function getDaysSince(dateStr: string): number {
  return diffDays(parseDate(dateStr), today()) + 1; // 1일째부터 시작
}

// ============================================
// 기념일 마일스톤 계산
// ============================================

export function getAnniversaryMilestones(anniversaryDate: string): Milestone[] {
  const start = parseDate(anniversaryDate);
  const now = today();
  const milestones: Milestone[] = [];

  // 일수 기반 마일스톤
  for (const days of DAY_MILESTONES) {
    const d = new Date(start);
    d.setDate(d.getDate() + days - 1); // D+1 기준이므로 -1
    const daysFromNow = diffDays(now, d);
    if (daysFromNow >= -1 && daysFromNow <= 365) {
      milestones.push({
        kind: 'anniversary_days',
        label: `anniversary.days${days}`,
        value: days,
        date: formatDate(d),
        daysFromNow,
      });
    }
  }

  // 연수 기반 마일스톤
  for (let year = 1; year <= MAX_YEAR_MILESTONES; year++) {
    const d = new Date(start.getFullYear() + year, start.getMonth(), start.getDate());
    const daysFromNow = diffDays(now, d);
    if (daysFromNow >= -1 && daysFromNow <= 365) {
      milestones.push({
        kind: 'anniversary_years',
        label: `anniversary.year${year}`,
        value: year,
        date: formatDate(d),
        daysFromNow,
      });
    }
  }

  return milestones.sort((a, b) => a.daysFromNow - b.daysFromNow);
}

// ============================================
// 생일 마일스톤 계산
// ============================================

export function getBirthdayMilestone(birthday: string, name: string): Milestone {
  const bday = parseDate(birthday);
  const now = today();

  let nextBirthday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
  if (diffDays(now, nextBirthday) < 0) {
    nextBirthday = new Date(now.getFullYear() + 1, bday.getMonth(), bday.getDate());
  }

  const daysFromNow = diffDays(now, nextBirthday);

  return {
    kind: 'birthday',
    label: 'anniversary.birthday',
    value: nextBirthday.getFullYear() - bday.getFullYear(),
    date: formatDate(nextBirthday),
    daysFromNow,
    targetName: name,
  };
}

// ============================================
// 통합 마일스톤 조회
// ============================================

export function getUpcomingCelebrations(
  anniversaryDate: string | null,
  myBirthday: string | null,
  partnerBirthday: string | null,
  myName: string,
  partnerName: string,
): Milestone[] {
  const milestones: Milestone[] = [];

  if (anniversaryDate) {
    milestones.push(...getAnniversaryMilestones(anniversaryDate));
  }
  if (myBirthday) {
    milestones.push(getBirthdayMilestone(myBirthday, myName));
  }
  if (partnerBirthday) {
    milestones.push(getBirthdayMilestone(partnerBirthday, partnerName));
  }

  return milestones
    .filter(m => m.daysFromNow >= 0)
    .sort((a, b) => a.daysFromNow - b.daysFromNow);
}

export function getTodayCelebrations(
  anniversaryDate: string | null,
  myBirthday: string | null,
  partnerBirthday: string | null,
  myName: string,
  partnerName: string,
): Milestone[] {
  return getUpcomingCelebrations(anniversaryDate, myBirthday, partnerBirthday, myName, partnerName)
    .filter(m => m.daysFromNow === 0);
}

// ============================================
// localStorage 축하 중복 방지
// ============================================

export function getCelebrationKey(milestone: Milestone): string {
  return `${STORAGE_PREFIX}${milestone.kind}_${milestone.value}_${milestone.date}`;
}

export function isCelebrationDismissed(milestone: Milestone): boolean {
  try {
    return localStorage.getItem(getCelebrationKey(milestone)) === 'true';
  } catch {
    return false;
  }
}

export function dismissCelebration(milestone: Milestone): void {
  try {
    localStorage.setItem(getCelebrationKey(milestone), 'true');
  } catch {
    // localStorage unavailable
  }
}
