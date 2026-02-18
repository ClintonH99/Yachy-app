/**
 * Settings Screen
 * Main hub for profile and vessel management
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SIZES } from '../constants/theme';
import { useAuthStore } from '../store';

export const SettingsScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const isHOD = user?.role === 'HOD';

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: '👤',
          label: 'My Profile',
          description: 'Edit your personal information',
          onPress: () => navigation.navigate('Profile'),
        },
      ],
    },
    ...(isHOD
      ? [
          {
            title: 'Vessel Management',
            items: [
              {
                icon: '⚓',
                label: 'Vessel Settings',
                description: 'Manage vessel name and invite code',
                onPress: () => navigation.navigate('VesselSettings'),
              },
              {
                icon: '👥',
                label: 'Crew Management',
                description: 'View and manage crew members',
                onPress: () => navigation.navigate('CrewManagement'),
              },
            ],
          },
        ]
      : []),
    {
      title: 'App',
      items: [
        {
          icon: '🔔',
          label: 'Notifications',
          description: 'Manage notification preferences',
          onPress: () => {
            // TODO: Implement notifications settings
            console.log('Notifications settings coming soon');
          },
          disabled: true,
        },
        {
          icon: '📱',
          label: 'About',
          description: 'App version and information',
          onPress: () => {
            // TODO: Implement about screen
            console.log('About screen coming soon');
          },
          disabled: true,
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* User Header */}
        <View style={styles.userHeader}>
          <View style={styles.avatarContainer}>
            {user?.profilePhoto ? (
              <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userDetails}>
              {user?.position} • {user?.department}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role}</Text>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingsItem,
                    item.disabled && styles.settingsItemDisabled,
                    itemIndex === section.items.length - 1 && styles.settingsItemLast,
                  ]}
                  onPress={item.onPress}
                  disabled={item.disabled}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingsItemLeft}>
                    <Text style={styles.settingsIcon}>{item.icon}</Text>
                    <View style={styles.settingsTextContainer}>
                      <Text style={styles.settingsLabel}>{item.label}</Text>
                      <Text style={styles.settingsDescription}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Yachy App v1.0.0</Text>
          <Text style={styles.versionSubtext}>
            Professional yacht operations management
          </Text>
        </View>
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONTS['2xl'],
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONTS.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  userDetails: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  roleText: {
    fontSize: FONTS.xs,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingsItemLast: {
    borderBottomWidth: 0,
  },
  settingsItemDisabled: {
    opacity: 0.5,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: FONTS.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  settingsDescription: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  versionText: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: FONTS.xs,
    color: COLORS.textTertiary,
  },
});
