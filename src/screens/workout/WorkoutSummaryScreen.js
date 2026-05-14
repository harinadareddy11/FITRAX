// src/screens/workout/WorkoutSummaryScreen.js
import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { Colors, GlobalStyles } from '../../theme';

export default function WorkoutSummaryScreen({ route, navigation }) {
  const { sessionData, streakResult } = route.params || {};

  if (!sessionData) {
    return (
      <SafeAreaView style={GlobalStyles.screen}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: Colors.textSecondary, fontFamily: 'Outfit_400Regular' }}>No session data</Text>
          <TouchableOpacity onPress={() => navigation.replace('WorkoutHome')} style={{ marginTop: 20 }}>
            <Text style={{ color: Colors.primary, fontFamily: 'Outfit_600SemiBold' }}>Back to Workout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalSets = sessionData.exercises?.reduce((t, ex) => t + ex.sets.filter(s => s.done).length, 0) || 0;
  const totalVol = sessionData.totalVolumeKg || 0;
  const duration = sessionData.duration || 0;

  return (
    <SafeAreaView style={GlobalStyles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Celebration card */}
        <View style={[GlobalStyles.card, styles.celebCard]}>
          <Text style={styles.celebEmoji}>🎉</Text>
          <Text style={styles.celebTitle}>Session Complete!</Text>
          <Text style={styles.celebSub}>{sessionData.splitType} · {sessionData.date}</Text>

          {/* Streak badge */}
          {streakResult?.newStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakNum}>{streakResult.newStreak}</Text>
              <Text style={styles.streakLabel}>day streak 🔥</Text>
            </View>
          )}
          {streakResult?.newStreak === streakResult?.newBest && streakResult?.newBest > 1 && (
            <View style={[GlobalStyles.greenBox, { marginTop: 12, width: '100%' }]}>
              <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.success, textAlign: 'center' }}>
                🏆 New best streak!
              </Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { value: totalSets, label: 'Sets done' },
            { value: `${duration}m`, label: 'Duration' },
            { value: `${totalVol.toLocaleString()}kg`, label: 'Volume' },
          ].map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Exercise breakdown */}
        <Text style={[GlobalStyles.sectionLabel, { marginTop: 24, marginBottom: 12 }]}>EXERCISE BREAKDOWN</Text>
        {sessionData.exercises?.map((ex, i) => {
          const doneSets = ex.sets.filter(s => s.done);
          const bestKg = doneSets.length > 0 ? Math.max(...doneSets.map(s => parseFloat(s.kg) || 0)) : 0;
          const bestReps = doneSets.find(s => parseFloat(s.kg) === bestKg)?.reps || 0;

          return (
            <View key={i} style={[GlobalStyles.card, styles.exCard]}>
              <View style={GlobalStyles.spaceBetween}>
                <Text style={styles.exName}>{ex.name}</Text>
                <Text style={styles.exCount}>{doneSets.length} sets</Text>
              </View>
              {bestKg > 0 && (
                <Text style={styles.bestSet}>
                  Best set: <Text style={{ color: Colors.primary }}>{bestKg}kg × {bestReps} reps</Text>
                </Text>
              )}
              {doneSets.length === 0 && (
                <Text style={styles.skippedText}>Skipped</Text>
              )}
            </View>
          );
        })}

      </ScrollView>

      {/* Footer actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[GlobalStyles.primaryButton, { marginBottom: 10 }]}
          onPress={() => navigation.replace('WorkoutHome')}
          activeOpacity={0.85}
        >
          <Text style={GlobalStyles.primaryButtonText}>Back to Home 🏠</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  celebCard: { alignItems: 'center', paddingVertical: 28 },
  celebEmoji: { fontSize: 52, marginBottom: 12 },
  celebTitle: { fontFamily: 'Outfit_700Bold', fontSize: 26, color: Colors.textPrimary, marginBottom: 4 },
  celebSub: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'baseline', gap: 6,
    backgroundColor: '#2A1500', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  streakNum: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 32, color: Colors.primary },
  streakLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 16, color: Colors.primary },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statBox: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 12,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statVal: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 22, color: Colors.primary },
  statLabel: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.textSecondary, marginTop: 3 },
  exCard: { marginBottom: 10 },
  exName: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.textPrimary, flex: 1 },
  exCount: { fontFamily: 'SpaceMono_400Regular', fontSize: 13, color: Colors.textSecondary },
  bestSet: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSecondary, marginTop: 6 },
  skippedText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  footer: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 },
});