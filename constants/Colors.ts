/**
 * Color palette for the C-Otter Psychology Health App
 * Professional and modern design with light/dark mode support
 * Primary brand color: #2563eb (Blue)
 */

const tintColorLight = '#2563eb';
const tintColorDark = '#60a5fa';

export const Colors = {
  light: {
    // Primary colors
    primary: '#2563eb',
    primaryLight: '#3b82f6',
    primaryDark: '#1d4ed8',
    
    // Text colors
    text: '#111827',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    textInverse: '#ffffff',
    
    // Background colors
    background: '#f9fafb',
    backgroundPrimary: '#ffffff',
    backgroundSecondary: '#f3f4f6',
    backgroundTertiary: '#e5e7eb',
    
    // UI Element colors
    tint: tintColorLight,
    icon: '#6b7280',
    iconInverse: '#ffffff',
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
    
    // Card and surface colors
    card: '#ffffff',
    cardBorder: '#e5e7eb',
    surface: '#f3f4f6',
    surfaceElevated: '#ffffff',
    
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Category colors (for health topics)
    mentalHealth: '#8B7FE8',
    fitness: '#FF6B6B',
    addiction: '#FFB088',
    nutrition: '#FFC857',
    social: '#6BCF7F',
    financial: '#4A5568',
    
    // Tab bar
    tabBarBackground: '#ffffff',
    tabBarBorder: '#e5e7eb',
    tabBarActive: '#2563eb',
    tabBarInactive: '#9ca3af',
  },
  dark: {
    // Primary colors
    primary: '#60a5fa',
    primaryLight: '#93c5fd',
    primaryDark: '#3b82f6',
    
    // Text colors
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    textTertiary: '#9ca3af',
    textInverse: '#111827',
    
    // Background colors
    background: '#111827',
    backgroundPrimary: '#1f2937',
    backgroundSecondary: '#374151',
    backgroundTertiary: '#4b5563',
    
    // UI Element colors
    tint: tintColorDark,
    icon: '#d1d5db',
    iconInverse: '#111827',
    tabIconDefault: '#6b7280',
    tabIconSelected: tintColorDark,
    
    // Card and surface colors
    card: '#1f2937',
    cardBorder: '#374151',
    surface: '#374151',
    surfaceElevated: '#374151',
    
    // Status colors
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    
    // Category colors (for health topics)
    mentalHealth: '#a5b4fc',
    fitness: '#fca5a5',
    addiction: '#fdba74',
    nutrition: '#fcd34d',
    social: '#86efac',
    financial: '#9ca3af',
    
    // Tab bar
    tabBarBackground: '#1f2937',
    tabBarBorder: '#374151',
    tabBarActive: '#60a5fa',
    tabBarInactive: '#6b7280',
  },
};

// Export default for convenience
export default Colors;
