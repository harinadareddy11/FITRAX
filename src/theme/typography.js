// src/theme/typography.js
import { Colors } from './colors';

export const Typography = {
  brandLogo: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 48,
    color: Colors.primary,
    letterSpacing: 4,
  },
  brandTagline: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  streakNumber: {
    fontFamily: 'SpaceMono_700Bold_Italic',
    fontSize: 72,
    color: Colors.primary,
    lineHeight: 80,
  },
  h1: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    lineHeight: 34,
  },
  h2: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  h3: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  label: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  number: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  numberLg: {
    fontFamily: 'SpaceMono_700Bold_Italic',
    fontSize: 36,
    color: Colors.primary,
  },
};