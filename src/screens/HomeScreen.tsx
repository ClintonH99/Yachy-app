/**
 * Home/Dashboard Screen
 * Fresh, minimalist design — image-centric, maritime-focused
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../components';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SIZES, SHADOWS } from '../constants/theme';
import { useAuthStore, useThemeStore, BACKGROUND_THEMES } from '../store';
import authService from '../services/auth';
import vesselService from '../services/vessel';

const { width } = Dimensions.get('window');
const CATEGORY_SIZE = (width - SPACING.xl * 2 - SPACING.md * 2) / 3;
const BANNER_HEIGHT = 220;

// Default vessel banner when none set
const DEFAULT_BANNER_IMAGE =
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200';

// Maritime imagery
const FEATURED_IMAGE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800';
const CATEGORY_IMAGES: Record<string, string> = {
  trips: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
  tasks: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400',
  maintenance: 'https://images.unsplash.com/photo-1564415315949-7a0c4c73aade?w=400',
};

const CATEGORIES = [
  { key: 'trips', label: 'Trips', icon: '📅', nav: 'UpcomingTrips', image: CATEGORY_IMAGES.trips },
  { key: 'tasks', label: 'Tasks', icon: '📋', nav: 'Tasks', image: CATEGORY_IMAGES.tasks },
  { key: 'maintenance', label: 'Maintenance', icon: '🔧', nav: 'MaintenanceHome', image: CATEGORY_IMAGES.maintenance },
  { key: 'watch', label: 'Watch', icon: '⏱️', nav: 'WatchKeeping' },
  { key: 'shopping', label: 'Shopping', icon: '🛒', nav: 'ShoppingListCategory' },
  { key: 'logs', label: 'Vessel Logs', icon: '🗒️', nav: 'VesselLogs' },
];

export const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const backgroundTheme = useThemeStore((s) => s.backgroundTheme);
  const themeColors = BACKGROUND_THEMES[backgroundTheme];
  const [vesselName, setVesselName] = useState<string | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [loadingVessel, setLoadingVessel] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerLoadFailed, setBannerLoadFailed] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const hasVessel = !!user?.vesselId;
  const isCaptain = user?.role === 'HOD';

  const menuItems: { label: string; icon: string; action: () => void }[] = [
    { label: 'Tasks', icon: '📋', action: () => navigation.navigate('Tasks') },
    { label: 'Trips', icon: '📅', action: () => navigation.getParent()?.navigate('MainTabs', { screen: 'ExploreTab' }) },
    { label: 'Maintenance', icon: '🔧', action: () => navigation.navigate('MaintenanceHome') },
    { label: 'Shopping', icon: '🛒', action: () => navigation.navigate('ShoppingListCategory') },
    { label: 'Import / Export', icon: '📥', action: () => navigation.navigate('ImportExport') },
    { label: 'Profile', icon: '👤', action: () => navigation.getParent()?.navigate('MainTabs', { screen: 'ProfileTab' }) },
  ];

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);
  const handleMenuAction = (action: () => void) => {
    closeMenu();
    action();
  };

  useEffect(() => {
    const fetchVessel = async () => {
      if (user?.vesselId) {
        setLoadingVessel(true);
        try {
          const vessel = await vesselService.getVessel(user.vesselId);
          if (vessel) setVesselName(vessel.name);
          const url = vesselService.getBannerPublicUrl(user.vesselId);
          setBannerLoadFailed(false);
          setBannerImageUrl(url);
        } catch (error) {
          console.error('Error fetching vessel:', error);
        } finally {
          setLoadingVessel(false);
        }
      }
    };
    fetchVessel();
  }, [user?.vesselId]);

  const handleUploadBanner = async () => {
    if (!user?.vesselId || !isCaptain) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.75,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setBannerLoadFailed(false);
        setBannerImageUrl(asset.uri);
        setUploadingBanner(true);
        try {
          await vesselService.uploadBannerImage(user.vesselId, asset.uri);
          const publicUrl = vesselService.getBannerPublicUrl(user.vesselId);
          setBannerImageUrl(publicUrl);
        } catch (error) {
          console.error('Banner upload error:', error);
        } finally {
          setUploadingBanner(false);
        }
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  return (
    <>
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            {loadingVessel ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={[styles.vesselName, { color: themeColors.textPrimary }]} numberOfLines={1}>
                {vesselName || 'Yachy'}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.menuIconWrap}
            onPress={openMenu}
            activeOpacity={0.7}
            accessibilityLabel="Menu"
            accessibilityRole="button"
          >
            <Text style={[styles.menuIcon, { color: themeColors.textPrimary }]}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* Vessel banner — Captain can tap to upload */}
        {hasVessel && (
          <TouchableOpacity
            style={styles.bannerWrap}
            onPress={isCaptain ? handleUploadBanner : undefined}
            activeOpacity={isCaptain ? 0.9 : 1}
            disabled={uploadingBanner}
          >
            <ImageBackground
              source={{ uri: !bannerLoadFailed && bannerImageUrl ? bannerImageUrl : DEFAULT_BANNER_IMAGE }}
              style={styles.bannerImage}
              imageStyle={styles.bannerImageStyle}
              onError={() => {
                if (bannerImageUrl) setBannerLoadFailed(true);
              }}
            >
              <View style={styles.bannerOverlay} />
              {isCaptain && (
                <View style={styles.bannerEditBadge}>
                  {uploadingBanner ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.bannerEditText}>📷 Change vessel photo</Text>
                  )}
                </View>
              )}
              {vesselName && (
                <Text style={styles.bannerVesselName} numberOfLines={1}>
                  {vesselName}
                </Text>
              )}
            </ImageBackground>
          </TouchableOpacity>
        )}

        {!hasVessel && (
          <View style={[styles.noVesselCard, { backgroundColor: themeColors.surface }]}>
            <Text style={styles.noVesselIcon}>⚓</Text>
            <Text style={styles.noVesselTitle}>You're not part of a vessel yet</Text>
            <Text style={styles.noVesselText}>
              Join with an invite code to get started.
            </Text>
            <Button
              title="Join Vessel"
              onPress={() => navigation.navigate('JoinVessel')}
              variant="primary"
              shape="pill"
              fullWidth
            />
          </View>
        )}

        {hasVessel && (
          <>
            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() => navigation.navigate('UpcomingTrips')}
              activeOpacity={0.95}
            >
              <ImageBackground
                source={{ uri: FEATURED_IMAGE }}
                style={styles.featuredImage}
                imageStyle={styles.featuredImageStyle}
              >
                <View style={styles.featuredOverlay} />
                <View style={styles.featuredContent}>
                  <Text style={styles.featuredLabel}>FEATURED</Text>
                  <Text style={styles.featuredTitle}>Upcoming Trips</Text>
                  <Text style={styles.featuredSubtitle}>Plan your next voyage</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Categories</Text>
                <TouchableOpacity onPress={() => navigation.getParent()?.navigate('MainTabs', { screen: 'ProfileTab' })}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={styles.categoryTile}
                    onPress={() => navigation.navigate(cat.nav)}
                    activeOpacity={0.8}
                  >
                    {cat.image ? (
                      <ImageBackground
                        source={{ uri: cat.image }}
                        style={styles.categoryImage}
                        imageStyle={styles.categoryImageStyle}
                      >
                        <View style={styles.categoryOverlay} />
                        <Text style={styles.categoryLabel}>{cat.label}</Text>
                      </ImageBackground>
                    ) : (
                      <View style={[styles.categoryImage, styles.categoryFallback, { backgroundColor: themeColors.surfaceAlt }]}>
                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                        <Text style={[styles.categoryLabel, { color: themeColors.textPrimary }]}>{cat.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Quick access</Text>
              <TouchableOpacity
                style={[styles.shortcutCard, { backgroundColor: themeColors.surface }]}
                onPress={() => navigation.navigate('VesselCrewSafety')}
                activeOpacity={0.8}
              >
                <Text style={styles.shortcutIcon}>🦺</Text>
                <Text style={[styles.shortcutLabel, { color: themeColors.textPrimary }]}>Vessel & Crew Safety</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shortcutCard, { backgroundColor: themeColors.surface }]}
                onPress={() => navigation.navigate('YardPeriodJobs')}
                activeOpacity={0.8}
              >
                <Text style={styles.shortcutIcon}>🔧</Text>
                <Text style={[styles.shortcutLabel, { color: themeColors.textPrimary }]}>Yard Period</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shortcutCard, { backgroundColor: themeColors.surface }]}
                onPress={() => navigation.navigate('Inventory')}
                activeOpacity={0.8}
              >
                <Text style={styles.shortcutIcon}>📦</Text>
                <Text style={[styles.shortcutLabel, { color: themeColors.textPrimary }]}>Inventory</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shortcutCard, { backgroundColor: themeColors.surface }]}
                onPress={() => navigation.navigate('ContractorDatabase')}
                activeOpacity={0.8}
              >
                <Text style={styles.shortcutIcon}>👷</Text>
                <Text style={[styles.shortcutLabel, { color: themeColors.textPrimary }]}>Contractors</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shortcutCard, { backgroundColor: themeColors.surface }]}
                onPress={() => navigation.navigate('ImportExport')}
                activeOpacity={0.8}
              >
                <Text style={styles.shortcutIcon}>📥</Text>
                <Text style={[styles.shortcutLabel, { color: themeColors.textPrimary }]}>Import / Export</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Button
          title="Sign Out"
          onPress={async () => {
            await authService.signOut();
            logout();
          }}
          variant="outline"
          shape="pill"
          fullWidth
          style={styles.logoutButton}
        />
      </View>
    </ScrollView>

    <Modal
      visible={menuVisible}
      transparent
      animationType="fade"
      onRequestClose={closeMenu}
    >
      <Pressable style={styles.menuOverlay} onPress={closeMenu}>
        <View style={[styles.menuDropdown, { backgroundColor: themeColors.surface }]}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, { borderBottomColor: themeColors.surfaceAlt }]}
              onPress={() => handleMenuAction(item.action)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemIcon}>{item.icon}</Text>
              <Text style={[styles.menuItemLabel, { color: themeColors.textPrimary }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    padding: SPACING.xl,
    paddingTop: SPACING.xl + SPACING.xl,
    paddingBottom: SIZES.bottomScrollPadding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  menuIconWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 24, fontWeight: '600' },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'flex-end',
    paddingTop: 120,
    paddingRight: SPACING.lg,
  },
  menuDropdown: {
    minWidth: 200,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.xs,
    ...SHADOWS.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  menuItemIcon: { fontSize: 20, marginRight: SPACING.md },
  menuItemLabel: { fontSize: FONTS.base, fontWeight: '500' },
  vesselName: {
    fontSize: FONTS.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  bannerWrap: {
    marginHorizontal: -SPACING.xl,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  bannerImage: {
    height: BANNER_HEIGHT,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
  },
  bannerImageStyle: { resizeMode: 'cover' },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bannerEditBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  bannerEditText: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.white },
  bannerVesselName: {
    fontSize: FONTS['2xl'],
    fontWeight: '700',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    zIndex: 1,
  },
  noVesselCard: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  noVesselIcon: { fontSize: 48, marginBottom: SPACING.md },
  noVesselTitle: {
    fontSize: FONTS.xl,
    fontWeight: '700',
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
  featuredCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOWS.lg,
  },
  featuredImage: {
    height: 180,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
  },
  featuredImageStyle: { borderRadius: BORDER_RADIUS.lg },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: BORDER_RADIUS.lg,
  },
  featuredContent: { zIndex: 1 },
  featuredLabel: {
    fontSize: FONTS.xs,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  featuredTitle: {
    fontSize: FONTS['2xl'],
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  featuredSubtitle: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  section: { marginBottom: SPACING.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  seeAll: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.primary },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  categoryTile: {
    width: CATEGORY_SIZE,
    height: CATEGORY_SIZE,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  categoryImage: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.sm,
  },
  categoryImageStyle: { borderRadius: BORDER_RADIUS.lg },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: BORDER_RADIUS.lg,
  },
  categoryFallback: { alignItems: 'center', justifyContent: 'center' },
  categoryIcon: { fontSize: 32, marginBottom: 4 },
  categoryLabel: {
    fontSize: FONTS.xs,
    fontWeight: '700',
    color: COLORS.white,
    zIndex: 1,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  shortcutIcon: { fontSize: FONTS['2xl'], marginRight: SPACING.lg },
  shortcutLabel: { fontSize: FONTS.lg, fontWeight: '600', flex: 1 },
  logoutButton: { marginTop: SPACING.md },
});
