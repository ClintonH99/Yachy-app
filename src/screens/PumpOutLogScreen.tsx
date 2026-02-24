/**
 * Pump Out Log Screen
 * List of pump out log entries with Add, Edit, Delete, and selective PDF export.
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
import pumpOutLogsService from '../services/pumpOutLogs';
import vesselService from '../services/vessel';
import { PumpOutLog, DischargeType } from '../types';
import { Button, Input } from '../components';
import { exportPumpOutLogPdf } from '../utils/vesselLogsPdf';

const DISCHARGE_LABELS: Record<DischargeType, string> = {
  DIRECT_DISCHARGE: 'Direct Discharge',
  TREATMENT_PLANT: 'Treatment Plant Discharge',
  PUMPOUT_SERVICE: 'Pumpout Service',
};

const DISCHARGE_COLORS: Record<DischargeType, string> = {
  DIRECT_DISCHARGE: COLORS.danger,
  TREATMENT_PLANT: COLORS.success,
  PUMPOUT_SERVICE: COLORS.primaryLight,
};

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

export const PumpOutLogScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<PumpOutLog[]>([]);
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
          (log.location?.toLowerCase().includes(q)) ||
          (log.pumpoutServiceName?.toLowerCase().includes(q)) ||
          (log.description?.toLowerCase().includes(q)) ||
          DISCHARGE_LABELS[log.dischargeType].toLowerCase().includes(q)
        );
      })
    : logs;

  const loadLogs = useCallback(async () => {
    if (!vesselId) return;
    try {
      const data = await pumpOutLogsService.getByVessel(vesselId);
      setLogs(data);
      setSelectedIds(new Set());
    } catch (e) {
      console.error('Load pump out logs error:', e);
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
  const onAdd = () => navigation.navigate('AddEditPumpOutLog', {});
  const onEdit = (log: PumpOutLog) => navigation.navigate('AddEditPumpOutLog', { logId: log.id });

  const onDelete = (log: PumpOutLog) => {
    Alert.alert('Delete entry', 'Delete this pump out log entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await pumpOutLogsService.delete(log.id); loadLogs(); }
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
      await exportPumpOutLogPdf(toExport, vesselName);
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
        <Text style={styles.message}>Join a vessel to view pump out logs.</Text>
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
              placeholder="Search by date, location, service, description…"
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
              <Text style={styles.emptyIcon}>🚿</Text>
              <Text style={styles.emptyTitle}>
                {logs.length === 0 ? 'No entries yet' : 'No matching entries'}
              </Text>
              <Text style={styles.emptyText}>
                {logs.length === 0
                  ? 'Tap "Add Log" to record your first pump out entry.'
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

                  <View style={[styles.badge, { backgroundColor: DISCHARGE_COLORS[log.dischargeType] + '20' }]}>
                    <Text style={[styles.badgeText, { color: DISCHARGE_COLORS[log.dischargeType] }]}>
                      {DISCHARGE_LABELS[log.dischargeType]}
                    </Text>
                  </View>

                  {log.dischargeType === 'PUMPOUT_SERVICE' && !!log.pumpoutServiceName && (
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Service</Text>
                      <Text style={styles.cardValue}>{log.pumpoutServiceName}</Text>
                    </View>
                  )}
                  {!!log.location && (
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Location</Text>
                      <Text style={styles.cardValue}>{log.location}</Text>
                    </View>
                  )}
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Amount</Text>
                    <Text style={styles.cardValue}>{log.amountInGallons} gallons</Text>
                  </View>
                  {!!log.description && (
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Description</Text>
                      <Text style={styles.cardValue}>{log.description}</Text>
                    </View>
                  )}
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
  badge: { alignSelf: 'flex-start', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.sm, marginBottom: SPACING.sm },
  badgeText: { fontSize: FONTS.sm, fontWeight: '700' },
  cardRow: { marginBottom: SPACING.sm },
  cardLabel: { fontSize: FONTS.xs, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  cardValue: { fontSize: FONTS.base, color: COLORS.textPrimary },
  cardCreatedBy: { fontSize: FONTS.xs, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: SPACING.xs },
  checkbox: {
    width: 22, height: 22, borderRadius: BORDER_RADIUS.sm, borderWidth: 2,
    borderColor: COLORS.gray300, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
});
