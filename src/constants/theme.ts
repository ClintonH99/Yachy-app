/**
 * Theme Constants
 * Professional nautical-inspired color scheme and styling
 */

export const COLORS = {
  // Primary colors - Professional nautical blues
  primary: '#1E3A8A', // Deep navy blue
  primaryLight: '#3B82F6', // Lighter blue
  primaryDark: '#1E40AF', // Darker navy
  
  // Secondary colors
  secondary: '#0EA5E9', // Ocean blue
  secondaryLight: '#38BDF8',
  
  // Status colors - Task progression
  success: '#10B981', // Green (70-100% time remaining)
  warning: '#F59E0B', // Yellow/Amber (30-70% time remaining)
  danger: '#EF4444', // Red (0-30% time remaining)
  
  // Module colors - Calendar view
  bossTripColor: '#3B82F6', // Blue
  guestTripColor: '#10B981', // Green
  contractorColor: '#F59E0B', // Yellow
  jobColor: '#EF4444', // Red
  dutyColor: '#8B5CF6', // Purple
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Background colors
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const FONTS = {
  // Font families (using system fonts for now)
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
  
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const SIZES = {
  // Common sizes
  buttonHeight: 48,
  inputHeight: 48,
  iconSize: 24,
  avatarSize: 40,
  
  // Header
  headerHeight: 60,
  
  // Tab bar
  tabBarHeight: 60,
};

export default {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  SIZES,
};
