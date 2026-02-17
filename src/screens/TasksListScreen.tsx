/**
 * Tasks List Screen - List tasks for a category (Daily, Weekly, Monthly)
 * HOD can add/edit/delete; crew can view
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../store';
import vesselTasksService from '../services/vesselTasks';
import { VesselTask, TaskCategory } from '../types';
import { getTaskUrgencyColor } from '../utils/taskUrgency';

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};

export const TasksListScreen = ({ navigation, route }: any) => {
  const { user } = useAuthStore();
  const category = (route.params?.category ?? 'DAILY') as TaskCategory;
  const categoryLabel = CATEGORY_LABELS[category];

  const [tasks, setTasks] = useState<VesselTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const vesselId = user?.vesselId ?? null;
  const isHOD = user?.role === 'HOD';

  useEffect(() => {
    navigation.setOptions({ title: `${categoryLabel} Tasks` });
  }, [navigation, categoryLabel]);

  const loadTasks = useCallback(async () => {
    if (!vesselId) return;
    try {
      const data = await vesselTasksService.getByVesselAndCategory(vesselId, category);
      setTasks(data);
    } catch (e) {
      console.error('Load tasks error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vesselId, category]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const onEdit = (task: VesselTask) => {
    if (!isHOD) return;
    navigation.navigate('AddEditTask', { category, taskId: task.id });
  };

  const onDelete = (task: VesselTask) => {
    if (!isHOD) return;
    Alert.alert(
      'Delete task',
      `Delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await vesselTasksService.delete(task.id);
              loadTasks();
            } catch (e) {
              Alert.alert('Error', 'Could not delete task');
            }
          },
        },
      ]
    );
  };

  const onMarkComplete = (task: VesselTask) => {
    if (task.status === 'COMPLETED') return;
    if (!user?.id || !user?.name) {
      Alert.alert('Error', 'Could not identify user');
      return;
    }
    vesselTasksService
      .markComplete(task.id, user.id, user.name)
      .then(() => loadTasks())
      .catch(() => Alert.alert('Error', 'Could not update task'));
  };

  const renderItem = ({ item }: { item: VesselTask }) => {
    const borderColor = getTaskUrgencyColor(
      item.doneByDate,
      item.createdAt,
      item.status
    );
    const isComplete = item.status === 'COMPLETED';

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: borderColor }]}
        onPress={() => onEdit(item)}
        activeOpacity={0.8}
        disabled={!isHOD}
      >
        <View style={styles.cardHeader}>
          <Text
            style={[styles.cardTitle, isComplete && styles.cardTitleComplete]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {isHOD && (
            <TouchableOpacity
              onPress={() => onDelete(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteBtn}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.cardMeta}>
          {item.doneByDate && (
            <Text style={styles.cardDate}>
              Done by: {formatDate(item.doneByDate)}
              {isComplete && ' ✓'}
            </Text>
          )}
          {item.recurring && (
            <Text style={styles.recurringBadge}>
              {item.recurring === '7_DAYS' ? 'Every 7 days' : item.recurring === '14_DAYS' ? 'Every 14 days' : 'Every 30 days'}
            </Text>
          )}
        </View>
        {isComplete && item.completedByName && (
          <Text style={styles.completedBy}>Completed by: {item.completedByName}</Text>
        )}
        {item.notes ? (
          <Text style={styles.cardNotes} numberOfLines={2}>
            {item.notes}
          </Text>
        ) : null}
        {!isComplete && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => onMarkComplete(item)}
          >
            <Text style={styles.completeBtnText}>Mark complete</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (!vesselId) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Join a vessel to see tasks.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : tasks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>No {categoryLabel.toLowerCase()} tasks yet</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  loader: {
    marginTop: SPACING.xl,
  },
  list: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  cardTitleComplete: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  deleteBtn: {
    fontSize: FONTS.sm,
    color: COLORS.danger,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardDate: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
  },
  recurringBadge: {
    fontSize: FONTS.xs,
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  completedBy: {
    fontSize: FONTS.sm,
    color: COLORS.success,
    marginTop: SPACING.xs,
  },
  cardNotes: {
    fontSize: FONTS.sm,
    color: COLORS.textTertiary,
  },
  completeBtn: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
  },
  completeBtnText: {
    fontSize: FONTS.sm,
    color: COLORS.white,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONTS.lg,
    color: COLORS.textSecondary,
  },
});
