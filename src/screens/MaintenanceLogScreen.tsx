/**
 * Maintenance Log Screen
 * Spreadsheet-style list of logs; Add Log, Edit, Delete, Export PDF.
 * Logs persist until manually deleted.
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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../store';
import maintenanceLogsService from '../services/maintenanceLogs';
import vesselService from '../services/vessel';
import { MaintenanceLog } from '../types';
import { Button } from '../components';

const COLUMN_WIDTH = 110;
const DATE_WIDTH = 88;
const ACTIONS_WIDTH = 90;

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const MaintenanceLogScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const vesselId = user?.vesselId ?? null;

  const loadLogs = useCallback(async () => {
    if (!vesselId) return;
    try {
      const data = await maintenanceLogsService.getByVessel(vesselId);
      setLogs(data);
    } catch (e) {
      console.error('Load maintenance logs error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vesselId]);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });

  const onAdd = () => {
    navigation.navigate('AddEditMaintenanceLog', {});
  };

  const onEdit = (log: MaintenanceLog) => {
    navigation.navigate('AddEditMaintenanceLog', { logId: log.id });
  };

  const onDelete = (log: MaintenanceLog) => {
    Alert.alert(
      'Delete log',
      `Delete maintenance log for "${log.equipment}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await maintenanceLogsService.delete(log.id);
              loadLogs();
            } catch (e) {
              Alert.alert('Error', 'Could not delete log');
            }
          },
        },
      ]
    );
  };

  const exportPdf = async () => {
    try {
      setExportingPdf(true);
      
      // Get vessel name for filename
      let vesselName = 'Vessel';
      if (vesselId) {
        try {
          const vessel = await vesselService.getVessel(vesselId);
          if (vessel?.name) {
            // Sanitize vessel name for filename (remove invalid chars)
            vesselName = vessel.name.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'Vessel';
          }
        } catch (e) {
          console.error('Error fetching vessel name:', e);
        }
      }
      
      // Format date for filename (YYYY-MM-DD)
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const filename = `${vesselName}_${dateStr}_MaintenanceLog.pdf`;
      
      const rows = logs.map(
        (l) =>
          `<tr>
            <td>${escapeHtml(l.equipment)}</td>
            <td>${escapeHtml(l.portStarboardNa)}</td>
            <td>${escapeHtml(l.serialNumber)}</td>
            <td>${escapeHtml(l.hoursOfService)}</td>
            <td>${escapeHtml(l.hoursAtNextService)}</td>
            <td>${escapeHtml(l.whatServiceDone)}</td>
            <td>${escapeHtml(l.notes)}</td>
            <td>${escapeHtml(l.serviceDoneBy)}</td>
            <td>${formatDate(l.createdAt)}</td>
          </tr>`
      ).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Maintenance Log</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-size: 10px; }
            th, td { border: 1px solid #333; padding: 6px; text-align: left; }
            th { background: #1e3a5f; color: white; }
            tr:nth-child(even) { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>Maintenance Log</h1>
          <p>Generated ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Port/Stbd/NA</th>
                <th>Serial #</th>
                <th>Hrs service</th>
                <th>Hrs next</th>
                <th>What service done</th>
                <th>Notes</th>
                <th>Done by</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length ? rows : '<tr><td colspan="9">No entries</td></tr>'}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html,
        width: 842,
        height: 595,
        base64: false,
      });
      
      // Rename file with vessel name, date, and "Maintenance Log"
      const newUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });
      
      await Sharing.shareAsync(newUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Maintenance Log PDF',
      });
    } catch (e) {
      console.error('Export PDF error:', e);
      Alert.alert(
        'Export failed',
        'Could not generate PDF. If you added expo-print or expo-sharing recently, try: npx expo start --clear and rebuild the app (e.g. re-open in Expo Go or create a new development build).'
      );
    } finally {
      setExportingPdf(false);
    }
  };

  if (!vesselId) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Join a vessel to see maintenance logs.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        <Button
          title="Add Log"
          onPress={onAdd}
          variant="primary"
          style={styles.addButton}
        />
        <Button
          title={exportingPdf ? 'Exporting…' : 'Download PDF'}
          onPress={exportPdf}
          variant="outline"
          style={styles.pdfButton}
          disabled={exportingPdf || logs.length === 0}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : logs.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        >
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No maintenance logs yet</Text>
            <Button title="Add first log" onPress={onAdd} variant="primary" style={styles.emptyBtn} />
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          style={styles.tableScroll}
          contentContainerStyle={styles.tableContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        >
          <View style={styles.table}>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.headerCell, { width: COLUMN_WIDTH }]}>Equipment</Text>
              <Text style={[styles.cell, styles.headerCell, { width: 72 }]}>Port/Stbd/NA</Text>
              <Text style={[styles.cell, styles.headerCell, { width: COLUMN_WIDTH }]}>Serial #</Text>
              <Text style={[styles.cell, styles.headerCell, { width: 70 }]}>Hrs</Text>
              <Text style={[styles.cell, styles.headerCell, { width: 70 }]}>Hrs next</Text>
              <Text style={[styles.cell, styles.headerCell, { width: COLUMN_WIDTH }]}>Service done</Text>
              <Text style={[styles.cell, styles.headerCell, { width: COLUMN_WIDTH }]}>Notes</Text>
              <Text style={[styles.cell, styles.headerCell, { width: COLUMN_WIDTH }]}>Done by</Text>
              <Text style={[styles.cell, styles.headerCell, { width: DATE_WIDTH }]}>Date</Text>
              <View style={[styles.cell, styles.headerCell, { width: ACTIONS_WIDTH }]} />
            </View>
            {logs.map((log) => (
              <View key={log.id} style={styles.row}>
                <Text style={[styles.cell, { width: COLUMN_WIDTH }]} numberOfLines={2}>{log.equipment}</Text>
                <Text style={[styles.cell, { width: 72 }]} numberOfLines={1}>{log.portStarboardNa || '—'}</Text>
                <Text style={[styles.cell, { width: COLUMN_WIDTH }]} numberOfLines={1}>{log.serialNumber || '—'}</Text>
                <Text style={[styles.cell, { width: 70 }]} numberOfLines={1}>{log.hoursOfService || '—'}</Text>
                <Text style={[styles.cell, { width: 70 }]} numberOfLines={1}>{log.hoursAtNextService || '—'}</Text>
                <Text style={[styles.cell, { width: COLUMN_WIDTH }]} numberOfLines={2}>{log.whatServiceDone || '—'}</Text>
                <Text style={[styles.cell, { width: COLUMN_WIDTH }]} numberOfLines={2}>{log.notes || '—'}</Text>
                <Text style={[styles.cell, { width: COLUMN_WIDTH }]} numberOfLines={1}>{log.serviceDoneBy || '—'}</Text>
                <Text style={[styles.cell, { width: DATE_WIDTH }, styles.dateCell]}>{formatDate(log.createdAt)}</Text>
                <View style={[styles.cell, styles.actionsCell, { width: ACTIONS_WIDTH }]}>
                  <TouchableOpacity onPress={() => onEdit(log)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.editBtn}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(log)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.deleteBtn}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
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
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  addButton: {
    flex: 1,
  },
  pdfButton: {
    flex: 1,
  },
  loader: {
    marginTop: SPACING.xl,
  },
  emptyScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  empty: {
    alignItems: 'center',
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
  emptyBtn: {
    minWidth: 160,
  },
  tableScroll: {
    flex: 1,
  },
  tableContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['2xl'],
  },
  table: {
    minWidth: 2 * COLUMN_WIDTH * 3 + 70 * 2 + DATE_WIDTH + ACTIONS_WIDTH,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    alignItems: 'center',
    minHeight: 44,
  },
  headerRow: {
    backgroundColor: COLORS.primary,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  cell: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: FONTS.sm,
    color: COLORS.textPrimary,
  },
  headerCell: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONTS.xs,
  },
  dateCell: {
    color: COLORS.textSecondary,
  },
  actionsCell: {
    flexDirection: 'row',
    gap: SPACING.xs,
    justifyContent: 'flex-start',
  },
  editBtn: {
    fontSize: FONTS.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  deleteBtn: {
    fontSize: FONTS.xs,
    color: COLORS.danger,
    fontWeight: '600',
  },
});
