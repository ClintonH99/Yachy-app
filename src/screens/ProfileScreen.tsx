/**
 * Profile Screen
 * View and edit user profile (photo, name, position, department)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../store';
import { Button } from '../components';
import userService from '../services/user';
import { Department } from '../types';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Form state
  const [name, setName] = useState(user?.name || '');
  const [position, setPosition] = useState(user?.position || '');
  const [department, setDepartment] = useState<Department>(user?.department || 'DECK');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto);

  const departments: Department[] = ['DECK', 'INTERIOR', 'ENGINEERING', 'GALLEY'];

  const handlePickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photos'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingPhoto(true);
        try {
          // Upload photo
          const photoUrl = await userService.uploadProfilePhoto(
            user!.id,
            result.assets[0].uri
          );
          setProfilePhoto(photoUrl);

          // Update user profile immediately
          const updatedUser = await userService.updateProfile(user!.id, {
            profilePhoto: photoUrl,
          });

          if (updatedUser) {
            setUser(updatedUser);
          }

          Alert.alert('Success', 'Profile photo updated!');
        } catch (error) {
          console.error('Upload error:', error);
          Alert.alert('Error', 'Failed to upload photo. Please try again.');
        } finally {
          setIsUploadingPhoto(false);
        }
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemovePhoto = async () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsUploadingPhoto(true);
            try {
              if (profilePhoto) {
                await userService.deleteProfilePhoto(profilePhoto);
              }
              setProfilePhoto(undefined);

              const updatedUser = await userService.updateProfile(user!.id, {
                profilePhoto: '',
              });

              if (updatedUser) {
                setUser(updatedUser);
              }

              Alert.alert('Success', 'Profile photo removed!');
            } catch (error) {
              console.error('Remove photo error:', error);
              Alert.alert('Error', 'Failed to remove photo. Please try again.');
            } finally {
              setIsUploadingPhoto(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!position.trim()) {
      Alert.alert('Error', 'Position is required');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await userService.updateProfile(user!.id, {
        name: name.trim(),
        position: position.trim(),
        department,
      });

      if (updatedUser) {
        setUser(updatedUser);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setName(user?.name || '');
    setPosition(user?.position || '');
    setDepartment(user?.department || 'DECK');
    setIsEditing(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {isUploadingPhoto ? (
              <View style={styles.photoLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {user?.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.photoActions}>
            <Button
              title="Change Photo"
              onPress={handlePickImage}
              variant="outline"
              size="small"
              style={styles.photoButton}
              disabled={isUploadingPhoto}
            />
            {profilePhoto && (
              <Button
                title="Remove"
                onPress={handleRemovePhoto}
                variant="outline"
                size="small"
                style={styles.photoButton}
                disabled={isUploadingPhoto}
              />
            )}
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            {/* Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={COLORS.textTertiary}
                />
              ) : (
                <Text style={styles.value}>{user?.name}</Text>
              )}
            </View>

            {/* Position */}
            <View style={styles.field}>
              <Text style={styles.label}>Position</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={position}
                  onChangeText={setPosition}
                  placeholder="Enter your position"
                  placeholderTextColor={COLORS.textTertiary}
                />
              ) : (
                <Text style={styles.value}>{user?.position}</Text>
              )}
            </View>

            {/* Department */}
            <View style={styles.field}>
              <Text style={styles.label}>Department</Text>
              {isEditing ? (
                <View style={styles.departmentSelector}>
                  {departments.map((dept) => (
                    <TouchableOpacity
                      key={dept}
                      style={[
                        styles.departmentChip,
                        department === dept && styles.departmentChipActive,
                      ]}
                      onPress={() => setDepartment(dept)}
                    >
                      <Text
                        style={[
                          styles.departmentChipText,
                          department === dept && styles.departmentChipTextActive,
                        ]}
                      >
                        {dept}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.value}>{user?.department}</Text>
              )}
            </View>

            {/* Email (read-only) */}
            <View style={[styles.field, styles.fieldLast]}>
              <Text style={styles.label}>Email</Text>
              <Text style={[styles.value, styles.valueDisabled]}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Account Information (read-only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user?.role}</Text>
              </View>
            </View>
            <View style={[styles.field, styles.fieldLast]}>
              <Text style={styles.label}>Member Since</Text>
              <Text style={styles.value}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <View style={styles.actions}>
            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="outline"
              fullWidth
              style={styles.actionButton}
              disabled={isSaving}
            />
            <Button
              title={isSaving ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              variant="primary"
              fullWidth
              style={styles.actionButton}
              disabled={isSaving}
            />
          </View>
        )}
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
  photoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  photoContainer: {
    marginBottom: SPACING.md,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  photoLoading: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  photoActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  photoButton: {
    minWidth: 100,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  editButton: {
    fontSize: FONTS.base,
    color: COLORS.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  field: {
    marginBottom: SPACING.lg,
  },
  fieldLast: {
    marginBottom: 0,
  },
  label: {
    fontSize: FONTS.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  value: {
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
  },
  valueDisabled: {
    color: COLORS.textTertiary,
  },
  input: {
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  departmentSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  departmentChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  departmentChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  departmentChipText: {
    fontSize: FONTS.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  departmentChipTextActive: {
    color: COLORS.white,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  roleText: {
    fontSize: FONTS.sm,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
  },
});
