/**
 * Crew Management Screen
 * HOD can view all crew members, their roles, and manage them
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../store';
import userService from '../services/user';
import vesselService from '../services/vessel';
import { User, Department, Vessel } from '../types';
import { Button } from '../components';

export const CrewManagementScreen = ({ navigation }: any) => {
  const { user: currentUser } = useAuthStore();
  const [crew, setCrew] = useState<User[]>([]);
  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if user is HOD
  const isHOD = currentUser?.role === 'HOD';

  useFocusEffect(
    useCallback(() => {
      if (!isHOD) {
        Alert.alert(
          'Access Denied',
          'Only HODs can access crew management',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      loadData();
    }, [isHOD])
  );

  const loadData = async () => {
    if (!currentUser?.vesselId) return;

    try {
      // Load both crew and vessel data
      const [crewData, vesselData] = await Promise.all([
        userService.getVesselCrew(currentUser.vesselId),
        vesselService.getVessel(currentUser.vesselId),
      ]);
      
      setCrew(crewData);
      setVessel(vesselData);
    } catch (error) {
      console.error('Load data error:', error);
      Alert.alert('Error', 'Failed to load crew members');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCrew = async () => {
    if (!currentUser?.vesselId) return;

    try {
      const crewData = await userService.getVesselCrew(currentUser.vesselId);
      setCrew(crewData);
    } catch (error) {
      console.error('Load crew error:', error);
      Alert.alert('Error', 'Failed to load crew members');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleCopyInviteCode = async () => {
    if (!vessel?.inviteCode) return;

    await Clipboard.setStringAsync(vessel.inviteCode);
    Alert.alert(
      'Invite Code Copied!',
      `Code: ${vessel.inviteCode}\n\nShare this with new crew members to join ${vessel.name}.`
    );
  };

  const handleShareInviteCode = async () => {
    if (!vessel?.inviteCode) return;

    try {
      await Share.share({
        message: `Join our yacht crew on Yachy App!\n\nVessel: ${vessel.name}\nInvite Code: ${vessel.inviteCode}\n\nDownload the app and use this code during registration to get started.`,
        title: 'Yachy App Invite - ' + vessel.name,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleViewInviteCode = () => {
    if (!vessel?.inviteCode) return;

    const expiryDate = new Date(vessel.inviteExpiry);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let expiryText = '';
    if (daysUntilExpiry < 0) {
      expiryText = 'Expired';
    } else if (daysUntilExpiry === 0) {
      expiryText = 'Expires today';
    } else if (daysUntilExpiry === 1) {
      expiryText = 'Expires tomorrow';
    } else if (daysUntilExpiry < 30) {
      expiryText = `Expires in ${daysUntilExpiry} days`;
    } else {
      expiryText = expiryDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    Alert.alert(
      'Vessel Invite Code',
      `Code: ${vessel.inviteCode}\nVessel: ${vessel.name}\nStatus: ${expiryText}\n\nShare this code with new crew members during registration.`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Copy Code', onPress: handleCopyInviteCode },
        { text: 'Share', onPress: handleShareInviteCode },
      ]
    );
  };

  const handleRemoveCrew = (crewMember: User) => {
    Alert.alert(
      'Remove Crew Member',
      `Are you sure you want to remove ${crewMember.name} from the vessel? They can rejoin using the invite code.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.removeCrewMember(crewMember.id);
              Alert.alert('Success', `${crewMember.name} has been removed from the vessel`);
              loadCrew(); // Refresh list
            } catch (error) {
              console.error('Remove crew error:', error);
              Alert.alert('Error', 'Failed to remove crew member');
            }
          },
        },
      ]
    );
  };

  const handlePromoteToDemote = (crewMember: User) => {
    const isCurrentlyHOD = crewMember.role === 'HOD';
    const newRole = isCurrentlyHOD ? 'CREW' : 'HOD';
    const action = isCurrentlyHOD ? 'demote' : 'promote';

    Alert.alert(
      `${action === 'promote' ? 'Promote' : 'Demote'} ${crewMember.name}`,
      `${action === 'promote' 
        ? `Promote ${crewMember.name} to Head of Department (HOD)? They will have full management permissions.`
        : `Demote ${crewMember.name} to regular crew? They will lose HOD permissions.`
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'promote' ? 'Promote' : 'Demote',
          onPress: async () => {
            try {
              await userService.updateUserRole(crewMember.id, newRole);
              Alert.alert(
                'Success',
                `${crewMember.name} has been ${action}d to ${newRole}`
              );
              loadCrew(); // Refresh list
            } catch (error) {
              console.error('Update role error:', error);
              Alert.alert('Error', `Failed to ${action} crew member`);
            }
          },
        },
      ]
    );
  };

  const getDepartmentColor = (department: Department): string => {
    switch (department) {
      case 'DECK':
        return '#3B82F6'; // Blue
      case 'INTERIOR':
        return '#8B5CF6'; // Purple
      case 'ENGINEERING':
        return '#EF4444'; // Red
      case 'GALLEY':
        return '#10B981'; // Green
      default:
        return COLORS.textSecondary;
    }
  };

  const renderCrewMember = ({ item }: { item: User }) => {
    const isCurrentUser = item.id === currentUser?.id;

    return (
      <TouchableOpacity
        style={styles.crewCard}
        onPress={() => {
          Alert.alert(
            item.name,
            `${item.position}\n${item.department}\n\nEmail: ${item.email}\nRole: ${item.role}`,
            [
              { text: 'Close', style: 'cancel' },
              ...(!isCurrentUser
                ? [
                    {
                      text: item.role === 'HOD' ? 'Demote' : 'Promote',
                      onPress: () => handlePromoteToDemote(item),
                    },
                    {
                      text: 'Remove',
                      onPress: () => handleRemoveCrew(item),
                      style: 'destructive' as const,
                    },
                  ]
                : []),
            ]
          );
        }}
        activeOpacity={0.7}
      >
        <View style={styles.crewCardLeft}>
          {item.profilePhoto ? (
            <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.crewInfo}>
            <View style={styles.crewNameRow}>
              <Text style={styles.crewName}>{item.name}</Text>
              {isCurrentUser && <Text style={styles.youBadge}>YOU</Text>}
            </View>
            <Text style={styles.crewPosition}>{item.position}</Text>
            <View style={styles.crewBadges}>
              <View
                style={[
                  styles.departmentBadge,
                  { backgroundColor: getDepartmentColor(item.department) },
                ]}
              >
                <Text style={styles.departmentText}>{item.department}</Text>
              </View>
              <View
                style={[
                  styles.roleBadge,
                  item.role === 'HOD' ? styles.roleBadgeHOD : styles.roleBadgeCrew,
                ]}
              >
                <Text style={styles.roleText}>{item.role}</Text>
              </View>
            </View>
          </View>
        </View>

        {!isCurrentUser && (
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={() => {
              Alert.alert(
                'Manage ' + item.name,
                'Choose an action',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: item.role === 'HOD' ? 'Demote to Crew' : 'Promote to HOD',
                    onPress: () => handlePromoteToDemote(item),
                  },
                  {
                    text: 'Remove from Vessel',
                    onPress: () => handleRemoveCrew(item),
                    style: 'destructive',
                  },
                ]
              );
            }}
          >
            <Text style={styles.optionsIcon}>⋮</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Invite Code Card - Prominent at Top */}
      {vessel && (
        <View style={styles.inviteCard}>
          <View style={styles.inviteCardHeader}>
            <View>
              <Text style={styles.inviteCardTitle}>Invite New Crew</Text>
              <Text style={styles.inviteCardSubtitle}>
                Share this code for crew to join
              </Text>
            </View>
            <Text style={styles.inviteCodeLarge}>{vessel.inviteCode}</Text>
          </View>
          <View style={styles.inviteActions}>
            <Button
              title="📋 Copy Code"
              onPress={handleCopyInviteCode}
              variant="outline"
              size="small"
              style={styles.inviteButton}
            />
            <Button
              title="📤 Share Code"
              onPress={handleShareInviteCode}
              variant="primary"
              size="small"
              style={styles.inviteButton}
            />
          </View>
          <TouchableOpacity 
            style={styles.inviteDetailsButton}
            onPress={handleViewInviteCode}
          >
            <Text style={styles.inviteDetailsText}>
              View full details & manage code →
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{crew.length}</Text>
          <Text style={styles.statLabel}>Total Crew</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {crew.filter((c) => c.role === 'HOD').length}
          </Text>
          <Text style={styles.statLabel}>HODs</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {crew.filter((c) => c.role === 'CREW').length}
          </Text>
          <Text style={styles.statLabel}>Crew</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          💡 Tap any crew member to view details and manage their role
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Crew Members</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>No Crew Members</Text>
      <Text style={styles.emptyText}>
        Share your vessel's invite code to add crew members
      </Text>
    </View>
  );

  if (!isHOD) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading crew...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={crew}
        renderItem={renderCrewMember}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  inviteCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  inviteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  inviteCardTitle: {
    fontSize: FONTS.lg,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  inviteCardSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  inviteCodeLarge: {
    fontSize: FONTS['2xl'],
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  inviteButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  inviteDetailsButton: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  inviteDetailsText: {
    fontSize: FONTS.sm,
    color: COLORS.white,
    opacity: 0.9,
    textDecorationLine: 'underline',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: FONTS['2xl'],
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoText: {
    fontSize: FONTS.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  crewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  crewCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SPACING.md,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONTS.xl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  crewInfo: {
    flex: 1,
  },
  crewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  crewName: {
    fontSize: FONTS.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: SPACING.xs,
  },
  youBadge: {
    fontSize: FONTS.xs,
    fontWeight: 'bold',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  crewPosition: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  crewBadges: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  departmentBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  departmentText: {
    fontSize: FONTS.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  roleBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  roleBadgeHOD: {
    backgroundColor: '#F59E0B', // Amber
  },
  roleBadgeCrew: {
    backgroundColor: COLORS.textSecondary,
  },
  roleText: {
    fontSize: FONTS.xs,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  optionsButton: {
    padding: SPACING.sm,
  },
  optionsIcon: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
