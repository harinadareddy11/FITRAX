// src/services/workoutService.js
import { supabase } from './supabase/client';
import { updateStreakAfterSession } from './streakService';
import { format } from 'date-fns';
import exercises from '../data/exercises.json';

// ─── Exercise Filtering ───────────────────────────────────────
export function filterExercisesByEquipment(userEquipment = []) {
  if (!userEquipment.length) return exercises;

  const equipMap = {
    'Full Gym': ['barbell', 'dumbbell_pair', 'cable', 'machine', 'bodyweight'],
    'Dumbbells Only': ['dumbbell_pair', 'bodyweight'],
    'Single Dumbbell': ['dumbbell_single', 'bodyweight'],
    'Barbell': ['barbell', 'bodyweight'],
    'Cables': ['cable', 'bodyweight'],
    'Resistance Bands': ['resistance_band', 'bodyweight'],
    'Bodyweight Only': ['bodyweight'],
    'Pull-up Bar': ['pullup_bar', 'bodyweight'],
  };

  const allowedEquipment = new Set(
    userEquipment.flatMap((e) => equipMap[e] || [])
  );

  return exercises.filter((ex) =>
    ex.equipment.some((eq) => allowedEquipment.has(eq))
  );
}

// ─── Workout Plan Generator ───────────────────────────────────
export function generateWorkoutPlan({ goal, equipment, daysPerWeek, preset }) {
  const available = filterExercisesByEquipment(equipment);

  if (daysPerWeek <= 3) {
    return buildFullBodyPlan(available, daysPerWeek, goal);
  } else if (daysPerWeek === 4) {
    return buildUpperLowerPlan(available, goal);
  } else {
    return buildPPLPlan(available, goal);
  }
}

function buildPPLPlan(available, goal) {
  const setsForGoal = goal === 'fat_loss' ? 3 : 4;
  const push = [
    ...available.filter(e => e.muscle === 'chest').slice(0, 2),
    ...available.filter(e => e.muscle === 'shoulders').slice(0, 2),
    ...available.filter(e => e.muscle === 'triceps').slice(0, 2),
  ];
  const pull = [
    ...available.filter(e => e.muscle === 'back').slice(0, 3),
    ...available.filter(e => e.muscle === 'biceps').slice(0, 2),
  ];
  const legs = [
    ...available.filter(e => e.muscle === 'quads').slice(0, 2),
    ...available.filter(e => e.muscle === 'hamstrings').slice(0, 1),
    ...available.filter(e => e.muscle === 'glutes').slice(0, 1),
    ...available.filter(e => e.muscle === 'calves').slice(0, 1),
  ];
  const makeExercises = (list) =>
    list.map((ex) => ({
      exerciseId: ex.id, name: ex.name,
      targetSets: setsForGoal, targetReps: goal === 'fat_loss' ? '12-15' : '8-12',
    }));
  return {
    name: 'PPL Split', type: 'ppl', daysPerWeek: 6,
    days: [
      { dayName: 'Monday', splitType: 'Push', exercises: makeExercises(push) },
      { dayName: 'Tuesday', splitType: 'Pull', exercises: makeExercises(pull) },
      { dayName: 'Wednesday', splitType: 'Legs', exercises: makeExercises(legs) },
      { dayName: 'Thursday', splitType: 'Push', exercises: makeExercises(push) },
      { dayName: 'Friday', splitType: 'Pull', exercises: makeExercises(pull) },
      { dayName: 'Saturday', splitType: 'Legs', exercises: makeExercises(legs) },
    ],
  };
}

function buildUpperLowerPlan(available, goal) {
  const upper = [
    ...available.filter(e => ['chest', 'back', 'shoulders'].includes(e.muscle)).slice(0, 4),
    ...available.filter(e => ['biceps', 'triceps'].includes(e.muscle)).slice(0, 2),
  ];
  const lower = [
    ...available.filter(e => ['quads', 'hamstrings', 'glutes', 'calves'].includes(e.muscle)).slice(0, 5),
    ...available.filter(e => e.muscle === 'core').slice(0, 2),
  ];
  const makeExercises = (list) =>
    list.map((ex) => ({ exerciseId: ex.id, name: ex.name, targetSets: 4, targetReps: '8-12' }));
  return {
    name: 'Upper/Lower Split', type: 'upper_lower', daysPerWeek: 4,
    days: [
      { dayName: 'Monday', splitType: 'Upper', exercises: makeExercises(upper) },
      { dayName: 'Tuesday', splitType: 'Lower', exercises: makeExercises(lower) },
      { dayName: 'Thursday', splitType: 'Upper', exercises: makeExercises(upper) },
      { dayName: 'Friday', splitType: 'Lower', exercises: makeExercises(lower) },
    ],
  };
}

