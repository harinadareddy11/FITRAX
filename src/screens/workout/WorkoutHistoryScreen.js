// src/screens/workout/WorkoutHistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase/client';
import useAuthStore from '../../store/useAuthStore';
import { Colors } from '../../theme';
import { format, parseISO } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'fitrax_sync_queue';

export default function WorkoutHistoryScreen({ navigation }) {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    if (!user?.id) return;
    try {
      // Load cloud sessions
      const { data: cloud } = await supabase
        .from('workout_sessions')
        .select('id, date, split_type, day_name, exercises, total_volume_kg, duration')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(50);

      // Load pending offline sessions from queue
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      const offlineSessions = queue
        .filter(i => i.type === 'session')
        .map(i => ({
          id: i.id,
          date: i.data.date,
          split_type: i.data.splitType,
          day_name: i.data.dayName,
          exercises: i.data.exercises,
          total_volume_kg: i.data.totalVolumeKg,
          duration: i.data.duration,
          pending: true,
        }));

      // Merge: offline first (most recent), then cloud
      const merged = [...offlineSessions, ...(cloud || [])];
      // Deduplicate by date+splitType
      const seen = new Set();
      const deduped = merged.filter(s => {
        const key = `${s.date}_${s.split_type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setSessions(deduped);
    } catch (e) {
      console.log('History load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // Group by month
  const grouped = sessions.reduce((acc, s) => {
    const month = s.date?.slice(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(s);
    return acc;
  }, {});

  const cloudSessions = sessions.filter(s => !s.pending);
  const pendingSessions = sessions.filter(s => s.pending);
  const totalVolume = cloudSessions.reduce((t, s) => t + (s.total_volume_kg || 0), 0);
  const avgDuration = cloudSessions.length
    ? Math.round(cloudSessions.reduce((t, s) => t + (s.duration || 0), 0) / cloudSessions.length)
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ActivityIndicator color={Colors.primary} size="large" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Workout History</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Pending sync notice */}
        {pendingSessions.length > 0 && (
          <View style={styles.syncNotice}>
            <Text style={styles.syncNoticeText}>
              ☁️ {pendingSessions.length} session{pendingSessions.length > 1 ? 's' : ''} saved offline — will sync when online
            </Text>
          </View>
        )}

        {/* Summary strip */}
        {sessions.length > 0 && (
          <View style={styles.strip}>
            {[
              { v: sessions.length, l: 'Sessions' },
              { v: `${Math.round(totalVolume).toLocaleString()}kg`, l: 'Total Volume' },
              { v: avgDuration > 0 ? `${avgDuration}m` : '—', l: 'Avg Duration' },
            ].map(st => (
              <View key={st.l} style={styles.stripItem}>
                <Text style={styles.stripVal}>{st.v}</Text>
                <Text style={styles.stripLabel}>{st.l}</Text>
              </View>
            ))}
          </View>
        )}

        {sessions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptySub}>Complete your first workout to see history here</Text>
          </View>
        ) : (
          Object.keys(grouped).map(month => (
            <View key={month}>
              <Text style={styles.monthLabel}>
                {format(parseISO(`${month}-01`), 'MMMM yyyy')}
                <Text style={styles.monthCount}> · {grouped[month].length} sessions</Text>
              </Text>

              {grouped[month].map(session => {
                const isOpen = expanded === session.id;
                const allSets = session.exercises?.reduce((t, ex) =>
                  t + (ex.sets?.length || 0), 0) || 0;
                const doneSets = session.exercises?.reduce((t, ex) =>
                  t + (ex.sets?.filter(s => s.done)?.length || 0), 0) || 0;
                const skippedSets = allSets - doneSets;

                return (
                  <TouchableOpacity
                    key={session.id}
                    style={[styles.card, isOpen && styles.cardOpen, session.pending && styles.cardPending]}
                    onPress={() => setExpanded(isOpen ? null : session.id)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.sessionRow}>
                      <View style={styles.dateBadge}>
                        <Text style={styles.dateDay}>{format(parseISO(session.date), 'd')}</Text>
                        <Text style={styles.dateMon}>{format(parseISO(session.date), 'MMM')}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.splitType}>{session.split_type || session.day_name}</Text>
                          {session.pending && (
                            <View style={styles.pendingBadge}>
                              <Text style={styles.pendingBadgeText}>📴 Offline</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.metaRow}>
                          {session.duration > 0 && <Text style={styles.meta}>⏱ {session.duration}m</Text>}
                          {session.total_volume_kg > 0 && <Text style={styles.meta}>🏋️ {Math.round(session.total_volume_kg).toLocaleString()}kg</Text>}
                          <Text style={[styles.meta, { color: '#2ECC71' }]}>✅ {doneSets}</Text>
                          {skippedSets > 0 && <Text style={[styles.meta, { color: '#888' }]}>⏭ {skippedSets} skipped</Text>}
                        </View>
                      </View>
                      <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
                    </View>

                    {isOpen && (
                      <View style={styles.breakdown}>
                        <View style={styles.divider} />
                        {session.pending && (
                          <Text style={styles.pendingNote}>
                            🔄 This session is saved locally and will sync to cloud when internet is available.
                          </Text>
                        )}
                        {session.exercises?.map((ex, i) => {
                          const done = ex.sets?.filter(s => s.done) || [];
                          const skipped = ex.sets?.filter(s => !s.done) || [];
                          const best = done.length > 0
                            ? done.reduce((b, s) => (parseFloat(s.kg) || 0) > (parseFloat(b.kg) || 0) ? s : b, done[0])
                            : null;
                          const totalSets = ex.sets?.length || 0;
                          const allSkipped = done.length === 0;

                          return (
                            <View key={i} style={[styles.exBlock, allSkipped && styles.exBlockSkipped]}>
                              {/* Exercise header row */}
                              <View style={styles.exHeaderRow}>
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.exName, allSkipped && styles.exNameSkipped]}>
                                    {ex.name}
                                  </Text>
                                </View>
                                <View style={styles.exStatusBadge}>
                                  {allSkipped ? (
                                    <View style={styles.badgeSkipped}>
                                      <Text style={styles.badgeSkippedText}>⏭ Skipped</Text>
                                    </View>
                                  ) : (
                                    <View style={styles.badgeDone}>
                                      <Text style={styles.badgeDoneText}>
                                        ✅ {done.length}/{totalSets}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>

                              {/* Done sets detail */}
                              {done.length > 0 && (
                                <View style={styles.setsContainer}>
                                  {done.map((set, si) => (
                                    <View key={si} style={styles.setLine}>
                                      <Text style={styles.setLineNum}>Set {si + 1}</Text>
                                      <Text style={styles.setLineData}>
                                        {set.kg === 'bw'
                                          ? `BW × ${set.reps} reps`
                                          : set.seconds
                                            ? `${set.seconds}s hold`
                                            : `${set.kg}kg × ${set.reps} reps`}
                                      </Text>
                                    </View>
                                  ))}
                                  {best && (
                                    <Text style={styles.exBest}>
                                      🏆 Best: {best.kg === 'bw' ? `BW × ${best.reps}` : `${best.kg}kg × ${best.reps}`}
                                    </Text>
                                  )}
                                </View>
                              )}

                              {/* Skipped sets (when partially done) */}
                              {!allSkipped && skipped.length > 0 && (
                                <Text style={styles.partialSkip}>
                                  ⏭ {skipped.length} set{skipped.length > 1 ? 's' : ''} skipped
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  backBtn: { width: 60 },
  backText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSecondary },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#FFF' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  syncNotice: { backgroundColor: 'rgba(230,92,0,0.1)', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(230,92,0,0.3)' },
  syncNoticeText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: Colors.primary, textAlign: 'center' },
  strip: { flexDirection: 'row', backgroundColor: '#161618', borderRadius: 14, marginBottom: 24, padding: 16, borderWidth: 1, borderColor: '#2C2C2E' },
  stripItem: { flex: 1, alignItems: 'center' },
  stripVal: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 18, color: Colors.primary },
  stripLabel: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#666', marginTop: 3 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#FFF', marginBottom: 8 },
  emptySub: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#666', textAlign: 'center' },
  monthLabel: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: '#888', letterSpacing: 0.5, marginBottom: 10, marginTop: 8 },
  monthCount: { fontFamily: 'Outfit_400Regular', color: '#555' },
  card: { backgroundColor: '#161618', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2C2C2E', overflow: 'hidden' },
  cardOpen: { borderColor: Colors.primary },
  cardPending: { borderStyle: 'dashed', borderColor: '#444' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  dateBadge: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2C2C2E' },
  dateDay: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 18, color: Colors.primary, lineHeight: 20 },
  dateMon: { fontFamily: 'Outfit_400Regular', fontSize: 10, color: '#888' },
  splitType: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#FFF', marginBottom: 4 },
  pendingBadge: { backgroundColor: '#2C2C2E', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  pendingBadgeText: { fontFamily: 'Outfit_400Regular', fontSize: 10, color: '#888' },
  metaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  meta: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#888' },
  chevron: { color: '#444', fontSize: 12 },
  breakdown: { paddingHorizontal: 14, paddingBottom: 14 },
  divider: { height: 1, backgroundColor: '#2C2C2E', marginBottom: 12 },
  pendingNote: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.primary, marginBottom: 10, lineHeight: 18 },

  // Exercise block
  exBlock: {
    marginBottom: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  exBlockSkipped: {
    backgroundColor: '#141414',
    borderColor: '#222',
    opacity: 0.7,
  },
  exHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  exName: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#DDD' },
  exNameSkipped: { color: '#555', textDecorationLine: 'line-through' },
  exStatusBadge: { marginLeft: 8 },
  badgeDone: {
    backgroundColor: 'rgba(46,204,113,0.15)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(46,204,113,0.3)',
  },
  badgeDoneText: { fontFamily: 'Outfit_600SemiBold', fontSize: 11, color: '#2ECC71' },
  badgeSkipped: {
    backgroundColor: 'rgba(136,136,136,0.12)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#333',
  },
  badgeSkippedText: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#666' },

  // Individual set lines
  setsContainer: { marginTop: 4, paddingLeft: 4 },
  setLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  setLineNum: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#666', width: 44 },
  setLineData: { fontFamily: 'SpaceMono_400Regular', fontSize: 12, color: '#CCC', flex: 1 },
  exBest: { fontFamily: 'Outfit_600SemiBold', fontSize: 11, color: Colors.primary, marginTop: 6 },
  partialSkip: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#555', marginTop: 4 },
});
