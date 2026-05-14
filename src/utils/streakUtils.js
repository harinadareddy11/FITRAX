// src/utils/streakUtils.js
import { format, differenceInCalendarDays, startOfWeek, addDays, isToday, isFuture, parseISO } from 'date-fns';

/**
 * Calculate current streak from an array of session dates (strings: 'yyyy-MM-dd')
 * Rules:
 *  - Same day logs count as 1
 *  - Streak breaks if gap > 1 day (not consecutive)
 *  - Best streak tracked separately
 */
export function calculateStreak(sessions = []) {
  if (!sessions.length) return { current: 0, best: 0 };

  // Get unique dates sorted descending
  const uniqueDates = [...new Set(sessions.map((s) => s.date))].sort().reverse();

  if (!uniqueDates.length) return { current: 0, best: 0 };

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');

  // Streak must start from today or yesterday to be "active"
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return { current: 0, best: 0 };
  }

  let currentStreak = 1;
  let bestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = differenceInCalendarDays(
      parseISO(uniqueDates[i - 1]),
      parseISO(uniqueDates[i])
    );
    if (diff === 1) {
      currentStreak++;
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      break;
    }
  }

  return { current: currentStreak, best: bestStreak };
}

/**
 * Get the 7-day week grid (Mon–Sun of current week)
 * Returns array of { dayLetter, date, hasSession, isMissed, isToday, isFuture }
 */
export function getWeekGrid(sessions = []) {
  const sessionDates = new Set(sessions.map((s) => s.date));
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Start from Monday
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return dayLetters.map((letter, i) => {
    const day = addDays(weekStart, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const future = isFuture(day) && dateStr !== todayStr;
    const hasSession = sessionDates.has(dateStr);
    const isCurrentDay = dateStr === todayStr;
    const missed = !future && !hasSession && !isCurrentDay && dateStr < todayStr;

    return {
      dayLetter: letter,
      date: dateStr,
      hasSession,
      isMissed: missed,
      isToday: isCurrentDay,
      isFuture: future,
    };
  });
}

/**
 * Check if streak should increment on new session.
 * Allows up to 2-day gap so programs with rest days (Mon/Wed/Fri, etc.)
 * don't accidentally break the streak.
 */
export function shouldIncrementStreak(lastSessionDate) {
  if (!lastSessionDate) return true; // first ever session
  const diff = differenceInCalendarDays(new Date(), parseISO(lastSessionDate));
  if (diff === 0) return false;  // already logged today — guard
  return diff <= 2;              // yesterday or day-before = consecutive ✅
}

export function isStreakBroken(lastSessionDate) {
  if (!lastSessionDate) return false;
  const diff = differenceInCalendarDays(new Date(), parseISO(lastSessionDate));
  return diff > 2; // 3+ days without a session = streak broken
}