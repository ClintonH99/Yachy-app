/**
 * Add / Edit Pre-Departure Checklist Screen
 * Title, optional trip link, checklist items (read-and-do, not tickable)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SIZES } from '../constants/theme';
import { useAuthStore } from '../store';
import preDepartureChecklistsService from '../services/preDepartureChecklists';
import tripsService from '../services/trips';
import { PreDepartureChecklistItem, Department } from '../types';
import { Input, Button } from '../components';
import { Trip } from '../types';

const DEPARTMENT_OPTIONS: { value: Department | null; label: string }[] = [
  { value: null, label: 'All Departments' },
  { value: 'BRIDGE', label: 'Bridge' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'EXTERIOR', label: 'Exterior' },
  { value: 'INTERIOR', label: 'Interior' },
  { value: 'GALLEY', label: 'Galley' },
];

const DEFAULT_ITEMS = [
  'Fuel topped up',
  'Water tanks full',
  'Safety equipment checked',
  'Provisions on board',
  'Engine room inspection',
  'Navigation equipment ready',
];

export const AddEditPreDepartureChecklistScreen = ({ navigation, route }: any) => {
  const { user } = useAuthStore();
  const checklistId = route?.params?.checklistId as string | undefined;
  const isEdit = !!checklistId;
  const isHOD = user?.role === 'HOD';

  const [title, setTitle] = useState('');
  const [tripId, setTripId] = useState<string | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [items, setItems] = useState<PreDepartureChecklistItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [loading, setLoading] = useState(!!checklistId);
  const [saving, setSaving] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);

  const vesselId = user?.vesselId ?? null;

  const loadChecklist = useCallback(async () => {
    if (!checklistId) return;
    try {
      const c = await preDepartureChecklistsService.getById(checklistId);
      if (c) {
        setTitle(c.title);
        setTripId(c.tripId);
        setDepartment(c.department);
        setItems(c.items);
      } else {
        Alert.alert('Error', 'Checklist not found.');
        navigation.goBack();
      }
    } catch (e) {
      console.error('Load checklist error:', e);
      Alert.alert('Error', 'Could not load checklist.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [checklistId, navigation]);

  const loadTrips = useCallback(async () => {
    if (!vesselId) return;
    const data = await tripsService.getTripsByVessel(vesselId);
    setTrips(data);
  }, [vesselId]);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
      if (checklistId) loadChecklist();
      else setLoading(false);
    }, [checklistId, loadChecklist, loadTrips])
  );

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? (isHOD ? 'Edit Checklist' : 'Pre-Departure Checklist') : 'Create Pre-Departure Checklist',
    });
  }, [navigation, isEdit, isHOD]);

  const addItem = async () => {
    const label = newItemLabel.trim();
    if (!label || !checklistId) return;
    try {
      const added = await preDepartureChecklistsService.addItem(checklistId, label);
      setItems((prev) => [...prev, added].sort((a, b) => a.sortOrder - b.sortOrder));
      setNewItemLabel('');
    } catch (e) {
      Alert.alert('Error', 'Could not add item.');
    }
  };

  const removeItem = async (item: PreDepartureChecklistItem) => {
    try {
      await preDepartureChecklistsService.deleteItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      Alert.alert('Error', 'Could not remove item.');
    }
  };

  const handleSave = async () => {
    if (!isHOD) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Missing title', 'Please enter a title for the checklist.');
      return;
    }
    if (!vesselId) return;

    setSaving(true);
    try {
      if (isEdit) {
        await preDepartureChecklistsService.update(checklistId!, { title: trimmedTitle, tripId, department });
        Alert.alert('Saved', 'Checklist updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        const itemLabels = items.length > 0 ? items.map((i) => i.label) : DEFAULT_ITEMS;
        const created = await preDepartureChecklistsService.create({
          vesselId,
          tripId: tripId || undefined,
          department: department || undefined,
          title: trimmedTitle,
          items: itemLabels.map((label) => ({ label })),
        });
        Alert.alert('Created', 'Pre-departure checklist created.', [
          { text: 'OK', onPress: () => navigation.replace('AddEditPreDepartureChecklist', { checklistId: created.id }) },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not save checklist.');
    } finally {
      setSaving(false);
    }
  };

  const selectedTrip = trips.find((t) => t.id === tripId);
  const selectedDeptLabel = DEPARTMENT_OPTIONS.find((o) => o.value === department)?.label ?? 'All Departments';

  if (!vesselId) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Join a vessel to create checklists.</Text>
      </View>
    );
  }

  if (!isHOD && !isEdit) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Only HODs can create pre-departure checklists.</Text>
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
        {isHOD ? (
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Deck/Interior Team or Miami to Nassau"
          />
        ) : (
          <>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Title</Text>
              <Text style={styles.readOnlyTitle}>{title || '—'}</Text>
            </View>
            {department != null && (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Department</Text>
                <Text style={styles.readOnlyTitle}>
                  {DEPARTMENT_OPTIONS.find((o) => o.value === department)?.label ?? department}
                </Text>
              </View>
            )}
          </>
        )}

        {isHOD && (
          <>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Department</Text>
              <TouchableOpacity
                style={styles.pickerTrigger}
                onPress={() => setDepartmentModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerValue}>{selectedDeptLabel}</Text>
                <Text style={styles.pickerIcon}>▾</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Linked Trip (optional)</Text>
              <TouchableOpacity
                style={styles.pickerTrigger}
                onPress={() => setTripModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerValue, !selectedTrip && styles.pickerPlaceholder]}>
                  {selectedTrip ? selectedTrip.title : 'No trip selected'}
                </Text>
                <Text style={styles.pickerIcon}>▾</Text>
              </TouchableOpacity>
            </View>

            {departmentModalVisible && (
              <Modal visible transparent animationType="fade">
                <Pressable style={styles.modalBackdrop} onPress={() => setDepartmentModalVisible(false)}>
                  <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
                    <Text style={styles.modalTitle}>Select department</Text>
                    {DEPARTMENT_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value ?? 'all'}
                        style={[styles.modalItem, department === opt.value && styles.modalItemSelected]}
                        onPress={() => {
                          setDepartment(opt.value);
                          setDepartmentModalVisible(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Pressable>
              </Modal>
            )}

            {tripModalVisible && (
              <Modal visible transparent animationType="fade">
                <Pressable style={styles.modalBackdrop} onPress={() => setTripModalVisible(false)}>
                  <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
                    <Text style={styles.modalTitle}>Select trip</Text>
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        setTripId(null);
                        setTripModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>No trip</Text>
                    </TouchableOpacity>
                    {trips.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.modalItem, tripId === t.id && styles.modalItemSelected]}
                        onPress={() => {
                          setTripId(t.id);
                          setTripModalVisible(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{t.title}</Text>
                        <Text style={styles.modalItemSub}>{t.startDate} – {t.endDate}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Pressable>
              </Modal>
            )}
          </>
        )}

        <Text style={styles.sectionLabel}>Checklist items</Text>

        {isEdit ? (
          <>
            {items.map((item, idx) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemBullet}>{idx + 1}.</Text>
                <Text style={styles.itemLabel}>{item.label}</Text>
                {isHOD && (
                  <TouchableOpacity
                    onPress={() => removeItem(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.removeBtn}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {isHOD && (
            <View style={styles.addRow}>
              <Input
                value={newItemLabel}
                onChangeText={setNewItemLabel}
                placeholder="Add new item..."
                containerStyle={styles.addInput}
                onSubmitEditing={addItem}
              />
              <TouchableOpacity style={styles.addBtn} onPress={addItem}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
            )}
          </>
        ) : (
          <Text style={styles.hint}>
            Save the checklist to add and manage items. Default items will be added on creation.
          </Text>
        )}

        {isHOD && (
        <View style={styles.actions}>
          <Button
            title={isEdit ? 'Save' : 'Create Checklist'}
            onPress={handleSave}
            variant="primary"
            loading={saving}
            disabled={saving}
            fullWidth
          />
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={saving}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 88 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  message: { fontSize: FONTS.base, color: COLORS.textSecondary, textAlign: 'center' },
  readOnlyTitle: { fontSize: FONTS.base, color: COLORS.textPrimary, fontWeight: '600' },
  fieldContainer: { marginBottom: SPACING.md },
  label: {
    fontSize: FONTS.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: SIZES.inputHeight,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  pickerValue: { fontSize: FONTS.base, color: COLORS.textPrimary },
  pickerPlaceholder: { color: COLORS.gray400 },
  pickerIcon: { fontSize: 14, color: COLORS.textSecondary },
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
    padding: SPACING.md,
    minWidth: 280,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  modalItem: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm },
  modalItemSelected: { backgroundColor: COLORS.primaryLight },
  modalItemText: { fontSize: FONTS.base, color: COLORS.textPrimary },
  modalItemSub: { fontSize: FONTS.xs, color: COLORS.textSecondary, marginTop: 2 },
  sectionLabel: {
    fontSize: FONTS.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  itemBullet: {
    fontSize: FONTS.base,
    fontWeight: '600',
    color: COLORS.primary,
    minWidth: 24,
  },
  itemLabel: { flex: 1, fontSize: FONTS.base, color: COLORS.textPrimary },
  removeBtn: { fontSize: FONTS.sm, color: COLORS.danger },
  addRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, marginTop: SPACING.sm },
  addInput: { flex: 1, marginBottom: 0 },
  addBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
  },
  addBtnText: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.white },
  hint: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  actions: { marginTop: SPACING.xl, gap: SPACING.sm },
  cancelBtn: { alignSelf: 'center', padding: SPACING.sm },
  cancelText: { fontSize: FONTS.base, color: COLORS.textSecondary },
});
