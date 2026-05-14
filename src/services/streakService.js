// src/services/streakService.js
import { supabase } from './supabase/client';
import { shouldIncrementStreak, isStreakBroken } from '../utils/streakUtils';
import { format } from 'date-fns';

/**
 * Call this after saving a session. Updates streak on the profile row.
 */
export async function updateStreakAfterSession(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('streak_current, streak_best, total_sessions, last_session_date')
    .eq('id', userId)
    .single();

  if (!data) return;

  const lastSessionDate = data.last_session_date || null;
  const currentStreak = data.streak_current || 0;
  const bestStreak = data.streak_best || 0;
  const today = format(new Date(), 'yyyy-MM-dd');

  // Already logged today — don't increment
  if (lastSessionDate === today) return;

  let newStreak;
  if (shouldIncrementStreak(lastSessionDate)) {
    newStreak = currentStreak + 1;
  } else if (isStreakBroken(lastSessionDate)) {
    newStreak = 1;
  } else {
    newStreak = 1;
  }

  const newBest = Math.max(newStreak, bestStreak);
  const totalSessions = (data.total_sessions || 0) + 1;

  await supabase.from('profiles').update({
    streak_current: newStreak,
    streak_best: newBest,
    last_session_date: today,
    total_sessions: totalSessions,
    last_active: new Date().toISOString(),
  }).eq('id', userId);

  return { newStreak, newBest };
}

/**
 * Get recent sessions for streak/home display
 */
export async function getRecentSessions(userId, limitCount = 30) {
  const { data } = await supabase
    .from('workout_sessions')
    .select('id, date, split_type, day_name, exercises, total_volume_kg, duration')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limitCount);

  return (data || []).map(d => ({
    id: d.id,
    date: d.date,
    splitType: d.split_type,
    dayName: d.day_name,
    exercises: d.exercises || [],
    totalVolumeKg: d.total_volume_kg,
    duration: d.duration,
  }));
}