/**
 * Shopping List Screen
 * Department filter, Create button, list of shopping lists (title + bullet items)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SIZES } from '../constants/theme';
import { useAuthStore, useDepartmentColorStore, getDepartmentColor } from '../store';
import shoppingListsService, { ShoppingList, ShoppingListItem } from '../services/shoppingLists';
import { Department } from '../types';
import { Button } from '../components';

const DEPARTMENTS: Department[] = ['BRIDGE', 'ENGINEERING', 'EXTERIOR', 'INTERIOR', 'GALLEY'];

export const ShoppingListScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const overrides = useDepartmentColorStore((s) => s.overrides);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleDepartments, setVisibleDepartments] = useState<Record<Department, boolean>>({
    BRIDGE: true,
    ENGINEERING: true,
    EXTERIOR: true,
    INTERIOR: true,
    GALLEY: true,
  });
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);

  const vesselId = user?.vesselId ?? null;

  const selectDepartment = (dept: Department) => {
    setVisibleDepartments({
      BRIDGE: dept === 'BRIDGE',
      ENGINEERING: dept === 'ENGINEERING',
      EXTERIOR: dept === 'EXTERIOR',
      INTERIOR: dept === 'INTERIOR',
      GALLEY: dept === 'GALLEY',
    });
  };

  const selectAllDepartments = () => {
    setVisibleDepartments({
      BRIDGE: true,
      ENGINEERING: true,
      EXTERIOR: true,
      INTERIOR: true,
      GALLEY: true,
    });
  };

  const filteredLists = lists.filter((l) => visibleDepartments[l.department ?? 'INTERIOR']);

  const loadLists = useCallback(async () => {
    if (!vesselId) return;
    setLoading(true);
    try {
      const data = await shoppingListsService.getByVessel(vesselId);
      setLists(data);
    } catch (e) {
      console.error('Load shopping lists error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vesselId]);

  useFocusEffect(useCallback(() => {
    loadLists();
  }, [loadLists]));

  const onRefresh = () => {
    setRefreshing(true);
    loadLists();
  };

  const toggleItemChecked = async (list: ShoppingList, itemIndex: number) => {
    const newItems: ShoppingListItem[] = list.items.map((item, idx) =>
      idx === itemIndex ? { ...item, checked: !item.checked } : item
    );
    try {
      await shoppingListsService.update(list.id, { items: newItems });
      setLists((prev) =>
        prev.map((l) => (l.id === list.id ? { ...l, items: newItems } : l))
      );
    } catch (e) {
      console.error('Toggle item error:', e);
    }
  };

  const departmentDisplayText = DEPARTMENTS.every((d) => visibleDepartments[d])
    ? 'All departments'
    : DEPARTMENTS.filter((d) => visibleDepartments[d])
        .map((d) => d.charAt(0) + d.slice(1).toLowerCase())
        .join(', ');

  if (!vesselId) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Join a vessel to use Shopping List.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      <View style={styles.createRow}>
        <Button
          title="Create"
          onPress={() => navigation.navigate('AddEditShoppingList', {})}
          variant="primary"
          fullWidth
        />
      </View>

      <Text style={styles.filterLabel}>Department</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setDepartmentDropdownOpen(!departmentDropdownOpen)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownText}>{departmentDisplayText}</Text>
        <Text style={styles.dropdownChevron}>{departmentDropdownOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {departmentDropdownOpen && (
        <Modal visible transparent animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setDepartmentDropdownOpen(false)}>
            <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  DEPARTMENTS.every((d) => visibleDepartments[d]) && styles.modalItemSelected,
                ]}
                onPress={() => {
                  selectAllDepartments();
                  setDepartmentDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    DEPARTMENTS.every((d) => visibleDepartments[d]) && styles.modalItemTextSelected,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {DEPARTMENTS.map((dept) => (
                <TouchableOpacity
                  key={dept}
                  style={[styles.modalItem, visibleDepartments[dept] && styles.modalItemSelected]}
                  onPress={() => {
                    selectDepartment(dept);
                    setDepartmentDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      visibleDepartments[dept] && styles.modalItemTextSelected,
                    ]}
                  >
                    {dept.charAt(0) + dept.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
      ) : filteredLists.length === 0 ? (
        <Text style={styles.empty}>
          {lists.length === 0
            ? 'No shopping lists yet. Tap Create to add one.'
            : 'No lists for the selected department(s).'}
        </Text>
      ) : (
        filteredLists.map((list) => (
          <View key={list.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => navigation.navigate('AddEditShoppingList', { listId: list.id })}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle} numberOfLines={1}>
                {list.title}
              </Text>
              <View
                style={[
                  styles.deptBadge,
                  { backgroundColor: getDepartmentColor(list.department, overrides) },
                ]}
              >
                <Text style={styles.deptBadgeText}>
                  {list.department.charAt(0) + list.department.slice(1).toLowerCase()}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.bulletList}>
              {list.items.length === 0 ? (
                <Text style={styles.bulletPlaceholder}>No items</Text>
              ) : (
                list.items.map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <TouchableOpacity
                      onPress={() => toggleItemChecked(list, idx)}
                      style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                      activeOpacity={0.7}
                    >
                      {item.checked ? (
                        <Text style={styles.checkboxTick}>✓</Text>
                      ) : null}
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.bulletText,
                        item.checked && styles.bulletTextChecked,
                      ]}
                      numberOfLines={2}
                    >
                      {item.text}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SIZES.bottomScrollPadding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  message: { fontSize: FONTS.base, color: COLORS.textSecondary, textAlign: 'center' },
  createRow: { marginBottom: SPACING.lg },
  filterLabel: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  dropdownText: { fontSize: FONTS.base, color: COLORS.textPrimary, fontWeight: '500' },
  dropdownChevron: { fontSize: 10, color: COLORS.textSecondary },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalBox: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.sm, minWidth: 200 },
  modalItem: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, backgroundColor: COLORS.white },
  modalItemSelected: { backgroundColor: COLORS.white },
  modalItemText: { fontSize: FONTS.base, color: COLORS.textPrimary },
  modalItemTextSelected: { color: COLORS.primary, fontWeight: '600' },
  loader: { marginVertical: SPACING.xl },
  empty: { fontSize: FONTS.base, color: COLORS.textSecondary, paddingVertical: SPACING.xl },
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  cardTitle: { fontSize: FONTS.lg, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  deptBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.sm },
  deptBadgeText: { fontSize: FONTS.xs, fontWeight: '600', color: COLORS.white },
  bulletList: { marginTop: SPACING.xs },
  bulletRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  checkboxTick: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  bulletText: { fontSize: FONTS.base, color: COLORS.textPrimary, flex: 1 },
  bulletTextChecked: { textDecorationLine: 'line-through', color: COLORS.textTertiary },
  bulletPlaceholder: { fontSize: FONTS.sm, color: COLORS.textTertiary, fontStyle: 'italic' },
});
