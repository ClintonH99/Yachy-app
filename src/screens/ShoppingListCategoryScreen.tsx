/**
 * Shopping List Category Screen
 * Choose between General Shopping or Trip Shopping before viewing/creating lists
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
import { useAuthStore } from '../store';

const CATEGORIES = [
  {
    icon: '🛒',
    label: 'General Shopping',
    listType: 'general' as const,
  },
  {
    icon: '✈️',
    label: 'Trip Shopping',
    listType: 'trip' as const,
  },
];

export const ShoppingListCategoryScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const vesselId = user?.vesselId ?? null;

  if (!vesselId) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Join a vessel to use Shopping List.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category.listType}
          style={styles.card}
          onPress={() => navigation.navigate('ShoppingList', { listType: category.listType })}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  message: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
