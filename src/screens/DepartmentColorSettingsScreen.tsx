/**
 * Department Color Settings Screen
 * Crew can choose a color scheme per department or "No color"
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SIZES } from '../constants/theme';
import { useDepartmentColorStore, getDepartmentColor } from '../store';
import { Department } from '../types';

const DEPARTMENTS: Department[] = ['BRIDGE', 'ENGINEERING', 'EXTERIOR', 'INTERIOR', 'GALLEY'];

const DEPARTMENT_LABELS: Record<Department, string> = {
  BRIDGE: 'Bridge',
  ENGINEERING: 'Engineering',
  EXTERIOR: 'Exterior',
  INTERIOR: 'Interior',
  GALLEY: 'Galley',
};

const COLOR_SWATCHES = COLORS.tripColorSwatches;

export const DepartmentColorSettingsScreen = () => {
  const { overrides, loaded, loadOverrides, setOverride } = useDepartmentColorStore();
  const [pickingDepartment, setPickingDepartment] = useState<Department | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadOverrides();
    }, [loadOverrides])
  );

  const handleSelectColor = async (dept: Department, color: string | null) => {
    await setOverride(dept, color);
    setPickingDepartment(null);
  };

  if (!loaded) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Department colors</Text>
      <Text style={styles.subtitle}>
        Choose a color for each department, or No color for neutral.
      </Text>

      <View style={styles.section}>
        {DEPARTMENTS.map((dept, index) => {
          const effectiveColor = getDepartmentColor(dept, overrides);
          const isNoColor = overrides[dept] === null;
          const isLast = index === DEPARTMENTS.length - 1;
          return (
            <TouchableOpacity
              key={dept}
              style={[styles.row, isLast && styles.rowLast]}
              onPress={() => setPickingDepartment(dept)}
              activeOpacity={0.7}
            >
              <Text style={styles.rowLabel}>{DEPARTMENT_LABELS[dept]}</Text>
              <View style={styles.rowRight}>
                {isNoColor ? (
                  <Text style={styles.noColorLabel}>No color</Text>
                ) : (
                  <View style={[styles.swatch, { backgroundColor: effectiveColor }]} />
                )}
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal
        visible={!!pickingDepartment}
        transparent
        animationType="fade"
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPickingDepartment(null)}
        >
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            {pickingDepartment && (
              <>
                <Text style={styles.modalTitle}>
                  {DEPARTMENT_LABELS[pickingDepartment]}
                </Text>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleSelectColor(pickingDepartment, null)}
                >
                  <View style={[styles.swatch, styles.swatchNoColor]} />
                  <Text style={styles.modalOptionText}>No color</Text>
                </TouchableOpacity>
                <View style={styles.swatchRow}>
                  {COLOR_SWATCHES.map((hex) => (
                    <TouchableOpacity
                      key={hex}
                      style={[styles.swatch, styles.swatchSmall, { backgroundColor: hex }]}
                      onPress={() => handleSelectColor(pickingDepartment, hex)}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setPickingDepartment(null)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
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
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: {
    fontSize: FONTS.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  noColorLabel: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  swatchNoColor: {
    backgroundColor: COLORS.gray300,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chevron: { fontSize: 20, color: COLORS.textTertiary },
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
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: FONTS.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  modalOptionText: { fontSize: FONTS.base, color: COLORS.textPrimary },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  swatchSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: FONTS.base, color: COLORS.textSecondary },
});
