// src/screens/onboarding/OnboardingStatsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import OnboardingLayout from './OnboardingLayout';
import useAuthStore from '../../store/useAuthStore';
import { Colors, GlobalStyles } from '../../theme';

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

function calcBMI(weight, height) {
  const w = parseFloat(weight);
  const h = parseFloat(height) / 100;
  if (!w || !h || h === 0) return null;
  return (w / (h * h)).toFixed(1);
}

export default function OnboardingStatsScreen({ navigation }) {
  const { onboardingData, updateOnboardingData } = useAuthStore();
  const [age,        setAge]        = useState(onboardingData.age?.toString() || '');
  const [weight,     setWeight]     = useState(onboardingData.weight?.toString() || '');
  const [height,     setHeight]     = useState(onboardingData.height?.toString() || '');
  const [experience, setExperience] = useState(onboardingData.experience || 'Intermediate');
  const [bmi,        setBmi]        = useState(null);

  useEffect(() => {
    setBmi(calcBMI(weight, height));
  }, [weight, height]);

  const canProceed = age && weight && height && experience;

  const handleNext = () => {
    updateOnboardingData({
      age:        parseInt(age),
      weight:     parseFloat(weight),
      height:     parseFloat(height),
      bmi:        parseFloat(bmi) || null,
      experience,
    });
    navigation.navigate('Equipment');
  };

  return (
    <OnboardingLayout
      step={2}
      title="Your stats"
      subtitle="Used to calculate BMI and personalise your plan."
      onNext={handleNext}
      onBack={() => navigation.goBack()}
      nextDisabled={!canProceed}
    >
      {/* AGE */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>AGE</Text>
        <TextInput
          style={styles.input}
          placeholder="22"
          placeholderTextColor={Colors.textMuted}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
      </View>

      {/* BODYWEIGHT */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>BODYWEIGHT (KG)</Text>
        <TextInput
          style={styles.input}
          placeholder="78"
          placeholderTextColor={Colors.textMuted}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />
      </View>

      {/* HEIGHT */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>HEIGHT (CM)</Text>
        <TextInput
          style={styles.input}
          placeholder="175"
          placeholderTextColor={Colors.textMuted}
          value={height}
          onChangeText={setHeight}
          keyboardType="decimal-pad"
        />
      </View>

      {/* EXPERIENCE LEVEL */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>EXPERIENCE LEVEL</Text>
        <View style={styles.pillRow}>
          {EXPERIENCE_LEVELS.map((level) => {
            const active = experience === level;
            return (
              <TouchableOpacity
                key={level}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setExperience(level)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {level}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 0,
  },

  // Experience level pills
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,      // gray border when inactive
    backgroundColor: 'transparent',
  },
  pillActive: {
    borderColor: Colors.primary,     // orange border only — NO fill
    backgroundColor: 'transparent',
  },
  pillText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,       // white text when inactive
  },
  pillTextActive: {
    color: Colors.primary,           // orange text when active — no black, no fill
  },
});