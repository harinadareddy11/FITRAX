import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator, Alert, Switch } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../services/supabase/client';
import { Colors, GlobalStyles } from '../../theme';

const GOALS = [
  { key:'muscle_gain', label:'Muscle Gain 💪', desc:'Build size & strength' },
  { key:'fat_loss',    label:'Fat Loss 🔥',    desc:'Burn fat, stay lean' },
  { key:'maintain',   label:'Maintain ⚖️',    desc:'Keep current physique' },
  { key:'general',    label:'General Fitness 🏃', desc:'Overall health' },
];

const EQUIPMENT = ['Full Gym','Dumbbells Only','Single Dumbbell','Barbell','Cables','Resistance Bands','Bodyweight Only','Pull-up Bar'];

// ── Edit basic profile info ───────────────────────────────────────────────────
export function EditProfileModal({ visible, profile, userId, onSave, onClose }) {
  const [name,   setName]   = useState(profile?.name   || '');
  const [age,    setAge]    = useState(String(profile?.age    || ''));
  const [weight, setWeight] = useState(String(profile?.weight || ''));
  const [height, setHeight] = useState(String(profile?.height || ''));
  const [budget, setBudget] = useState(String(profile?.dietBudget || ''));
  const [saving, setSaving] = useState(false);

  const bmi = weight && height ? (parseFloat(weight) / Math.pow(parseFloat(height)/100, 2)).toFixed(1) : null;

  const save = async () => {
    setSaving(true);
    try {
      const updates = { name: name.trim(), age: parseInt(age)||null, weight: parseFloat(weight)||null, height: parseFloat(height)||null, bmi: bmi ? parseFloat(bmi) : null, diet_budget: parseInt(budget)||200 };
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;
      onSave(updates);
    } catch(e) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const fields = [
    { label:'Name', value:name, setter:setName, keyboard:'default' },
    { label:'Age', value:age, setter:setAge, keyboard:'number-pad', suffix:'years' },
    { label:'Weight', value:weight, setter:setWeight, keyboard:'decimal-pad', suffix:'kg' },
    { label:'Height', value:height, setter:setHeight, keyboard:'decimal-pad', suffix:'cm' },
    { label:'Diet Budget', value:budget, setter:setBudget, keyboard:'number-pad', prefix:'₹', suffix:'/day' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.row}><Text style={s.title}>Edit Profile</Text><TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>✕</Text></TouchableOpacity></View>
          <ScrollView showsVerticalScrollIndicator={false} style={{paddingHorizontal:20}}>
            {fields.map(f => (
              <View key={f.label} style={{marginTop:14}}>
                <Text style={s.label}>{f.label}</Text>
                <View style={s.inputRow}>
                  {f.prefix && <Text style={s.affix}>{f.prefix}</Text>}
                  <TextInput style={[GlobalStyles.input,{flex:1}]} value={f.value} onChangeText={f.setter} keyboardType={f.keyboard} placeholder={f.label} placeholderTextColor={Colors.textMuted} />
                  {f.suffix && <Text style={s.affix}>{f.suffix}</Text>}
                </View>
              </View>
            ))}
            {bmi && <View style={s.bmiBox}><Text style={s.bmiText}>BMI Preview: <Text style={{color:Colors.primary}}>{bmi}</Text></Text></View>}
            <TouchableOpacity style={[GlobalStyles.primaryButton,{marginTop:20,marginBottom:40}]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF"/> : <Text style={GlobalStyles.primaryButtonText}>Save Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Change Goal ───────────────────────────────────────────────────────────────
export function ChangeGoalModal({ visible, currentGoal, userId, onSave, onClose }) {
  const [selected, setSelected] = useState(currentGoal);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await supabase.from('profiles').update({ goal: selected }).eq('id', userId);
      onSave(selected);
    } catch(e) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={[s.row,{paddingHorizontal:20,paddingTop:20,paddingBottom:12,borderBottomWidth:1,borderBottomColor:Colors.border}]}>
            <Text style={s.title}>Change Goal</Text>
            <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <View style={{padding:20}}>
            {GOALS.map(g => (
              <TouchableOpacity key={g.key} style={[s.goalCard, selected===g.key && s.goalSelected]} onPress={() => setSelected(g.key)} activeOpacity={0.8}>
                <Text style={s.goalLabel}>{g.label}</Text>
                <Text style={s.goalDesc}>{g.desc}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[GlobalStyles.primaryButton,{marginTop:16}]} onPress={save} disabled={saving||selected===currentGoal}>
              {saving ? <ActivityIndicator color="#FFF"/> : <Text style={GlobalStyles.primaryButtonText}>Update Goal</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Edit Equipment ────────────────────────────────────────────────────────────
export function EditEquipmentModal({ visible, current, userId, onSave, onClose }) {
  const [selected, setSelected] = useState(current || []);
  const [saving, setSaving] = useState(false);

  const toggle = (item) => setSelected(prev => prev.includes(item) ? prev.filter(x=>x!==item) : [...prev, item]);

  const save = async () => {
    if (!selected.length) { Alert.alert('Select at least one'); return; }
    setSaving(true);
    try {
      await supabase.from('profiles').update({ equipment: selected }).eq('id', userId);
      onSave(selected);
    } catch(e) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={[s.row,{paddingHorizontal:20,paddingTop:20,paddingBottom:12,borderBottomWidth:1,borderBottomColor:Colors.border}]}>
            <Text style={s.title}>Edit Equipment</Text>
            <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <View style={{padding:20}}>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:20}}>
              {EQUIPMENT.map(eq => {
                const on = selected.includes(eq);
                return (
                  <TouchableOpacity key={eq} style={[s.chip, on && s.chipOn]} onPress={() => toggle(eq)} activeOpacity={0.8}>
                    <Text style={[s.chipText, on && s.chipTextOn]}>{eq}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={GlobalStyles.primaryButton} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF"/> : <Text style={GlobalStyles.primaryButtonText}>Save Equipment</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Change App Lock ───────────────────────────────────────────────────────────
export function ChangeLockModal({ visible, onSave, onClose }) {
  const [step,  setStep]  = useState('choose'); // choose | setpin
  const [type,  setType]  = useState('none');
  const [pin,   setPin]   = useState('');
  const [pin2,  setPin2]  = useState('');
  const [saving,setSaving]= useState(false);

  const choose = async (t) => {
    if (t === 'biometric') {
      const hw  = await LocalAuthentication.hasHardwareAsync();
      const enr = await LocalAuthentication.isEnrolledAsync();
      if (!hw || !enr) { Alert.alert('Biometric not available','Set up fingerprint/face ID in phone settings first.'); return; }
    }
    setType(t);
    if (t === 'pin') { setStep('setpin'); return; }
    save(t, null);
  };

  const save = async (lockType, lockPin) => {
    setSaving(true);
    try {
      await SecureStore.setItemAsync('fitrax_lock_type', lockType);
      if (lockType === 'pin' && lockPin) await SecureStore.setItemAsync('fitrax_pin', lockPin);
      else await SecureStore.deleteItemAsync('fitrax_pin').catch(()=>{});
      onSave(lockType);
    } catch(e) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const confirmPin = () => {
    if (pin.length < 4) { Alert.alert('PIN must be at least 4 digits'); return; }
    if (pin !== pin2)   { Alert.alert('PINs do not match'); return; }
    save('pin', pin);
  };

  const close = () => { setStep('choose'); setPin(''); setPin2(''); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={[s.row,{paddingHorizontal:20,paddingTop:20,paddingBottom:12,borderBottomWidth:1,borderBottomColor:Colors.border}]}>
            <Text style={s.title}>{step==='choose'?'App Lock':'Set PIN'}</Text>
            <TouchableOpacity onPress={close}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <View style={{padding:20}}>
            {step === 'choose' ? (
              <>
                {[
                  {key:'none',  icon:'🔓', label:'No Lock',    desc:'Progress screen is open to anyone'},
                  {key:'pin',   icon:'🔢', label:'PIN Lock',   desc:'4+ digit PIN to unlock progress'},
                  {key:'biometric', icon:'👆', label:'Biometric', desc:'Fingerprint or Face ID'},
                ].map(o => (
                  <TouchableOpacity key={o.key} style={s.lockOption} onPress={() => choose(o.key)} activeOpacity={0.8}>
                    <Text style={{fontSize:24}}>{o.icon}</Text>
                    <View style={{flex:1,marginLeft:14}}>
                      <Text style={s.lockLabel}>{o.label}</Text>
                      <Text style={s.lockDesc}>{o.desc}</Text>
                    </View>
                    {saving && type===o.key && <ActivityIndicator color={Colors.primary}/>}
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <Text style={s.label}>New PIN</Text>
                <TextInput style={[GlobalStyles.input,{marginTop:8,marginBottom:14,letterSpacing:8,fontSize:20}]} value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry maxLength={8} placeholder="····" placeholderTextColor={Colors.textMuted}/>
                <Text style={s.label}>Confirm PIN</Text>
                <TextInput style={[GlobalStyles.input,{marginTop:8,marginBottom:20,letterSpacing:8,fontSize:20}]} value={pin2} onChangeText={setPin2} keyboardType="number-pad" secureTextEntry maxLength={8} placeholder="····" placeholderTextColor={Colors.textMuted}/>
                <TouchableOpacity style={GlobalStyles.primaryButton} onPress={confirmPin} disabled={saving}>
                  {saving ? <ActivityIndicator color="#FFF"/> : <Text style={GlobalStyles.primaryButtonText}>Set PIN</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={{marginTop:12,alignItems:'center'}} onPress={()=>setStep('choose')}>
                  <Text style={{color:Colors.textSecondary,fontFamily:'Outfit_400Regular'}}>← Back</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Change Password ───────────────────────────────────────────────────────────
export function ChangePasswordModal({ visible, userEmail, onClose }) {
  const [current, setCurrent] = useState('');
  const [next,    setNext]    = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving,  setSaving]  = useState(false);

  const save = async () => {
    if (next.length < 6) { Alert.alert('Password too short','Use at least 6 characters.'); return; }
    if (next !== confirm) { Alert.alert('Passwords do not match'); return; }
    setSaving(true);
    try {
      // Re-authenticate with current password
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: userEmail, password: current });
      if (authErr) throw new Error('Current password is wrong.');
      // Update to new password
      const { error: updateErr } = await supabase.auth.updateUser({ password: next });
      if (updateErr) throw updateErr;
      Alert.alert('Password changed!','Your password has been updated.');
      setCurrent(''); setNext(''); setConfirm('');
      onClose();
    } catch(e) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={[s.row,{paddingHorizontal:20,paddingTop:20,paddingBottom:12,borderBottomWidth:1,borderBottomColor:Colors.border}]}>
            <Text style={s.title}>Change Password</Text>
            <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <View style={{padding:20}}>
            {[
              {label:'Current Password', value:current, setter:setCurrent},
              {label:'New Password',     value:next,    setter:setNext},
              {label:'Confirm New',      value:confirm, setter:setConfirm},
            ].map(f => (
              <View key={f.label} style={{marginBottom:14}}>
                <Text style={s.label}>{f.label}</Text>
                <TextInput style={[GlobalStyles.input,{marginTop:6}]} value={f.value} onChangeText={f.setter} secureTextEntry placeholder={f.label} placeholderTextColor={Colors.textMuted}/>
              </View>
            ))}
            <TouchableOpacity style={[GlobalStyles.primaryButton,{marginTop:8}]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF"/> : <Text style={GlobalStyles.primaryButtonText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'flex-end' },
  sheet: { backgroundColor:'#1A1A1C', borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'85%' },
  row: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  title: { fontFamily:'Outfit_700Bold', fontSize:18, color:'#FFF' },
  closeBtn: { color:'#666', fontSize:20, padding:4 },
  label: { fontFamily:'Outfit_600SemiBold', fontSize:13, color:Colors.textSecondary },
  inputRow: { flexDirection:'row', alignItems:'center', gap:8, marginTop:6 },
  affix: { fontFamily:'Outfit_600SemiBold', fontSize:15, color:Colors.textSecondary },
  bmiBox: { marginTop:12, backgroundColor:'rgba(230,92,0,0.1)', borderRadius:10, padding:12, borderWidth:1, borderColor:'rgba(230,92,0,0.3)' },
  bmiText: { fontFamily:'Outfit_400Regular', fontSize:14, color:Colors.textSecondary },
  goalCard: { backgroundColor:Colors.bgCard, borderRadius:14, padding:16, marginBottom:10, borderWidth:1.5, borderColor:Colors.border },
  goalSelected: { borderColor:Colors.primary, backgroundColor:'rgba(230,92,0,0.08)' },
  goalLabel: { fontFamily:'Outfit_700Bold', fontSize:16, color:'#FFF', marginBottom:4 },
  goalDesc: { fontFamily:'Outfit_400Regular', fontSize:13, color:Colors.textSecondary },
  chip: { paddingHorizontal:14, paddingVertical:8, backgroundColor:Colors.bgCard, borderRadius:20, borderWidth:1.5, borderColor:Colors.border },
  chipOn: { borderColor:Colors.primary, backgroundColor:'rgba(230,92,0,0.15)' },
  chipText: { fontFamily:'Outfit_400Regular', fontSize:13, color:Colors.textSecondary },
  chipTextOn: { color:Colors.primary, fontFamily:'Outfit_600SemiBold' },
  lockOption: { flexDirection:'row', alignItems:'center', backgroundColor:Colors.bgCard, borderRadius:14, padding:16, marginBottom:10, borderWidth:1, borderColor:Colors.border },
  lockLabel: { fontFamily:'Outfit_600SemiBold', fontSize:15, color:'#FFF', marginBottom:2 },
  lockDesc: { fontFamily:'Outfit_400Regular', fontSize:12, color:Colors.textSecondary },
});
