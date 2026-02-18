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

export const AddEditYardJobScreen = ({ navigation, route }: any) => {
  const { user } = useAuthStore();
  const jobId = route.params?.jobId as string | undefined;

  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
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

  const markedDates: Record<string, { selected?: boolean; selectedColor?: string }> =
    doneByDate ? { [doneByDate]: { selected: true, selectedColor: COLORS.primary } } : {};

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
        keyboardShouldPersistTaps="handled"
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
});
