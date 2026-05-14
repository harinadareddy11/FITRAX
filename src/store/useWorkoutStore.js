import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getExerciseType } from '../utils/exerciseTypes';

/** Stable ID for custom exercises — same name always gets same slug so history matches across sessions */
export function toExerciseSlug(name) {
  return 'custom_' + name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
}

const useWorkoutStore = create(
  persist(
    (set) => ({
      activeSession: null,
      sessionExercises: [],
      sessionStartTime: null,

      startWorkout: ({ templateId, dayName, splitType, exercises }) => {
        const sessionExercises = (exercises || []).map((ex) => {
          const type = ex.type || getExerciseType(ex.name); // honour custom type, fallback to keyword detection
          return {
            exerciseId: ex.exerciseId || ex.id,
            name: ex.name,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            type, // ← context-aware type
            sets: Array.from({ length: parseInt(ex.targetSets) || 3 }, (_, i) => ({
              setNumber: i + 1, kg: '', reps: '', seconds: null, done: false,
            })),
          };
        });

        set({
          activeSession: { templateId, dayName, splitType },
          sessionExercises,
          sessionStartTime: Date.now(), // persisted to AsyncStorage immediately
        });
      },

      logSet: ({ exerciseIndex, setIndex, kg, reps, seconds }) => {
        set((state) => {
          const updated = [...state.sessionExercises];
          updated[exerciseIndex] = {
            ...updated[exerciseIndex],
            sets: updated[exerciseIndex].sets.map((s, i) =>
              i === setIndex ? { ...s, kg: kg ?? s.kg, reps: reps ?? s.reps, seconds: seconds ?? s.seconds, done: true } : s
            ),
          };
          return { sessionExercises: updated };
        });
      },

      addSet: (exerciseIndex) => {
        set((state) => {
          const updated = [...state.sessionExercises];
          const ex = updated[exerciseIndex];
          updated[exerciseIndex] = {
            ...ex,
            sets: [...ex.sets, { setNumber: ex.sets.length + 1, kg: '', reps: '', done: false }],
          };
          return { sessionExercises: updated };
        });
      },

      addExercise: (ex) => {
        set((state) => {
          const type = ex.type || getExerciseType(ex.name);
          // Use slug-based ID for custom exercises so history tracks across sessions
          const exerciseId = ex.isCustom ? toExerciseSlug(ex.name) : (ex.exerciseId || ex.id);
          const newEx = {
            exerciseId,
            name: ex.name,
            muscle: ex.muscle || 'custom',
            type,
            targetSets: 3,
            targetReps: '10',
            isCustom: ex.isCustom || false,
            sets: [{ setNumber: 1, kg: '', reps: '', done: false }],
          };
          return { sessionExercises: [...state.sessionExercises, newEx] };
        });
      },

      clearSession: () => set({ activeSession: null, sessionExercises: [], sessionStartTime: null }),
    }),
    {
      name: 'fitrax-workout-session', // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist active session state — not functions
      partialize: (state) => ({
        activeSession: state.activeSession,
        sessionExercises: state.sessionExercises,
        sessionStartTime: state.sessionStartTime,
      }),
    }
  )
);

export default useWorkoutStore;