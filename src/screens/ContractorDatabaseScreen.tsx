/**
 * Contractor Database Screen
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
  Modal,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SIZES } from '../constants/theme';
import { useAuthStore, useDepartmentColorStore, getDepartmentColor } from '../store';
import contractorsService, { Contractor } from '../services/contractors';
import { Department } from '../types';
import { Button, Input } from '../components';

const DEPARTMENTS: Department[] = ['BRIDGE', 'ENGINEERING', 'EXTERIOR', 'INTERIOR', 'GALLEY'];

const allDeptsVisible: Record<Department, boolean> = {
  BRIDGE: true,
  ENGINEERING: true,
  EXTERIOR: true,
  INTERIOR: true,
  GALLEY: true,
};

type SearchFilter = 'all' | 'company_name' | 'company_address' | 'known_for' | 'description' | 'contact_name' | 'mobile' | 'email';

const SEARCH_FILTER_OPTIONS: { value: SearchFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'company_name', label: 'Company Name' },
  { value: 'company_address', label: 'Company Address' },
  { value: 'known_for', label: 'Know For' },
  { value: 'description', label: 'Description' },
  { value: 'contact_name', label: 'Contact Name' },
  { value: 'mobile', label: 'Mobile Number' },
  { value: 'email', label: 'Email' },
];

export const ContractorDatabaseScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const overrides = useDepartmentColorStore((s) => s.overrides);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleDepartments, setVisibleDepartments] = useState<Record<Department, boolean>>(allDeptsVisible);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all');
  const [searchFilterOpen, setSearchFilterOpen] = useState(false);

  const vesselId = user?.vesselId ?? null;

  const matchesKeyword = (c: Contractor) => {
    if (!searchKeyword.trim()) return true;
    const q = searchKeyword.toLowerCase().trim();
    const matchField = (value: string) => (value ?? '').toLowerCase().includes(q);
    switch (searchFilter) {
      case 'company_name':
        return matchField(c.companyName);
      case 'company_address':
        return matchField(c.companyAddress);
      case 'known_for':
        return matchField(c.knownFor);
      case 'description':
        return matchField(c.description);
      case 'contact_name':
        return (c.contacts ?? []).some((contact) => matchField(contact.name));
      case 'mobile':
        return (c.contacts ?? []).some((contact) => matchField(contact.mobile));
      case 'email':
        return (c.contacts ?? []).some((contact) => matchField(contact.email));
      default:
        return (
          matchField(c.knownFor) ||
          matchField(c.companyName) ||
          matchField(c.companyAddress) ||
          matchField(c.description) ||
          (c.contacts ?? []).some(
            (contact) =>
              matchField(contact.name) || matchField(contact.mobile) || matchField(contact.email)
          )
        );
    }
  };

  const filteredContractors = contractors
    .filter((c) => visibleDepartments[c.department ?? 'INTERIOR'])
    .filter(matchesKeyword);
  const departmentDisplayText =
    DEPARTMENTS.every((d) => visibleDepartments[d])
      ? 'All departments'
      : DEPARTMENTS.filter((d) => visibleDepartments[d])
          .map((d) => d.charAt(0) + d.slice(1).toLowerCase())
          .join(', ');

  const loadContractors = useCallback(async () => {
    if (!vesselId) return;
    setLoading(true);
    try {
      const data = await contractorsService.getByVessel(vesselId);
      setContractors(data);
    } catch (e) {
      console.error('Load contractors error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vesselId]);

  useFocusEffect(useCallback(() => {
    loadContractors();
  }, [loadContractors]));

  const onRefresh = () => {
    setRefreshing(true);
    loadContractors();
  };

  const onDelete = (contractor: Contractor) => {
    Alert.alert('Delete contractor', `Delete "${contractor.companyName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await contractorsService.delete(contractor.id);
            loadContractors();
          } catch {
            Alert.alert('Error', 'Could not delete contractor.');
          }
        },
      },
    ]);
  };

  if (!vesselId) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Join a vessel to use Contractor Database.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      <View style={styles.searchSection}>
        <View style={styles.searchFilterRow}>
          <Text style={styles.searchFilterLabel}>Search by</Text>
          <TouchableOpacity
            style={styles.searchFilterDropdown}
            onPress={() => setSearchFilterOpen(!searchFilterOpen)}
            activeOpacity={0.7}
          >
            <Text style={styles.searchFilterText}>
              {SEARCH_FILTER_OPTIONS.find((o) => o.value === searchFilter)?.label ?? 'All'}
            </Text>
            <Text style={styles.searchFilterChevron}>{searchFilterOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {searchFilterOpen && (
            <Modal visible transparent animationType="fade">
              <Pressable style={styles.modalBackdrop} onPress={() => setSearchFilterOpen(false)}>
                <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
                  {SEARCH_FILTER_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.modalItem, searchFilter === opt.value && styles.modalItemSelected]}
                      onPress={() => {
                        setSearchFilter(opt.value);
                        setSearchFilterOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          searchFilter === opt.value && styles.modalItemTextSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Pressable>
            </Modal>
          )}
        </View>
        <Input
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          placeholder={
            searchFilter === 'all'
              ? 'Search for Contractor by name or job type'
              : `Search by ${SEARCH_FILTER_OPTIONS.find((o) => o.value === searchFilter)?.label.toLowerCase()}…`
          }
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>
      <View style={styles.actionRow}>
        <Button
          title="Create Contractor"
          onPress={() => navigation.navigate('AddEditContractor', {})}
          variant="primary"
          fullWidth
        />
      </View>

      {contractors.length > 0 && !loading && (
        <>
          <Text style={styles.filterLabel}>Department</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setDepartmentDropdownOpen(!departmentDropdownOpen)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownText}>{departmentDisplayText}</Text>
            <Text style={styles.dropdownChevron}>{departmentDropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {departmentDropdownOpen && (
            <Modal visible transparent animationType="fade">
              <Pressable style={styles.modalBackdrop} onPress={() => setDepartmentDropdownOpen(false)}>
                <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      DEPARTMENTS.every((d) => visibleDepartments[d]) && styles.modalItemSelected,
                    ]}
                    onPress={() => {
                      setVisibleDepartments(allDeptsVisible);
                      setDepartmentDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        DEPARTMENTS.every((d) => visibleDepartments[d]) && styles.modalItemTextSelected,
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  {DEPARTMENTS.map((dept) => (
                    <TouchableOpacity
                      key={dept}
                      style={[styles.modalItem, visibleDepartments[dept] && styles.modalItemSelected]}
                      onPress={() => {
                        setVisibleDepartments({
                          BRIDGE: dept === 'BRIDGE',
                          ENGINEERING: dept === 'ENGINEERING',
                          EXTERIOR: dept === 'EXTERIOR',
                          INTERIOR: dept === 'INTERIOR',
                          GALLEY: dept === 'GALLEY',
                        });
                        setDepartmentDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          visibleDepartments[dept] && styles.modalItemTextSelected,
                        ]}
                      >
                        {dept.charAt(0) + dept.slice(1).toLowerCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Pressable>
            </Modal>
          )}
        </>
      )}

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
      ) : filteredContractors.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👷</Text>
          <Text style={styles.emptyTitle}>No contractors yet</Text>
          <Text style={styles.emptyText}>
            {contractors.length === 0
              ? 'Tap "Create Contractor" to add your first contractor.'
              : 'No contractors match your search or department filter.'}
          </Text>
        </View>
      ) : (
        filteredContractors.map((contractor) => (
          <View key={contractor.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => navigation.navigate('AddEditContractor', { contractorId: contractor.id })}
              activeOpacity={0.8}
            >
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {contractor.companyName}
                </Text>
                <View
                  style={[
                    styles.deptBadge,
                    { backgroundColor: getDepartmentColor(contractor.department ?? 'INTERIOR', overrides) },
                  ]}
                >
                  <Text style={styles.deptBadgeText}>
                    {(contractor.department ?? 'INTERIOR').charAt(0) +
                      (contractor.department ?? 'INTERIOR').slice(1).toLowerCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => navigation.navigate('AddEditContractor', { contractorId: contractor.id })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.editBtn}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(contractor)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.deleteBtn}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            {contractor.knownFor ? (
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Know For</Text>
                <Text style={styles.cardValue}>{contractor.knownFor}</Text>
              </View>
            ) : null}
            {contractor.companyAddress ? (
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Address</Text>
                <Text style={styles.cardValue}>{contractor.companyAddress}</Text>
              </View>
            ) : null}
            {contractor.description ? (
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Description</Text>
                <Text style={styles.cardValue} numberOfLines={2}>{contractor.description}</Text>
              </View>
            ) : null}
            {contractor.contacts.length > 0 && (
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Contact(s)</Text>
                {contractor.contacts.map((c, i) => (
                  <Text key={i} style={styles.cardValue}>
                    {[c.name, c.mobile, c.email].filter(Boolean).join(' · ')}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SIZES.bottomScrollPadding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  message: { fontSize: FONTS.base, color: COLORS.textSecondary, textAlign: 'center' },
  searchSection: { marginBottom: SPACING.sm },
  searchFilterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  searchFilterLabel: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textPrimary, marginRight: SPACING.sm },
  searchFilterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchFilterText: { fontSize: FONTS.base, color: COLORS.textPrimary, fontWeight: '500', flex: 1 },
  searchFilterChevron: { fontSize: 10, color: COLORS.textSecondary },
  searchInput: { backgroundColor: COLORS.white },
  actionRow: { marginBottom: SPACING.lg },
  filterLabel: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  dropdownText: { fontSize: FONTS.base, color: COLORS.textPrimary, fontWeight: '500' },
  dropdownChevron: { fontSize: 10, color: COLORS.textSecondary },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalBox: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.sm, minWidth: 200 },
  modalItem: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, backgroundColor: COLORS.white },
  modalItemSelected: { backgroundColor: COLORS.white },
  modalItemText: { fontSize: FONTS.base, color: COLORS.textPrimary },
  modalItemTextSelected: { color: COLORS.primary, fontWeight: '600' },
  loader: { marginVertical: SPACING.xl },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  emptyText: { fontSize: FONTS.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACING.sm },
  cardTitle: { fontSize: FONTS.lg, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  deptBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.sm },
  deptBadgeText: { fontSize: FONTS.xs, fontWeight: '600', color: COLORS.white },
  cardActions: { flexDirection: 'row', gap: SPACING.md },
  editBtn: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '600' },
  deleteBtn: { fontSize: FONTS.sm, color: COLORS.danger, fontWeight: '600' },
  cardRow: { marginBottom: SPACING.sm },
  cardLabel: { fontSize: FONTS.xs, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  cardValue: { fontSize: FONTS.base, color: COLORS.textPrimary, lineHeight: 20 },
});
