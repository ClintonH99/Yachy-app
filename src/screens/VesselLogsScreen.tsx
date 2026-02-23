/**
 * Vessel Logs Screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING, SIZES } from '../constants/theme';

const LOG_CATEGORIES = [
  {
    icon: '🗑️',
    label: 'General Waste',
    route: 'GeneralWasteLog',
  },
  {
    icon: '⛽',
    label: 'Fuel Log',
    route: 'FuelLog',
  },
  {
    icon: '🚿',
    label: 'Pump Out Log',
    route: 'PumpOutLog',
  },
];

export const VesselLogsScreen = ({ navigation }: any) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {LOG_CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category.route}
          style={styles.card}
          onPress={() => navigation.navigate(category.route)}
          activeOpacity={0.8}
        >
          <Text style={styles.cardIcon}>{category.icon}</Text>
          <Text style={styles.cardLabel}>{category.label}</Text>
          <Text style={styles.cardChevron}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SIZES.bottomScrollPadding,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    fontSize: FONTS['2xl'],
    marginRight: SPACING.lg,
  },
  cardLabel: {
    flex: 1,
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cardChevron: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
});
