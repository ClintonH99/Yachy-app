/**
 * Pre-Departure Checklist Screen
 * List of pre-departure checklists; Create button to add new
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../store';
import preDepartureChecklistsService from '../services/preDepartureChecklists';
import { PreDepartureChecklist, Department } from '../types';
import { Button } from '../components';

const CAPTAIN_CHECKLIST_MAX_ITEMS = 15;

const DEPARTMENT_OPTIONS: { value: Department | ''; label: string }[] = [
  { value: '', label: 'All Departments' },
  { value: 'BRIDGE', label: 'Bridge' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'EXTERIOR', label: 'Exterior' },
  { value: 'INTERIOR', label: 'Interior' },
  { value: 'GALLEY', label: 'Galley' },
];

export const PreDepartureChecklistScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [checklists, setChecklists] = useState<PreDepartureChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<Department | ''>('');
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);

  const vesselId = user?.vesselId ?? null;
  const isHOD = user?.role === 'HOD';

  const filteredChecklists = useMemo(() => {
    if (!departmentFilter) return checklists;
    return checklists.filter(
      (c) => c.department === departmentFilter || c.department === null
    );
  }, [checklists, departmentFilter]);

  const captainBoard = useMemo(() => {
    const allDeptChecklists = filteredChecklists.filter((c) => c.department === null);
    return allDeptChecklists[0] ?? null;
  }, [filteredChecklists]);

  const otherChecklists = useMemo(() => {
    if (!captainBoard) return filteredChecklists;
    return filteredChecklists.filter((c) => c.id !== captainBoard.id);
  }, [filteredChecklists, captainBoard]);

  const loadChecklists = useCallback(async () => {
    if (!vesselId) return;
    try {
      const data = await preDepartureChecklistsService.getByVessel(vesselId);
      setChecklists(data);
    } catch (e) {
      console.error('Load pre-departure checklists error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vesselId]);

  useFocusEffect(
    useCallback(() => {
      loadChecklists();
    }, [loadChecklists])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadChecklists();
  };

  const onCreate = () => {
    navigation.navigate('AddEditPreDepartureChecklist', {});
  };

  const onEdit = (checklist: PreDepartureChecklist) => {
    navigation.navigate('AddEditPreDepartureChecklist', { checklistId: checklist.id });
  };

  const onDelete = (checklist: PreDepartureChecklist) => {
    if (!isHOD) return;
    Alert.alert(
      'Delete checklist',
      `Delete "${checklist.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await preDepartureChecklistsService.delete(checklist.id);
              loadChecklists();
            } catch (e) {
              Alert.alert('Error', 'Could not delete checklist');
            }
          },
        },
      ]
    );
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const itemCount = (c: PreDepartureChecklist) => c.items.length;

  const renderItem = ({ item }: { item: PreDepartureChecklist }) => {
    const count = itemCount(item);
    const deptLabel = item.department
      ? DEPARTMENT_OPTIONS.find((o) => o.value === item.department)?.label ?? item.department
      : 'All';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onEdit(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
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
          <Text style={styles.deptBadge}>{deptLabel}</Text>
          <Text style={styles.cardProgress}>{count} items</Text>
          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!vesselId) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Join a vessel to manage pre-departure checklists.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const ListHeader = (
    <>
      <View style={styles.boardHeader}>
        <Text style={styles.boardTitle}>Pre-Departure Checklist</Text>
        <Text style={styles.boardHint}>
          {isHOD
            ? 'Add tasks for crew to complete before each departure. Read and do.'
            : 'Tasks to complete before departure. Read and do.'}
        </Text>
      </View>
      {isHOD && (
        <View style={styles.actionBar}>
          <Button title="Create" onPress={onCreate} variant="primary" fullWidth />
        </View>
      )}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, departmentFilter ? styles.filterChipActive : null]}
          onPress={() => setDepartmentModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.filterChipLabel}>Department</Text>
          <Text style={[styles.filterChipValue, departmentFilter ? styles.filterChipValueActive : null]}>
            {departmentFilter ? DEPARTMENT_OPTIONS.find((o) => o.value === departmentFilter)?.label ?? departmentFilter : 'All'}
          </Text>
        </TouchableOpacity>
        {departmentFilter ? (
          <TouchableOpacity onPress={() => setDepartmentFilter('')} style={styles.clearFilters}>
            <Text style={styles.clearFiltersText}>Clear filter</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {captainBoard && (
        <TouchableOpacity
          style={styles.captainBoard}
          onPress={() => onEdit(captainBoard)}
          activeOpacity={0.9}
        >
          <Text style={styles.captainBoardBadge}>Captain's Checklist</Text>
          <Text style={styles.captainBoardTitle} numberOfLines={1}>
            {captainBoard.title}
          </Text>
          <View style={styles.captainBoardItems}>
            {captainBoard.items
              .slice(0, CAPTAIN_CHECKLIST_MAX_ITEMS)
              .map((item, idx) => (
                <View key={item.id} style={styles.captainBoardItemRow}>
                  <Text style={styles.captainBoardItemNum}>{idx + 1}.</Text>
                  <Text style={styles.captainBoardItemLabel}>{item.label}</Text>
                </View>
              ))}
            {captainBoard.items.length === 0 && (
              <Text style={styles.captainBoardEmpty}>No items yet</Text>
            )}
            {captainBoard.items.length > CAPTAIN_CHECKLIST_MAX_ITEMS && (
              <Text style={styles.readMore}>Read More...</Text>
            )}
          </View>
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {departmentModalVisible && (
        <Modal visible transparent animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setDepartmentModalVisible(false)}>
            <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Filter by department</Text>
              {DEPARTMENT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value || 'all'}
                  style={[styles.modalItem, departmentFilter === opt.value && styles.modalItemSelected]}
                  onPress={() => {
                    setDepartmentFilter(opt.value);
                    setDepartmentModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}

      <FlatList
        data={otherChecklists}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[
          styles.list,
          otherChecklists.length === 0 && !captainBoard && styles.listEmpty,
        ]}
        ListEmptyComponent={
          otherChecklists.length === 0 && !captainBoard ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>
                {filteredChecklists.length === 0 && checklists.length > 0 ? 'No matching checklists' : 'No checklists yet'}
              </Text>
              <Text style={styles.emptyText}>
                {filteredChecklists.length === 0 && checklists.length > 0
                  ? 'Try a different department filter.'
                  : isHOD
                    ? 'Tap "Create" to add a checklist. Use "All Departments" for the Captain\'s board.'
                    : 'No pre-departure tasks have been added yet.'}
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
  boardHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  boardTitle: {
    fontSize: FONTS.xl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  boardHint: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
  },
  actionBar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    gap: SPACING.md,
  },
  filterChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
  },
  filterChipLabel: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
  },
  filterChipValue: {
    fontSize: FONTS.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  filterChipValueActive: {
    color: COLORS.primary,
  },
  clearFilters: {
    paddingVertical: SPACING.xs,
  },
  clearFiltersText: {
    fontSize: FONTS.sm,
    color: COLORS.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    minWidth: 260,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  modalItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
  },
  modalItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  modalItemText: {
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
  },
  captainBoard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  captainBoardBadge: {
    fontSize: FONTS.xs,
    fontWeight: '700',
    color: COLORS.white,
    opacity: 0.9,
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  captainBoardTitle: {
    fontSize: FONTS.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  captainBoardItems: {},
  captainBoardItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  captainBoardItemNum: {
    fontSize: FONTS.sm,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.9,
    marginRight: SPACING.sm,
  },
  captainBoardItemLabel: {
    flex: 1,
    fontSize: FONTS.base,
    color: COLORS.white,
    lineHeight: 22,
  },
  captainBoardEmpty: {
    fontSize: FONTS.sm,
    color: COLORS.white,
    opacity: 0.7,
  },
  readMore: {
    fontSize: FONTS.sm,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.95,
    marginTop: SPACING.sm,
  },
  list: {
    padding: SPACING.lg,
    paddingBottom: 88,
  },
  listEmpty: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
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
  },
  cardTitle: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
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
    marginTop: SPACING.xs,
  },
  deptBadge: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  cardProgress: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
  },
  cardDate: {
    fontSize: FONTS.sm,
    color: COLORS.textTertiary,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: {
    fontSize: FONTS.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
