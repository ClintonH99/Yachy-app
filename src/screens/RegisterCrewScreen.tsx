/**
 * Register Crew Screen
 * For crew members joining with an invite code
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, Input } from '../components';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Department } from '../types';
import authService from '../services/auth';
import { useAuthStore } from '../store';

const DEPARTMENTS = [
  { label: 'Bridge', value: 'BRIDGE' },
  { label: 'Engineering', value: 'ENGINEERING' },
  { label: 'Exterior', value: 'EXTERIOR' },
  { label: 'Interior', value: 'INTERIOR' },
  { label: 'Galley', value: 'GALLEY' },
];

export const RegisterCrewScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    position: '',
    department: '' as Department | '',
    inviteCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const setUser = useAuthStore((state) => state.setUser);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Position is required';
      valid = false;
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
      valid = false;
    }

    // Invite code is REQUIRED for crew members
    if (!formData.inviteCode.trim()) {
      newErrors.inviteCode = 'Invite code is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { user, session } = await authService.signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        position: formData.position,
        department: formData.department as string,
        inviteCode: formData.inviteCode,
      });

      if (user) {
        setUser(user);
        Alert.alert(
          'Success',
          'Welcome aboard! Your crew account has been created.',
          [
            { 
              text: 'OK',
              onPress: () => navigation.replace('Home')
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Crew registration error:', error);
      Alert.alert('Error', error.message || 'Failed to create account. Please check your invite code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.icon}>👥</Text>
            <Text style={styles.title}>Create Crew Account</Text>
            <Text style={styles.subtitle}>
              Join your vessel using an invite code
            </Text>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              You'll need an 8-character invite code from your captain to create a crew account.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              error={errors.name}
            />

            <Input
              label="Email"
              placeholder="your@email.com"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              secureTextEntry
              autoCapitalize="none"
              error={errors.confirmPassword}
            />

            <Input
              label="Position"
              placeholder="e.g., Deckhand, Chief Stew, Engineer"
              value={formData.position}
              onChangeText={(value) => updateField('position', value)}
              error={errors.position}
            />

            {/* Department Selection */}
            <View style={styles.departmentSection}>
              <Text style={styles.label}>Department</Text>
              <View style={styles.departmentButtons}>
                {DEPARTMENTS.map((dept) => (
                  <Button
                    key={dept.value}
                    title={dept.label}
                    variant={
                      formData.department === dept.value ? 'primary' : 'outline'
                    }
                    size="small"
                    onPress={() => updateField('department', dept.value)}
                    style={styles.departmentButton}
                  />
                ))}
              </View>
              {errors.department && (
                <Text style={styles.error}>{errors.department}</Text>
              )}
            </View>

            {/* Invite Code - REQUIRED for crew */}
            <Input
              label="Invite Code *"
              placeholder="e.g., ABC12345"
              value={formData.inviteCode}
              onChangeText={(value) => updateField('inviteCode', value.toUpperCase())}
              autoCapitalize="characters"
              maxLength={8}
              error={errors.inviteCode}
            />

            <Button
              title="Create Crew Account"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              style={styles.registerButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Button
              title="Sign In"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
              size="small"
            />
          </View>

          {/* Don't have invite code */}
          <View style={styles.helpSection}>
            <Text style={styles.helpText}>Don't have an invite code?</Text>
            <Text style={styles.helpSubtext}>
              Ask your captain for the vessel's invite code, or create a captain account if you're starting your own vessel.
            </Text>
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
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
    textAlign: 'center',
  },
  infoBanner: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  infoBannerText: {
    fontSize: FONTS.sm,
    color: COLORS.primary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONTS.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  departmentSection: {
    marginBottom: SPACING.md,
  },
  departmentButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  departmentButton: {
    flex: 1,
    minWidth: '45%',
    marginBottom: SPACING.sm,
  },
  registerButton: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  footerText: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
  },
  helpSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
  },
  helpText: {
    fontSize: FONTS.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  helpSubtext: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  error: {
    fontSize: FONTS.xs,
    color: COLORS.danger,
    marginTop: SPACING.xs,
  },
});
