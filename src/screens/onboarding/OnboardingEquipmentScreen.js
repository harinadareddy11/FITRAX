// src/screens/onboarding/OnboardingEquipmentScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import OnboardingLayout from './OnboardingLayout';
import useAuthStore from '../../store/useAuthStore';
import { Colors } from '../../theme';

const EQUIPMENT = [
  { id: 'full_gym',        label: 'Full gym' },
  { id: 'dumbbells_only',  label: 'Dumbbells only' },
  { id: '1_dumbbell',      label: '1 dumbbell' },
  { id: 'barbell',         label: 'Barbell' },
  { id: 'cables',          label: 'Cables' },
  { id: 'bands',           label: 'Bands' },
  { id: 'bodyweight',      label: 'Bodyweight' },
  { id: 'pullup_bar',      label: 'Pull-up bar' },
];

export default function OnboardingEquipmentScreen({ navigation }) {
  const { onboardingData, updateOnboardingData } = useAuthStore();
  const [selected, setSelected] = useState(onboardingData.equipment || []);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    updateOnboardingData({ equipment: selected });
    navigation.navigate('WorkoutPlan');
  };

  const hasSingleDumbbell = selected.includes('1_dumbbell');

  return (
    <OnboardingLayout
      step={3}
      title="Your equipment"
      subtitle="Select all you have access to"
      onNext={handleNext}
      onBack={() => navigation.goBack()}
      nextDisabled={selected.length === 0}
    >
      {/* Pill wrap row — no emojis, no desc, just label */}
      <View style={styles.pillWrap}>
        {EQUIPMENT.map((eq) => {
          const active = selected.includes(eq.id);
          return (
            <TouchableOpacity
              key={eq.id}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => toggle(eq.id)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {eq.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Info box — only when 1 dumbbell selected */}
      {hasSingleDumbbell && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>1 dumbbell selected?</Text>
          <Text style={styles.infoBody}>
            Only exercises possible with one dumbbell will appear in your plan — no barbell, no cables.
          </Text>
        </View>
      )}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  // Wrap row of pills
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // Inactive pill — dark bg, gray border, white text
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },

  // Active pill — orange border, no fill, orange text
  pillActive: {
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },

  pillText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,       // white when inactive
  },

  pillTextActive: {
    color: Colors.primary,           // orange when active
  },

  // Info box — dark card with orange title
  infoBox: {
    marginTop: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
  },
  infoTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: Colors.primary,           // orange bold title
    marginBottom: 6,
  },
  infoBody: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});