/**
 * Home/Dashboard Screen (Placeholder)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Button } from '../components';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../store';
import authService from '../services/auth';
import vesselService from '../services/vessel';

export const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const [vesselName, setVesselName] = useState<string | null>(null);
  const [loadingVessel, setLoadingVessel] = useState(false);

  const handleLogout = async () => {
    await authService.signOut();
    logout();
  };

  // Check if user has joined a vessel
  const hasVessel = !!user?.vesselId;

  // Fetch vessel name when user has a vessel
  useEffect(() => {
    const fetchVessel = async () => {
      if (user?.vesselId) {
        setLoadingVessel(true);
        try {
          const vessel = await vesselService.getVessel(user.vesselId);
          if (vessel) {
            setVesselName(vessel.name);
          }
        } catch (error) {
          console.error('Error fetching vessel:', error);
        } finally {
          setLoadingVessel(false);
        }
      }
    };

    fetchVessel();
  }, [user?.vesselId]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome, {user?.name}!</Text>
          <Text style={styles.subtitle}>
            {user?.position} - {user?.department}
          </Text>
          {hasVessel && (
            <View style={styles.vesselBadge}>
              <Text style={styles.vesselIcon}>⚓</Text>
              {loadingVessel ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.vesselName}>{vesselName || 'Loading vessel...'}</Text>
              )}
              <Text style={styles.roleBadge}>{user?.role}</Text>
            </View>
          )}
        </View>

        {/* No Vessel Warning */}
        {!hasVessel && (
          <View style={styles.noVesselCard}>
            <Text style={styles.noVesselIcon}>⚓</Text>
            <Text style={styles.noVesselTitle}>You're not part of a vessel yet</Text>
            <Text style={styles.noVesselText}>
              Join an existing vessel with an invite code to get started.
            </Text>
            <View style={styles.vesselActions}>
              <Button
                title="Join Vessel"
                onPress={() => navigation.navigate('JoinVessel')}
                variant="primary"
                fullWidth
                style={styles.actionButton}
              />
            </View>
          </View>
        )}

        {/* Quick access: list of shortcut cards (stacked vertically) */}
        <View style={styles.shortcutList}>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Tasks')}
            activeOpacity={0.8}
          >
            <Text style={styles.shortcutIcon}>📋</Text>
            <Text style={styles.shortcutLabel}>Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('UpcomingTrips')}
            activeOpacity={0.8}
          >
            <Text style={styles.shortcutIcon}>📅</Text>
            <Text style={styles.shortcutLabel}>Upcoming Trips</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('MaintenanceLog')}
            activeOpacity={0.8}
          >
            <Text style={styles.shortcutIcon}>📝</Text>
            <Text style={styles.shortcutLabel}>Maintenance Log</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('YardPeriodJobs')}
            activeOpacity={0.8}
          >
            <Text style={styles.shortcutIcon}>🔧</Text>
            <Text style={styles.shortcutLabel}>Yard Period</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
          >
            <Text style={styles.shortcutIcon}>⚙️</Text>
            <Text style={styles.shortcutLabel}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Show normal content only if user has a vessel */}
        {hasVessel && (
          <>
            {/* Coming Soon Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Coming Soon</Text>
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>✅ Tasks (Daily, Weekly, Monthly)</Text>
                <Text style={styles.featureItem}>✅ Inventory Tracking</Text>
                <Text style={styles.featureItem}>✅ Watch Duties</Text>
                <Text style={styles.featureItem}>✅ Trips Planning</Text>
                <Text style={styles.featureItem}>✅ Calendar View</Text>
                <Text style={styles.featureItem}>✅ AI Store Finder</Text>
              </View>
            </View>

            {/* Development Info */}
            <View style={styles.devInfo}>
              <Text style={styles.devInfoText}>
                🚧 App is in active development
              </Text>
              <Text style={styles.devInfoSubtext}>
                Authentication is working! Next: Building the main features.
              </Text>
            </View>
          </>
        )}

        {/* Logout Button */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          fullWidth
          style={styles.logoutButton}
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
  },
  header: {
    marginBottom: SPACING.xl,
  },
  vesselBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  vesselIcon: {
    fontSize: 20,
  },
  vesselName: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.primary,
  },
  roleBadge: {
    fontSize: FONTS.xs,
    fontWeight: 'bold',
    color: COLORS.white,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    textTransform: 'uppercase',
  },
  noVesselCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: 12,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noVesselIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  noVesselTitle: {
    fontSize: FONTS.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  noVesselText: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  vesselActions: {
    width: '100%',
    gap: SPACING.sm,
  },
  actionButton: {
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONTS['3xl'],
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
  },
  shortcutList: {
    marginBottom: SPACING.xl,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shortcutIcon: {
    fontSize: FONTS['2xl'],
    marginRight: SPACING.lg,
  },
  shortcutLabel: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: FONTS.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  featureList: {
    gap: SPACING.sm,
  },
  featureItem: {
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  devInfo: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.xl,
  },
  devInfoText: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  devInfoSubtext: {
    fontSize: FONTS.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  logoutButton: {
    marginTop: SPACING.md,
  },
});
