/**
 * Watch Keeping Screen
 * Hub with two buttons: Watch Schedule and Create
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SIZES } from '../constants/theme';
import { useAuthStore } from '../store';

export const WatchKeepingScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const vesselId = user?.vesselId ?? null;

  if (!vesselId) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Join a vessel to use Watch Keeping.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('WatchSchedule')}
        activeOpacity={0.8}
      >
        <Text style={styles.cardIcon}>📋</Text>
        <View style={styles.cardLabelWrap}>
          <Text style={styles.cardLabel}>Watch Schedule</Text>
          <Text style={styles.cardHint}>View published watch timetables</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CreateWatchTimetable')}
        activeOpacity={0.8}
      >
        <Text style={styles.cardIcon}>➕</Text>
        <View style={styles.cardLabelWrap}>
          <Text style={styles.cardLabel}>Create</Text>
          <Text style={styles.cardHint}>Create and publish a new watch timetable</Text>
        </View>
      </TouchableOpacity>
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
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 36,
    marginRight: SPACING.lg,
  },
  cardLabelWrap: {
    flex: 1,
  },
  cardLabel: {
    fontSize: FONTS.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cardHint: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
  },
});
