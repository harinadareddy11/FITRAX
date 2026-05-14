// src/theme/index.js
import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const GlobalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardDeep: {
    backgroundColor: Colors.bgCardDeep,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  orangeBox: {
    backgroundColor: '#2A1500',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3D2000',
  },
  greenBox: {
    backgroundColor: Colors.successBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1A4A2E',
  },
  errorBox: {
    backgroundColor: Colors.errorBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#4A1A1A',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  sectionLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
});

export { Colors } from './colors';
export { Typography } from './typography';