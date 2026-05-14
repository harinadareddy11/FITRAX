// src/screens/workout/ActiveWorkoutScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, Vibration, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import useWorkoutStore from '../../store/useWorkoutStore';
import useAuthStore from '../../store/useAuthStore';
import { saveSession, getWeightSuggestion } from '../../services/workoutService';
import { queueSession } from '../../services/offlineQueue';
import { format } from 'date-fns';
import { parseTargetSeconds, formatSeconds, getSetDoneLabel, getSetPendingLabel } from '../../utils/exerciseTypes';
import exercises from '../../data/exercises.json';
import { toExerciseSlug } from '../../store/useWorkoutStore';

// Using your original colors object to keep it exactly how you had it
const Colors = {
  primary: '#E65C00', textPrimary: '#FFF', textSecondary: '#888', textMuted: '#666',
  bgCard: '#161618', bgCardDeep: '#1C1C1E', border: '#2C2C2E', success: '#2ECC71', successBg: '#0D2E1A'
};

const REST_DURATIONS = [60, 90, 120];

export default function ActiveWorkoutScreen({ navigation }) {
  const { user, userProfile } = useAuthStore();
  const { activeSession, sessionExercises, sessionStartTime, logSet, addSet, addExercise, clearSession } = useWorkoutStore();
  
  // Your original logging modes
  const loggingMode = userProfile?.loggingMode || 'after';
  const isRealtime = loggingMode === 'realtime';

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [logModal, setLogModal] = useState({ visible: false, exerciseIndex: 0, setIndex: 0 });
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [elapsedMin, setElapsedMin] = useState(0); // live timer

  // ── Add-exercise-during-workout picker state ──
  const [addExModal, setAddExModal] = useState(false);
  const [addExSearch, setAddExSearch] = useState('');
  const [addExCustomModal, setAddExCustomModal] = useState(false);
  const [addExCustomName, setAddExCustomName] = useState('');
  const [addExCustomMuscle, setAddExCustomMuscle] = useState('chest');
  const [addExCustomType, setAddExCustomType] = useState('weighted');

  const MUSCLE_COLORS = {
    chest: '#E65C00', back: '#3498DB', shoulders: '#9B59B6',
    biceps: '#2ECC71', triceps: '#E74C3C', legs: '#F39C12',
    core: '#1ABC9C', glutes: '#E91E63',
  };

  const filteredAddEx = exercises.filter(ex =>
    ex.name.toLowerCase().includes(addExSearch.toLowerCase()) ||
    ex.muscle.toLowerCase().includes(addExSearch.toLowerCase())
  );

  // Rest timer (between sets)
  const [restDuration, setRestDuration] = useState(90);
  const [restRemaining, setRestRemaining] = useState(null);
  const timerRef = useRef(null);

  // Exercise hold timer (for timed exercises like plank)
  const [holdElapsed, setHoldElapsed] = useState(0);    // seconds elapsed
  const [holdTarget, setHoldTarget] = useState(60);     // target seconds
  const [holdRunning, setHoldRunning] = useState(false);
  const [holdDone, setHoldDone] = useState(false);      // reached target
  const holdTimerRef = useRef(null);

  const currentEx = sessionExercises[currentExerciseIndex];

  // Load weight suggestion
  useEffect(() => {
    if (!currentEx) return;
    getWeightSuggestion(user?.id, currentEx.exerciseId).then(setSuggestion);
  }, [currentExerciseIndex]);

  // Live elapsed timer — updates every 30s is enough, but 10s feels more alive
  useEffect(() => {
    const update = () => {
      if (sessionStartTime) {
        setElapsedMin(Math.floor((Date.now() - sessionStartTime) / 60000));
      }
    };
    update(); // immediate first tick
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [sessionStartTime]);

  // Rest timer logic
  useEffect(() => {
    if (restRemaining === null) return;
    if (restRemaining <= 0) {
      Vibration.vibrate([200, 100, 200, 100, 400]);
      setRestRemaining(null);
      return;
    }
    timerRef.current = setTimeout(() => setRestRemaining(r => r - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [restRemaining]);

  // Hold timer effect — counts up every second
  useEffect(() => {
    if (!holdRunning) return;
    holdTimerRef.current = setTimeout(() => {
      setHoldElapsed(e => {
        const next = e + 1;
        if (next >= holdTarget && !holdDone) {
          setHoldDone(true);
          Vibration.vibrate([300, 100, 300, 100, 500]);
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(holdTimerRef.current);
  }, [holdRunning, holdElapsed]);

  const resetHoldTimer = () => {
    setHoldElapsed(0);
    setHoldRunning(false);
    setHoldDone(false);
    clearTimeout(holdTimerRef.current);
  };

  // ── Add-during-workout handlers ──────────────────────────────
  const handlePickAddEx = (ex) => {
    addExercise(ex);
    setAddExModal(false);
    setAddExSearch('');
    // Jump to the newly added exercise
    setCurrentExerciseIndex(sessionExercises.length); // will be the new last index after state updates
  };

  const handleConfirmAddCustom = () => {
    const trimmed = addExCustomName.trim();
    if (!trimmed) { Alert.alert('Name required', 'Please enter an exercise name.'); return; }
    addExercise({
      id: toExerciseSlug(trimmed),
      name: trimmed,
      muscle: addExCustomMuscle,
      type: addExCustomType,
      isCustom: true,
    });
    setAddExCustomModal(false);
    setAddExCustomName('');
    setAddExModal(false);
    setAddExSearch('');
    setCurrentExerciseIndex(sessionExercises.length);
  };

  const openLogModal = (exerciseIndex, setIndex) => {
    const ex = sessionExercises[exerciseIndex];
    // Reset hold timer state for new set
    resetHoldTimer();
    if (ex?.type === 'timed') {
      // Parse target from plan (e.g. "60", "60s", "1:30")
      const target = parseTargetSeconds(ex.targetReps);
      setHoldTarget(target);
      setHoldElapsed(0);
    } else {
      const lastKg = ex?.sets[setIndex]?.kg || '';
      setWeight(lastKg || suggestion?.kg?.toString() || '');
      setReps(ex?.sets[setIndex]?.reps || '');
    }
    setLogModal({ visible: true, exerciseIndex, setIndex });
  };

  const closeLogModal = () => {
    resetHoldTimer();
    setLogModal({ ...logModal, visible: false });
    setWeight('');
    setReps('');
  };

  const handleLogSet = () => {
    const ex = sessionExercises[logModal.exerciseIndex];
    const type = ex?.type || 'weighted';

    if (type === 'timed') {
      if (holdElapsed < 1) return; // must have held at least 1 second
      logSet({ exerciseIndex: logModal.exerciseIndex, setIndex: logModal.setIndex, reps: String(holdElapsed), seconds: holdElapsed });
    } else if (type === 'bodyweight') {
      if (!reps) return;
      logSet({ exerciseIndex: logModal.exerciseIndex, setIndex: logModal.setIndex, kg: 'bw', reps });
    } else {
      if (!weight || !reps) return;
      logSet({ exerciseIndex: logModal.exerciseIndex, setIndex: logModal.setIndex, kg: weight, reps });
    }

    closeLogModal();
    if (isRealtime && type !== 'timed') setRestRemaining(restDuration);
  };

  const handleFinish = () => {
    Alert.alert('Finish workout?', 'Your session will be saved and your streak updated.', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Finish & Save',
        onPress: async () => {
          setSaving(true);
          try {
            const duration = Math.round((Date.now() - sessionStartTime) / 60000) || 1;
            const today = format(new Date(), 'yyyy-MM-dd');
            const sessionId = `${today}_${Date.now()}`;
            const totalVolumeKg = sessionExercises.reduce((t, ex) =>
              t + ex.sets.reduce((s, set) =>
                s + (set.done ? (parseFloat(set.kg)||0) * (parseInt(set.reps)||0) : 0), 0), 0);

            const payload = {
              sessionId,
              date: today,
              dayName: activeSession?.dayName,
              splitType: activeSession?.splitType,
              exercises: sessionExercises,
              totalVolumeKg: Math.round(totalVolumeKg),
              duration,
              loggingMode,
            };

            let streakResult = null;
            try {
              const result = await saveSession(user.id, { ...payload, templateId: activeSession?.templateId });
              streakResult = result.streakResult;
            } catch (networkErr) {
              // Offline fallback — save to local queue
              await queueSession(payload);
              clearSession();
              Alert.alert(
                '💾 Saved Offline',
                'No internet detected. Your workout is saved and will sync automatically when you reconnect.',
                [{ text: 'OK', onPress: () => navigation.replace('WorkoutHome') }]
              );
              return;
            }

            const sessionData = {
              date: today,
              splitType: activeSession?.splitType,
              exercises: sessionExercises,
              duration,
              totalVolumeKg: Math.round(totalVolumeKg),
            };
            clearSession();
            navigation.replace('WorkoutSummary', { sessionData, streakResult });
            
          } catch (e) {
            Alert.alert('Error', 'Could not save session. Check your connection.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const handleBack = () => {
    Alert.alert('Discard workout?', 'Your progress won\'t be saved.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { clearSession(); navigation.goBack(); } },
    ]);
  };

  if (!activeSession || !currentEx) {
    return (
      <SafeAreaView style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.textSecondary, fontFamily: 'Outfit_400Regular' }}>No active workout</Text>
      </SafeAreaView>
    );
  }

  const isFirstSession = !suggestion;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.cancelText}>✕ Cancel</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{activeSession.splitType}</Text>
          <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 1 }}>
            ⏱ {elapsedMin === 0 ? 'Just started' : `${elapsedMin} min`}
          </Text>
        </View>
        <TouchableOpacity style={[styles.finishBtn, saving && { opacity: 0.5 }]} onPress={handleFinish} disabled={saving}>
          <Text style={styles.finishText}>{saving ? 'Saving...' : 'Finish'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── EXERCISE TITLE ── */}
        <View style={styles.exHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.exName}>{currentEx.name}</Text>
            {isFirstSession && <View style={styles.firstTimeBadge}><Text style={styles.firstTimeText}>First time</Text></View>}
          </View>
        </View>

        {/* ── FIRST SESSION TIP OR SUGGESTION ── */}
        {isFirstSession ? (
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>First session tip</Text>
            <Text style={styles.tipText}>
              No previous data yet. Start with a weight you're comfortable with. After today, we'll suggest progressions based on your performance.
            </Text>
          </View>
        ) : suggestion && (
          <View style={styles.suggestionBox}>
            <Text style={styles.suggestionText}>💡 {suggestion.hint}</Text>
          </View>
        )}

        {/* ── REST TIMER (REALTIME ONLY) ── */}
        {isRealtime && restRemaining !== null && (
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>REST TIMER</Text>
            <Text style={styles.timerNumber}>{Math.floor(restRemaining / 60)}:{(restRemaining % 60).toString().padStart(2, '0')}</Text>
            <View style={styles.timerBar}>
              <View style={[styles.timerFill, { width: `${(restRemaining / restDuration) * 100}%` }]} />
            </View>
            <View style={styles.timerOptions}>
              {REST_DURATIONS.map(d => (
                <TouchableOpacity key={d} style={[styles.timerOptBtn, restDuration === d && styles.timerOptActive]} onPress={() => { setRestDuration(d); setRestRemaining(d); }}>
                  <Text style={[styles.timerOptText, restDuration === d && { color: Colors.primary }]}>{d}s</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.skipTimer} onPress={() => setRestRemaining(null)}>
              <Text style={styles.skipTimerText}>Skip rest →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── EXERCISE TYPE BADGE ── */}
        {currentEx.type === 'timed' && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>⏱ Hold / Timed — no weight needed</Text>
          </View>
        )}
        {currentEx.type === 'bodyweight' && (
          <View style={[styles.typeBadge, { backgroundColor: 'rgba(46,204,113,0.12)', borderColor: 'rgba(46,204,113,0.3)' }]}>
            <Text style={[styles.typeBadgeText, { color: '#2ECC71' }]}>💪 Bodyweight — reps only</Text>
          </View>
        )}

        {/* ── SETS LIST ── */}
        <View style={{ gap: 8, marginTop: 8 }}>
          {currentEx.sets.map((set, si) => (
            <TouchableOpacity
              key={si}
              style={[styles.setRow, set.done && styles.setRowDone]}
              onPress={() => openLogModal(currentExerciseIndex, si)}
              activeOpacity={0.8}
            >
              <Text style={styles.setNum}>{si + 1}</Text>
              <Text style={[styles.setStatus, set.done && { color: Colors.success }]}>
                {set.done
                  ? getSetDoneLabel(set, currentEx.type)
                  : getSetPendingLabel(currentEx.type)}
              </Text>
              {currentEx.type === 'timed' && !set.done && (
                <Text style={styles.targetHint}>Target: {formatSeconds(parseTargetSeconds(currentEx.targetReps))}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(currentExerciseIndex)}>
          <Text style={styles.addSetText}>+ Add set</Text>
        </TouchableOpacity>

        {/* ── NAVIGATION (REALTIME) ── */}
        {isRealtime && (
          <View style={styles.exNav}>
            {currentExerciseIndex > 0 && (
              <TouchableOpacity style={styles.exNavBtn} onPress={() => setCurrentExerciseIndex(i => i - 1)}>
                <Text style={styles.exNavText}>← Previous</Text>
              </TouchableOpacity>
            )}
            {currentExerciseIndex < sessionExercises.length - 1 && (
              <TouchableOpacity style={[styles.exNavBtn, { marginLeft: 'auto' }]} onPress={() => setCurrentExerciseIndex(i => i + 1)}>
                <Text style={styles.exNavText}>Next exercise →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── ALL EXERCISES LIST (AFTER MODE) ── */}
        {!isRealtime && sessionExercises.length > 1 && (
          <>
            <Text style={styles.sectionLabelAfter}>ALL EXERCISES</Text>
            {sessionExercises.map((ex, ei) => (
              <View key={ei} style={[styles.afterExCard, ei === currentExerciseIndex && styles.afterExCardActive]}>
                <TouchableOpacity onPress={() => setCurrentExerciseIndex(ei)}>
                  <Text style={[styles.afterExName, ei === currentExerciseIndex && { color: Colors.primary }]}>{ex.name}</Text>
                  <Text style={styles.afterExCount}>{ex.sets.filter(s => s.done).length}/{ex.sets.length} sets logged</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* ── ADD EXERCISE BUTTON ── */}
        <TouchableOpacity style={styles.addExerciseBtn} onPress={() => { setAddExModal(true); setAddExSearch(''); }}>
          <Text style={styles.addExerciseBtnText}>+ Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── LOGGING MODAL ── */}
      <Modal visible={logModal.visible} transparent animationType="slide" onRequestClose={closeLogModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{currentEx.name}</Text>
            <Text style={styles.modalSub}>Set {logModal.setIndex + 1}</Text>

            {/* ── TIMED EXERCISE UI ── */}
            {currentEx.type === 'timed' && (
              <View style={styles.timerModalBody}>
                {/* Target */}
                <Text style={styles.timerModalTarget}>Target: {formatSeconds(holdTarget)}</Text>

                {/* Elapsed display */}
                <Text style={[
                  styles.timerModalElapsed,
                  holdElapsed >= holdTarget && { color: Colors.success },
                ]}>
                  {formatSeconds(holdElapsed)}
                </Text>

                {/* Progress bar */}
                <View style={styles.timerModalBar}>
                  <View style={[styles.timerModalFill, {
                    width: `${Math.min((holdElapsed / holdTarget) * 100, 100)}%`,
                    backgroundColor: holdElapsed >= holdTarget ? Colors.success : Colors.primary,
                  }]} />
                </View>

                {holdDone && (
                  <Text style={styles.timerModalGoal}>🎉 Target reached! Log it or keep holding.</Text>
                )}

                {/* Start / Pause button */}
                <TouchableOpacity
                  style={[styles.timerStartBtn, holdRunning && styles.timerPauseBtn]}
                  onPress={() => setHoldRunning(r => !r)}
                >
                  <Text style={styles.timerStartBtnText}>
                    {holdRunning ? '⏸ Pause' : holdElapsed > 0 ? '▶ Resume' : '▶ Start'}
                  </Text>
                </TouchableOpacity>

                {/* Log button — only enabled if held at least 1 second */}
                <TouchableOpacity
                  style={[styles.primaryButton, holdElapsed < 1 && { opacity: 0.4 }]}
                  onPress={handleLogSet}
                  disabled={holdElapsed < 1}
                >
                  <Text style={styles.primaryButtonText}>
                    {holdElapsed > 0 ? `✓ Log ${holdElapsed}s` : 'Start the timer first'}
                  </Text>
                </TouchableOpacity>

                {/* Reset */}
                {holdElapsed > 0 && (
                  <TouchableOpacity onPress={resetHoldTimer} style={{ marginTop: 8, alignItems: 'center' }}>
                    <Text style={{ color: Colors.textMuted, fontFamily: 'Outfit_400Regular', fontSize: 13 }}>↺ Reset</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ── BODYWEIGHT EXERCISE UI ── */}
            {currentEx.type === 'bodyweight' && (
              <>
                <Text style={styles.bwHint}>💪 Bodyweight — no weight needed</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Reps: ___"
                  placeholderTextColor={Colors.textMuted}
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="numeric"
                  autoFocus
                />
                <TouchableOpacity style={[styles.primaryButton, !reps && { opacity: 0.4 }]} onPress={handleLogSet} disabled={!reps}>
                  <Text style={styles.primaryButtonText}>Log Set {logModal.setIndex + 1}</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── WEIGHTED EXERCISE UI ── */}
            {(!currentEx.type || currentEx.type === 'weighted') && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Weight: ___ kg"
                  placeholderTextColor={Colors.textMuted}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  autoFocus
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Reps: ___"
                  placeholderTextColor={Colors.textMuted}
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={[styles.primaryButton, (!weight || !reps) && { opacity: 0.4 }]} onPress={handleLogSet} disabled={!weight || !reps}>
                  <Text style={styles.primaryButtonText}>Log Set {logModal.setIndex + 1}</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={{ marginTop: 10, alignItems: 'center', padding: 10 }} onPress={closeLogModal}>
              <Text style={{ color: Colors.textSecondary, fontFamily: 'Outfit_400Regular', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ADD EXERCISE PICKER MODAL ── */}
      <Modal visible={addExModal} transparent animationType="slide" onRequestClose={() => setAddExModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Search by name or muscle..."
              placeholderTextColor={Colors.textMuted}
              value={addExSearch}
              onChangeText={setAddExSearch}
              autoFocus
            />
            <FlatList
              data={filteredAddEx}
              keyExtractor={item => item.id}
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.addExItem} onPress={() => handlePickAddEx(item)}>
                  <View style={[styles.addExDot, { backgroundColor: MUSCLE_COLORS[item.muscle] || Colors.primary }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addExItemName}>{item.name}</Text>
                    <Text style={styles.addExItemMuscle}>{item.muscle} · {item.difficulty}</Text>
                  </View>
                  <Text style={{ color: Colors.primary, fontSize: 18 }}>+</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ fontSize: 28, marginBottom: 6 }}>🔍</Text>
                  <Text style={{ color: Colors.textSecondary, fontFamily: 'Outfit_400Regular', fontSize: 13, textAlign: 'center' }}>
                    No matches. Create a custom exercise below.
                  </Text>
                </View>
              }
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.addExCustomBtn}
                  onPress={() => { setAddExModal(false); setAddExCustomModal(true); setAddExCustomName(''); }}
                >
                  <Text style={{ fontSize: 18 }}>✏️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addExCustomTitle}>Create Custom Exercise</Text>
                    <Text style={styles.addExCustomSub}>Can't find it? Add your own</Text>
                  </View>
                  <Text style={{ color: Colors.primary, fontSize: 16 }}>→</Text>
                </TouchableOpacity>
              }
            />
            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 12 }} onPress={() => setAddExModal(false)}>
              <Text style={{ color: Colors.textSecondary, fontFamily: 'Outfit_400Regular', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CUSTOM EXERCISE QUICK-ADD MODAL ── */}
      <Modal visible={addExCustomModal} transparent animationType="slide" onRequestClose={() => setAddExCustomModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Custom Exercise</Text>
            <Text style={styles.modalSub}>Name it, pick muscle & type</Text>

            <TextInput
              style={[styles.modalInput, { marginBottom: 14 }]}
              placeholder="e.g. Incline Bench Press"
              placeholderTextColor={Colors.textMuted}
              value={addExCustomName}
              onChangeText={setAddExCustomName}
              autoFocus
              maxLength={60}
            />

            <Text style={styles.addExPickerLabel}>MUSCLE GROUP</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {Object.keys(MUSCLE_COLORS).map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.addExChip, addExCustomMuscle === m && styles.addExChipActive]}
                    onPress={() => setAddExCustomMuscle(m)}
                  >
                    <Text style={[styles.addExChipText, addExCustomMuscle === m && { color: Colors.primary }]}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.addExPickerLabel}>TYPE</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {[['weighted', '🏋️ Weighted'], ['bodyweight', '💪 Bodyweight'], ['timed', '⏱ Timed']].map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.addExChip, { flex: 1, alignItems: 'center' }, addExCustomType === key && styles.addExChipActive]}
                  onPress={() => setAddExCustomType(key)}
                >
                  <Text style={[styles.addExChipText, addExCustomType === key && { color: Colors.primary }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, !addExCustomName.trim() && { opacity: 0.4 }]}
              onPress={handleConfirmAddCustom}
              disabled={!addExCustomName.trim()}
            >
              <Text style={styles.primaryButtonText}>Add to Workout +</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 12 }} onPress={() => setAddExCustomModal(false)}>
              <Text style={{ color: Colors.textSecondary, fontFamily: 'Outfit_400Regular', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancelText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSecondary },
  headerTitle: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: Colors.textPrimary },
  finishBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  finishText: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#000' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  exHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  exName: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: Colors.textPrimary, flex: 1 },
  firstTimeBadge: { alignSelf: 'flex-start', backgroundColor: Colors.bgCard, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.border, marginTop: 6 },
  firstTimeText: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.textSecondary },
  tipCard: { backgroundColor: Colors.bgCard, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  tipTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: Colors.primary, marginBottom: 6 },
  tipText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  suggestionBox: { backgroundColor: '#2A1500', padding: 12, borderRadius: 8, marginBottom: 16 },
  suggestionText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.primary },
  timerCard: { backgroundColor: Colors.bgCard, borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Colors.primary },
  timerLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 8 },
  timerNumber: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 48, color: Colors.primary },
  timerBar: { width: '100%', height: 4, backgroundColor: Colors.border, borderRadius: 2, marginVertical: 12, overflow: 'hidden' },
  timerFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  timerOptions: { flexDirection: 'row', gap: 8 },
  timerOptBtn: { paddingHorizontal: 16, paddingVertical: 6, backgroundColor: Colors.bgCardDeep, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  timerOptActive: { borderColor: Colors.primary },
  timerOptText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSecondary },
  skipTimer: { marginTop: 10 },
  skipTimerText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textMuted },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.bgCard, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: Colors.border },
  setRowDone: { borderColor: Colors.success, backgroundColor: Colors.successBg },
  setNum: { fontFamily: 'SpaceMono_400Regular', fontSize: 16, color: Colors.textSecondary, width: 20 },
  setStatus: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textMuted },
  addSetBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  addSetText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.primary },
  exNav: { flexDirection: 'row', marginTop: 20, marginBottom: 8 },
  exNavBtn: { backgroundColor: Colors.bgCard, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  exNavText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  sectionLabelAfter: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#666', marginTop: 24, marginBottom: 10, letterSpacing: 1 },
  afterExCard: { backgroundColor: Colors.bgCard, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  afterExCardActive: { borderColor: Colors.primary, backgroundColor: '#2A1500' },
  afterExName: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 3 },
  afterExCount: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.bgCardDeep, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: Colors.border },
  modalTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: Colors.textPrimary, marginBottom: 4 },
  modalSub: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  modalInput: { backgroundColor: '#000', color: '#FFF', borderRadius: 10, padding: 16, marginBottom: 12, fontFamily: 'SpaceMono_400Regular', fontSize: 16 },
  primaryButton: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#000' },

  // Exercise type badges
  typeBadge: { backgroundColor: 'rgba(230,92,0,0.12)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(230,92,0,0.3)', marginBottom: 12, alignSelf: 'flex-start' },
  typeBadgeText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: Colors.primary },
  targetHint: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textMuted, marginLeft: 'auto' },

  // Bodyweight modal hint
  bwHint: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#2ECC71', marginBottom: 14, textAlign: 'center' },

  // Timed exercise hold timer (inside modal)
  timerModalBody: { alignItems: 'center', paddingVertical: 8 },
  timerModalTarget: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  timerModalElapsed: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 72, color: Colors.primary, letterSpacing: 2 },
  timerModalBar: { width: '90%', height: 6, backgroundColor: Colors.border, borderRadius: 3, marginVertical: 14, overflow: 'hidden' },
  timerModalFill: { height: '100%', borderRadius: 3 },
  timerModalGoal: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.success, marginBottom: 12, textAlign: 'center' },
  timerStartBtn: { backgroundColor: Colors.primary, borderRadius: 50, paddingHorizontal: 40, paddingVertical: 14, marginBottom: 12 },
  timerPauseBtn: { backgroundColor: '#333' },
  timerStartBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#FFF' },

  // Add Exercise during workout
  addExerciseBtn: {
    marginTop: 20, borderWidth: 1.5, borderColor: Colors.primary,
    borderStyle: 'dashed', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    backgroundColor: 'rgba(230,92,0,0.06)',
  },
  addExerciseBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: Colors.primary },
  addExItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  addExDot: { width: 10, height: 10, borderRadius: 5 },
  addExItemName: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  addExItemMuscle: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  addExCustomBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 8, padding: 14,
    backgroundColor: 'rgba(230,92,0,0.08)',
    borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(230,92,0,0.35)',
    borderStyle: 'dashed',
  },
  addExCustomTitle: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: Colors.primary },
  addExCustomSub: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  addExPickerLabel: {
    fontFamily: 'Outfit_600SemiBold', fontSize: 11,
    color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 8,
  },
  addExChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#111', borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  addExChipActive: { borderColor: Colors.primary, backgroundColor: '#2A1500' },
  addExChipText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: Colors.textSecondary },
});