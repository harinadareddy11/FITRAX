// src/screens/main/HomeScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, GlobalStyles } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase, mapProfile } from '../../services/supabase/client';
import useAuthStore from '../../store/useAuthStore';
import useWorkoutStore from '../../store/useWorkoutStore';
import { getRecentSessions } from '../../services/streakService';
import { getWeekGrid } from '../../utils/streakUtils';
import { getAvatarSource } from '../../config/avatars';
import { format, addDays } from 'date-fns';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, userProfile, setUserProfile } = useAuthStore();
  const { startWorkout } = useWorkoutStore();
  const [profile, setProfile] = useState(userProfile);
  const [sessions, setSessions] = useState([]);
  const [templateDays, setTemplateDays] = useState([]);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [tomorrowWorkout, setTomorrowWorkout] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [profileRes, recentSessions] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        getRecentSessions(user.id, 30),
      ]);

      if (profileRes.data) {
        const p = mapProfile(profileRes.data);
        setProfile(p);
        setUserProfile(p);

        const todayName = format(new Date(), 'EEEE');
        const tomorrowName = format(addDays(new Date(), 1), 'EEEE');

        const tmplRes = await supabase
          .from('workout_templates')
          .select('days')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .single();

        if (tmplRes.data) {
          const days = tmplRes.data.days || [];
          setTemplateDays(days);
          setTodayWorkout(days.find(d => d.dayName === todayName) || null);
          setTomorrowWorkout(days.find(d => d.dayName === tomorrowName) || null);
        }
      }
      setSessions(recentSessions);
    } catch (e) {
      console.log('Home load error:', e);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const isTodayCompleted = sessions.some(s => s.date === todayDateStr);
  const isTodayRestDay = !todayWorkout || (todayWorkout.exercises || []).length === 0;
  const isTomorrowRestDay = !tomorrowWorkout || (tomorrowWorkout.exercises || []).length === 0;

  const streak = profile?.streakCurrent || 0;
  const firstName = (profile?.name || 'there').split(' ')[0];

  const rawGrid = getWeekGrid(sessions);
  const weekGrid = rawGrid.map(day => {
    const fullDayName = format(day.date, 'EEEE');
    const config = templateDays.find(d => d.dayName === fullDayName);
    const isRestScheduled = !config || (config.exercises || []).length === 0;
    return { ...day, isRestScheduled, isMissed: !day.hasSession && !isRestScheduled && day.isPast };
  });

  const handleStartWorkout = () => {
    if (!todayWorkout || isTodayCompleted) return;
    startWorkout({
      templateId: 'default',
      dayName: format(new Date(), 'EEEE'),
      splitType: todayWorkout.workoutName || "Today's Workout",
      exercises: todayWorkout.exercises
    });
    navigation.navigate('Workout', { screen: 'ActiveWorkout' });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E65C00" />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>{getGreeting()},</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{firstName} 💪</Text>
          </View>
          {(() => {
            const avatarSrc = profile?.avatarKey ? getAvatarSource(profile.avatarKey) : null;
            return avatarSrc
              ? <Image source={avatarSrc} style={styles.avatarImg}/>
              : <View style={styles.avatar}><Text style={styles.avatarText}>{firstName[0]?.toUpperCase() || 'U'}</Text></View>;
          })()}
        </View>

        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>CURRENT STREAK</Text>
          {streak === 0 ? (
            <View style={{ alignItems: 'center', width: '100%' }}>
              <Text style={styles.streakZero}>0</Text>
              <Text style={styles.streakZeroSub}>Your journey starts today</Text>
              <TouchableOpacity style={styles.orangeBtn} onPress={handleStartWorkout} activeOpacity={0.85}>
                <Text style={styles.orangeBtnText}>Log Your First Session →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakSub}>days in a row — keep going!</Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}><Text style={styles.statValue}>{profile?.totalSessions || 0}</Text><Text style={styles.statLabel}>Sessions</Text></View>
                <View style={styles.statBox}><Text style={styles.statValue}>{profile?.streakBest || 0}</Text><Text style={styles.statLabel}>Best streak</Text></View>
                <View style={styles.statBox}><Text style={styles.statValue}>{sessions.length}</Text><Text style={styles.statLabel}>Activity</Text></View>
              </View>
            </>
          )}
        </View>

        <Text style={styles.sectionLabel}>THIS WEEK</Text>
        <View style={styles.weekGrid}>
          {weekGrid.map((day, i) => (
            <View key={i} style={styles.dayCol}>
              <Text style={styles.dayLetter}>{day.dayLetter}</Text>
              <View style={[styles.dayBox, day.hasSession && styles.dayBoxGreen, day.isMissed && styles.dayBoxRed, day.isRestScheduled && !day.hasSession && styles.dayBoxRest, day.isToday && styles.dayBoxToday]}>
                {day.hasSession ? <Text style={styles.dayCheck}>✓</Text> : day.isRestScheduled ? <Text style={{ fontSize: 16 }}>🛌</Text> : <Text style={styles.dayDash}>—</Text>}
              </View>
            </View>
          ))}
        </View>

        {isTodayCompleted ? (
          <View style={styles.dayDoneBanner}>
            <Text style={styles.dayDoneText}>
              <Text style={styles.dayDoneBold}>Day {streak} done! </Text>
              Come back tomorrow to keep your streak going.
            </Text>
          </View>
        ) : (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              {streak === 0 ? "Every day you log a workout fills a green dot. Don't break the chain! 🔥" : "Log today's session to keep your streak alive! 🔥"}
            </Text>
          </View>
        )}

        {!isTodayCompleted && (
          isTodayRestDay ? (
            <View style={{ marginTop: 20 }}>
              <View style={styles.restDayCard}>
                <Text style={styles.restDayEmoji}>🛌</Text>
                <View>
                  <Text style={styles.restDayTitle}>Rest Day</Text>
                  <Text style={styles.restDaySub}>Recover well! Muscle grows while you sleep.</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 24 }}>
              <Text style={styles.sectionLabel}>TODAY'S PLAN</Text>
              <View style={styles.planCard}>
                <Text style={styles.planTitle}>{todayWorkout.workoutName?.toUpperCase() || 'WORKOUT'}</Text>
                <Text style={styles.planSubTitle}>{todayWorkout.muscles || 'Full Body'}</Text>
                {todayWorkout.exercises.map((ex, i) => (
                  <View key={i} style={[styles.exRow, i < todayWorkout.exercises.length - 1 && styles.exRowBorder]}>
                    <View style={styles.exDot} />
                    <Text style={styles.exName}>{ex.name}</Text>
                    <Text style={styles.exSets}>{ex.targetSets}×{ex.targetReps}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.orangeBtn} onPress={handleStartWorkout} activeOpacity={0.85}>
                <Text style={styles.orangeBtnText}>{streak === 0 ? 'Start First Workout 💪' : 'Start Workout Log'}</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {isTodayCompleted && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionLabel}>UP NEXT (TOMORROW)</Text>
            {isTomorrowRestDay ? (
              <View style={styles.restDayCard}>
                <Text style={styles.restDayEmoji}>🛌</Text>
                <View>
                  <Text style={styles.restDayTitle}>Tomorrow is Rest Day</Text>
                  <Text style={styles.restDaySub}>A well-deserved break is coming up.</Text>
                </View>
              </View>
            ) : (
              <View style={styles.planCard}>
                <Text style={styles.planTitle}>{tomorrowWorkout.workoutName?.toUpperCase() || 'WORKOUT'}</Text>
                <Text style={styles.planSubTitle}>{tomorrowWorkout.muscles || 'Full Body'}</Text>
                {tomorrowWorkout.exercises.map((ex, i) => (
                  <View key={i} style={[styles.exRow, i < tomorrowWorkout.exercises.length - 1 && styles.exRowBorder]}>
                    <View style={styles.exDot} />
                    <Text style={styles.exName}>{ex.name}</Text>
                    <Text style={styles.exSets}>{ex.targetSets}×{ex.targetReps}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  welcomeText: { fontFamily: 'Outfit_400Regular', fontSize: 16, color: '#888888' },
  userName: { fontFamily: 'Outfit_700Bold', fontSize: 32, color: '#FFFFFF' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E65C00', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: '#FFFFFF' },
  avatarImg: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#E65C00' },
  streakCard: { backgroundColor: '#161618', borderRadius: 20, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: '#2C2C2E' },
  streakLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#888888', letterSpacing: 1.5, alignSelf: 'center', marginBottom: 12 },
  streakZero: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 80, color: '#FFFFFF', opacity: 0.15, textAlign: 'center' },
  streakZeroSub: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#666666', marginBottom: 20, textAlign: 'center' },
  streakNumber: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 80, color: '#E65C00', textAlign: 'center', lineHeight: 88 },
  streakSub: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#888888', textAlign: 'center', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E' },
  statValue: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 22, color: '#FFFFFF' },
  statLabel: { fontFamily: 'Outfit_400Regular', fontSize: 10, color: '#666666', marginTop: 4 },
  sectionLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#666666', letterSpacing: 1.5, marginBottom: 12 },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  dayCol: { alignItems: 'center', gap: 8 },
  dayLetter: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#444444' },
  dayBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#161618', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' },
  dayBoxGreen: { backgroundColor: '#0D2E1A', borderColor: '#2ECC71' },
  dayBoxRed: { backgroundColor: '#2E0D0D', borderColor: '#E74C3C' },
  dayBoxRest: { backgroundColor: '#1A1A2E', borderColor: '#3F51B5' },
  dayBoxToday: { borderWidth: 2, borderColor: '#E65C00' },
  dayCheck: { color: '#2ECC71', fontSize: 16, fontWeight: 'bold' },
  dayDash: { color: '#333' },
  dayDoneBanner: { backgroundColor: '#0D1A0D', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#1A331A' },
  dayDoneText: { fontFamily: 'Outfit_400Regular', color: '#888', fontSize: 14, lineHeight: 22 },
  dayDoneBold: { fontFamily: 'Outfit_700Bold', color: '#2ECC71' },
  hintBox: { backgroundColor: '#1A1700', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2C2A00' },
  hintText: { fontFamily: 'Outfit_400Regular', color: '#888', fontSize: 13, lineHeight: 18 },
  restDayCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#161618', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2C2C2E' },
  restDayEmoji: { fontSize: 32 },
  restDayTitle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#FFFFFF' },
  restDaySub: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#888', marginTop: 2 },
  planCard: { backgroundColor: '#161618', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#2C2C2E' },
  planTitle: { fontFamily: 'Outfit_700Bold', fontSize: 12, color: '#E65C00', letterSpacing: 1, marginBottom: 4 },
  planSubTitle: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#FFFFFF', marginBottom: 16 },
  exRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  exRowBorder: { borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  exDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E65C00', marginRight: 12 },
  exName: { flex: 1, color: '#FFFFFF', fontSize: 15 },
  exSets: { color: '#666', fontFamily: 'SpaceMono_400Regular', fontSize: 13 },
  orangeBtn: { backgroundColor: '#E65C00', borderRadius: 14, paddingVertical: 18, alignItems: 'center', width: '100%' },
  orangeBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#1A0800' },
});