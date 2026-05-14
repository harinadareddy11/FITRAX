// src/screens/onboarding/OnboardingGoalScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import OnboardingLayout from './OnboardingLayout';
import useAuthStore from '../../store/useAuthStore';
import { Colors } from '../../theme';

const GOALS = [
  { id: 'muscle_gain', label: 'Muscle Gain', emoji: '💪', desc: 'bulk up' },
  { id: 'fat_loss',    label: 'Fat Loss',    emoji: '🔥', desc: 'cut down' },
  { id: 'maintain',   label: 'Maintain',    emoji: '⚖️',  desc: 'stay fit' },
  { id: 'general',    label: 'General Fitness', emoji: '🏃', desc: 'overall health' },
];

export default function OnboardingGoalScreen({ navigation }) {
  const { onboardingData, updateOnboardingData } = useAuthStore();
  const [selected, setSelected] = useState(onboardingData.goal || null);

  const handleNext = () => {
    updateOnboardingData({ goal: selected });
    navigation.navigate('Stats');
  };

  return (
    <OnboardingLayout
      step={1}
      title="What's your goal?"
      subtitle="We'll personalise your entire app around this"
      onNext={handleNext}
      onBack={() => {}}
      hideBack
      nextDisabled={!selected}
    >
      <View style={styles.grid}>
        {GOALS.map((g) => {
          const active = selected === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              style={[styles.card, active && styles.cardActive]}
              onPress={() => setSelected(g.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>{g.emoji}</Text>
              <Text style={styles.cardLabel}>{g.label}</Text>
              <Text style={styles.cardDesc}>{g.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',      // center emoji, label, desc horizontally
  },
  cardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#140A00',
  },
  emoji: {
    fontSize: 28,
    marginBottom: 12,
    textAlign: 'center',
  },
  cardLabel: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
    alignSelf: 'stretch',      // stretch so textAlign center fills card width
  },
  cardDesc: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    textAlign: 'center',
    alignSelf: 'stretch',      // stretch so textAlign center fills card width
  },
});