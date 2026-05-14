// src/screens/onboarding/BiometricSetupScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Animated, ScrollView,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const KEYPAD = [
  { key: '1', sub: '' },
  { key: '2', sub: 'ABC' },
  { key: '3', sub: 'DEF' },
  { key: '4', sub: 'GHI' },
  { key: '5', sub: 'JKL' },
  { key: '6', sub: 'MNO' },
  { key: '7', sub: 'PQRS' },
  { key: '8', sub: 'TUV' },
  { key: '9', sub: 'WXYZ' },
  { key: '', sub: '' },
  { key: '0', sub: '' },
  { key: '⌫', sub: '' },
];

function PinDots({ pin, error }) {
  return (
    <View style={styles.pinDots}>
      {[0, 1, 2, 3].map(i => (
        <View
          key={i}
          style={[
            styles.pinDot,
            i < pin.length && (error ? styles.pinDotError : styles.pinDotFilled),
          ]}
        />
      ))}
    </View>
  );
}

function Keypad({ onPress }) {
  return (
    <View style={styles.keypad}>
      {KEYPAD.map((k, i) => (
        k.key === '' ? (
          <View key={i} style={styles.keyEmpty} />
        ) : (
          <TouchableOpacity
            key={i}
            style={styles.key}
            onPress={() => onPress(k.key)}
            activeOpacity={0.6}
          >
            <Text style={styles.keyNum}>{k.key}</Text>
            {k.sub ? <Text style={styles.keySub}>{k.sub}</Text> : null}
          </TouchableOpacity>
        )
      ))}
    </View>
  );
}

