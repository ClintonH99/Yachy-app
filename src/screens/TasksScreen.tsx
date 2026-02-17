/**
 * Tasks Screen - Hub: Upcoming Tasks (button), Overdue, then Daily/Weekly/Monthly categories
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../store';
import { TaskCategory } from '../types';
import { Button } from '../components';
import vesselTasksService from '../services/vesselTasks';

const CLEANUP_STORAGE_KEY = 'yachy_tasks_last_cleanup_month';

const CATEGORIES: { key: TaskCategory; label: string; icon: string }[] = [
  { key: 'DAILY', label: 'Daily', icon: '📅' },
  { key: 'WEEKLY', label: 'Weekly', icon: '📆' },
  { key: 'MONTHLY', label: 'Monthly', icon: '🗓️' },
];

export const TasksScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const vesselId = user?.vesselId ?? null;
  const isHOD = user?.role === 'HOD';

  useEffect(() => {
    const runMonthlyCleanup = async () => {
      if (!vesselId) return;
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      try {
        const lastCleanup = await AsyncStorage.getItem(CLEANUP_STORAGE_KEY);
        if (lastCleanup === currentMonth) return;
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        await vesselTasksService.deleteCompletedTasksBefore(vesselId, firstDay);
        await AsyncStorage.setItem(CLEANUP_STORAGE_KEY, currentMonth);
      } catch (e) {
        console.error('Monthly cleanup error:', e);
      }
    };
    runMonthlyCleanup();
  }, [vesselId]);

  if (!vesselId) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Join a vessel to see tasks.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        Choose a category to view and manage tasks
      </Text>
      {isHOD && (
        <Button
          title="Create Task"
          onPress={() => navigation.navigate('AddEditTask', {})}
          variant="primary"
          fullWidth
          style={styles.createButton}
        />
      )}

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('UpcomingTasks')}
        activeOpacity={0.8}
      >
        <Text style={styles.cardIcon}>📋</Text>
        <View style={styles.cardLabelWrap}>
          <Text style={styles.cardLabel}>Upcoming Tasks</Text>
          <Text style={styles.cardHint}>Tasks due in the next 3 days</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.card, styles.overdueCard]}
        onPress={() => navigation.navigate('OverdueTasks')}
        activeOpacity={0.8}
      >
        <Text style={styles.cardIcon}>⚠️</Text>
        <View style={styles.cardLabelWrap}>
          <Text style={styles.cardLabel}>Overdue Tasks</Text>
          <Text style={styles.cardHint}>Tasks past their deadline</Text>
        </View>
      </TouchableOpacity>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.key}
          style={styles.card}
          onPress={() => navigation.navigate('TasksList', { category: cat.key })}
          activeOpacity={0.8}
        >
          <Text style={styles.cardIcon}>{cat.icon}</Text>
          <Text style={styles.cardLabel}>{cat.label}</Text>
          <Text style={styles.cardHint}>View & create tasks</Text>
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
    paddingBottom: SPACING['2xl'],
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
  subtitle: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  createButton: {
    marginBottom: SPACING.xl,
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
  cardLabel: {
    flex: 1,
    fontSize: FONTS.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cardLabelWrap: {
    flex: 1,
  },
  cardHint: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
});
