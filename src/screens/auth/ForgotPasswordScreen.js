// src/screens/auth/ForgotPasswordScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase/client';
import { Colors } from '../../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState('');

  const handleSend = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: 'https://fitrax.app/reset-password' }
      );
      if (authError) throw authError;
      setSent(true);
    } catch (e) {
      setError(e.message || 'Failed to send reset email. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.body}>
          <Text style={styles.logo}>FITRAX</Text>
          <Text style={styles.title}>Reset Password</Text>

          {sent ? (
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>📧</Text>
              <Text style={styles.successTitle}>Check your email</Text>
              <Text style={styles.successSub}>
                We sent a password reset link to{'\n'}
                <Text style={{ color: Colors.primary }}>{email.trim()}</Text>
              </Text>
              <Text style={styles.successHint}>
                Check your spam folder if you don't see it within 2 minutes.
              </Text>
              <TouchableOpacity style={styles.backToLoginBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.subtitle}>
                Enter your account email and we'll send you a link to reset your password.
              </Text>

              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />

              {!!error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity
                style={[styles.btn, (!email.trim() || loading) && { opacity: 0.5 }]}
                onPress={handleSend}
                disabled={!email.trim() || loading}
              >
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.btnText}>Send Reset Link</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  back: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  backText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSecondary },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 20 },
  logo: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: Colors.primary, letterSpacing: 4, marginBottom: 20 },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 30, color: '#FFF', marginBottom: 10 },
  subtitle: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 32 },
  label: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: Colors.textSecondary, letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: '#1C1C1E', borderRadius: 12, paddingVertical: 16,
    paddingHorizontal: 18, fontFamily: 'Outfit_400Regular', fontSize: 15,
    color: '#FFF', marginBottom: 12,
  },
  error: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#E74C3C', marginBottom: 12 },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 17, alignItems: 'center', marginTop: 8,
  },
  btnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#000' },
  // Success state
  successBox: { alignItems: 'center', paddingTop: 20 },
  successIcon: { fontSize: 52, marginBottom: 20 },
  successTitle: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: '#FFF', marginBottom: 12 },
  successSub: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 16 },
  successHint: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 32 },
  backToLoginBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 40 },
  backToLoginText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#000' },
});
