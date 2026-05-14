// src/screens/main/ProfileScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase, mapProfile } from '../../services/supabase/client';
import { getAvatarSource } from '../../config/avatars';
import useAuthStore from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import AvatarPickerModal from '../../components/profile/AvatarPickerModal';
import { EditProfileModal, ChangeGoalModal, EditEquipmentModal, ChangeLockModal, ChangePasswordModal } from '../../components/profile/ProfileModals';

const GOAL_LABELS = { muscle_gain:'Muscle Gain 💪', fat_loss:'Fat Loss 🔥', maintain:'Maintain ⚖️', general:'General Fitness 🏃' };

function getBMILabel(bmi) {
  if (!bmi) return { label: '—', color: '#666' };
  const b = parseFloat(bmi);
  if (b < 18.5) return { label: `${bmi} — Underweight 📉`, color: '#3498DB' };
  if (b < 25)   return { label: `${bmi} — Healthy ✅`,     color: '#2ECC71' };
  if (b < 30)   return { label: `${bmi} — Overweight ⚠️`,  color: '#E67E22' };
  return              { label: `${bmi} — Obese 🔴`,         color: '#E74C3C' };
}

export default function ProfileScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, userProfile, setUserProfile, signOut: clearStore } = useAuthStore();
  const [profile, setProfile] = useState(userProfile);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(null);

  const s = createStyles(colors);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) { const p = mapProfile(data); setProfile(p); setUserProfile(p); }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));
  const onRefresh = async () => { setRefreshing(true); await loadProfile(); setRefreshing(false); };

  const handleLogout = () => Alert.alert('Log out?', "You'll need to sign in again.", [
    { text:'Cancel', style:'cancel' },
    { text:'Log out', style:'destructive', onPress: async () => { await supabase.auth.signOut(); clearStore(); } },
  ]);

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently delete all your data — workouts, progress photos, weight logs, and your profile. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete Everything',
          style: 'destructive',
          onPress: () => Alert.alert(
            'Are you absolutely sure?',
            `Type "DELETE" to confirm.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete My Account',
                style: 'destructive',
                onPress: async () => {
                  try {
                    const uid = user?.id;
                    if (!uid) return;
                    // Delete all user data
                    await Promise.all([
                      supabase.from('weight_log').delete().eq('user_id', uid),
                      supabase.from('workout_sessions').delete().eq('user_id', uid),
                      supabase.from('photos').delete().eq('user_id', uid),
                      supabase.from('workout_plans').delete().eq('user_id', uid),
                    ]);
                    await supabase.from('profiles').delete().eq('id', uid);
                    await supabase.auth.signOut();
                    clearStore();
                  } catch (e) {
                    Alert.alert('Error', 'Could not delete account. Contact support.');
                  }
                },
              },
            ]
          ),
        },
      ]
    );
  };

  const toggleLoggingMode = async () => {
    const newMode = profile?.loggingMode === 'realtime' ? 'after' : 'realtime';
    await supabase.from('profiles').update({ logging_mode: newMode }).eq('id', user.id);
    setProfile(p => ({ ...p, loggingMode: newMode }));
  };

  const onAvatarSelect = async (key) => {
    await supabase.from('profiles').update({ avatar_key: key }).eq('id', user.id);
    setProfile(p => ({ ...p, avatarKey: key }));
    setModal(null);
  };

  const onProfileSave = (updates) => {
    setProfile(p => ({ ...p, name: updates.name??p.name, age: updates.age??p.age, weight: updates.weight??p.weight, height: updates.height??p.height, bmi: updates.bmi??p.bmi, dietBudget: updates.diet_budget??p.dietBudget }));
    setModal(null);
  };

  const onGoalSave = (goal) => { setProfile(p => ({ ...p, goal })); setModal(null); };
  const onEquipmentSave = (equipment) => { setProfile(p => ({ ...p, equipment })); setModal(null); };
  const onLockSave = () => { setModal(null); Alert.alert('Lock updated ✓'); };

  const name = profile?.name || 'User';
  const avatarSrc = profile?.avatarKey ? getAvatarSource(profile.avatarKey) : null;

  const settingRows = [
    { icon:'🗓', label:'Edit Workout Plan', desc:'Regenerate or rebuild your plan',              onPress: () => navigation.navigate('Workout', { screen: 'EditWorkoutPlan' }) },
    { icon:'🎯', label:'Change Goal',       desc: GOAL_LABELS[profile?.goal] || 'Not set',       onPress: () => setModal('goal') },
    { icon:'🏋️', label:'Edit Equipment',   desc: (profile?.equipment||[]).slice(0,2).join(', ') || 'Not set', onPress: () => setModal('equipment') },
    { icon:'🔒', label:'App Lock',          desc: 'Change PIN or biometric lock',                onPress: () => setModal('lock') },
    { icon:'🔑', label:'Change Password',   desc: 'Update your account password',               onPress: () => setModal('password') },
  ];

  return (
    <SafeAreaView style={[s.screen]} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary}/>}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.avatarWrap} onPress={() => setModal('avatar')} activeOpacity={0.85}>
            {avatarSrc
              ? <Image source={avatarSrc} style={s.avatarImg}/>
              : <View style={s.avatarFallback}><Text style={s.avatarInitial}>{name[0]?.toUpperCase()}</Text></View>
            }
            <View style={s.editBadge}><Text style={s.editBadgeText}>✏️</Text></View>
          </TouchableOpacity>
          <Text style={s.name}>{name}</Text>
          <Text style={s.email}>{profile?.email || user?.email}</Text>
          <TouchableOpacity style={s.editProfileBtn} onPress={() => setModal('edit')}>
            <Text style={s.editProfileText}>Edit Profile →</Text>
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        <View style={s.strip}>
          {[{v: profile?.streakCurrent||0, l:'Streak'},{v: profile?.streakBest||0, l:'Best'},{v: profile?.totalSessions||0, l:'Sessions'}].map(st => (
            <View key={st.l} style={s.stripItem}>
              <Text style={s.stripVal}>{st.v}</Text>
              <Text style={s.stripLabel}>{st.l}</Text>
            </View>
          ))}
        </View>

        {/* Stats card */}
        <Text style={s.sectionLabel}>YOUR STATS</Text>
        <View style={s.card}>
          {[
            {l:'Goal',        v: GOAL_LABELS[profile?.goal]||'Not set'},
            {l:'Age',         v: profile?.age ? `${profile.age} yrs` : '—'},
            {l:'Height',      v: profile?.height ? `${profile.height} cm` : '—'},
            {l:'Diet budget', v: profile?.dietBudget ? `₹${profile.dietBudget}/day` : '—'},
          ].map(r => (
            <View key={r.l} style={s.statRow}>
              <Text style={s.statLabel}>{r.l}</Text>
              <Text style={s.statVal}>{r.v}</Text>
            </View>
          ))}

          {/* Weight journey: starting → current */}
          {(profile?.weight || profile?.startingWeight) && (
            <View style={s.statRow}>
              <Text style={s.statLabel}>Weight</Text>
              <View style={{ alignItems: 'flex-end' }}>
                {profile?.startingWeight && profile?.weight && profile.startingWeight !== profile.weight ? (
                  <>
                    <Text style={s.statVal}>
                      {profile.startingWeight} kg → {profile.weight} kg
                    </Text>
                    <Text style={[
                      s.weightDelta,
                      { color: profile.weight < profile.startingWeight ? '#2ECC71' : '#E74C3C' }
                    ]}>
                      {profile.weight < profile.startingWeight ? '▼' : '▲'}
                      {Math.abs(profile.weight - profile.startingWeight).toFixed(1)} kg
                    </Text>
                  </>
                ) : (
                  <Text style={s.statVal}>{profile?.weight ?? profile?.startingWeight} kg</Text>
                )}
              </View>
            </View>
          )}

          <View style={[s.statRow, {borderBottomWidth:0}]}>
            <Text style={s.statLabel}>BMI</Text>
            <Text style={[s.statVal, {color: getBMILabel(profile?.bmi).color}]}>{getBMILabel(profile?.bmi).label}</Text>
          </View>
        </View>

        {/* Equipment */}
        {(profile?.equipment||[]).length > 0 && (
          <>
            <Text style={[s.sectionLabel,{marginTop:20}]}>EQUIPMENT</Text>
            <View style={s.chips}>
              {profile.equipment.map(eq => <View key={eq} style={s.chip}><Text style={s.chipText}>{eq}</Text></View>)}
            </View>
          </>
        )}

        {/* Settings */}
        <Text style={[s.sectionLabel,{marginTop:24}]}>SETTINGS</Text>
        <View style={s.card}>
          {/* Theme toggle */}
          <View style={[s.settingRow,{borderBottomWidth:1,borderBottomColor:colors.divider}]}>
            <Text style={{fontSize:20,marginRight:14}}>{isDark ? '🌙' : '☀️'}</Text>
            <View style={{flex:1}}>
              <Text style={s.settingLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              <Text style={s.settingDesc}>{isDark ? 'Switch to light theme' : 'Switch to dark theme'}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{false: colors.border, true: colors.primary}}
              thumbColor="#FFF"
            />
          </View>

          {/* Real-time logging toggle */}
          <View style={[s.settingRow,{borderBottomWidth:1,borderBottomColor:colors.divider}]}>
            <Text style={{fontSize:20,marginRight:14}}>⚡</Text>
            <View style={{flex:1}}>
              <Text style={s.settingLabel}>Real-time logging</Text>
              <Text style={s.settingDesc}>{profile?.loggingMode==='realtime'?'On — log sets live':'Off — log after workout'}</Text>
            </View>
            <Switch value={profile?.loggingMode==='realtime'} onValueChange={toggleLoggingMode} trackColor={{false:colors.border,true:colors.primary}} thumbColor="#FFF"/>
          </View>

          {settingRows.map((r,i) => (
            <TouchableOpacity key={r.label} style={[s.settingRow, i<settingRows.length-1 && {borderBottomWidth:1,borderBottomColor:colors.divider}]} onPress={r.onPress} activeOpacity={0.7}>
              <Text style={{fontSize:20,marginRight:14}}>{r.icon}</Text>
              <View style={{flex:1}}>
                <Text style={s.settingLabel}>{r.label}</Text>
                <Text style={s.settingDesc} numberOfLines={1}>{r.desc}</Text>
              </View>
              <Text style={{color:colors.textMuted,fontSize:18}}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={s.logoutText}>Log out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.85}>
          <Text style={s.deleteText}>🗑 Delete Account</Text>
        </TouchableOpacity>

        <Text style={s.version}>FitRax v1.0 · Track. Transform. Repeat.</Text>
      </ScrollView>

      {/* Modals */}
      <AvatarPickerModal visible={modal==='avatar'} currentKey={profile?.avatarKey} onSelect={onAvatarSelect} onClose={() => setModal(null)}/>
      <EditProfileModal  visible={modal==='edit'}   profile={profile} userId={user?.id} onSave={onProfileSave} onClose={() => setModal(null)}/>
      <ChangeGoalModal   visible={modal==='goal'}    currentGoal={profile?.goal} userId={user?.id} onSave={onGoalSave} onClose={() => setModal(null)}/>
      <EditEquipmentModal visible={modal==='equipment'} current={profile?.equipment} userId={user?.id} onSave={onEquipmentSave} onClose={() => setModal(null)}/>
      <ChangeLockModal   visible={modal==='lock'}    onSave={onLockSave} onClose={() => setModal(null)}/>
      <ChangePasswordModal visible={modal==='password'} userEmail={profile?.email||user?.email} onClose={() => setModal(null)}/>
    </SafeAreaView>
  );
}

const createStyles = (C) => StyleSheet.create({
  screen: { flex:1, backgroundColor:C.bg },
  scroll: { paddingHorizontal:20, paddingTop:24, paddingBottom:48 },
  header: { alignItems:'center', marginBottom:24 },
  avatarWrap: { position:'relative', marginBottom:14 },
  avatarImg: { width:96, height:96, borderRadius:48, borderWidth:3, borderColor:C.primary },
  avatarFallback: { width:96, height:96, borderRadius:48, backgroundColor:C.primary, alignItems:'center', justifyContent:'center', borderWidth:3, borderColor:C.primary },
  avatarInitial: { fontFamily:'Outfit_700Bold', fontSize:36, color:'#FFF' },
  editBadge: { position:'absolute', bottom:0, right:0, backgroundColor:C.bgCard, borderRadius:14, width:28, height:28, alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:C.border },
  editBadgeText: { fontSize:13 },
  name: { fontFamily:'Outfit_700Bold', fontSize:22, color:C.textPrimary, marginBottom:4 },
  email: { fontFamily:'Outfit_400Regular', fontSize:13, color:C.textSecondary, marginBottom:12 },
  editProfileBtn: { backgroundColor:C.bgCard, borderRadius:20, paddingHorizontal:16, paddingVertical:7, borderWidth:1, borderColor:C.border },
  editProfileText: { fontFamily:'Outfit_600SemiBold', fontSize:13, color:C.primary },
  strip: { flexDirection:'row', backgroundColor:C.bgCard, borderRadius:14, marginBottom:24, padding:16, borderWidth:1, borderColor:C.border },
  stripItem: { flex:1, alignItems:'center' },
  stripVal: { fontFamily:'SpaceMono_700Bold_Italic', fontSize:24, color:C.primary },
  stripLabel: { fontFamily:'Outfit_400Regular', fontSize:12, color:C.textSecondary, marginTop:3 },
  sectionLabel: { fontFamily:'Outfit_600SemiBold', fontSize:11, color:C.textSecondary, letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 },
  card: { backgroundColor:C.bgCard, borderRadius:12, padding:16, borderWidth:1, borderColor:C.border, marginBottom:4 },
  statRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderBottomColor:C.border },
  statLabel: { fontFamily:'Outfit_400Regular', fontSize:14, color:C.textSecondary },
  statVal: { fontFamily:'Outfit_600SemiBold', fontSize:14, color:C.textPrimary },
  chips: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip: { backgroundColor:C.bgCard, borderRadius:20, paddingHorizontal:14, paddingVertical:6, borderWidth:1, borderColor:C.border },
  chipText: { fontFamily:'Outfit_400Regular', fontSize:13, color:C.textSecondary },
  settingRow: { flexDirection:'row', alignItems:'center', paddingVertical:14 },
  settingLabel: { fontFamily:'Outfit_600SemiBold', fontSize:15, color:C.textPrimary, marginBottom:2 },
  settingDesc: { fontFamily:'Outfit_400Regular', fontSize:12, color:C.textSecondary },
  logoutBtn: { marginTop:28, borderWidth:1, borderColor:C.error, borderRadius:12, paddingVertical:15, alignItems:'center' },
  logoutText: { fontFamily:'Outfit_600SemiBold', fontSize:16, color:C.error },
  deleteBtn: { marginTop:12, borderWidth:1, borderColor:'#5A1A1A', borderRadius:12, paddingVertical:15, alignItems:'center', backgroundColor:'rgba(231,76,60,0.06)' },
  deleteText: { fontFamily:'Outfit_600SemiBold', fontSize:15, color:'#E74C3C' },
  version: { fontFamily:'Outfit_400Regular', fontSize:12, color:C.textMuted, textAlign:'center', marginTop:20 },
  weightDelta: { fontFamily:'Outfit_600SemiBold', fontSize:12, marginTop:2 },
});