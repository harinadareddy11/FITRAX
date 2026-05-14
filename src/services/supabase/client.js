// src/services/supabase/client.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://jdgftzztkqdcxczpejom.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZ2Z0enp0a3FkY3hjenBlam9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDM0MTEsImV4cCI6MjA5MzMxOTQxMX0.AHYvpJX3vlD05bNgBbMxPcbFNHpIFNqd2boHOHJKArI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Map snake_case DB profile → camelCase app profile
export function mapProfile(d) {
  if (!d) return null;
  return {
    name: d.name,
    email: d.email,
    age: d.age,
    weight: d.weight,
    height: d.height,
    bmi: d.bmi,
    goal: d.goal,
    equipment: d.equipment || [],
    loggingMode: d.logging_mode || 'after',
    dietBudget: d.diet_budget ?? 200,
    onboardingCompleted: d.onboarding_completed ?? false,
    streakCurrent: d.streak_current ?? 0,
    streakBest: d.streak_best ?? 0,
    totalSessions: d.total_sessions ?? 0,
    lastSessionDate: d.last_session_date,
    avatarKey: d.avatar_key || null,
    startingWeight: d.starting_weight ?? null,  // first weight recorded at onboarding
  };
}

// Map session row → camelCase
export function mapSession(d) {
  if (!d) return null;
  return {
    id: d.id,
    date: d.date,
    splitType: d.split_type,
    dayName: d.day_name,
    type: d.type,
    duration: d.duration,
    totalVolumeKg: d.total_volume_kg,
    exercises: d.exercises || [],
    loggingMode: d.logging_mode,
  };
}
