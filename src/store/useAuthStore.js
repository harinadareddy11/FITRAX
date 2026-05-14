// src/store/useAuthStore.js
import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  // Firebase user object (uid, email, etc.)
  user: null,
  // Full Firestore profile
  userProfile: null,
  // Temporary data collected during onboarding (cleared after completion)
  onboardingData: {
    goal: null,          // 'muscle_gain' | 'fat_loss' | 'maintain' | 'general'
    name: '',
    age: '',
    weight: '',
    height: '',
    bmi: null,
    equipment: [],       // array of equipment strings
    workoutPath: null,   // 'generate' | 'manual' | 'preset'
    daysPerWeek: 4,
    presetTemplate: null,
    dietBudget: 200,
    loggingMode: 'after', // 'realtime' | 'after'
  },

  setUser: (user) => set({ user }),

  setUserProfile: (profile) => set({ userProfile: profile }),

  updateOnboardingData: (data) =>
    set((state) => ({
      onboardingData: { ...state.onboardingData, ...data },
    })),

  clearOnboardingData: () =>
    set({
      onboardingData: {
        goal: null, name: '', age: '', weight: '', height: '',
        bmi: null, equipment: [], workoutPath: null, daysPerWeek: 4,
        presetTemplate: null, dietBudget: 200, loggingMode: 'after',
      },
    }),

  signOut: () => set({ user: null, userProfile: null }),
}));

export default useAuthStore;