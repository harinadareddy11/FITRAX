// src/screens/workout/EditWorkoutPlanScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase/client';
import useAuthStore from '../../store/useAuthStore';
import { generateWorkoutPlan } from '../../services/workoutService';
import { Colors } from '../../theme';

const GOALS = [
  { key: 'muscle_gain', label: 'Muscle Gain 💪', desc: 'Build size & strength' },
  { key: 'fat_loss',    label: 'Fat Loss 🔥',    desc: 'Burn fat, stay lean' },
  { key: 'maintain',   label: 'Maintain ⚖️',    desc: 'Keep current physique' },
  { key: 'general',    label: 'General Fitness 🏃', desc: 'Overall health' },
];
const DAYS_OPTIONS = [3, 4, 5, 6];

// ── Day-wise Editor ───────────────────────────────────────────
function DayEditor({ day, onChange }) {
  const [editingExIdx, setEditingExIdx] = useState(null);

  const updateExercise = (exIdx, field, value) => {
    const updated = day.exercises.map((ex, i) =>
      i === exIdx ? { ...ex, [field]: value } : ex
    );
    onChange({ ...day, exercises: updated });
  };

  const removeExercise = (exIdx) => {
    const updated = day.exercises.filter((_, i) => i !== exIdx);
    onChange({ ...day, exercises: updated });
  };

  const addExercise = () => {
    const updated = [
      ...day.exercises,
      { name: '', targetSets: 3, targetReps: '8-12', exerciseId: `custom_${Date.now()}` },
    ];
    onChange({ ...day, exercises: updated });
    setEditingExIdx(updated.length - 1);
  };

  return (
    <View style={s.dayBlock}>
      <Text style={s.dayName}>{day.dayName}</Text>
      <Text style={s.dayWorkoutName}>{day.workoutName || day.splitType || ''}</Text>

      {day.exercises.map((ex, i) => (
        <View key={i} style={s.exCard}>
          <View style={s.exCardHeader}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setEditingExIdx(editingExIdx === i ? null : i)}
            >
              <Text style={s.exCardName} numberOfLines={1}>
                {ex.name || <Text style={{ color: '#555' }}>Untitled exercise</Text>}
              </Text>
              <Text style={s.exCardMeta}>
                {ex.targetSets} sets × {ex.targetReps} reps
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.exDeleteBtn}
              onPress={() => {
                Alert.alert('Remove exercise?', ex.name || 'This exercise', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => removeExercise(i) },
                ]);
              }}
            >
              <Text style={s.exDeleteText}>✕</Text>
            </TouchableOpacity>
          </View>

          {editingExIdx === i && (
            <View style={s.exEditFields}>
              <Text style={s.fieldLabel}>EXERCISE NAME</Text>
              <TextInput
                style={s.fieldInput}
                value={ex.name}
                onChangeText={v => updateExercise(i, 'name', v)}
                placeholder="e.g. Bench Press"
                placeholderTextColor="#444"
              />
              <View style={s.fieldsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>SETS</Text>
                  <TextInput
                    style={s.fieldInput}
                    value={String(ex.targetSets)}
                    onChangeText={v => updateExercise(i, 'targetSets', parseInt(v) || 1)}
                    keyboardType="numeric"
                    placeholder="3"
                    placeholderTextColor="#444"
                  />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 2 }}>
                  <Text style={s.fieldLabel}>REPS / TARGET</Text>
                  <TextInput
                    style={s.fieldInput}
                    value={String(ex.targetReps)}
                    onChangeText={v => updateExercise(i, 'targetReps', v)}
                    placeholder="8-12"
                    placeholderTextColor="#444"
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity style={s.addExBtn} onPress={addExercise}>
        <Text style={s.addExBtnText}>+ Add Exercise</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function EditWorkoutPlanScreen({ navigation }) {
  const { user } = useAuthStore();
  const [mode, setMode] = useState('edit'); // 'auto' | 'manual' | 'edit'
  const [goal, setGoal] = useState('muscle_gain');
  const [days, setDays] = useState(4);
  const [equipment, setEquipment] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Day-editor state
  const [templateId, setTemplateId] = useState(null);
  const [planDays, setPlanDays] = useState([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: prof } = await supabase
        .from('profiles').select('goal, equipment').eq('id', user.id).single();
      if (prof) {
        if (prof.goal) setGoal(prof.goal);
        if (prof.equipment?.length) setEquipment(prof.equipment);
      }
      const { data: tmpl } = await supabase
        .from('workout_templates').select('*')
        .eq('user_id', user.id).eq('is_default', true).single();
      if (tmpl) {
        if (tmpl.days_per_week) setDays(Math.min(6, Math.max(3, tmpl.days_per_week)));
        setTemplateId(tmpl.id);
        setPlanDays(tmpl.days || []);
      }
      setLoading(false);
    })();
  }, []);

  // ── Auto generate ──────────────────────────────────────────
  const handleAutoGenerate = async () => {
    setSaving(true);
    try {
      const plan = generateWorkoutPlan({ goal, equipment, daysPerWeek: days });
      await supabase.from('workout_templates')
        .delete().eq('user_id', user.id).eq('is_default', true);
      const { error } = await supabase.from('workout_templates').insert({
        user_id: user.id,
        name: plan.name,
        type: plan.type,
        days_per_week: plan.daysPerWeek,
        days: plan.days,
        is_default: true,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      Alert.alert(
        '✅ Plan Updated!',
        `Your new "${plan.name}" plan is live. Go to the Workout tab to see it.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Error', 'Could not save plan. Try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Save day-wise edits ────────────────────────────────────
  const handleSaveDayEdits = async () => {
    // Validate: each exercise must have a name
    for (const day of planDays) {
      for (const ex of day.exercises) {
        if (!ex.name?.trim()) {
          Alert.alert('Missing name', `One exercise in ${day.dayName} has no name. Please fill it in.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      if (templateId) {
        // Update existing template
        const { error } = await supabase
          .from('workout_templates')
          .update({ days: planDays, updated_at: new Date().toISOString() })
          .eq('id', templateId);
        if (error) throw error;
      } else {
        // No template yet — create one
        const { error } = await supabase.from('workout_templates').insert({
          user_id: user.id,
          name: 'Custom Plan',
          type: 'custom',
          days_per_week: planDays.length,
          days: planDays,
          is_default: true,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      setDirty(false);
      Alert.alert(
        '✅ Saved!',
        'Your workout plan has been updated. The changes are live in the Workout tab.',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Error', 'Could not save changes. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleManualBuild = () => {
    navigation.navigate('ManualPlanBuilder', { fromProfile: true });
  };

  const updateDay = (idx, updatedDay) => {
    const newDays = planDays.map((d, i) => (i === idx ? updatedDay : d));
    setPlanDays(newDays);
    setDirty(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const currentDay = planDays[selectedDayIdx];

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => {
          if (dirty) {
            Alert.alert('Unsaved changes', 'You have unsaved changes. Discard them?', [
              { text: 'Stay', style: 'cancel' },
              { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
            ]);
          } else {
            navigation.goBack();
          }
        }}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Workout Plan</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Mode tabs */}
      <View style={s.modeTabs}>
        {[
          ['edit', '✏️ Edit Days'],
          ['auto', '⚡ Auto'],
          ['manual', '🛠 Manual'],
        ].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[s.modeTab, mode === key && s.modeTabActive]}
            onPress={() => setMode(key)}
          >
            <Text style={[s.modeTabText, mode === key && s.modeTabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── EDIT DAYS MODE ── */}
      {mode === 'edit' && (
        <>
          {planDays.length === 0 ? (
            <View style={s.emptyPlan}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyTitle}>No plan yet</Text>
              <Text style={s.emptySub}>Generate a plan first using Auto or Manual mode, then come back here to edit days.</Text>
            </View>
          ) : (
            <>
              {/* Day tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.dayTabsScroll}
                contentContainerStyle={s.dayTabsContent}
              >
                {planDays.map((d, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.dayTab, selectedDayIdx === i && s.dayTabActive]}
                    onPress={() => setSelectedDayIdx(i)}
                  >
                    <Text style={[s.dayTabText, selectedDayIdx === i && s.dayTabTextActive]}>
                      {d.dayName?.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Editor for selected day */}
              <ScrollView
                contentContainerStyle={s.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {currentDay && (
                  <DayEditor
                    key={selectedDayIdx}
                    day={currentDay}
                    onChange={(updated) => updateDay(selectedDayIdx, updated)}
                  />
                )}

                {/* Save button */}
                <TouchableOpacity
                  style={[s.saveBtn, (!dirty || saving) && s.saveBtnDisabled]}
                  onPress={handleSaveDayEdits}
                  disabled={!dirty || saving}
                >
                  {saving
                    ? <ActivityIndicator color="#000" />
                    : <Text style={s.saveBtnText}>
                        {dirty ? 'Save Changes →' : 'No Changes'}
                      </Text>}
                </TouchableOpacity>

                {dirty && (
                  <Text style={s.dirtyHint}>
                    💡 Unsaved changes — tap Save to apply them to your workout
                  </Text>
                )}
              </ScrollView>
            </>
          )}
        </>
      )}

      {/* ── AUTO MODE ── */}
      {mode === 'auto' && (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.sectionLabel}>YOUR GOAL</Text>
          {GOALS.map(g => (
            <TouchableOpacity
              key={g.key}
              style={[s.goalCard, goal === g.key && s.goalActive]}
              onPress={() => setGoal(g.key)}
              activeOpacity={0.8}
            >
              <Text style={s.goalLabel}>{g.label}</Text>
              <Text style={s.goalDesc}>{g.desc}</Text>
              {goal === g.key && <View style={s.checkBadge}><Text style={s.checkText}>✓</Text></View>}
            </TouchableOpacity>
          ))}

          <Text style={[s.sectionLabel, { marginTop: 24 }]}>DAYS PER WEEK</Text>
          <View style={s.daysRow}>
            {DAYS_OPTIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[s.dayPill, days === d && s.dayPillActive]}
                onPress={() => setDays(d)}
              >
                <Text style={[s.dayPillText, days === d && s.dayPillTextActive]}>{d}</Text>
                <Text style={[s.dayPillSub, days === d && { color: Colors.primary }]}>days</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.previewBox}>
            <Text style={s.previewText}>
              {days <= 3 ? '📦 Full Body' : days === 4 ? '🔄 Upper / Lower Split' : '🔁 Push / Pull / Legs'} plan
              {'  ·  '}{days}x per week{'  ·  '}tailored for {GOALS.find(g => g.key === goal)?.label}
            </Text>
          </View>

          {!!equipment.length && (
            <Text style={s.equipNote}>
              🏋️ Using your saved equipment: {equipment.slice(0, 2).join(', ')}{equipment.length > 2 ? ` +${equipment.length - 2} more` : ''}
            </Text>
          )}

          <TouchableOpacity
            style={[s.generateBtn, saving && { opacity: 0.6 }]}
            onPress={handleAutoGenerate}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#000" />
              : <Text style={s.generateBtnText}>Generate New Plan →</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── MANUAL MODE ── */}
      {mode === 'manual' && (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.manualContainer}>
            <Text style={s.manualIcon}>🛠</Text>
            <Text style={s.manualTitle}>Build Your Own Routine</Text>
            <Text style={s.manualDesc}>
              Design a fully custom plan — pick any split, choose your exercises, and set your own sets & reps.
            </Text>
            <View style={s.manualSteps}>
              {[
                'Add workout days (Monday, Wednesday…)',
                'Choose split type (Push/Pull/Legs, Full Body…)',
                'Pick exercises and set sets × reps',
                'Save — your plan updates instantly',
              ].map((step, i) => (
                <View key={i} style={s.manualStep}>
                  <View style={s.stepDot}><Text style={s.stepNum}>{i + 1}</Text></View>
                  <Text style={s.stepText}>{step}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={s.generateBtn} onPress={handleManualBuild}>
              <Text style={s.generateBtnText}>Open Plan Builder →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D0D0D' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  back: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#888', width: 48 },
  headerTitle: { fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#FFF' },
  modeTabs: {
    flexDirection: 'row', margin: 16,
    backgroundColor: '#1A1A1A', borderRadius: 12, padding: 4,
  },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  modeTabActive: { backgroundColor: Colors.primary },
  modeTabText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#666' },
  modeTabTextActive: { color: '#000' },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  // ── Edit Days ──
  emptyPlan: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 60 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#FFF', marginBottom: 10 },
  emptySub: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },

  dayTabsScroll: { maxHeight: 56 },
  dayTabsContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  dayTab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#1A1A1A',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  dayTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayTabText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#666' },
  dayTabTextActive: { color: '#000' },

  dayBlock: { paddingTop: 16 },
  dayName: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#FFF', marginBottom: 2 },
  dayWorkoutName: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.primary, marginBottom: 16 },

  exCard: {
    backgroundColor: '#161618', borderRadius: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#2A2A2A', overflow: 'hidden',
  },
  exCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  exCardName: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#FFF', marginBottom: 2 },
  exCardMeta: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#666' },
  exDeleteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#2A1515', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#3A2020',
  },
  exDeleteText: { color: '#E74C3C', fontSize: 13 },

  exEditFields: {
    backgroundColor: '#111', paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4,
    borderTopWidth: 1, borderTopColor: '#2A2A2A',
  },
  fieldsRow: { flexDirection: 'row', marginTop: 4 },
  fieldLabel: {
    fontFamily: 'Outfit_600SemiBold', fontSize: 10, color: '#555',
    letterSpacing: 1.2, marginTop: 10, marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#1A1A1A', color: '#FFF', borderRadius: 8,
    padding: 12, fontFamily: 'Outfit_400Regular', fontSize: 14,
    borderWidth: 1, borderColor: '#2A2A2A',
  },

  addExBtn: {
    borderWidth: 1.5, borderColor: Colors.primary,
    borderStyle: 'dashed', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
    backgroundColor: 'rgba(230,92,0,0.05)', marginTop: 6,
  },
  addExBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.primary },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center', marginTop: 28,
  },
  saveBtnDisabled: { backgroundColor: '#2A2A2A' },
  saveBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#000' },
  dirtyHint: {
    fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#666',
    textAlign: 'center', marginTop: 12, lineHeight: 18,
  },

  // ── Auto mode ──
  sectionLabel: {
    fontFamily: 'Outfit_600SemiBold', fontSize: 11, color: '#666',
    letterSpacing: 1.5, marginBottom: 12,
  },
  goalCard: {
    backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1.5, borderColor: '#2A2A2A', position: 'relative',
  },
  goalActive: { borderColor: Colors.primary, backgroundColor: 'rgba(230,92,0,0.08)' },
  goalLabel: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#FFF', marginBottom: 4 },
  goalDesc: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#888' },
  checkBadge: {
    position: 'absolute', top: 12, right: 12,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  checkText: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: '#000' },
  daysRow: { flexDirection: 'row', gap: 10 },
  dayPill: {
    flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12,
    alignItems: 'center', paddingVertical: 16,
    borderWidth: 1.5, borderColor: '#2A2A2A',
  },
  dayPillActive: { borderColor: Colors.primary, backgroundColor: 'rgba(230,92,0,0.1)' },
  dayPillText: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: '#FFF' },
  dayPillTextActive: { color: Colors.primary },
  dayPillSub: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#666', marginTop: 2 },
  previewBox: {
    backgroundColor: 'rgba(230,92,0,0.08)', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: 'rgba(230,92,0,0.2)', marginTop: 16,
  },
  previewText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.primary, lineHeight: 20 },
  equipNote: {
    fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#666',
    marginTop: 10, textAlign: 'center',
  },
  generateBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center', marginTop: 24,
  },
  generateBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#000' },

  // ── Manual mode ──
  manualContainer: { alignItems: 'center', paddingTop: 20 },
  manualIcon: { fontSize: 52, marginBottom: 16 },
  manualTitle: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#FFF', marginBottom: 10 },
  manualDesc: {
    fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#888',
    textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  manualSteps: { alignSelf: 'stretch', marginBottom: 8 },
  manualStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(230,92,0,0.15)', borderWidth: 1.5,
    borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: Colors.primary },
  stepText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#CCC', flex: 1, lineHeight: 22, paddingTop: 3 },
});
