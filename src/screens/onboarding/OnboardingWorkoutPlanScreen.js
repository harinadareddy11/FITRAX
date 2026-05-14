// src/screens/onboarding/OnboardingWorkoutPlanScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import OnboardingLayout from './OnboardingLayout';
import useAuthStore from '../../store/useAuthStore';
import { Colors, GlobalStyles } from '../../theme';

const PATHS = [
  {
    id: 'generate',
    label: 'Generate a plan for me',
    emoji: '⚡',
    desc: 'App builds a personalised plan based on your goal and equipment',
  },
  {
    id: 'manual',
    label: "I'll build my own routine",
    emoji: '✏️',
    desc: 'Add your own days and exercises one by one',
  },
  {
    id: 'preset',
    label: 'Pick a preset template',
    emoji: '📋',
    desc: 'PPL, Bro Split, Upper/Lower, Full Body — pre-filled and editable',
  },
];

const PRESETS = ['PPL', 'Bro Split', 'Upper/Lower', 'Full Body'];
const DAYS = [3, 4, 5, 6];

export default function OnboardingWorkoutPlanScreen({ navigation }) {
  const { onboardingData, updateOnboardingData } = useAuthStore();
  const [path, setPath] = useState(onboardingData.workoutPath || null);
  const [days, setDays] = useState(onboardingData.daysPerWeek || 4);
  const [preset, setPreset] = useState(onboardingData.presetTemplate || null);

  const handleNext = () => {
    if (path === 'manual') {
      // Go to manual builder screen
      updateOnboardingData({ workoutPath: 'manual' });
      navigation.navigate('ManualPlanBuilder');
      return;
    }
    updateOnboardingData({ workoutPath: path, daysPerWeek: days, presetTemplate: preset });
    navigation.navigate('DietBudget');
  };

  const canProceed = path && (path !== 'preset' || preset);

  return (
    <OnboardingLayout
      step={4}
      title="Set up your workout plan"
      subtitle="You can always edit this later from the Workout tab."
      onNext={handleNext}
      onBack={() => navigation.goBack()}
      nextDisabled={!canProceed}
      nextLabel={path === 'manual' ? 'Build My Routine →' : 'Continue →'}
    >
      {/* Path selection */}
      <View style={{ gap: 10 }}>
        {PATHS.map((p) => {
          const active = path === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.card, active && styles.cardActive]}
              onPress={() => setPath(p.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardEmoji}>{p.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardLabel, active && { color: Colors.primary }]}>{p.label}</Text>
                <Text style={styles.cardDesc}>{p.desc}</Text>
              </View>
              {active && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Days per week — only for generate */}
      {path === 'generate' && (
        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionLabel}>DAYS PER WEEK</Text>
          <View style={styles.daysRow}>
            {DAYS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dayBtn, days === d && styles.dayBtnActive]}
                onPress={() => setDays(d)}
              >
                <Text style={[styles.dayText, days === d && { color: Colors.primary }]}>{d}</Text>
                <Text style={styles.daySubtext}>days</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Preset picker */}
      {path === 'preset' && (
        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionLabel}>SELECT TEMPLATE</Text>
          <View style={styles.presetsWrap}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.presetTag, preset === p && styles.presetTagActive]}
                onPress={() => setPreset(p)}
              >
                <Text style={[styles.presetText, preset === p && { color: Colors.primary }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Manual hint */}
      {path === 'manual' && (
        <View style={[GlobalStyles.orangeBox, { marginTop: 16 }]}>
          <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20 }}>
            Tap "Build My Routine" to add your workout days and pick exercises from our library of 80+ exercises.
          </Text>
        </View>
      )}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: 12,
    padding: 16, borderWidth: 1.5, borderColor: Colors.border, gap: 12,
  },
  cardActive: { borderColor: Colors.primary, backgroundColor: '#2A1500' },
  cardEmoji: { fontSize: 22 },
  cardLabel: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 3 },
  cardDesc: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  check: { color: Colors.primary, fontFamily: 'Outfit_700Bold', fontSize: 16 },
  sectionLabel: {
    fontFamily: 'Outfit_600SemiBold', fontSize: 11,
    color: Colors.textSecondary, letterSpacing: 1.5, marginBottom: 12,
  },
  daysRow: { flexDirection: 'row', gap: 10 },
  dayBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    backgroundColor: Colors.bgCard, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  dayBtnActive: { borderColor: Colors.primary, backgroundColor: '#2A1500' },
  dayText: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 22, color: Colors.textPrimary },
  daySubtext: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.textSecondary },
  presetsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetTag: {
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: Colors.bgCard, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  presetTagActive: { borderColor: Colors.primary, backgroundColor: '#2A1500' },
  presetText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.textPrimary },
});