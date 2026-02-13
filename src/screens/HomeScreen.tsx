/**
 * Home/Dashboard Screen (Placeholder)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Button } from '../components';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useAuthStore } from '../store';
import authService from '../services/auth';

export const HomeScreen = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await authService.signOut();
    logout();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome, {user?.name}!</Text>
          <Text style={styles.subtitle}>
            {user?.position} - {user?.department}
          </Text>
        </View>

        {/* Quick Stats Placeholder */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Active Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Upcoming Trips</Text>
          </View>
        </View>

        {/* Coming Soon Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming Soon</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✅ Tasks Management</Text>
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
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: FONTS['3xl'],
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
