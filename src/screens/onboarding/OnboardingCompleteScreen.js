// src/screens/onboarding/OnboardingCompleteScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase/client';
import useAuthStore from '../../store/useAuthStore';
import { generateWorkoutPlan } from '../../services/workoutService';
import { Colors, GlobalStyles } from '../../theme';

export default function OnboardingCompleteScreen({ onComplete }) {
  const { user, onboardingData, clearOnboardingData } = useAuthStore();
  const [saving, setSaving] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { saveProfile(); }, []);

  const saveProfile = async () => {
    try {
      const uid = user?.id;
      if (!uid) return;

      let plan;
      if (onboardingData.workoutPath === 'manual' && onboardingData.manualPlan) {
        plan = onboardingData.manualPlan;
      } else {
        plan = generateWorkoutPlan({
          goal: onboardingData.goal,
          equipment: onboardingData.equipment,
          daysPerWeek: onboardingData.daysPerWeek,
          preset: onboardingData.presetTemplate,
        });
      }

      // Save full user profile
      const { error: profileError } = await supabase.from('profiles').update({
        name: onboardingData.name,
        age: onboardingData.age,
        weight: onboardingData.weight,
        height: onboardingData.height,
        bmi: onboardingData.bmi,
        goal: onboardingData.goal,
        equipment: onboardingData.equipment,
        logging_mode: onboardingData.loggingMode,
        diet_budget: onboardingData.dietBudget,
        onboarding_completed: true,
        last_active: new Date().toISOString(),
        // starting_weight is set ONCE at onboarding — never overwritten by weight logs
        starting_weight: onboardingData.weight,
      }).eq('id', uid);

      if (profileError) throw profileError;

      // Save workout template — delete old default first, then insert fresh
      await supabase.from('workout_templates').delete().eq('user_id', uid).eq('is_default', true);

      const { error: tmplError } = await supabase.from('workout_templates').insert({
        user_id: uid,
        name: plan.name,
        type: plan.type,
        days_per_week: plan.daysPerWeek,
        days: plan.days,
        is_default: true,
        created_at: new Date().toISOString(),
      });

      if (tmplError) throw tmplError;

      setSaving(false);
    } catch (e) {
      console.log('Save error:', e);
      setError('Failed to save. Tap retry.');
      setSaving(false);
    }
  };

  const handleStart = () => {
    clearOnboardingData();
    onComplete?.();
  };

  if (saving) {
    return (
      <SafeAreaView style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.savingText}>Setting up your FitRax...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.screen, { justifyContent: 'center', paddingHorizontal: 24 }]}>
        <View style={GlobalStyles.errorBox}>
          <Text style={{ color: Colors.error, fontFamily: 'Outfit_400Regular' }}>{error}</Text>
        </View>
        <TouchableOpacity style={[GlobalStyles.primaryButton, { marginTop: 20 }]} onPress={saveProfile}>
          <Text style={GlobalStyles.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const goalLabels = {
    muscle_gain: 'Muscle Gain 💪', fat_loss: 'Fat Loss 🔥',
    maintain: 'Maintain ⚖️', general: 'General Fitness 🏃',
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.celebEmoji}>🎉</Text>
        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.sub}>Your FitRax is personalised and ready.</Text>

        <View style={[GlobalStyles.card, styles.summaryCard]}>
          <Text style={GlobalStyles.sectionLabel}>YOUR SETUP</Text>
          {[
            { label: 'Goal', value: goalLabels[onboardingData.goal] || onboardingData.goal },
            { label: 'Plan', value: onboardingData.workoutPath === 'manual' ? 'Custom routine ✏️' : onboardingData.workoutPath === 'preset' ? `${onboardingData.presetTemplate} preset` : 'Generated plan ⚡' },
            { label: 'Diet budget', value: `₹${onboardingData.dietBudget}/day` },
            { label: 'Logging', value: onboardingData.loggingMode === 'realtime' ? 'Real-time' : 'After workout' },
          ].map((r) => (
            <View key={r.label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{r.label}</Text>
              <Text style={styles.summaryValue}>{r.value}</Text>
            </View>
          ))}
        </View>

        <View style={[GlobalStyles.greenBox, { marginTop: 14 }]}>
          <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.success, lineHeight: 22 }}>
            ✓ Workout plan saved{'\n'}✓ Diet plan loaded{'\n'}✓ App lock configured{'\n'}✓ Ready to log your first session
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={GlobalStyles.primaryButtonText}>Start using FitRax →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  celebEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 16 },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 30, color: Colors.textPrimary, textAlign: 'center', marginBottom: 10 },
  sub: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  summaryCard: { gap: 0 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryLabel: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSecondary },
  summaryValue: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  savingText: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: Colors.textSecondary, marginTop: 16 },
  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  startBtn: { backgroundColor: Colors.success, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
});