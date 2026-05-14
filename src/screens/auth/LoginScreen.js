// src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase/client';
import { Colors, GlobalStyles, Typography } from '../../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      // RootNavigator will automatically route to Main/Onboarding
    } catch (e) {
      console.error('LOGIN ERROR:', JSON.stringify(e), e.message, e.status);
      const msg =
        e.message?.toLowerCase().includes('invalid') || e.message?.toLowerCase().includes('credentials')
          ? 'Incorrect email or password.'
          : e.message?.toLowerCase().includes('confirm')
          ? 'Please check your email to confirm your account first.'
          : e.message || 'Login failed. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={Typography.brandLogo}>FITRAX</Text>
          <Text style={[Typography.h2, { marginTop: 32, marginBottom: 6 }]}>Welcome back</Text>
          <Text style={styles.sub}>Log in to continue your streak</Text>

          {!!error && (
            <View style={[GlobalStyles.errorBox, { marginTop: 20 }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={GlobalStyles.input}
              placeholder="you@email.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
            <TextInput
              style={GlobalStyles.input}
              placeholder="Your password"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[GlobalStyles.primaryButton, { marginTop: 28 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={GlobalStyles.primaryButtonText}>Log In →</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={{ alignItems: 'flex-end', marginTop: 10 }}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 20, alignItems: 'center' }}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.switchText}>
              No account yet? <Text style={styles.switchLink}>Create one →</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 24 },
  back: { paddingTop: 16, paddingBottom: 8 },
  backText: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: Colors.textSecondary },
  content: { flex: 1, paddingTop: 20 },
  sub: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: Colors.textSecondary },
  form: { marginTop: 24 },
  label: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  errorText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.error },
  switchText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSecondary },
  switchLink: { color: Colors.primary, fontFamily: 'Outfit_600SemiBold' },
  forgotText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.primary },
});