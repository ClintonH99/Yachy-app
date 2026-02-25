/**
 * Theme Settings Screen
 * Lets the user pick a background colour theme for the app
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SIZES } from '../constants/theme';
import { useThemeStore, BACKGROUND_THEMES, BackgroundThemeId } from '../store';

const THEMES: { id: BackgroundThemeId; label: string; description: string }[] = [
  { id: 'light', label: 'Light', description: 'Clean white background' },
  { id: 'ocean', label: 'Ocean', description: 'Soft blue tones' },
  { id: 'sand', label: 'Sand', description: 'Warm amber tones' },
  { id: 'navy', label: 'Navy', description: 'Dark navy background' },
];

export const ThemeSettingsScreen = () => {
  const { backgroundTheme, loaded, loadTheme, setBackgroundTheme } = useThemeStore();

  useFocusEffect(
    useCallback(() => {
      loadTheme();
    }, [loadTheme])
  );

  if (!loaded) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>App theme</Text>
      <Text style={styles.subtitle}>
        Choose a colour scheme for the app background.
      </Text>

      <View style={styles.section}>
        {THEMES.map((theme, index) => {
          const isSelected = backgroundTheme === theme.id;
          const colors = BACKGROUND_THEMES[theme.id];
          const isLast = index === THEMES.length - 1;

          return (
            <TouchableOpacity
              key={theme.id}
              style={[styles.row, isLast && styles.rowLast]}
              onPress={() => setBackgroundTheme(theme.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.preview, { backgroundColor: colors.background }]}>
                <View style={[styles.previewDot, { backgroundColor: colors.surface }]} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{theme.label}</Text>
                <Text style={styles.rowDesc}>{theme.description}</Text>
              </View>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SIZES.bottomScrollPadding },
  title: {
    fontSize: FONTS.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  rowLast: { borderBottomWidth: 0 },
  preview: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: FONTS.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  rowDesc: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
});
