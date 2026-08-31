export const colors = {
  primary: '#F5C518',
  primaryLight: '#FFD700',
  primaryDark: '#C8A000',
  bgDark: '#0A0B1E',
  bgMid: '#111228',
  bgCard: '#161830',
  bgCardLight: '#1E2040',
  bgCardBorder: '#252650',
  accent: '#E83535',
  accentGreen: '#2ECC71',
  accentBlue: '#3B82F6',
  accentPurple: '#9B59B6',
  text: '#FFFFFF',
  textSecondary: '#9999BB',
  textMuted: '#555577',
  border: '#252640',
  success: '#2ECC71',
  warning: '#F59E0B',
  error: '#E83535',
  gold: '#F5C518',
  silver: '#C0C0C0',
  coal: '#6B4226',
  jade: '#10B981',
  oil: '#374151',
  tin: '#9CA3AF',
};

export const gradients = {
  gold: ['#F5C518', '#C8A000'] as string[],
  goldLight: ['#FFD700', '#F5C518'] as string[],
  dark: ['#0A0B1E', '#161830'] as string[],
  darkDeep: ['#050614', '#0A0B1E'] as string[],
  card: ['#1E2040', '#161830'] as string[],
  mining: ['#1a1d3a', '#0A0B1E'] as string[],
  success: ['#2ECC71', '#16A34A'] as string[],
  danger: ['#E83535', '#C01F1F'] as string[],
  blue: ['#3B82F6', '#1D4ED8'] as string[],
  purple: ['#9B59B6', '#7C3AED'] as string[],
  green: ['#10B981', '#059669'] as string[],
  orange: ['#F59E0B', '#D97706'] as string[],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  body: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
  hero: 36,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  gold: {
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};
