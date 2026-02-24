/**
 * Fuel Log Screen
 * List of fuel log entries with Add, Edit, Delete, and selective PDF export.
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
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SIZES } from '../constants/theme';
import { useAuthStore } from '../store';
import fuelLogsService from '../services/fuelLogs';
import vesselService from '../services/vessel';
import { FuelLog } from '../types';
import { Button, Input } from '../components';
import { exportFuelLogPdf } from '../utils/vesselLogsPdf';

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function Checkbox({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.checkbox, checked && styles.checkboxChecked]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );
}

export const FuelLogScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const vesselId = user?.vesselId ?? null;

  const filteredLogs = searchQuery.trim()
    ? logs.filter((log) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          (log.logDate?.toLowerCase().includes(q)) ||
          (log.logTime?.toLowerCase().includes(q)) ||
          (log.locationOfRefueling?.toLowerCase().includes(q))
        );
      })
    : logs;

  const loadLogs = useCallback(async () => {
    if (!vesselId) return;
    try {
      const data = await fuelLogsService.getByVessel(vesselId);
      setLogs(data);
      setSelectedIds(new Set());
    } catch (e) {
      console.error('Load fuel logs error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vesselId]);

  useFocusEffect(useCallback(() => { loadLogs(); }, [loadLogs]));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = filteredLogs.length > 0 && filteredLogs.every((l) => selectedIds.has(l.id));
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(filteredLogs.map((l) => l.id)));
  };

  const onRefresh = () => { setRefreshing(true); loadLogs(); };
  const onAdd = () => navigation.navigate('AddEditFuelLog', {});
  const onEdit = (log: FuelLog) => navigation.navigate('AddEditFuelLog', { logId: log.id });

  const onDelete = (log: FuelLog) => {
    Alert.alert('Delete entry', `Delete fuel log entry for ${log.locationOfRefueling || log.logDate}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await fuelLogsService.delete(log.id); loadLogs(); }
          catch { Alert.alert('Error', 'Could not delete entry.'); }
        },
      },
    ]);
  };

  const onExportPdf = async () => {
    const toExport = logs.filter((l) => selectedIds.has(l.id));
    if (toExport.length === 0) {
      Alert.alert('Nothing selected', 'Select at least one entry to export.');
      return;
    }
    setExportingPdf(true);
    try {
      let vesselName = 'Vessel';
      if (vesselId) {
        const vessel = await vesselService.getVessel(vesselId);
        if (vessel?.name) vesselName = vessel.name;
      }
      await exportFuelLogPdf(toExport, vesselName);
    } catch (e) {
      console.error('Export PDF error:', e);
      Alert.alert('Export failed', 'Could not generate PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  if (!vesselId) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Join a vessel to view fuel logs.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.actionBar}>
        <Button title="Add Log" onPress={onAdd} variant="primary" style={styles.actionBtn} />
        <Button
          title={exportingPdf ? 'Exporting…' : selectedIds.size > 0 ? `Download PDF (${selectedIds.size})` : 'Download PDF'}
          onPress={onExportPdf}
          variant="outline"
          style={styles.actionBtn}
          disabled={exportingPdf || selectedIds.size === 0}
        />
      </View>

      {logs.length > 0 && !loading && (
        <>
          <View style={styles.searchRow}>
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by date, time, location…"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllRow}>
            <Text style={styles.selectAllText}>{allSelected ? 'Deselect All' : 'Select All'}</Text>
          </TouchableOpacity>
        </>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.listContent, filteredLogs.length === 0 && styles.emptyContent]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {filteredLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⛽</Text>
              <Text style={styles.emptyTitle}>
                {logs.length === 0 ? 'No entries yet' : 'No matching entries'}
              </Text>
              <Text style={styles.emptyText}>
                {logs.length === 0
                  ? 'Tap "Add Log" to record your first fuel entry.'
                  : 'Try a different search term.'}
              </Text>
            </View>
          ) : (
            filteredLogs.map((log) => {
              const selected = selectedIds.has(log.id);
              return (
                <TouchableOpacity
                  key={log.id}
                  style={[styles.card, selected && styles.cardSelected]}
                  onPress={() => toggleSelect(log.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardLeft}>
                      <Checkbox checked={selected} onPress={() => toggleSelect(log.id)} />
                      <View style={styles.cardMeta}>
                        <Text style={styles.cardDate}>{log.logDate}</Text>
                        <Text style={styles.cardDot}>·</Text>
                        <Text style={styles.cardTime}>{log.logTime}</Text>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity onPress={() => onEdit(log)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.editBtn}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onDelete(log)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.deleteBtn}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {!!log.locationOfRefueling && (
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Location of Refueling</Text>
                      <Text style={styles.cardValue}>{log.locationOfRefueling}</Text>
                    </View>
                  )}

                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Amount</Text>
                      <Text style={styles.statValue}>{log.amountOfFuel} gal</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Per Gallon</Text>
                      <Text style={styles.statValue}>{formatCurrency(log.pricePerGallon)}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Total</Text>
                      <Text style={[styles.statValue, styles.totalValue]}>{formatCurrency(log.totalPrice)}</Text>
                    </View>
                  </View>

                  {!!log.createdByName && (
                    <Text style={styles.cardCreatedBy}>Logged by {log.createdByName}</Text>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  message: { fontSize: FONTS.base, color: COLORS.textSecondary, textAlign: 'center' },
  actionBar: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm,
  },
  actionBtn: { flex: 1 },
  searchRow: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  searchInput: { backgroundColor: COLORS.white },
  selectAllRow: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  selectAllText: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '600' },
  loader: { marginTop: SPACING.xl },
  listContent: { padding: SPACING.lg, paddingBottom: SIZES.bottomScrollPadding },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  emptyState: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.xl, alignItems: 'center',
    shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  emptyText: { fontSize: FONTS.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md,
    shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
    borderWidth: 2, borderColor: 'transparent',
  },
  cardSelected: { borderColor: COLORS.primary },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  cardDate: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.primary },
  cardDot: { fontSize: FONTS.base, color: COLORS.textSecondary },
  cardTime: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textSecondary },
  cardActions: { flexDirection: 'row', gap: SPACING.md },
  editBtn: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '600' },
  deleteBtn: { fontSize: FONTS.sm, color: COLORS.danger, fontWeight: '600' },
  cardRow: { marginBottom: SPACING.sm },
  cardLabel: { fontSize: FONTS.xs, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  cardValue: { fontSize: FONTS.base, color: COLORS.textPrimary },
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginTop: SPACING.xs, marginBottom: SPACING.sm },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: COLORS.gray200, marginVertical: 2 },
  statLabel: { fontSize: FONTS.xs, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  statValue: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary },
  totalValue: { color: COLORS.primary, fontWeight: '700' },
  cardCreatedBy: { fontSize: FONTS.xs, color: COLORS.textSecondary, fontStyle: 'italic' },
  checkbox: {
    width: 22, height: 22, borderRadius: BORDER_RADIUS.sm, borderWidth: 2,
    borderColor: COLORS.gray300, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
});
