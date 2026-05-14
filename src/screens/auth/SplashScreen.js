// src/screens/auth/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function SplashScreen({ state = 'checking' }) {
  // state: 'checking' | 'loading'

  // Logo fade-in on mount
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.88)).current;

  // Three dots — scale + opacity
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;

  // Progress bar for 'loading' state
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Logo entrance — runs once
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  // Dots / progress based on state
  useEffect(() => {
    let stopped = false;

    if (state === 'checking') {
      // Reset all dots to 0 scale
      d1.setValue(0); d2.setValue(0); d3.setValue(0);

      const bounce = (dot) =>
        Animated.sequence([
          Animated.spring(dot, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 250, useNativeDriver: true }),
        ]);

      const loop = () => {
        if (stopped) return;
        Animated.sequence([
          bounce(d1),
          bounce(d2),
          bounce(d3),
          Animated.delay(200),
        ]).start(({ finished }) => {
          if (finished && !stopped) loop();
        });
      };
      loop();
    }

    if (state === 'loading') {
      d1.setValue(0); d2.setValue(0); d3.setValue(0);
      progressAnim.setValue(0);

      // All 3 dots pulse together while loading
      const pulse = () => {
        if (stopped) return;
        Animated.sequence([
          Animated.parallel([
            Animated.spring(d1, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
            Animated.spring(d2, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
            Animated.spring(d3, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(d1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
            Animated.timing(d2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
            Animated.timing(d3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          ]),
          Animated.delay(150),
        ]).start(({ finished }) => {
          if (finished && !stopped) pulse();
        });
      };
      pulse();

      // Progress bar sweep
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: false,
      }).start();
    }

    return () => {
      stopped = true;
      d1.stopAnimation(); d2.stopAnimation(); d3.stopAnimation();
      progressAnim.stopAnimation();
    };
  }, [state]);

  const dotStyle = (anim) => ({
    transform: [{ scale: anim }],
    opacity: anim,
  });

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Text style={styles.logo}>FITRAX</Text>
        <Text style={styles.tagline}>TRACK. TRANSFORM. REPEAT.</Text>
      </Animated.View>

      {/* Bottom indicator */}
      <View style={styles.bottom}>
        {/* Dots — always shown */}
        <View style={styles.dotsRow}>
          {[d1, d2, d3].map((d, i) => (
            <Animated.View key={i} style={[styles.dot, dotStyle(d)]} />
          ))}
        </View>

        {/* Progress bar — only during 'loading' */}
        {state === 'loading' && (
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        )}

        {state === 'loading' && (
          <Text style={styles.loadingText}>Loading your data...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 52,
    color: '#E65C00',
    letterSpacing: 5,
  },
  tagline: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#666666',
    letterSpacing: 3,
    marginTop: 8,
  },
  bottom: {
    paddingBottom: 72,
    alignItems: 'center',
    width: '100%',
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#E65C00',
  },
  progressTrack: {
    width: width * 0.55,
    height: 3,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E65C00',
    borderRadius: 2,
  },
  loadingText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#555',
    letterSpacing: 0.5,
  },
});