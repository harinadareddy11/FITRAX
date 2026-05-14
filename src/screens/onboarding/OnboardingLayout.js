// src/screens/onboarding/OnboardingLayout.js
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, GlobalStyles } from '../../theme';

const TOTAL_STEPS = 6;

export default function OnboardingLayout({
  step,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = 'Next →',
  nextDisabled = false,
  loading = false,
  hideBack = false,
  nextVariant = 'primary',
}) {
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* ── Top bar: back btn absolute, dots truly centered ── */}
        <View style={styles.topBar}>
          {!hideBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}

          {/* Dots always centered regardless of back btn */}
          <View style={styles.dotsRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i + 1 === step && styles.dotActive,
                  i + 1 < step  && styles.dotDone,
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* "STEP 1 OF 6" — uppercase, orange, centered */}
          <Text style={styles.stepLabel}>STEP {step} OF {TOTAL_STEPS}</Text>

          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

          <View style={{ marginTop: 28 }}>
            {children}
          </View>
        </ScrollView>

        {/* Next button always pinned to bottom */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              nextVariant === 'green' ? styles.greenBtn : styles.primaryBtn,
              nextDisabled && { opacity: 0.4 },
            ]}
            onPress={onNext}
            disabled={nextDisabled || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.nextText}>{nextLabel}</Text>
            }
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // ── Top bar ──
  topBar: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 44,        // pushed down more
    paddingBottom: 16,
    minHeight: 80,         // increased to match
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    top: 44,
    alignSelf: 'center',
  },
  backText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // ── Progress dots ──
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 22,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  dotDone: {
    backgroundColor: Colors.primary,
    opacity: 0.45,
  },

  // ── Scroll content ──
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 24,
    alignItems: 'stretch', // ensures children fill full width so textAlign center works
  },

  // ── "STEP X OF 6" label ──
  stepLabel: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 12,
    color: Colors.primary,
    letterSpacing: 2,
    textAlign: 'center',
    alignSelf: 'stretch',  // forces full width — fixes centering on all devices
    marginBottom: 10,
  },

  // ── Title ──
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    lineHeight: 32,
    textAlign: 'center',
    alignSelf: 'stretch',  // forces full width — fixes centering on all devices
  },

  // ── Subtitle ──
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
    textAlign: 'center',
    alignSelf: 'stretch',  // forces full width — fixes centering on all devices
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenBtn: {
    backgroundColor: Colors.success,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#000',
  },
});