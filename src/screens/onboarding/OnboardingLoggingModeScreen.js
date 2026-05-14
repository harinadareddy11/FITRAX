// src/screens/onboarding/OnboardingLoggingModeScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import OnboardingLayout from './OnboardingLayout';
import useAuthStore from '../../store/useAuthStore';
import { Colors } from '../../theme';

const MODES = [
  {
    id: 'realtime',
    label: 'Log in real-time',
    emoji: '⏱️',
    desc: 'Log each set as you finish it. Rest timer auto-starts after every set. Phone vibrates when rest ends.',
    tag: 'Best for: logging at the gym',
  },
  {
    id: 'after',
    label: 'Log after workout',
    emoji: '📝',
    desc: 'Enter all your sets at once when you get home. Clean, fast entry with no timer interruptions.',
    tag: 'Best for: logging at home',
  },
];

export default function OnboardingLoggingModeScreen({ navigation }) {
  const { onboardingData, updateOnboardingData } = useAuthStore();
  const [mode, setMode] = useState(onboardingData.loggingMode || 'after');

  const handleNext = () => {
    updateOnboardingData({ loggingMode: mode });
    navigation.navigate('BiometricSetup');
  };

  return (
    <OnboardingLayout
      step={6}
      title="How do you prefer to log?"
      subtitle="This changes how the workout screen works. You can change it in Settings anytime."
      onNext={handleNext}
      onBack={() => navigation.goBack()}
    >
      <View style={{ gap: 14 }}>
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.card, active && styles.cardActive]}
              onPress={() => setMode(m.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <Text style={styles.emoji}>{m.emoji}</Text>
                <Text style={[styles.label, active && { color: Colors.primary }]}>{m.label}</Text>
                {active && <Text style={styles.check}>✓</Text>}
              </View>
              <Text style={styles.desc}>{m.desc}</Text>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{m.tag}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard, borderRadius: 14,
    padding: 18, borderWidth: 1.5, borderColor: Colors.border,
  },
  cardActive: { borderColor: Colors.primary, backgroundColor: '#2A1500' },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  emoji: { fontSize: 22 },
  label: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: Colors.textPrimary, flex: 1 },
  check: { color: Colors.primary, fontFamily: 'Outfit_700Bold', fontSize: 16 },
  desc: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.bgCardDeep,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
  tagText: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSecondary },
});