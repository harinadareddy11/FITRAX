// src/navigation/RootNavigator.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';
import { supabase, mapProfile } from '../services/supabase/client';
import useAuthStore from '../store/useAuthStore';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainTabNavigator from './MainTabNavigator';
import SplashScreen from '../screens/auth/SplashScreen';
import useOfflineSync from '../hooks/useOfflineSync';
import { ThemeProvider } from '../context/ThemeContext';

const FitRaxTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0D0D0D', // Matches app background
  },
};

// Shown only when user is logged in — owns the NetInfo sync listener
function AppWithSync() {
  const { isOnline, pendingCount, syncing } = useOfflineSync();
  const showBanner = !isOnline || syncing || pendingCount > 0;
  return (
    <>
      {showBanner && (
        <View style={s.banner}>
          <Text style={s.bannerText}>
            {!isOnline
              ? '📴 Offline — data saved locally'
              : syncing
                ? `🔄 Syncing ${pendingCount} item${pendingCount !== 1 ? 's' : ''}...`
              : `☁️ ${pendingCount} item${pendingCount !== 1 ? 's' : ''} waiting to sync`}
          </Text>
        </View>
      )}
      <MainTabNavigator />
    </>
  );
}

const s = StyleSheet.create({
  banner: {
    backgroundColor: '#1C1C1E', paddingVertical: 7, paddingHorizontal: 16,
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2C2C2E',
  },
  bannerText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#E65C00' },
});

export default function RootNavigator() {
  const { user, setUser, setUserProfile } = useAuthStore();
  // 'checking' → initial load  |  'loading' → fetching profile  |  'done' → ready
  const [authState, setAuthState] = useState('checking');
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const handleUser = async (supabaseUser) => {
    if (supabaseUser) {
      setAuthState('loading');
      setUser(supabaseUser);
      try {
        const { data } = await supabase
          .from('profiles').select('*').eq('id', supabaseUser.id).single();
        if (data) {
          const profile = mapProfile(data);
          setUserProfile(profile);
          setOnboardingCompleted(profile.onboardingCompleted === true);
        }
      } catch (e) {
        console.log('Profile fetch error:', e);
      }
      setAuthState('done');
    } else {
      setUser(null);
      setUserProfile(null);
      setOnboardingCompleted(false);
      setAuthState('done');
    }
  };

  useEffect(() => {
    // onAuthStateChange fires with event = 'INITIAL_SESSION' on mount and
    // delivers the persisted session from AsyncStorage automatically.
    // This is the recommended pattern for React Native — no need for getSession().
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // INITIAL_SESSION fires once on mount with the stored session (or null).
        // SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED fire for subsequent changes.
        handleUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  if (authState === 'checking') return <SplashScreen state="checking" />;
  if (authState === 'loading')  return <SplashScreen state="loading" />;

  return (
    <ThemeProvider>
      <NavigationContainer theme={FitRaxTheme}>
        {!user ? (
          <AuthNavigator />
        ) : !onboardingCompleted ? (
          <OnboardingNavigator onComplete={() => setOnboardingCompleted(true)} />
        ) : (
          <AppWithSync />
        )}
      </NavigationContainer>
    </ThemeProvider>
  );
}