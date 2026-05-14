// src/screens/onboarding/ManualPlanBuilderScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Modal, FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import useAuthStore from '../../store/useAuthStore';
import { supabase } from '../../services/supabase/client';
import exercises from '../../data/exercises.json';
import { toExerciseSlug } from '../../store/useWorkoutStore';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SPLIT_TYPES = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Chest', 'Back', 'Shoulders', 'Arms', 'Custom'];

const MUSCLE_COLORS = {
  chest: '#E65C00', back: '#3498DB', shoulders: '#9B59B6',
  biceps: '#2ECC71', triceps: '#E74C3C', legs: '#F39C12',
  core: '#1ABC9C', glutes: '#E91E63',
};

export default function ManualPlanBuilderScreen({ navigation, route }) {
  const fromProfile = route?.params?.fromProfile === true;
  const { user, updateOnboardingData } = useAuthStore();
  const [days, setDays] = useState([]);
  const [saving, setSaving] = useState(false);
  const [addDayModal, setAddDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [exerciseModal, setExerciseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayName, setSelectedDayName] = useState('Monday');
  const [selectedSplit, setSelectedSplit] = useState('Push');
  const [setsRepsModal, setSetsRepsModal] = useState(false);
  const [pendingExercise, setPendingExercise] = useState(null);
  const [sets, setSets] = useState('4');
  const [reps, setReps] = useState('10');
  // Edit mode
  const [editModal, setEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // { dayIndex, exIndex }
  const [editSets, setEditSets] = useState('');
  const [editReps, setEditReps] = useState('');
  // Custom exercise creation
  const [customModal, setCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState('chest');
  const [customType, setCustomType] = useState('weighted');

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.muscle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddDay = () => {
    if (days.find(d => d.dayName === selectedDayName)) {
      Alert.alert('Day exists', `${selectedDayName} is already added.`);
      return;
    }
    setDays(prev => [...prev, { dayName: selectedDayName, splitType: selectedSplit, exercises: [] }]);
    setAddDayModal(false);
  };

  const handleRemoveDay = (index) => {
    Alert.alert('Remove day?', `Remove ${days[index].dayName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setDays(prev => prev.filter((_, i) => i !== index)) },
    ]);
  };

  const handleAddExercise = (dayIndex) => {
    setSelectedDay(dayIndex);
    setSearchQuery('');
    setExerciseModal(true);
  };

  const handleSelectExercise = (exercise) => {
    setExerciseModal(false);
    setPendingExercise(exercise);
    setSets('4');
    setReps('10');
    setSetsRepsModal(true);
  };

  const handleOpenCustom = () => {
    setExerciseModal(false);
    setCustomName('');
    setCustomMuscle('chest');
    setCustomType('weighted');
    setCustomModal(true);
  };

  const handleConfirmCustom = () => {
    const trimmed = customName.trim();
    if (!trimmed) { Alert.alert('Name required', 'Please enter a name for the exercise.'); return; }
    const customEx = {
      id: toExerciseSlug(trimmed), // stable slug — same name = same ID across sessions
      name: trimmed,
      muscle: customMuscle,
      type: customType,
      difficulty: 'custom',
      isCustom: true,
    };
    setCustomModal(false);
    setPendingExercise(customEx);
    setSets('4');
    setReps('10');
    setSetsRepsModal(true);
  };

  const handleConfirmExercise = () => {
    if (!pendingExercise || selectedDay === null) return;
    if (!sets || !reps) { Alert.alert('Required', 'Please enter sets and reps.'); return; }
    setDays(prev => {
      const updated = [...prev];
      updated[selectedDay] = {
        ...updated[selectedDay],
        exercises: [...updated[selectedDay].exercises, {
          exerciseId: pendingExercise.id,
          name: pendingExercise.name,
          muscle: pendingExercise.muscle,
          targetSets: parseInt(sets) || 4,
          targetReps: reps,
        }],
      };
      return updated;
    });
    setSetsRepsModal(false);
    setPendingExercise(null);
  };

  const handleRemoveExercise = (dayIndex, exIndex) => {
    setDays(prev => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        exercises: updated[dayIndex].exercises.filter((_, i) => i !== exIndex),
      };
      return updated;
    });
  };

  // Open edit modal for existing exercise
  const handleEditExercise = (dayIndex, exIndex) => {
    const ex = days[dayIndex].exercises[exIndex];
    setEditTarget({ dayIndex, exIndex });
    setEditSets(ex.targetSets.toString());
    setEditReps(ex.targetReps.toString());
    setEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editSets || !editReps) { Alert.alert('Required', 'Please enter sets and reps.'); return; }
    const { dayIndex, exIndex } = editTarget;
    setDays(prev => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        exercises: updated[dayIndex].exercises.map((ex, i) =>
          i === exIndex
            ? { ...ex, targetSets: parseInt(editSets) || 4, targetReps: editReps }
            : ex
        ),
      };
      return updated;
    });
    setEditModal(false);
  };

  const handleSave = async () => {
    if (days.length === 0) { Alert.alert('Add at least one day', 'You need at least one workout day.'); return; }

    if (fromProfile) {
      // ── Post-onboarding: save directly to DB ──
      setSaving(true);
      try {
        const plan = { name: 'My Routine', type: 'custom', daysPerWeek: days.length, days };
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
          '✅ Plan Saved!',
          'Your custom routine is now live. The Workout tab will show your updated plan.',
          [{ text: 'Done', onPress: () => navigation.navigate('WorkoutHome') }]
        );
      } catch (e) {
        Alert.alert('Error', 'Could not save plan. Try again.');
      } finally {
        setSaving(false);
      }
    } else {
      // ── Onboarding: store in local state and continue ──
      updateOnboardingData({
        workoutPath: 'manual',
        manualPlan: { name: 'My Routine', type: 'custom', daysPerWeek: days.length, days },
      });
      navigation.navigate('DietBudget');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{fromProfile ? 'Edit My Routine' : 'Build Your Routine'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#E65C00" size="small" />
            : <Text style={styles.saveText}>{fromProfile ? 'Save' : 'Save →'}</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>My Workout Plan</Text>
        <Text style={styles.pageSub}>Add days and exercises. Tap any exercise to edit sets/reps.</Text>

        {days.map((day, dayIndex) => (
          <View key={dayIndex} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <View style={styles.dayTag}>
                <Text style={styles.dayTagText}>{day.splitType.toUpperCase()}</Text>
              </View>
              <Text style={styles.dayName}>{day.dayName}</Text>
              <TouchableOpacity onPress={() => handleRemoveDay(dayIndex)}>
                <Text style={styles.removeDay}>✕</Text>
              </TouchableOpacity>
            </View>

            {day.exercises.map((ex, exIndex) => (
              <TouchableOpacity
                key={exIndex}
                style={styles.exerciseRow}
                onPress={() => handleEditExercise(dayIndex, exIndex)}
                activeOpacity={0.7}
              >
                <View style={[styles.muscleDot, { backgroundColor: MUSCLE_COLORS[ex.muscle] || '#E65C00' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exMuscle}>{ex.muscle}</Text>
                </View>
                <View style={styles.exSetsWrap}>
                  <Text style={styles.exSets}>{ex.targetSets}×{ex.targetReps}</Text>
                  <Text style={styles.editHint}>tap to edit</Text>
                </View>
                <TouchableOpacity style={styles.removeExBtn} onPress={() => handleRemoveExercise(dayIndex, exIndex)}>
                  <Text style={styles.removeExText}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.addExBtn} onPress={() => handleAddExercise(dayIndex)}>
              <Text style={styles.addExText}>+ Add Exercise</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addDayBtn}
          onPress={() => {
            setSelectedDayName(DAY_NAMES.find(d => !days.find(x => x.dayName === d)) || 'Monday');
            setSelectedSplit('Push');
            setAddDayModal(true);
          }}
        >
          <Text style={styles.addDayIcon}>+</Text>
          <Text style={styles.addDayText}>Add Workout Day</Text>
        </TouchableOpacity>

        {days.length === 0 && (
          <View style={styles.emptyHint}>
            <Text style={styles.emptyHintText}>
              Tap "Add Workout Day" to start. Add Push, Pull, Legs or any custom split you follow.
            </Text>
          </View>
        )}
      </ScrollView>

      {days.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.saveBtnText}>{fromProfile ? 'Save Plan ✓' : 'Save Plan & Continue →'}</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* ── ADD DAY MODAL ──────────────────────────────────── */}
      <Modal visible={addDayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Workout Day</Text>

            <Text style={styles.modalLabel}>DAY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {DAY_NAMES.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chipBtn, selectedDayName === d && styles.chipBtnActive]}
                    onPress={() => setSelectedDayName(d)}
                  >
                    <Text style={[styles.chipText, selectedDayName === d && { color: '#E65C00' }]}>{d.slice(0, 3)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.modalLabel}>SPLIT TYPE</Text>
            <View style={styles.splitGrid}>
              {SPLIT_TYPES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chipBtn, selectedSplit === s && styles.chipBtnActive]}
                  onPress={() => setSelectedSplit(s)}
                >
                  <Text style={[styles.chipText, selectedSplit === s && { color: '#E65C00' }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.orangeBtn} onPress={handleAddDay}>
              <Text style={styles.orangeBtnText}>Add {selectedDayName} — {selectedSplit}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddDayModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── EXERCISE PICKER MODAL ──────────────────────────── */}
      <Modal visible={exerciseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <Text style={styles.modalTitle}>
              Add Exercise{selectedDay !== null ? ` — ${days[selectedDay]?.dayName}` : ''}
            </Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or muscle..."
              placeholderTextColor="#555555"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <FlatList
              data={filteredExercises}
              keyExtractor={item => item.id}
              style={{ maxHeight: 280 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🔍</Text>
                  <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#888', marginBottom: 4 }}>
                    No matches found
                  </Text>
                  <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#555', textAlign: 'center' }}>
                    Try a different name, or create a custom exercise below
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.exerciseItem} onPress={() => handleSelectExercise(item)}>
                  <View style={[styles.muscleDot, { backgroundColor: MUSCLE_COLORS[item.muscle] || '#E65C00' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseItemName}>{item.name}</Text>
                    <Text style={styles.exerciseItemMuscle}>{item.muscle} · {item.difficulty}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListFooterComponent={
                <TouchableOpacity style={styles.createCustomBtn} onPress={handleOpenCustom}>
                  <Text style={styles.createCustomIcon}>✏️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.createCustomTitle}>Create Custom Exercise</Text>
                    <Text style={styles.createCustomSub}>Can't find it? Add your own</Text>
                  </View>
                  <Text style={styles.createCustomArrow}>→</Text>
                </TouchableOpacity>
              }
            />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setExerciseModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── SETS & REPS MODAL (free input) ─────────────────── */}
      <Modal visible={setsRepsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{pendingExercise?.name}</Text>
            <Text style={styles.modalSub}>{pendingExercise?.muscle}</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputField}>
                <Text style={styles.modalLabel}>SETS</Text>
                <TextInput
                  style={styles.numberInput}
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="numeric"
                  placeholder="e.g. 4"
                  placeholderTextColor="#555555"
                  maxLength={2}
                />
              </View>
              <View style={styles.inputDivider} />
              <View style={styles.inputField}>
                <Text style={styles.modalLabel}>REPS</Text>
                <TextInput
                  style={styles.numberInput}
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="default"
                  placeholder="e.g. 10 or 8-12"
                  placeholderTextColor="#555555"
                  maxLength={10}
                />
              </View>
            </View>

            <Text style={styles.inputHint}>You can type a range like "8-12" or "10-15" for reps</Text>

            <TouchableOpacity
              style={[styles.orangeBtn, (!sets || !reps) && { opacity: 0.4 }]}
              onPress={handleConfirmExercise}
              disabled={!sets || !reps}
            >
              <Text style={styles.orangeBtnText}>
                Add — {sets || '?'} sets × {reps || '?'} reps
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSetsRepsModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── EDIT SETS/REPS MODAL ───────────────────────────── */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {editTarget !== null && (
              <Text style={styles.modalTitle}>
                {days[editTarget.dayIndex]?.exercises[editTarget.exIndex]?.name}
              </Text>
            )}
            <Text style={styles.modalSub}>Edit sets and reps</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputField}>
                <Text style={styles.modalLabel}>SETS</Text>
                <TextInput
                  style={styles.numberInput}
                  value={editSets}
                  onChangeText={setEditSets}
                  keyboardType="numeric"
                  placeholder="e.g. 4"
                  placeholderTextColor="#555555"
                  maxLength={2}
                  autoFocus
                />
              </View>
              <View style={styles.inputDivider} />
              <View style={styles.inputField}>
                <Text style={styles.modalLabel}>REPS</Text>
                <TextInput
                  style={styles.numberInput}
                  value={editReps}
                  onChangeText={setEditReps}
                  keyboardType="default"
                  placeholder="e.g. 10 or 8-12"
                  placeholderTextColor="#555555"
                  maxLength={10}
                />
              </View>
            </View>

            <Text style={styles.inputHint}>Type a range like "8-12" or a fixed number like "10"</Text>

            <TouchableOpacity style={styles.orangeBtn} onPress={handleSaveEdit}>
              <Text style={styles.orangeBtnText}>Save Changes</Text>
            </TouchableOpacity>

            {/* Delete exercise option */}
            {editTarget !== null && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  handleRemoveExercise(editTarget.dayIndex, editTarget.exIndex);
                  setEditModal(false);
                }}
              >
                <Text style={styles.deleteBtnText}>Remove this exercise</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ── CUSTOM EXERCISE MODAL ──────────────────────────── */}
      <Modal visible={customModal} transparent animationType="slide" onRequestClose={() => setCustomModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Create Custom Exercise</Text>
              <Text style={styles.modalSub}>Name it, pick a muscle group and type</Text>

              {/* Name input */}
              <Text style={styles.modalLabel}>EXERCISE NAME</Text>
              <TextInput
                style={[styles.searchInput, { marginBottom: 18 }]}
                placeholder="e.g. Incline Bench Press"
                placeholderTextColor="#555"
                value={customName}
                onChangeText={setCustomName}
                autoFocus
                maxLength={60}
              />

              {/* Muscle group picker */}
              <Text style={styles.modalLabel}>MUSCLE GROUP</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {Object.keys(MUSCLE_COLORS).map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.chipBtn, customMuscle === m && styles.chipBtnActive]}
                      onPress={() => setCustomMuscle(m)}
                    >
                      <Text style={[styles.chipText, customMuscle === m && { color: '#E65C00' }]}>
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Type picker */}
              <Text style={styles.modalLabel}>EXERCISE TYPE</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 22 }}>
                {[['weighted', '🏋️ Weighted'], ['bodyweight', '💪 Bodyweight'], ['timed', '⏱ Timed']].map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.chipBtn, { flex: 1, alignItems: 'center' }, customType === key && styles.chipBtnActive]}
                    onPress={() => setCustomType(key)}
                  >
                    <Text style={[styles.chipText, customType === key && { color: '#E65C00' }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.orangeBtn, !customName.trim() && { opacity: 0.4 }]}
                onPress={handleConfirmCustom}
                disabled={!customName.trim()}
              >
                <Text style={styles.orangeBtnText}>Continue — Set Sets & Reps →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCustomModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D0D0D' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  backText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#888888' },
  headerTitle: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#FFFFFF' },
  saveText: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#E65C00' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  pageTitle: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: '#FFFFFF', marginBottom: 6 },
  pageSub: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#888888', marginBottom: 24, lineHeight: 20 },
  dayCard: {
    backgroundColor: '#1A1A1A', borderRadius: 14,
    padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  dayTag: {
    backgroundColor: '#2A1500', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  dayTagText: { fontFamily: 'Outfit_700Bold', fontSize: 11, color: '#E65C00', letterSpacing: 1 },
  dayName: { fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#FFFFFF', flex: 1 },
  removeDay: { fontSize: 18, color: '#555555' },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: '#252525',
  },
  muscleDot: { width: 10, height: 10, borderRadius: 5 },
  exName: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  exMuscle: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#666666', marginTop: 2 },
  exSetsWrap: { alignItems: 'flex-end' },
  exSets: { fontFamily: 'SpaceMono_400Regular', fontSize: 13, color: '#E65C00' },
  editHint: { fontFamily: 'Outfit_400Regular', fontSize: 10, color: '#444444', marginTop: 2 },
  removeExBtn: { padding: 6 },
  removeExText: { fontSize: 14, color: '#444444' },
  addExBtn: {
    marginTop: 10, borderWidth: 1, borderColor: '#2A2A2A',
    borderRadius: 8, paddingVertical: 10, alignItems: 'center',
    borderStyle: 'dashed',
  },
  addExText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#E65C00' },
  addDayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#1A1A1A',
    borderRadius: 14, padding: 18, marginBottom: 16,
    borderWidth: 1.5, borderColor: '#E65C00', borderStyle: 'dashed',
  },
  addDayIcon: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#E65C00' },
  addDayText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#E65C00' },
  emptyHint: {
    backgroundColor: '#1A1A1A', borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: '#2A2A2A',
  },
  emptyHintText: {
    fontFamily: 'Outfit_400Regular', fontSize: 13,
    color: '#666666', lineHeight: 20, textAlign: 'center',
  },
  footer: { paddingHorizontal: 20, paddingBottom: 28 },
  saveBtn: {
    backgroundColor: '#E65C00', borderRadius: 12,
    paddingVertical: 18, alignItems: 'center',
  },
  saveBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#FFFFFF' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 36,
    borderTopWidth: 1, borderColor: '#2A2A2A',
  },
  modalTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#FFFFFF', marginBottom: 4 },
  modalSub: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#888888', marginBottom: 16 },
  modalLabel: {
    fontFamily: 'Outfit_600SemiBold', fontSize: 11,
    color: '#666666', letterSpacing: 1.5, marginBottom: 8,
  },
  chipBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#111111', borderRadius: 20,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  chipBtnActive: { borderColor: '#E65C00', backgroundColor: '#2A1500' },
  chipText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#888888' },
  splitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  searchInput: {
    backgroundColor: '#111111', borderRadius: 10,
    borderWidth: 1, borderColor: '#2A2A2A',
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: 'Outfit_400Regular', fontSize: 15,
    color: '#FFFFFF', marginBottom: 14,
  },
  exerciseItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222222',
  },
  exerciseItemName: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  exerciseItemMuscle: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#666666', marginTop: 2 },
  // Free input sets/reps
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  inputField: { flex: 1 },
  inputDivider: { width: 1, height: 50, backgroundColor: '#2A2A2A' },
  numberInput: {
    backgroundColor: '#111111', borderRadius: 10,
    borderWidth: 1, borderColor: '#2A2A2A',
    paddingHorizontal: 14, paddingVertical: 14,
    fontFamily: 'Outfit_700Bold', fontSize: 20,
    color: '#E65C00', textAlign: 'center',
  },
  inputHint: {
    fontFamily: 'Outfit_400Regular', fontSize: 12,
    color: '#444444', marginBottom: 20, textAlign: 'center',
  },
  orangeBtn: {
    backgroundColor: '#E65C00', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginBottom: 10,
  },
  orangeBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#FFFFFF' },
  deleteBtn: {
    borderWidth: 1, borderColor: '#4A1A1A', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', marginBottom: 8,
  },
  deleteBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#E74C3C' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#666666' },
  // Custom exercise creation button (inside FlatList footer)
  createCustomBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 8, padding: 14,
    backgroundColor: 'rgba(230,92,0,0.08)',
    borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(230,92,0,0.35)',
    borderStyle: 'dashed',
  },
  createCustomIcon: { fontSize: 20 },
  createCustomTitle: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#E65C00' },
  createCustomSub: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#888', marginTop: 2 },
  createCustomArrow: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#E65C00' },
});