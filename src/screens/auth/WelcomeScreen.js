// src/screens/auth/WelcomeScreen.js
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>

      {/* Logo section — upper portion, not dead center */}
      <View style={styles.logoSection}>
        <Text style={styles.logo}>FITRAX</Text>
        <Text style={styles.tagline} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>TRACK. TRANSFORM. REPEAT.</Text>

        {/* Large gap between tagline and subtitle */}
        <View style={styles.gap} />

        <Text style={styles.subtitle}>Your private gym companion.</Text>
        <Text style={styles.subtitle}>Built for Indian gym-goers.</Text>
      </View>

      {/* Buttons pinned to bottom */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Signup')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Get Started →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ghostBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.ghostBtnText}>I already have an account</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 16,
  },

  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
    width: '100%',
    overflow: 'visible',
  },

  // FITRAX — massive, fills width, bold, orange
  logo: {
    fontFamily: 'Outfit_900Black',
    fontSize: 72,
    color: '#E85400',
    letterSpacing: 2,            // minimal spacing so text stays inside
    textAlign: 'center',
    lineHeight: 76,
    fontWeight: '900',
  },

  tagline: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: '#555555',
    letterSpacing: 5,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
    alignSelf: 'stretch',
  },

  // Gap between tagline and subtitle
  gap: { height: 52 },

  // Subtitle lines
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 26,
  },

  // Buttons at bottom
  buttonSection: {
    paddingBottom: 40,
    gap: 10,
  },

  // Get Started — orange bg, black bold text, rounded
  primaryBtn: {
    backgroundColor: '#E85400',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 17,
    color: '#000000',            // black text on orange — matches wireframe
  },

  // I already have an account — no border, just gray text
  ghostBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#1A1A1A',  // very subtle dark bg — matches wireframe faint box
  },
  ghostBtnText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#666666',
  },
});