/**
 * Add / Edit Trip Screen
 * Calendar to choose start and end dates; title and notes. HOD only.
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
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../store';
import tripsService from '../services/trips';
import { TripType } from '../types';
import { Input, Button } from '../components';
import { useVesselTripColors } from '../hooks/useVesselTripColors';
import { DEFAULT_COLORS } from '../services/tripColors';

type MarkedDates = { [date: string]: { startingDay?: boolean; endingDay?: boolean; color: string; textColor?: string } };

function getMarkedRange(start: string, end: string, color: string): MarkedDates {
  const marked: MarkedDates = {};
  const startD = new Date(start);
  const endD = new Date(end);
  for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    marked[key] = {
      startingDay: key === start,
      endingDay: key === end,
      color,
      textColor: COLORS.white,
    };
  }
  return marked;
}

export const AddEditTripScreen = ({ navigation, route }: any) => {
  const { user } = useAuthStore();
  const type = (route.params?.type ?? 'GUEST') as TripType;
  const tripId = route.params?.tripId as string | undefined;

  const typeLabels: Record<TripType, string> = {
    GUEST: 'Guest Trip',
    BOSS: 'Boss Trip',
    DELIVERY: 'Delivery',
    YARD_PERIOD: 'Yard Period',
  };
  const typeLabel = typeLabels[type] ?? type;
  useEffect(() => {
    navigation.setOptions({
      title: tripId ? `Edit ${typeLabel}` : `Add ${typeLabel}`,
    });
  }, [navigation, tripId, typeLabel]);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!tripId);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'start' | 'end'>('start');

  const vesselId = user?.vesselId ?? null;
  const isHOD = user?.role === 'HOD';
  const isEdit = !!tripId;
  const { colors: tripColors, load: loadTripColors } = useVesselTripColors(vesselId);
  const typeColorMap = tripColors
    ? { GUEST: tripColors.guest, BOSS: tripColors.boss, DELIVERY: tripColors.delivery, YARD_PERIOD: tripColors.yardPeriod }
    : { GUEST: DEFAULT_COLORS.guest, BOSS: DEFAULT_COLORS.boss, DELIVERY: DEFAULT_COLORS.delivery, YARD_PERIOD: DEFAULT_COLORS.yardPeriod };
  const accentColor = typeColorMap[type] ?? COLORS.primary;

  useEffect(() => {
    if (vesselId) loadTripColors();
  }, [vesselId, loadTripColors]);

  useEffect(() => {
    if (!tripId) return;
    (async () => {
      try {
        const trip = await tripsService.getTripById(tripId);
        if (trip) {
          setTitle(trip.title);
          setNotes(trip.notes ?? '');
          setStartDate(trip.startDate);
          setEndDate(trip.endDate);
        }
      } catch (e) {
        console.error('Load trip error:', e);
        Alert.alert('Error', 'Could not load trip');
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  const onDayPress = (dateString: string) => {
    if (step === 'start') {
      setStartDate(dateString);
      setEndDate(dateString);
      setStep('end');
    } else {
      if (startDate && dateString < startDate) {
        setStartDate(dateString);
        setEndDate(startDate);
      } else {
        setEndDate(dateString);
      }
    }
  };

  const markedDates: MarkedDates = startDate && endDate
    ? getMarkedRange(startDate, endDate, accentColor)
    : {};

  const calendarTheme = {
    backgroundColor: COLORS.white,
    calendarBackground: COLORS.white,
    textSectionTitleColor: COLORS.textSecondary,
    selectedDayBackgroundColor: accentColor,
    selectedDayTextColor: COLORS.white,
    todayTextColor: COLORS.primary,
    dayTextColor: COLORS.textPrimary,
    textDisabledColor: COLORS.gray400,
    arrowColor: COLORS.primary,
    monthTextColor: COLORS.primary,
  };

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Missing title', 'Please enter a title for the trip.');
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('Select dates', 'Please choose start and end dates on the calendar.');
      return;
    }
    if (!vesselId) {
      Alert.alert('Error', 'You must be in a vessel to create trips.');
      return;
    }
    if (!isHOD) {
      Alert.alert('Access denied', 'Only HODs can create or edit trips.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await tripsService.updateTrip(tripId, {
          title: trimmed,
          startDate,
          endDate,
          notes: notes.trim() || undefined,
        });
        Alert.alert('Updated', 'Trip updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await tripsService.createTrip({
          vesselId,
          type,
          title: trimmed,
          startDate,
          endDate,
          notes: notes.trim() || undefined,
        });
        Alert.alert('Created', 'Trip added.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (e) {
      console.error('Save trip error:', e);
      Alert.alert('Error', 'Could not save trip.');
    } finally {
      setSaving(false);
    }
  };

  if (!isHOD) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Only HODs can add or edit trips.</Text>
      </View>
    );
  }

  if (!vesselId) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Join a vessel to add trips.</Text>
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
          label="Trip title"
          value={title}
          onChangeText={setTitle}
          placeholder={
            type === 'GUEST'
              ? 'e.g. Charter week'
              : type === 'BOSS'
              ? 'e.g. Owner family trip'
              : type === 'DELIVERY'
              ? 'e.g. Delivery to Palma'
              : 'e.g. Annual refit'
          }
          autoCapitalize="words"
        />
        <Text style={styles.label}>Select dates</Text>
        <Text style={styles.hint}>
          {!startDate
            ? 'Tap a start date on the calendar'
            : !endDate
            ? 'Tap the end date'
            : `${startDate} – ${endDate}`}
        </Text>
        <View style={styles.calendarWrap}>
          <Calendar
            current={startDate || new Date().toISOString().slice(0, 10)}
            minDate={new Date().toISOString().slice(0, 10)}
            markedDates={markedDates}
            markingType="period"
            onDayPress={({ dateString }) => onDayPress(dateString)}
            theme={calendarTheme}
            hideExtraDays
          />
        </View>
        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Special requests, itinerary notes..."
          multiline
          numberOfLines={3}
        />
        <View style={styles.actions}>
          <Button
            title={isEdit ? 'Update trip' : 'Add trip'}
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
  label: {
    fontSize: FONTS.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
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
    marginBottom: SPACING.lg,
    overflow: 'hidden',
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
