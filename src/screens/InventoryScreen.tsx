/**
 * Inventory Screen
 * Placeholder for vessel inventory (categories and items by department)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useAuthStore } from '../store';

export const InventoryScreen = () => {
  const { user } = useAuthStore();
  const hasVessel = !!user?.vesselId;

  if (!hasVessel) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Join a vessel to use Inventory.</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.icon}>📦</Text>
      <Text style={styles.title}>Inventory</Text>
      <Text style={styles.message}>Inventory management is coming soon.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  icon: { fontSize: 48, marginBottom: SPACING.md },
  title: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  message: { fontSize: FONTS.base, color: COLORS.textSecondary, textAlign: 'center' },
});
