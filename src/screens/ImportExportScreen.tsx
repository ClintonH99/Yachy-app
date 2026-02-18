/**
 * Import/Export Screen
 * Download Excel templates and import data for Tasks, Maintenance Log, Yard Period
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SIZES } from '../constants/theme';
import { useAuthStore } from '../store';
import vesselTasksService from '../services/vesselTasks';
import maintenanceLogsService from '../services/maintenanceLogs';
import yardJobsService from '../services/yardJobs';
import {
  downloadTemplate,
  parseTasksFile,
  parseMaintenanceFile,
  parseYardFile,
  TemplateType,
} from '../services/excelTemplates';
import { Button } from '../components';

export const ImportExportScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [downloading, setDownloading] = useState<TemplateType | null>(null);
  const [importing, setImporting] = useState<TemplateType | null>(null);

  const vesselId = user?.vesselId ?? null;

  const handleDownload = async (type: TemplateType) => {
    setDownloading(type);
    try {
      await downloadTemplate(type);
    } catch (e) {
      console.error('Download template error:', e);
      Alert.alert('Error', 'Could not create template.');
    } finally {
      setDownloading(null);
    }
  };

  const handleImport = async (type: TemplateType) => {
    if (!vesselId) {
      Alert.alert('No vessel', 'Join a vessel to import data.');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setImporting(type);

      if (type === 'tasks') {
        const { success, errors } = await parseTasksFile(uri);
        if (success.length === 0 && errors.length > 0) {
          Alert.alert(
            'Import failed',
            errors.map((e) => `Row ${e.row}: ${e.message}`).join('\n')
          );
          return;
        }
        let imported = 0;
        for (const row of success) {
          try {
            await vesselTasksService.create({
              vesselId,
              category: row.category as 'DAILY' | 'WEEKLY' | 'MONTHLY',
              department: (row.department || user?.department || 'INTERIOR') as 'BRIDGE' | 'ENGINEERING' | 'EXTERIOR' | 'INTERIOR' | 'GALLEY',
              title: row.title,
              notes: row.notes,
              doneByDate: row.doneByDate || undefined,
              recurring: (row.recurring as '7_DAYS' | '14_DAYS' | '30_DAYS') || undefined,
            });
            imported++;
          } catch (e) {
            console.error('Import task error:', e);
            errors.push({ row: imported + 1, message: (e as Error).message });
          }
        }
        const errMsg = errors.length > 0 ? `\n\n${errors.length} row(s) had errors.` : '';
        Alert.alert('Import complete', `Imported ${imported} task(s).${errMsg}`);
      } else if (type === 'maintenance') {
        const { success, errors } = await parseMaintenanceFile(uri);
        if (success.length === 0 && errors.length > 0) {
          Alert.alert(
            'Import failed',
            errors.map((e) => `Row ${e.row}: ${e.message}`).join('\n')
          );
          return;
        }
        let imported = 0;
        for (const row of success) {
          try {
            await maintenanceLogsService.create({
              vesselId,
              equipment: row.equipment,
              portStarboardNa: row.location,
              serialNumber: row.serialNumber,
              hoursOfService: row.hoursOfService,
              hoursAtNextService: row.hoursAtNextService,
              whatServiceDone: row.whatServiceDone,
              notes: row.notes,
              serviceDoneBy: row.serviceDoneBy,
            });
            imported++;
          } catch (e) {
            console.error('Import maintenance log error:', e);
            errors.push({ row: imported + 1, message: (e as Error).message });
          }
        }
        const errMsg = errors.length > 0 ? `\n\n${errors.length} row(s) had errors.` : '';
        Alert.alert('Import complete', `Imported ${imported} maintenance log(s).${errMsg}`);
      } else if (type === 'yard') {
        const { success, errors } = await parseYardFile(uri);
        if (success.length === 0 && errors.length > 0) {
          Alert.alert(
            'Import failed',
            errors.map((e) => `Row ${e.row}: ${e.message}`).join('\n')
          );
          return;
        }
        let imported = 0;
        for (const row of success) {
          try {
            await yardJobsService.create({
              vesselId,
              jobTitle: row.jobTitle,
              jobDescription: row.jobDescription,
              yardLocation: row.yardLocation,
              contractorCompanyName: row.contractorCompanyName,
              contactDetails: row.contactDetails,
              doneByDate: row.doneByDate || undefined,
            });
            imported++;
          } catch (e) {
            console.error('Import yard job error:', e);
            errors.push({ row: imported + 1, message: (e as Error).message });
          }
        }
        const errMsg = errors.length > 0 ? `\n\n${errors.length} row(s) had errors.` : '';
        Alert.alert('Import complete', `Imported ${imported} yard period job(s).${errMsg}`);
      }
    } catch (e) {
      console.error('Import error:', e);
      Alert.alert('Error', 'Could not import file.');
    } finally {
      setImporting(null);
    }
  };

  const TemplateSection = ({
    type,
    title,
    icon,
    description,
  }: {
    type: TemplateType;
    title: string;
    icon: string;
    description: string;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {icon} {title}
      </Text>
      <Text style={styles.sectionDesc}>{description}</Text>
      {!vesselId && (
        <Text style={styles.vesselNote}>Join a vessel to import data.</Text>
      )}
      <View style={styles.actions}>
        <Button
          title={downloading === type ? 'Creating…' : 'Download Template'}
          onPress={() => handleDownload(type)}
          variant="outline"
          disabled={!!downloading}
          loading={downloading === type}
          style={styles.btn}
        />
        <Button
          title={importing === type ? 'Importing…' : 'Import from File'}
          onPress={() => handleImport(type)}
          variant="primary"
          disabled={!!importing || !vesselId}
          loading={importing === type}
          style={styles.btn}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.intro}>
          Download a template, fill it with your data in Excel or Google Sheets, then import it here.
        </Text>

        <TemplateSection
          type="tasks"
          title="Tasks"
          icon="📋"
          description="Daily, Weekly, and Monthly tasks. Columns: Category, Title, Notes, Done By Date, Recurring."
        />
        <TemplateSection
          type="maintenance"
          title="Maintenance Log"
          icon="📝"
          description="Equipment maintenance records. Columns: Equipment, Location, Serial #, Hours, Service details."
        />
        <TemplateSection
          type="yard"
          title="Yard Period"
          icon="🔧"
          description="Yard period jobs. Columns: Job Title, Description, Yard Location, Contractor, Contact."
        />
      </View>
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
    paddingBottom: SIZES.bottomScrollPadding,
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
  intro: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  vesselNote: {
    fontSize: FONTS.sm,
    color: COLORS.warning,
    marginBottom: SPACING.sm,
  },
  section: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionDesc: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  btn: {
    flex: 1,
    minWidth: 140,
  },
});
