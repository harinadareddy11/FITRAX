// src/screens/main/DietScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { supabase, mapProfile } from '../../services/supabase/client';
import useAuthStore from '../../store/useAuthStore';
import { getDietPlan } from '../../services/dietService';
import { Colors, GlobalStyles } from '../../theme';

const GOAL_LABELS = {
  muscle_gain: 'Muscle Gain 💪', fat_loss: 'Fat Loss 🔥',
  maintain: 'Maintain ⚖️', general: 'General Fitness 🏃',
};
const MACRO_COLORS = { protein: '#3498DB', carbs: '#E67E22', fat: '#9B59B6' };

export default function DietScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        const p = mapProfile(data);
        setProfile(p);
        setPlan(getDietPlan(p.goal, p.dietBudget));
      }
    } catch (e) {
      console.log('Diet load error:', e);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  if (!plan) {
    return (
      <SafeAreaView style={[GlobalStyles.screen, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: Colors.textSecondary, fontFamily: 'Outfit_400Regular' }}>Loading diet plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tier = (profile?.dietBudget || 200) <= 150 ? 'Economy' : (profile?.dietBudget || 200) <= 250 ? 'Standard' : 'Premium';

  return (
    <SafeAreaView style={[GlobalStyles.screen, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={GlobalStyles.spaceBetween}>
          <View>
            <Text style={styles.pageTitle}>Diet Plan</Text>
            <Text style={styles.goalLine}>{GOAL_LABELS[profile?.goal] || 'General'}</Text>
          </View>
          <View style={styles.budgetBadge}>
            <Text style={styles.budgetText}>₹{profile?.dietBudget || 200}/day</Text>
            <Text style={styles.tierText}>{tier}</Text>
          </View>
        </View>

        <View style={[GlobalStyles.card, styles.macroCard]}>
          <Text style={GlobalStyles.sectionLabel}>DAILY TARGETS</Text>
          <View style={styles.macroRow}>
            {[
              { label: 'Protein', value: plan.macros.protein, unit: 'g', color: MACRO_COLORS.protein },
              { label: 'Carbs',   value: plan.macros.carbs,   unit: 'g', color: MACRO_COLORS.carbs },
              { label: 'Fat',     value: plan.macros.fat,     unit: 'g', color: MACRO_COLORS.fat },
              { label: 'Calories',value: plan.macros.calories, unit: 'kcal', color: Colors.primary },
            ].map((m) => (
              <View key={m.label} style={styles.macroPill}>
                <Text style={[styles.macroValue, { color: m.color }]}>{m.value}</Text>
                <Text style={styles.macroUnit}>{m.unit}</Text>
                <Text style={styles.macroLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[GlobalStyles.sectionLabel, { marginBottom: 12 }]}>TODAY'S MEALS</Text>
        {plan.meals.map((meal, i) => (
          <View key={i} style={[GlobalStyles.card, styles.mealCard]}>
            <View style={GlobalStyles.spaceBetween}>
              <View style={styles.mealTimeBox}>
                <Text style={styles.mealTime}>{meal.time}</Text>
              </View>
              <Text style={styles.mealCal}>{meal.macros.calories} kcal</Text>
            </View>
            <Text style={styles.mealName}>{meal.name}</Text>
            <View style={styles.itemsList}>
              {meal.items.map((item, j) => (
                <View key={j} style={styles.itemRow}>
                  <View style={styles.itemDot} />
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.mealMacros}>
              {[
                { label: 'P', value: meal.macros.protein, color: MACRO_COLORS.protein },
                { label: 'C', value: meal.macros.carbs,   color: MACRO_COLORS.carbs },
                { label: 'F', value: meal.macros.fat,     color: MACRO_COLORS.fat },
              ].map((m) => (
                <View key={m.label} style={[styles.macroChip, { borderColor: m.color + '40' }]}>
                  <Text style={[styles.macroChipText, { color: m.color }]}>{m.label}: {m.value}g</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={[GlobalStyles.orangeBox, { marginTop: 8 }]}>
          <Text style={styles.noteTitle}>🇮🇳 Why Indian foods?</Text>
          <Text style={styles.noteText}>
            All meal plans use common Indian ingredients available at any local market or mess — eggs, dal, rice, roti, paneer, chicken, curd. No avocado or quinoa. Real food, real budget.
          </Text>
        </View>
        <Text style={styles.changeNote}>Change your budget or goal from the Profile screen to get a different plan.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  pageTitle: { fontFamily: 'Outfit_700Bold', fontSize: 28, color: Colors.textPrimary },
  goalLine: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  budgetBadge: { backgroundColor: '#2A1500', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },
  budgetText: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 16, color: Colors.primary },
  tierText: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  macroCard: { marginTop: 16, marginBottom: 24 },
  macroRow: { flexDirection:'row', flexWrap:'wrap', gap: 10, marginTop: 12 },
  macroPill: { width:'48%', backgroundColor: Colors.bgCardDeep, borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  macroValue: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 20 },
  macroUnit: { fontFamily: 'Outfit_400Regular', fontSize: 10, color: Colors.textSecondary, marginTop: 1 },
  macroLabel: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.textSecondary, marginTop: 3 },
  mealCard: { marginBottom: 12 },
  mealTimeBox: { backgroundColor: Colors.bgCardDeep, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  mealTime: { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: Colors.textSecondary },
  mealCal: { fontFamily: 'SpaceMono_400Regular', fontSize: 13, color: Colors.primary },
  mealName: { fontFamily: 'Outfit_700Bold', fontSize: 17, color: Colors.textPrimary, marginTop: 10, marginBottom: 12 },
  itemsList: { gap: 6, marginBottom: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  itemText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSecondary, flex: 1 },
  mealMacros: { flexDirection: 'row', gap: 8 },
  macroChip: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.bgCardDeep, borderRadius: 20, borderWidth: 1 },
  macroChipText: { fontFamily: 'SpaceMono_400Regular', fontSize: 11 },
  noteTitle: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: Colors.primary, marginBottom: 6 },
  noteText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  changeNote: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 16 },
});