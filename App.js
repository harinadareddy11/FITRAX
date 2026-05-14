// App.js
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold_Italic,
} from '@expo-google-fonts/space-mono';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/screens/auth/SplashScreen';

ExpoSplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold_Italic,
  });

  useEffect(() => {
    if (fontsLoaded) {
      ExpoSplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Show our animated splash (with dots) while fonts are loading
  // instead of a blank black screen
  if (!fontsLoaded) {
    return (
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
        <SplashScreen state="checking" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <RootNavigator />
    </SafeAreaProvider>
  );
}