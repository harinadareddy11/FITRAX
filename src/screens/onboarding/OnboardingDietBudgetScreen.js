// src/screens/onboarding/OnboardingDietBudgetScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import OnboardingLayout from './OnboardingLayout';
import useAuthStore from '../../store/useAuthStore';
import { getDietPlan } from '../../services/dietService';
import { Colors, GlobalStyles } from '../../theme';

const STEPS = [100, 150, 200, 250, 300, 350, 400];

export default function OnboardingDietBudgetScreen({ navigation }) {
  const { onboardingData, updateOnboardingData } = useAuthStore();
  const [budget, setBudget] = useState(onboardingData.dietBudget || 200);

  const plan = getDietPlan(onboardingData.goal, budget);

  const tierLabel = budget <= 150 ? 'Economy' : budget <= 250 ? 'Standard' : 'Premium';
  const tierColor = budget <= 150 ? Colors.textSecondary : budget <= 250 ? Colors.primary : Colors.success;

  const handleNext = () => {
    updateOnboardingData({ dietBudget: budget });
    navigation.navigate('LoggingMode');
  };

  return (
    <OnboardingLayout
      step={5}
      title="Daily food budget"
      subtitle="We'll build your meal plan around real Indian foods within this budget."
      onNext={handleNext}
      onBack={() => navigation.goBack()}
    >
      {/* Budget display */}
      <View style={[GlobalStyles.card, styles.budgetCard]}>
        <Text style={styles.budgetLabel}>Daily budget</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={styles.budgetValue}>₹{budget}</Text>
          <Text style={[styles.tierBadge, { color: tierColor }]}>{tierLabel}</Text>
        </View>
        <Text style={styles.budgetSub}>{plan.macros.protein}g protein · {plan.macros.calories} kcal/day</Text>
      </View>

      {/* Slider buttons */}
      <View style={styles.sliderRow}>
        {STEPS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.stepBtn, budget === s && styles.stepBtnActive]}
            onPress={() => setBudget(s)}
          >
            <Text style={[styles.stepText, budget === s && { color: Colors.primary }]}>₹{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Meal preview */}
      <Text style={[GlobalStyles.sectionLabel, { marginTop: 24 }]}>TODAY'S MEAL PREVIEW</Text>
      <View style={{ gap: 10 }}>
        {plan.meals.map((meal, i) => (
          <View key={i} style={[GlobalStyles.card, styles.mealCard]}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTime}>{meal.time}</Text>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealCal}>{meal.macros.calories} kcal</Text>
            </View>
            <Text style={styles.mealItems}>{meal.items.join(' · ')}</Text>
            <Text style={styles.mealMacros}>
              P: {meal.macros.protein}g  C: {meal.macros.carbs}g  F: {meal.macros.fat}g
            </Text>
          </View>
        ))}
      </View>

      <View style={[GlobalStyles.orangeBox, { marginTop: 14 }]}>
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20 }}>
          All Indian food — eggs, dal, rice, roti, paneer, chicken. Change your budget anytime from the Diet screen.
        </Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  budgetCard: { alignItems: 'flex-start', gap: 4, marginBottom: 20 },
  budgetLabel: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSecondary },
  budgetValue: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 36, color: Colors.primary },
  tierBadge: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  budgetSub: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSecondary },
  sliderRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  stepBtn: {
    flex: 1, minWidth: 44, alignItems: 'center',
    paddingVertical: 10, backgroundColor: Colors.bgCard,
    borderRadius: 8, borderWidth: 1.5, borderColor: Colors.border,
  },
  stepBtnActive: { borderColor: Colors.primary, backgroundColor: '#2A1500' },
  stepText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: Colors.textSecondary },
  mealCard: { padding: 12 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  mealTime: { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: Colors.textSecondary, width: 58 },
  mealName: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: Colors.textPrimary, flex: 1 },
  mealCal: { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: Colors.primary },
  mealItems: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  mealMacros: { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 4 },
});