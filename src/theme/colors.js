// src/theme/colors.js
// Both palettes + shared brand values

const brand = {
  primary:      '#E65C00',
  primaryDark:  '#CC5200',
  primaryLight: '#FF7A1A',
  success:      '#2ECC71',
  error:        '#E74C3C',
  warning:      '#F39C12',
  gymDay:       '#2ECC71',
  missedDay:    '#E74C3C',
  today:        '#E65C00',
  tabActive:    '#E65C00',
};

export const darkColors = {
  ...brand,
  // Backgrounds
  bg:          '#0D0D0D',
  bgCard:      '#1A1A1A',
  bgCardDeep:  '#111111',
  bgElevated:  '#161618',
  bgHighlight: '#1C1C1E',
  bgInput:     '#1E1E1E',
  // Text
  textPrimary:   '#FFFFFF',
  textSecondary: '#999999',
  textMuted:     '#555555',
  textOnOrange:  '#FFFFFF',
  // Borders
  border:       '#2A2A2A',
  divider:      '#2C2C2E',
  borderFocus:  '#E65C00',
  // Status backgrounds
  successBg:  '#0D2E1A',
  errorBg:    '#2E0D0D',
  warningBg:  '#2E1E00',
  orangeBoxBg:     '#2A1500',
  orangeBoxBorder: '#3D2000',
  greenBoxBg:      '#0D2E1A',
  greenBoxBorder:  '#1A4A2E',
  // Week grid
  restDay: '#2A2A2A',
  // Tab bar
  tabInactive: '#555555',
  tabBg:       '#111111',
};

export const lightColors = {
  ...brand,
  // Backgrounds
  bg:          '#F2F2F7',
  bgCard:      '#FFFFFF',
  bgCardDeep:  '#F5F5F7',
  bgElevated:  '#FFFFFF',
  bgHighlight: '#EBEBF0',
  bgInput:     '#FFFFFF',
  // Text
  textPrimary:   '#1C1C1E',
  textSecondary: '#636366',
  textMuted:     '#8E8E93',
  textOnOrange:  '#FFFFFF',
  // Borders
  border:       '#E5E5EA',
  divider:      '#D1D1D6',
  borderFocus:  '#E65C00',
  // Status backgrounds
  successBg:  '#E8F8EE',
  errorBg:    '#FFECEC',
  warningBg:  '#FFF8E6',
  orangeBoxBg:     '#FFF0E6',
  orangeBoxBorder: '#FFD4B2',
  greenBoxBg:      '#E8F8EE',
  greenBoxBorder:  '#B2E8C8',
  // Week grid
  restDay: '#D1D1D6',
  // Tab bar
  tabInactive: '#C7C7CC',
  tabBg:       '#FFFFFF',
};

// Legacy export — defaults to dark so existing code doesn't break
export const Colors = darkColors;

export function getColors(isDark) {
  return isDark ? darkColors : lightColors;
}