/**
 * Add / Edit Yard Period Job Screen
 * Job Title, Description, Yard Location, Contractor, Contact Details, Done by Date. HOD only for create/edit.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SIZES } from '../constants/theme';
import { useAuthStore } from '../store';
import yardJobsService from '../services/yardJobs';
import { Input, Button } from '../components';
import { Department, YardJobPriority } from '../types';

export const AddEditYardJobScreen = ({ navigation, route }: any) => {
  const { user } = useAuthStore();
  const jobId = route.params?.jobId as string | undefined;

  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [department, setDepartment] = useState<Department>(user?.department ?? 'INTERIOR');
  const [priority, setPriority] = useState<YardJobPriority>('GREEN');
  const [yardLocation, setYardLocation] = useState('');
  const [contractorCompanyName, setContractorCompanyName] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [doneByDate, setDoneByDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!jobId);
  const [saving, setSaving] = useState(false);

  const vesselId = user?.vesselId ?? null;
  const isHOD = user?.role === 'HOD';
  const isEdit = !!jobId;

  useEffect(() => {
    navigation.setOptions({
      title: jobId ? 'Edit Job' : 'Create New Job',
    });
  }, [navigation, jobId]);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      try {
        const job = await yardJobsService.getById(jobId);
        if (job) {
          setJobTitle(job.jobTitle);
          setJobDescription(job.jobDescription ?? '');
          setDepartment(job.department ?? user?.department ?? 'INTERIOR');
          setPriority(job.priority ?? 'GREEN');
          setYardLocation(job.yardLocation ?? '');
          setContractorCompanyName(job.contractorCompanyName ?? '');
          setContactDetails(job.contactDetails ?? '');
          setDoneByDate(job.doneByDate ?? null);
        }
      } catch (e) {
        console.error('Load job error:', e);
        Alert.alert('Error', 'Could not load job');
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const markedDates: Record<string, { selected?: boolean; selectedColor?: string; selectedTextColor?: string; marked?: boolean }> =
    doneByDate
      ? {
          [doneByDate]: {
            selected: true,
            selectedColor: COLORS.primary,
            selectedTextColor: '#FFFFFF',
            marked: true,
          },
        }
      : {};

  const calendarTheme = {
    backgroundColor: COLORS.white,
    calendarBackground: COLORS.white,
    textSectionTitleColor: COLORS.textSecondary,
    selectedDayBackgroundColor: COLORS.primary,
    selectedDayTextColor: COLORS.white,
    todayTextColor: COLORS.primary,
    dayTextColor: COLORS.textPrimary,
    textDisabledColor: COLORS.gray400,
    arrowColor: COLORS.primary,
    monthTextColor: COLORS.primary,
  };

  const handleSave = async () => {
    const trimmed = jobTitle.trim();
    if (!trimmed) {
      Alert.alert('Missing title', 'Please enter a job title.');
      return;
    }
    if (!vesselId) {
      Alert.alert('Error', 'You must be in a vessel to create jobs.');
      return;
    }
    if (!isHOD) {
      Alert.alert('Access denied', 'Only HODs can create or edit jobs.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await yardJobsService.update(jobId, {
          jobTitle: trimmed,
          jobDescription: jobDescription.trim() || undefined,
          department,
          priority,
          yardLocation: yardLocation.trim() || undefined,
          contractorCompanyName: contractorCompanyName.trim() || undefined,
          contactDetails: contactDetails.trim() || undefined,
          doneByDate: doneByDate || null,
        });
        Alert.alert('Updated', 'Job updated.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await yardJobsService.create({
          vesselId,
          jobTitle: trimmed,
          jobDescription: jobDescription.trim() || undefined,
          department,
          priority,
          yardLocation: yardLocation.trim() || undefined,
          contractorCompanyName: contractorCompanyName.trim() || undefined,
          contactDetails: contactDetails.trim() || undefined,
          doneByDate: doneByDate || null,
        });
        Alert.alert('Created', 'Job added.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      console.error('Save job error:', e);
      Alert.alert('Error', 'Could not save job.');
    } finally {
      setSaving(false);
    }
  };

  if (!isHOD) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Only HODs can add or edit jobs.</Text>
      </View>
    );
  }

  if (!vesselId) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Join a vessel to add jobs.</Text>
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="always"
      >
        <Input
          label="Job title"
          value={jobTitle}
          onChangeText={setJobTitle}
          placeholder="e.g. Engine service"
          autoCapitalize="words"
        />
        <Input
          label="Job description"
          value={jobDescription}
          onChangeText={setJobDescription}
          placeholder="Details of the work required..."
          multiline
          numberOfLines={3}
        />
        <Text style={styles.label}>Department</Text>
        <Text style={styles.hint}>Which department is this job for?</Text>
        <View style={styles.chipRow}>
          {(['BRIDGE', 'ENGINEERING', 'EXTERIOR', 'INTERIOR', 'GALLEY'] as Department[]).map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[
                styles.chip,
                department === dept && styles.chipSelected,
                { borderColor: COLORS.departmentColors?.[dept] ?? COLORS.primary },
              ]}
              onPress={() => setDepartment(dept)}
            >
              <Text
                style={[
                  styles.chipText,
                  department === dept && styles.chipTextSelected,
                ]}
                numberOfLines={1}
              >
                {dept.charAt(0) + dept.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Urgency / Priority</Text>
        <Text style={styles.hint}>How urgent is this job?</Text>
        <View style={styles.priorityRow}>
          {(['GREEN', 'YELLOW', 'RED'] as YardJobPriority[]).map((p) => {
            const isSelected = priority === p;
            const chipColor = p === 'GREEN' ? COLORS.success : p === 'YELLOW' ? COLORS.warning : COLORS.danger;
            return (
            <TouchableOpacity
              key={p}
              style={[
                styles.priorityChip,
                { borderColor: chipColor, borderWidth: isSelected ? 3 : 2 },
                isSelected && { backgroundColor: chipColor },
              ]}
              onPress={() => setPriority(p)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.priorityDot, { backgroundColor: p === 'GREEN' ? COLORS.success : p === 'YELLOW' ? COLORS.warning : COLORS.danger }]} />
              <Text
                style={[
                  styles.priorityChipText,
                  isSelected && { color: COLORS.white, fontWeight: '700' },
                ]}
              >
                {p === 'GREEN' ? 'Low' : p === 'YELLOW' ? 'Medium' : 'High'}
              </Text>
            </TouchableOpacity>
          );
          })}
        </View>
        <Input
          label="Yard location"
          value={yardLocation}
          onChangeText={setYardLocation}
          placeholder="e.g. Palma Shipyard, Dock 7"
        />
        <Input
          label="Contractor / Company name"
          value={contractorCompanyName}
          onChangeText={setContractorCompanyName}
          placeholder="e.g. Marine Services Ltd"
        />
        <Input
          label="Contact details"
          value={contactDetails}
          onChangeText={setContactDetails}
          placeholder="Phone, email, or other contact info"
        />
        <Text style={styles.label}>Done by date (optional)</Text>
        <Text style={styles.hint}>
          Jobs with a deadline change color as time passes (green → yellow → red).
        </Text>
        <View style={styles.calendarWrap}>
          <Calendar
            current={doneByDate || new Date().toISOString().slice(0, 10)}
            minDate={new Date().toISOString().slice(0, 10)}
            markedDates={markedDates}
            onDayPress={({ dateString }) =>
              setDoneByDate(doneByDate === dateString ? null : dateString)
            }
            theme={calendarTheme}
            hideExtraDays
          />
        </View>
        {doneByDate && (
          <TouchableOpacity
            style={styles.clearDate}
            onPress={() => setDoneByDate(null)}
          >
            <Text style={styles.clearDateText}>Clear deadline</Text>
          </TouchableOpacity>
        )}
        <View style={styles.actions}>
          <Button
            title={isEdit ? 'Update job' : 'Create job'}
            onPress={handleSave}
            variant="primary"
            loading={saving}
            disabled={saving}
            fullWidth
          />
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
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
  label: {
    fontSize: FONTS.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  hint: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  calendarWrap: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  clearDate: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  clearDateText: {
    fontSize: FONTS.sm,
    color: COLORS.danger,
  },
  actions: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  cancelBtn: {
    alignSelf: 'center',
    padding: SPACING.sm,
  },
  cancelText: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  chip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    backgroundColor: COLORS.white,
  },
  chipSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  chipText: {
    fontSize: FONTS.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  chipTextSelected: {
    color: COLORS.white,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  priorityChip: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    backgroundColor: COLORS.white,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priorityChipText: {
    fontSize: FONTS.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
