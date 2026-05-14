// src/screens/auth/SignupScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../services/supabase/client';
import { Colors, GlobalStyles, Typography } from '../../theme';
import useAuthStore from '../../store/useAuthStore';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { updateOnboardingData } = useAuthStore();

  const handleSignup = async () => {
    if (!name.trim()) { setError('Enter your name.'); return; }
    if (!email.trim()) { setError('Enter your email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setError('');
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Disable email confirmation for dev — enable in production
          emailRedirectTo: undefined,
        },
      });
      if (authError) throw authError;

      const uid = data.user?.id;
      if (uid) {
        updateOnboardingData({ name: name.trim() });
        // Non-blocking — don't fail signup if profile update has issues
        supabase.from('profiles').update({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          onboarding_completed: false,
        }).eq('id', uid).then(({ error }) => {
          if (error) console.warn('Profile update warning:', error.message);
        });
      }
      // RootNavigator will detect onboarding_completed: false → go to Onboarding
    } catch (e) {
      console.error('SIGNUP ERROR:', JSON.stringify(e), e.message, e.status);
      const msg =
        e.message?.toLowerCase().includes('already registered') || e.message?.toLowerCase().includes('already been registered') || e.message?.toLowerCase().includes('already exists')
          ? 'This email is already registered. Log in instead.'
          : e.message?.toLowerCase().includes('valid email')
          ? 'Enter a valid email address.'
          : e.message?.toLowerCase().includes('password')
          ? 'Password is too weak. Use 6+ characters.'
          : e.message || 'Signup failed. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={Typography.brandLogo}>FITRAX</Text>
          <Text style={[Typography.h2, { marginTop: 32, marginBottom: 6 }]}>Create your account</Text>
          <Text style={styles.sub}>Takes 2 minutes. Free forever.</Text>

          {!!error && (
            <View style={[GlobalStyles.errorBox, { marginTop: 20 }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            {[
              { label: 'Your name', value: name, setter: setName, placeholder: 'Hari', type: 'default' },
              { label: 'Email', value: email, setter: setEmail, placeholder: 'you@email.com', type: 'email-address' },
              { label: 'Password', value: password, setter: setPassword, placeholder: 'Min 6 characters', secure: true },
            ].map((f, i) => (
              <View key={i} style={{ marginTop: i > 0 ? 16 : 0 }}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={GlobalStyles.input}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  value={f.value}
                  onChangeText={f.setter}
                  keyboardType={f.type || 'default'}
                  autoCapitalize={f.type === 'email-address' ? 'none' : 'words'}
                  autoCorrect={false}
                  secureTextEntry={f.secure || false}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[GlobalStyles.primaryButton, { marginTop: 28 }]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={GlobalStyles.primaryButtonText}>Create Account →</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 20, alignItems: 'center', paddingBottom: 40 }}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchLink}>Log in →</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 24 },
  back: { paddingTop: 16, paddingBottom: 8 },
  backText: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: Colors.textSecondary },
  sub: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: Colors.textSecondary },
  form: { marginTop: 24 },
  label: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  errorText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.error },
  switchText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSecondary },
  switchLink: { color: Colors.primary, fontFamily: 'Outfit_600SemiBold' },
});