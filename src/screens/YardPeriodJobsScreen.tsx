/**
 * Yard Period Jobs Screen
 * List of yard period jobs with Create New Job button
 */

import React, { useState, useCallback } from 'react';
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
import yardJobsService from '../services/yardJobs';
import { YardPeriodJob } from '../types';
import { Button } from '../components';
import { getTaskUrgencyColor } from '../utils/taskUrgency';

export const YardPeriodJobsScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<YardPeriodJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const vesselId = user?.vesselId ?? null;
  const isHOD = user?.role === 'HOD';

  const loadJobs = useCallback(async () => {
    if (!vesselId) return;
    try {
      const data = await yardJobsService.getByVessel(vesselId);
      setJobs(data);
    } catch (e) {
      console.error('Load yard jobs error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vesselId]);

  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [loadJobs])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const onAdd = () => {
    navigation.navigate('AddEditYardJob', {});
  };

  const onEdit = (job: YardPeriodJob) => {
    if (!isHOD) return;
    navigation.navigate('AddEditYardJob', { jobId: job.id });
  };

  const onDelete = (job: YardPeriodJob) => {
    if (!isHOD) return;
    Alert.alert(
      'Delete job',
      `Delete "${job.jobTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await yardJobsService.delete(job.id);
              loadJobs();
            } catch (e) {
              Alert.alert('Error', 'Could not delete job');
            }
          },
        },
      ]
    );
  };

  const onMarkComplete = (job: YardPeriodJob) => {
    if (job.status === 'COMPLETED') return;
    if (!user?.id || !user?.name) {
      Alert.alert('Error', 'Could not identify user');
      return;
    }
    yardJobsService
      .markComplete(job.id, user.id, user.name)
      .then(() => loadJobs())
      .catch(() => Alert.alert('Error', 'Could not update job'));
  };

  const renderItem = ({ item }: { item: YardPeriodJob }) => {
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
            {item.jobTitle}
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
        {item.yardLocation ? (
          <Text style={styles.cardSubtext}>📍 {item.yardLocation}</Text>
        ) : null}
        {item.contractorCompanyName ? (
          <Text style={styles.cardSubtext}>🏢 {item.contractorCompanyName}</Text>
        ) : null}
        {item.doneByDate && (
          <Text style={styles.cardDate}>
            Done by: {formatDate(item.doneByDate)}
            {isComplete && ' ✓'}
          </Text>
        )}
        {isComplete && item.completedByName && (
          <Text style={styles.completedBy}>Completed by: {item.completedByName}</Text>
        )}
        {item.jobDescription ? (
          <Text style={styles.cardNotes} numberOfLines={2}>
            {item.jobDescription}
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
        <Text style={styles.message}>Join a vessel to see yard period jobs.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isHOD && (
        <View style={styles.addRow}>
          <Button
            title="Create New Job"
            onPress={onAdd}
            variant="primary"
            style={styles.addButton}
          />
        </View>
      )}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : jobs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔧</Text>
          <Text style={styles.emptyText}>No yard period jobs yet</Text>
          {isHOD && (
            <Button
              title="Create first job"
              onPress={onAdd}
              variant="primary"
              style={styles.emptyBtn}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => j.id}
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
  addRow: {
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  addButton: {},
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
  cardSubtext: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  cardDate: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
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
    marginBottom: SPACING.lg,
  },
  emptyBtn: {},
});
