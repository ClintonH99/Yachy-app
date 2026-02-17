/**
 * Add / Edit Maintenance Log Screen
 * Equipment, Serial number, Hours of service, Hours at next service,
 * What service done, Notes, Service done by (Crew/Contractor)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useAuthStore } from '../store';
import maintenanceLogsService from '../services/maintenanceLogs';
import { Input, Button } from '../components';

export const AddEditMaintenanceLogScreen = ({ navigation, route }: any) => {
  const { user } = useAuthStore();
  const logId = route.params?.logId as string | undefined;

  const [equipment, setEquipment] = useState('');
  const [portStarboardNa, setPortStarboardNa] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [hoursOfService, setHoursOfService] = useState('');
  const [hoursAtNextService, setHoursAtNextService] = useState('');
  const [whatServiceDone, setWhatServiceDone] = useState('');
  const [notes, setNotes] = useState('');
  const [serviceDoneBy, setServiceDoneBy] = useState('');
  const [loading, setLoading] = useState(!!logId);
  const [saving, setSaving] = useState(false);

  const vesselId = user?.vesselId ?? null;
  const isEdit = !!logId;

  useEffect(() => {
    navigation.setOptions({
      title: logId ? 'Edit Log' : 'New Maintenance Log',
    });
  }, [navigation, logId]);

  useEffect(() => {
    if (!logId) return;
    (async () => {
      try {
        const log = await maintenanceLogsService.getById(logId);
        if (log) {
          setEquipment(log.equipment);
          setPortStarboardNa(log.portStarboardNa ?? '');
          setSerialNumber(log.serialNumber ?? '');
          setHoursOfService(log.hoursOfService ?? '');
          setHoursAtNextService(log.hoursAtNextService ?? '');
          setWhatServiceDone(log.whatServiceDone ?? '');
          setNotes(log.notes ?? '');
          setServiceDoneBy(log.serviceDoneBy ?? '');
        }
      } catch (e) {
        console.error('Load log error:', e);
        Alert.alert('Error', 'Could not load log');
      } finally {
        setLoading(false);
      }
    })();
  }, [logId]);

  const handleSave = async () => {
    const trimmedEquipment = equipment.trim();
    if (!trimmedEquipment) {
      Alert.alert('Required', 'Please enter equipment.');
      return;
    }
    const trimmedServiceDoneBy = serviceDoneBy.trim();
    if (!trimmedServiceDoneBy) {
      Alert.alert('Required', 'Please enter who did the service (Crew or Contractor name).');
      return;
    }
    if (!vesselId) {
      Alert.alert('Error', 'You must be in a vessel to add logs.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await maintenanceLogsService.update(logId, {
          equipment: trimmedEquipment,
          portStarboardNa: portStarboardNa.trim() || undefined,
          serialNumber: serialNumber.trim() || undefined,
          hoursOfService: hoursOfService.trim() || undefined,
          hoursAtNextService: hoursAtNextService.trim() || undefined,
          whatServiceDone: whatServiceDone.trim() || undefined,
          notes: notes.trim() || undefined,
          serviceDoneBy: trimmedServiceDoneBy,
        });
        Alert.alert('Updated', 'Log updated.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await maintenanceLogsService.create({
          vesselId,
          equipment: trimmedEquipment,
          portStarboardNa: portStarboardNa.trim() || undefined,
          serialNumber: serialNumber.trim() || undefined,
          hoursOfService: hoursOfService.trim() || undefined,
          hoursAtNextService: hoursAtNextService.trim() || undefined,
          whatServiceDone: whatServiceDone.trim() || undefined,
          notes: notes.trim() || undefined,
          serviceDoneBy: trimmedServiceDoneBy,
        });
        Alert.alert('Saved', 'Log added.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      console.error('Save log error:', e);
      Alert.alert('Error', 'Could not save log.');
    } finally {
      setSaving(false);
    }
  };

  if (!vesselId) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Join a vessel to add maintenance logs.</Text>
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
          label="Equipment"
          value={equipment}
          onChangeText={setEquipment}
          placeholder="e.g. Main engine, Generator"
          autoCapitalize="words"
        />
        <Input
          label="Port / Starboard or NA"
          value={portStarboardNa}
          onChangeText={setPortStarboardNa}
          placeholder="Port, Starboard or NA"
          autoCapitalize="characters"
        />
        <Input
          label="Serial number"
          value={serialNumber}
          onChangeText={setSerialNumber}
          placeholder="Optional"
        />
        <Input
          label="Hours of service"
          value={hoursOfService}
          onChangeText={setHoursOfService}
          placeholder="e.g. 1250"
          keyboardType="numeric"
        />
        <Input
          label="Hours at next service"
          value={hoursAtNextService}
          onChangeText={setHoursAtNextService}
          placeholder="e.g. 1500"
          keyboardType="numeric"
        />
        <Input
          label="What service done"
          value={whatServiceDone}
          onChangeText={setWhatServiceDone}
          placeholder="Describe the service performed..."
          multiline
          numberOfLines={3}
        />
        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes"
          multiline
          numberOfLines={2}
        />
        <Input
          label="Service done by (Crew / Contractor)"
          value={serviceDoneBy}
          onChangeText={setServiceDoneBy}
          placeholder="e.g. John Smith (Crew) or ABC Marine (Contractor)"
        />
        <View style={styles.actions}>
          <Button
            title={isEdit ? 'Update log' : 'Save log'}
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
    paddingBottom: SPACING['2xl'],
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
  actions: {
    marginTop: SPACING.lg,
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