function buildFullBodyPlan(available, daysPerWeek, goal) {
  const fullBody = [
    ...available.filter(e => e.muscle === 'chest').slice(0, 1),
    ...available.filter(e => e.muscle === 'back').slice(0, 1),
    ...available.filter(e => e.muscle === 'quads').slice(0, 1),
    ...available.filter(e => e.muscle === 'shoulders').slice(0, 1),
    ...available.filter(e => e.muscle === 'biceps').slice(0, 1),
    ...available.filter(e => e.muscle === 'triceps').slice(0, 1),
  ];
  const makeExercises = (list) =>
    list.map((ex) => ({ exerciseId: ex.id, name: ex.name, targetSets: 3, targetReps: '10-12' }));
  const dayNames = ['Monday', 'Wednesday', 'Friday', 'Saturday'];
  return {
    name: 'Full Body', type: 'full_body', daysPerWeek,
    days: Array.from({ length: daysPerWeek }, (_, i) => ({
      dayName: dayNames[i] || `Day ${i + 1}`,
      splitType: 'Full Body',
      exercises: makeExercises(fullBody),
    })),
  };
}

// ─── Weight Suggestion ───────────────────────────────────────
export async function getWeightSuggestion(userId, exerciseId) {
  try {
    const { data } = await supabase
      .from('workout_sessions')
      .select('exercises')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(5);

    const sessions = data || [];
    const history = sessions
      .map((s) => {
        const ex = s.exercises?.find((e) => e.exerciseId === exerciseId);
        if (!ex) return null;
        const doneSets = ex.sets.filter((s) => s.done);
        if (!doneSets.length) return null;
        const allRepsHit = doneSets.every(
          (s) => parseInt(s.reps) >= (ex.targetReps?.split('-')[1] || 10)
        );
        return { kg: Math.max(...doneSets.map((s) => parseFloat(s.kg) || 0)), allRepsHit };
      })
      .filter(Boolean);

    if (!history.length) return null;
    const lastWeight = history[0].kg;
    const last2AllHit = history.length >= 2 && history[0].allRepsHit && history[1].allRepsHit;
    if (last2AllHit) return { kg: lastWeight + 2.5, hint: `Great progress! Try ${lastWeight + 2.5}kg` };
    if (!history[0].allRepsHit && lastWeight > 0) return { kg: lastWeight, hint: `Same as last time: ${lastWeight}kg` };
    return { kg: lastWeight, hint: `Last session: ${lastWeight}kg` };
  } catch {
    return null;
  }
}

// ─── Save Session ────────────────────────────────────────────
export async function saveSession(userId, { exercises: exs, templateId, dayName, splitType, loggingMode, duration: passedDuration }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const sessionId = `${today}_${Date.now()}`;

  const totalVolumeKg = exs.reduce((total, ex) => {
    return total + ex.sets.reduce((s, set) => {
      return s + (set.done ? (parseFloat(set.kg) || 0) * (parseInt(set.reps) || 0) : 0);
    }, 0);
  }, 0);

  const duration = passedDuration || 1;

  const { error } = await supabase.from('workout_sessions').insert({
    id: sessionId,
    user_id: userId,
    date: today,
    type: splitType?.toLowerCase().replace(' ', '_') || 'custom',
    day_name: dayName,
    split_type: splitType,
    template_id: templateId,
    duration,
    total_volume_kg: Math.round(totalVolumeKg),
    exercises: exs.map((ex) => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      sets: ex.sets,
    })),
    prs_hit: [],
    logging_mode: loggingMode,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;

  const streakResult = await updateStreakAfterSession(userId);
  return { sessionId, streakResult };
}