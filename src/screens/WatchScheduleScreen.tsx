/**
 * Watch Schedule Screen
 * Published watch timetables - view and export as PDF
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SIZES } from '../constants/theme';
import { useAuthStore } from '../store';
import watchKeepingService, { PublishedWatchTimetable } from '../services/watchKeeping';
import { formatLocalDateString } from '../utils';

export const WatchScheduleScreen = ({ navigation, route }: any) => {
  const { user } = useAuthStore();
  const [publishedTimetables, setPublishedTimetables] = useState<PublishedWatchTimetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingSchedule, setViewingSchedule] = useState<PublishedWatchTimetable | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const vesselId = user?.vesselId ?? null;
  const isHOD = user?.role === 'HOD';

  const loadPublished = useCallback(async () => {
    if (!vesselId) return;
    setLoading(true);
    try {
      const data = await watchKeepingService.getByVessel(vesselId);
      setPublishedTimetables(data);
      return data;
    } catch (e) {
      console.error('Load published timetables error:', e);
      return [];
    } finally {
      setLoading(false);
    }
  }, [vesselId]);

  useFocusEffect(
    useCallback(() => {
      if (!vesselId) return;
      const timetableId = route?.params?.timetableId;
      loadPublished().then((data) => {
        if (timetableId && data && data.length > 0) {
          const timetable = data.find((t) => t.id === timetableId);
          if (timetable) {
            setViewingSchedule(timetable);
            navigation.setParams({ timetableId: undefined });
          }
        }
      });
    }, [vesselId, loadPublished, route?.params?.timetableId, navigation])
  );

  const handleDelete = async (timetable: PublishedWatchTimetable) => {
    Alert.alert(
      'Delete Watch Schedule',
      `Are you sure you want to delete the schedule for ${formatLocalDateString(timetable.forDate, { month: 'short', day: 'numeric' })}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await watchKeepingService.delete(timetable.id);
              setViewingSchedule(null);
              loadPublished();
              Alert.alert('Deleted', 'Watch Schedule has been deleted.');
            } catch (e) {
              console.error('Delete error:', e);
              Alert.alert('Error', 'Could not delete watch schedule.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (timetable: PublishedWatchTimetable) => {
    setViewingSchedule(null);
    navigation.navigate('CreateWatchTimetable', { timetableId: timetable.id });
  };

  const SLOTS_PER_PAGE = 30;

  const exportWatchSchedulePdf = async (t: PublishedWatchTimetable) => {
    setExportingPdf(true);
    try {
      const dateStr = formatLocalDateString(t.forDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const headerMeta = `
          <h1>Watch Schedule</h1>
          <p class="meta meta-row"><strong>Date:</strong> ${dateStr}</p>
          ${t.startLocation ? `<p class="meta meta-row"><strong>From:</strong> ${t.startLocation}</p>` : ''}
          ${t.destination ? `<p class="meta meta-row"><strong>To:</strong> ${t.destination}</p>` : ''}
          <p class="meta meta-row"><strong>Start:</strong> ${t.startTime}</p>`;

      const slotToRow = (s: (typeof t.slots)[0]) =>
        `<tr><td>${s.crewPosition || '—'}</td><td>${s.crewName}</td><td>${s.startTimeStr} – ${s.endTimeStr}</td></tr>`;

      const chunks: (typeof t.slots)[] = [];
      for (let i = 0; i < t.slots.length; i += SLOTS_PER_PAGE) {
        chunks.push(t.slots.slice(i, i + SLOTS_PER_PAGE));
      }

      const pageBlocks = chunks.map((chunk, pageIndex) => {
        const rows = chunk.map(slotToRow).join('');
        const isLast = pageIndex === chunks.length - 1;
        return `
          <div class="page" ${isLast ? '' : 'style="page-break-after: always;"'}>
            <div class="content">
              ${headerMeta}
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th class="col-position">Position</th>
                      <th class="col-crew">Crew</th>
                      <th class="col-time">Time</th>
                    </tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>
              ${chunks.length > 1 ? `<p class="page-num">Page ${pageIndex + 1} of ${chunks.length}</p>` : ''}
            </div>
          </div>`;
      });

      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Watch Schedule</title>
        <style>
          @page { size: A4 portrait; margin: 16px; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.3; }
          .content { padding: 14px; }
          h1 { margin: 0 0 8px 0; font-size: 18px; }
          .meta { margin: 2px 0; }
          .meta-row { margin-bottom: 4px; }
          .table-container { width: 50%; margin-top: 10px; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #ddd; }
          th, td { padding: 5px 8px; text-align: left; }
          th { background: #1E3A8A; color: white; font-weight: 600; border-bottom: 2px solid #1E3A8A; }
          td { border-bottom: 1px solid #ddd; border-right: 1px solid #ddd; }
          td:last-child { border-right: none; }
          tr:last-child td { border-bottom: none; }
          tr:nth-child(even) td { background: #f5f5f5; }
          .col-position { width: 30%; }
          .col-crew { width: 35%; }
          .col-time { width: 35%; }
          .page-num { font-size: 11px; color: #666; margin-top: 12px; }
        </style>
        </head>
        <body>${pageBlocks.join('')}</body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({
        html,
        width: 595,
        height: 842,
        base64: false,
      });
      const filename = `Watch_Schedule_${t.forDate}.pdf`;
      const newUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.moveAsync({ from: uri, to: newUri });
      await Sharing.shareAsync(newUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export Watch Schedule as PDF',
      });
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
        <Text style={styles.message}>Join a vessel to use Watch Schedule.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadPublished} colors={[COLORS.primary]} />
      }
    >
      {loading && publishedTimetables.length === 0 ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.xl }} />
      ) : publishedTimetables.length === 0 ? (
        <Text style={styles.empty}>
          No Watch Schedules yet. Create a timetable in Create, generate it, then tap Export to add it here.
        </Text>
      ) : (
        publishedTimetables.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={styles.card}
            onPress={() => setViewingSchedule(t)}
            activeOpacity={0.8}
          >
            <Text style={styles.cardTitle}>{t.watchTitle}</Text>
            <Text style={styles.cardMeta}>{formatLocalDateString(t.forDate, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            {t.startLocation ? <Text style={styles.cardMeta}>From: {t.startLocation}</Text> : null}
            {t.destination ? <Text style={styles.cardMeta}>To: {t.destination}</Text> : null}
            <Text style={styles.cardMeta}>Start: {t.startTime}</Text>
            <Text style={styles.cardHint}>Tap to view · Export PDF</Text>
          </TouchableOpacity>
        ))
      )}

      {viewingSchedule && (
        <Modal visible animationType="slide">
          <ScrollView
            style={styles.viewModal}
            contentContainerStyle={styles.viewModalContent}
            showsVerticalScrollIndicator
          >
            <View style={styles.viewHeader}>
              <Text style={styles.viewTitle}>Watch Schedule</Text>
              <Text style={styles.viewDate}>
                {formatLocalDateString(viewingSchedule.forDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.viewContent}>
              {viewingSchedule.startLocation ? <Text style={styles.viewMeta}>From: {viewingSchedule.startLocation}</Text> : null}
              {viewingSchedule.destination ? <Text style={styles.viewMeta}>To: {viewingSchedule.destination}</Text> : null}
              <Text style={styles.viewMeta}>Start: {viewingSchedule.startTime}</Text>
              <View style={styles.slots}>
                {viewingSchedule.slots.map((slot, idx) => (
                  <View key={idx} style={styles.slotRow}>
                    <Text style={styles.slotCrew}>{slot.crewName}</Text>
                    {slot.crewPosition ? <Text style={styles.slotRole}>{slot.crewPosition}</Text> : null}
                    <Text style={styles.slotTime}>{slot.startTimeStr} – {slot.endTimeStr}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.viewActions}>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={() => exportWatchSchedulePdf(viewingSchedule)}
                disabled={exportingPdf}
              >
                <Text style={styles.exportBtnText}>{exportingPdf ? 'Exporting...' : 'Export as PDF'}</Text>
              </TouchableOpacity>
              {isHOD && (
                <>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleEdit(viewingSchedule)}
                    disabled={deleting}
                  >
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(viewingSchedule)}
                    disabled={deleting}
                  >
                    <Text style={styles.deleteBtnText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setViewingSchedule(null)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SIZES.bottomScrollPadding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  message: { fontSize: FONTS.base, color: COLORS.textSecondary, textAlign: 'center' },
  empty: { fontSize: FONTS.base, color: COLORS.textSecondary, padding: SPACING.xl },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardTitle: { fontSize: FONTS.lg, fontWeight: '600', color: COLORS.textPrimary },
  cardMeta: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  cardHint: { fontSize: FONTS.xs, color: COLORS.primary, marginTop: SPACING.sm, fontWeight: '500' },
  viewModal: { flex: 1, backgroundColor: COLORS.background },
  viewModalContent: { paddingBottom: SIZES.bottomScrollPadding },
  viewHeader: { padding: SPACING.lg, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  viewTitle: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.primary },
  viewDate: { fontSize: FONTS.base, color: COLORS.textSecondary, marginTop: SPACING.xs },
  viewContent: { padding: SPACING.lg },
  viewMeta: { fontSize: FONTS.base, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  slots: { marginTop: SPACING.lg },
  slotRow: { backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm },
  slotCrew: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary },
  slotRole: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: 2 },
  slotTime: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '600', marginTop: SPACING.xs },
  viewActions: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.sm },
  exportBtn: { padding: SPACING.md, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  exportBtnText: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.white },
  editBtn: { padding: SPACING.md, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, alignItems: 'center', opacity: 0.9 },
  editBtnText: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.white },
  deleteBtn: { padding: SPACING.md, backgroundColor: '#dc2626', borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  deleteBtnText: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.white },
  closeBtn: { padding: SPACING.sm, alignItems: 'center' },
  closeBtnText: { fontSize: FONTS.base, color: COLORS.textSecondary },
});
