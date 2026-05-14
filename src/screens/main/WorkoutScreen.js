// src/screens/main/WorkoutScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabase/client';
import useAuthStore from '../../store/useAuthStore';
import useWorkoutStore from '../../store/useWorkoutStore';
import { format, addDays } from 'date-fns';

export default function WorkoutScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { startWorkout, activeSession } = useWorkoutStore();

  const [todayWorkout, setTodayWorkout] = useState(null);
  const [tomorrowWorkout, setTomorrowWorkout] = useState(null);
  const [lastSession, setLastSession] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todayName = format(new Date(), 'EEEE');
      const tomorrowName = format(addDays(new Date(), 1), 'EEEE');

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('date, split_type, day_name, exercises')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        const last = sessions[0];
        setLastSession({ date: last.date, splitType: last.split_type, dayName: last.day_name, exercises: last.exercises });
        setIsCompleted(last.date === todayStr);
      } else {
        setIsCompleted(false);
      }

      const { data: tmpl } = await supabase
        .from('workout_templates')
        .select('days')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (tmpl) {
        const days = tmpl.days || [];
        setTodayWorkout(days.find(d => d.dayName === todayName) || null);
        setTomorrowWorkout(days.find(d => d.dayName === tomorrowName) || null);
      }
    } catch (e) {
      console.log('Workout load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { 
    if (!activeSession) loadData(); 
  }, [activeSession, loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStartLogging = () => {
    if (!todayWorkout || isCompleted || !todayWorkout.exercises?.length) return;
    startWorkout({
      templateId: 'default',
      dayName: todayWorkout.dayName,
      splitType: todayWorkout.workoutName || todayWorkout.splitType || "Workout",
      exercises: todayWorkout.exercises,
    });
    navigation.navigate('ActiveWorkout');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]} edges={['top']}>
        <ActivityIndicator color="#E65C00" size="large" style={{ flex: 1, justifyContent: 'center' }} />
      </SafeAreaView>
    );
  }

  const renderLastSession = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const sectionTitle = lastSession?.date === todayStr ? "COMPLETED TODAY" : "LAST SESSION";

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionLabel}>{sectionTitle}</Text>
        {lastSession ? (
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historySplit}>{lastSession.splitType}</Text>
              <Text style={styles.historyDate}>{lastSession.date}</Text>
            </View>

            <View style={styles.divider} />

            {lastSession.exercises?.map((ex, i) => {
              const doneSets = ex.sets?.filter(s => s.done) || [];
              const totalSets = ex.sets?.length || 0;
              const allSkipped = doneSets.length === 0;

              return (
                <View key={i} style={[styles.historyExWrapper, allSkipped && styles.historyExSkipped]}>
                  <View style={styles.historyExHeaderRow}>
                    <Text style={[styles.historyExName, allSkipped && styles.historyExNameSkipped]}>
                      {allSkipped ? '⏭' : '✅'} {ex.name}
                    </Text>
                    {allSkipped ? (
                      <View style={styles.skipBadge}>
                        <Text style={styles.skipBadgeText}>Skipped</Text>
                      </View>
                    ) : (
                      <Text style={styles.doneCount}>{doneSets.length}/{totalSets} sets</Text>
                    )}
                  </View>

                  {!allSkipped && (
                    <View style={styles.historySetsContainer}>
                      {doneSets.map((s, idx) => (
                        <Text key={idx} style={styles.historyExSet}>
                          Set {idx + 1}:{' '}
                          <Text style={{ color: '#FFF' }}>
                            {s.kg === 'bw' ? 'BW' : `${s.kg || 0}kg`}
                          </Text>
                          {' × '}{s.reps || 0} reps
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.historyCard}>
            <Text style={styles.noHistoryText}>No sessions logged yet.</Text>
          </View>
        )}
      </View>
    );
  };

  // ✅ UPDATED: Tomorrow's Preview now shows full exercises
  const renderTomorrow = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionLabel}>UP NEXT (TOMORROW)</Text>
      <View style={styles.previewCard}>
        {tomorrowWorkout && tomorrowWorkout.exercises?.length > 0 ? (
          <>
            <Text style={styles.previewTitle}>{tomorrowWorkout.workoutName?.toUpperCase()}</Text>
            <Text style={styles.previewSub}>{tomorrowWorkout.muscles || 'Full Body'}</Text>

            {/* Added Map function for exercises */}
            <View style={{ marginTop: 12 }}>
              {tomorrowWorkout.exercises.map((ex, i) => (
                <View key={i} style={styles.exRow}>
                  <View style={styles.exDot} />
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exSets}>{ex.targetSets}×{ex.targetReps}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.restDayContainer}>
            <Text style={styles.restEmojiSmall}>🛌</Text>
            <Text style={styles.restSub}>Tomorrow is a scheduled Rest Day</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E65C00" />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.pageTitle}>Workout</Text>
            <Text style={styles.dateLine}>{format(new Date(), 'EEEE, d MMM')}</Text>
          </View>
          <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('WorkoutHistory')}>
            <Text style={styles.historyBtnText}>📜 History</Text>
          </TouchableOpacity>
        </View>

        {/* ── Resume banner: shows if app was killed mid-workout ── */}
        {activeSession && (
          <TouchableOpacity
            style={styles.resumeBanner}
            onPress={() => navigation.navigate('ActiveWorkout')}
            activeOpacity={0.85}
          >
            <View>
              <Text style={styles.resumeTitle}>⚡ Workout in progress</Text>
              <Text style={styles.resumeSub}>
                {activeSession.splitType} · started{' '}
                {useWorkoutStore.getState().sessionStartTime
                  ? `${Math.round((Date.now() - useWorkoutStore.getState().sessionStartTime) / 60000)} min ago`
                  : 'earlier'}
              </Text>
            </View>
            <Text style={styles.resumeArrow}>Resume →</Text>
          </TouchableOpacity>
        )}

        {isCompleted ? (
          <>
            <View style={styles.doneBanner}>
              <Text style={styles.doneText}>
                <Text style={styles.doneBold}>Day Done! </Text>
                Workout completed. Come back tomorrow to keep your streak alive.
              </Text>
            </View>
            
            {renderTomorrow()}
            {renderLastSession()}
          </>
        ) : (
          <>
            {todayWorkout && todayWorkout.exercises?.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>TODAY'S PLAN</Text>
                <Text style={styles.cardTitle}>{todayWorkout.workoutName?.toUpperCase() || 'WORKOUT'}</Text>
                <Text style={styles.cardSub}>{todayWorkout.muscles || 'Full Body'}</Text>

                {todayWorkout.exercises.map((ex, i) => (
                  <View key={i} style={styles.exRow}>
                    <View style={styles.exDot} />
                    <Text style={styles.exName}>{ex.name}</Text>
                    <Text style={styles.exSets}>{ex.targetSets}×{ex.targetReps}</Text>
                  </View>
                ))}

                <TouchableOpacity style={styles.orangeBtn} onPress={handleStartLogging} activeOpacity={0.85}>
                  <Text style={styles.orangeBtnText}>Start Workout Log</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.restEmoji}>🛌</Text>
                <Text style={styles.cardTitle}>Rest Day</Text>
                <Text style={styles.restSub}>No workout scheduled for today. Rest up!</Text>
              </View>
            )}

            {renderLastSession()}
            {renderTomorrow()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10, marginBottom: 0 },
  pageTitle: { fontFamily: 'Outfit_700Bold', fontSize: 32, color: '#FFFFFF' },
  dateLine: { fontFamily: 'Outfit_400Regular', fontSize: 16, color: '#888888', marginBottom: 24 },
  historyBtn: { backgroundColor: '#1C1C1E', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#2C2C2E', marginBottom: 24 },
  historyBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#E65C00' },
  sectionContainer: { marginBottom: 24 },

  card: { backgroundColor: '#161618', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2C2C2E', marginBottom: 24 },
  cardLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#E65C00', letterSpacing: 1.5, marginBottom: 4 },
  cardTitle: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: '#FFFFFF' },
  cardSub: { fontFamily: 'Outfit_400Regular', fontSize: 16, color: '#888', marginBottom: 16 },

  exRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1F1F1F' },
  exDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E65C00', marginRight: 12 },
  exName: { flex: 1, color: '#FFF', fontFamily: 'Outfit_400Regular', fontSize: 15 },
  exSets: { color: '#666', fontFamily: 'SpaceMono_400Regular', fontSize: 14 },

  orangeBtn: { backgroundColor: '#E65C00', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 20 },
  orangeBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#1A0800' },

  doneBanner: { backgroundColor: '#0D1A0D', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1A331A', marginBottom: 24 },
  doneText: { color: '#888', fontSize: 14, lineHeight: 22 },
  doneBold: { color: '#2ECC71', fontWeight: 'bold' },

  resumeBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(230,92,0,0.12)', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#E65C00', marginBottom: 16 },
  resumeTitle: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#FFF', marginBottom: 3 },
  resumeSub: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#999' },
  resumeArrow: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#E65C00' },

  sectionLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#666', marginBottom: 12, letterSpacing: 1 },
  
  historyCard: { backgroundColor: '#161618', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#222' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historySplit: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#FFF' },
  historyDate: { color: '#666', fontSize: 12 },
  
  divider: { height: 1, backgroundColor: '#2C2C2E', marginVertical: 14 },
  historyExWrapper: { marginBottom: 14, borderRadius: 8, backgroundColor: '#1A1A1A', padding: 10, borderWidth: 1, borderColor: '#2A2A2A' },
  historyExSkipped: { backgroundColor: '#141414', borderColor: '#1E1E1E', opacity: 0.65 },
  historyExHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  historyExName: { color: '#E65C00', fontFamily: 'Outfit_600SemiBold', fontSize: 14, flex: 1 },
  historyExNameSkipped: { color: '#555', textDecorationLine: 'line-through' },
  doneCount: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#2ECC71', marginLeft: 6 },
  skipBadge: { backgroundColor: 'rgba(136,136,136,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: '#333', marginLeft: 6 },
  skipBadgeText: { fontFamily: 'Outfit_400Regular', fontSize: 10, color: '#666' },
  historySetsContainer: { paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#2C2C2E', marginLeft: 4 },
  historyExSet: { color: '#888', fontFamily: 'SpaceMono_400Regular', fontSize: 12, paddingVertical: 2 },

  restEmoji: { fontSize: 40, marginBottom: 10 },
  restSub: { color: '#888', fontFamily: 'Outfit_400Regular', fontSize: 15 },
  noHistoryText: { color: '#444', textAlign: 'center', fontFamily: 'Outfit_400Regular' },

  // Changed previewCard opacity to 1.0 so the text remains bright and readable
  previewCard: { backgroundColor: '#161618', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#2C2C2E' },
  previewTitle: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#FFF' },
  previewSub: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#888', marginTop: 4 },
  restDayContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  restEmojiSmall: { fontSize: 24 }
});