export default function BiometricSetupScreen({ navigation }) {
  const [stage, setStage] = useState('init');
  // stages: init | fingerprint | no_fingerprint | pin_setup | pin_confirm | success
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (compatible && enrolled) {
      setStage('fingerprint');
    } else {
      setStage('no_fingerprint');
    }
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleEnableFingerprint = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Touch sensor to confirm',
      disableDeviceFallback: true,
    });
    if (result.success) {
      await SecureStore.setItemAsync('fitrax_lock_type', 'biometric');
      setStage('success');
    }
  };

  const handleKeyPress = (k) => {
    if (stage === 'pin_setup') {
      if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
      const next = pin + k;
      if (next.length <= 4) {
        setPin(next);
        if (next.length === 4) setTimeout(() => setStage('pin_confirm'), 250);
      }
    } else if (stage === 'pin_confirm') {
      if (k === '⌫') { setConfirmPin(p => p.slice(0, -1)); setPinError(false); return; }
      const next = confirmPin + k;
      if (next.length <= 4) {
        setConfirmPin(next);
        if (next.length === 4) {
          setTimeout(async () => {
            if (next === pin) {
              await SecureStore.setItemAsync('fitrax_lock_type', 'pin');
              await SecureStore.setItemAsync('fitrax_pin', next);
              setStage('success');
            } else {
              shake();
              setPinError(true);
              setConfirmPin('');
            }
          }, 150);
        }
      }
    }
  };

  const handleSkip = async () => {
    await SecureStore.setItemAsync('fitrax_lock_type', 'none');
    navigation.navigate('OnboardingComplete');
  };

  // ── LOADING / INIT ─────────────────────────────────────────
  if (stage === 'init') {
    return <View style={styles.screen} />;
  }

  // ── FINGERPRINT AVAILABLE ──────────────────────────────────
  if (stage === 'fingerprint') {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.almostDoneWrap}>
            <Text style={styles.almostDone}>ALMOST DONE</Text>
          </View>
          <Text style={styles.pageTitle}>Lock your app?</Text>
          <Text style={styles.pageSub}>Protect your progress photos</Text>

          {/* Fingerprint card */}
          <View style={styles.fpCard}>
            <View style={styles.fpCircle}>
              <Text style={styles.fpIcon}>👆</Text>
            </View>
            <Text style={styles.fpTitle}>Use Your Fingerprint</Text>
            <Text style={styles.fpDesc}>
              Uses your{' '}
              <Text style={styles.fpHighlight}>existing phone fingerprint.</Text>
              {'\n'}Same one you use to unlock your phone.{'\n'}No new registration needed.
            </Text>
          </View>

          {/* Privacy note */}
          <View style={styles.privacyBox}>
            <Text style={styles.privacyText}>
              FitRax{' '}
              <Text style={styles.fpHighlight}>never stores your fingerprint.</Text>
              {' '}Android handles all verification — we only get yes/no.
            </Text>
          </View>
        </ScrollView>

        {/* Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.orangeBtn} onPress={handleEnableFingerprint} activeOpacity={0.85}>
            <Text style={styles.orangeBtnText}>Enable Fingerprint Lock 👆</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={() => { setPin(''); setStage('pin_setup'); }}>
            <Text style={styles.ghostBtnText}>Use PIN instead</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipLink} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip — no lock for now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── NO FINGERPRINT ─────────────────────────────────────────
  if (stage === 'no_fingerprint') {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.almostDoneWrap}>
            <Text style={styles.almostDone}>ALMOST DONE</Text>
          </View>
          <Text style={styles.pageTitle}>Protect your app</Text>
          <Text style={styles.pageSub}>No fingerprint found on this phone</Text>

          {/* Info box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxHighlight}>Fingerprint not set up</Text>
            <Text style={styles.infoBoxText}> on this device. Set a PIN instead, or add fingerprint in Phone Settings first.</Text>
          </View>

          {/* PIN option */}
          <View style={styles.pinOptionCard}>
            <Text style={styles.pinOptionIcon}>🔢</Text>
            <View>
              <Text style={styles.pinOptionTitle}>Set a 4-Digit PIN</Text>
              <Text style={styles.pinOptionSub}>Secure alternative to fingerprint.</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.orangeBtn} onPress={() => { setPin(''); setStage('pin_setup'); }} activeOpacity={0.85}>
            <Text style={styles.orangeBtnText}>Set Up PIN →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={handleSkip}>
            <Text style={styles.ghostBtnText}>Skip — add lock later in Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── PIN SETUP ──────────────────────────────────────────────
  if (stage === 'pin_setup') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.pinScreen}>
          <Text style={styles.pinLogo}>FITRAX</Text>
          <Text style={styles.pinTitle}>Create your PIN</Text>
          <Text style={styles.pinSub}>Used to lock the app on open</Text>
          <PinDots pin={pin} error={false} />
          <Keypad onPress={handleKeyPress} />
          <View style={styles.pinHintBox}>
            <Text style={styles.pinHintText}>Choose 4 digits you'll remember. Don't use your phone unlock PIN.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── PIN CONFIRM ────────────────────────────────────────────
  if (stage === 'pin_confirm') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.pinScreen}>
          <Text style={styles.pinLogo}>FITRAX</Text>
          <Text style={styles.pinTitle}>Confirm your PIN</Text>
          <Text style={[styles.pinSub, pinError && { color: '#E74C3C' }]}>
            {pinError ? 'PINs don\'t match — try again' : 'Enter the same PIN again'}
          </Text>
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <PinDots pin={confirmPin} error={pinError} />
          </Animated.View>
          <Keypad onPress={handleKeyPress} />
          {pinError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>
                <Text style={{ fontFamily: 'Outfit_700Bold' }}>PIN mismatch.</Text>
                {' '}Cleared automatically — enter your PIN again from scratch.
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── SUCCESS ────────────────────────────────────────────────
  if (stage === 'success') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.successScreen}>
          <View style={styles.successCircle}>
            <Text style={{ fontSize: 44 }}>🔒</Text>
          </View>
          <Text style={styles.successTitle}>PIN Created!</Text>
          <Text style={styles.successSub}>Your app is now protected.{'\n'}Use your PIN or fingerprint to open FitRax.</Text>

          <View style={styles.successList}>
            {[
              'App locked at every open',
              '5 min grace period active',
              'Photos hidden from gallery',
              'Change PIN anytime in Settings',
            ].map((item, i) => (
              <View key={i} style={[styles.successItem, i < 3 && styles.successItemBorder]}>
                <Text style={styles.successItemText}>✓  {item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.greenBtn}
            onPress={() => navigation.navigate('OnboardingComplete')}
            activeOpacity={0.85}
          >
            <Text style={styles.greenBtnText}>Continue to App →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D0D0D' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
  almostDoneWrap: { alignItems: 'center', marginBottom: 12, marginTop: 10 },
  almostDone: {
    fontFamily: 'Outfit_700Bold', fontSize: 12,
    color: '#E65C00', letterSpacing: 2,
  },
  pageTitle: {
    fontFamily: 'Outfit_700Bold', fontSize: 28,
    color: '#FFFFFF', textAlign: 'center', marginBottom: 6,
  },
  pageSub: {
    fontFamily: 'Outfit_400Regular', fontSize: 14,
    color: '#888888', textAlign: 'center', marginBottom: 24,
  },
  // Fingerprint card
  fpCard: {
    backgroundColor: '#1A1A1A', borderRadius: 14,
    padding: 20, alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  fpCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#2A1500', borderWidth: 3, borderColor: '#E65C00',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  fpIcon: { fontSize: 44 },
  fpTitle: {
    fontFamily: 'Outfit_700Bold', fontSize: 18,
    color: '#FFFFFF', marginBottom: 10,
  },
  fpDesc: {
    fontFamily: 'Outfit_400Regular', fontSize: 13,
    color: '#888888', textAlign: 'center', lineHeight: 22,
  },
  fpHighlight: {
    color: '#E65C00', fontFamily: 'Outfit_700Bold',
  },
  privacyBox: {
    backgroundColor: '#1A1A1A', borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: '#2A2A2A',
  },
  privacyText: {
    fontFamily: 'Outfit_400Regular', fontSize: 13,
    color: '#888888', lineHeight: 20,
  },
  // No fingerprint
  infoBox: {
    backgroundColor: '#0D1A2A', borderRadius: 10,
    padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: '#1A3A5A',
  },
  infoBoxHighlight: {
    fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#3498DB',
  },
  infoBoxText: {
    fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#888888',
  },
  pinOptionCard: {
    backgroundColor: '#0D1A2A', borderRadius: 10,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: '#1A3A5A',
  },
  pinOptionIcon: { fontSize: 28 },
  pinOptionTitle: {
    fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#FFFFFF', marginBottom: 3,
  },
  pinOptionSub: {
    fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#888888',
  },
  // Footer
  footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
  orangeBtn: {
    backgroundColor: '#E65C00', borderRadius: 12,
    paddingVertical: 18, alignItems: 'center',
  },
  orangeBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#FFFFFF' },
  ghostBtn: {
    borderWidth: 1, borderColor: '#333333', borderRadius: 12,
    paddingVertical: 17, alignItems: 'center',
  },
  ghostBtnText: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#888888' },
  skipLink: { alignItems: 'center', paddingVertical: 6 },
  skipText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#555555' },
  // PIN screens
  pinScreen: { flex: 1, alignItems: 'center', paddingTop: 40 },
  pinLogo: {
    fontFamily: 'Outfit_700Bold', fontSize: 28,
    color: '#E65C00', letterSpacing: 4, marginBottom: 28,
  },
  pinTitle: {
    fontFamily: 'Outfit_700Bold', fontSize: 22,
    color: '#FFFFFF', marginBottom: 6,
  },
  pinSub: {
    fontFamily: 'Outfit_400Regular', fontSize: 14,
    color: '#888888', marginBottom: 28,
  },
  pinDots: {
    flexDirection: 'row', gap: 18, marginBottom: 36,
  },
  pinDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#333333',
    backgroundColor: 'transparent',
  },
  pinDotFilled: { backgroundColor: '#E65C00', borderColor: '#E65C00' },
  pinDotError: { backgroundColor: '#E74C3C', borderColor: '#E74C3C' },
  keypad: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10, width: '100%',
  },
  key: {
    width: '30%', aspectRatio: 1.5,
    backgroundColor: '#1A1A1A', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  keyEmpty: { width: '30%', aspectRatio: 1.5 },
  keyNum: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#FFFFFF' },
  keySub: { fontFamily: 'Outfit_400Regular', fontSize: 10, color: '#555555', marginTop: 1 },
  pinHintBox: {
    marginHorizontal: 24, marginTop: 16,
    backgroundColor: '#1A1A1A', borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: '#2A2A2A',
    width: '90%',
  },
  pinHintText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#888888', lineHeight: 20 },
  errorBox: {
    marginHorizontal: 24, marginTop: 12,
    backgroundColor: '#2E0D0D', borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: '#4A1A1A',
    width: '90%',
  },
  errorBoxText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#E74C3C', lineHeight: 20 },
  // Success
  successScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  successCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#0D2E1A', borderWidth: 3, borderColor: '#2ECC71',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: {
    fontFamily: 'Outfit_700Bold', fontSize: 30,
    color: '#FFFFFF', marginBottom: 10,
  },
  successSub: {
    fontFamily: 'Outfit_400Regular', fontSize: 15,
    color: '#888888', textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  successList: {
    width: '100%', backgroundColor: '#0D2E1A',
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#1A4A2E',
  },
  successItem: { paddingVertical: 10 },
  successItemBorder: { borderBottomWidth: 1, borderBottomColor: '#1A4A2E' },
  successItemText: {
    fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#2ECC71',
  },
  greenBtn: {
    backgroundColor: '#2ECC71', borderRadius: 12,
    paddingVertical: 18, alignItems: 'center',
  },
  greenBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#FFFFFF' },
});