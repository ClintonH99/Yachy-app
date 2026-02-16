/**
 * Login Screen
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
import authService from '../services/auth';
import { useAuthStore } from '../store';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const setUser = useAuthStore((state) => state.setUser);

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { user, session } = await authService.signIn({ email, password });
      
      if (user) {
        setUser(user);
        // Navigation will be handled by the auth state change
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in');
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue to Yachy</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={styles.loginButton}
            />
          </View>

          {/* Create Account Options */}
          <View style={styles.createAccountSection}>
            <Text style={styles.sectionTitle}>Don't have an account?</Text>
            
            {/* Captain Registration */}
            <View style={styles.accountTypeCard}>
              <Text style={styles.accountTypeIcon}>⚓</Text>
              <Text style={styles.accountTypeTitle}>Captain</Text>
              <Text style={styles.accountTypeDescription}>
                Create your vessel and invite your crew
              </Text>
              <Button
                title="Create Captain Account"
                onPress={() => navigation.navigate('RegisterCaptain')}
                variant="primary"
                fullWidth
                style={styles.accountTypeButton}
              />
            </View>

            {/* Crew Registration */}
            <View style={styles.accountTypeCard}>
              <Text style={styles.accountTypeIcon}>👥</Text>
              <Text style={styles.accountTypeTitle}>Crew Member</Text>
              <Text style={styles.accountTypeDescription}>
                Join a vessel using an invite code
              </Text>
              <Button
                title="Create Crew Account"
                onPress={() => navigation.navigate('RegisterCrew')}
                variant="outline"
                fullWidth
                style={styles.accountTypeButton}
              />
            </View>
          </View>

          {/* Coming Soon: Social Login */}
          <View style={styles.socialSection}>
            <Text style={styles.comingSoon}>
              Apple & Google Sign-In coming soon
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
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
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
  form: {
    marginBottom: SPACING.lg,
  },
  loginButton: {
    marginTop: SPACING.md,
  },
  createAccountSection: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  accountTypeCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accountTypeIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  accountTypeTitle: {
    fontSize: FONTS.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  accountTypeDescription: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  accountTypeButton: {
    marginTop: SPACING.xs,
  },
  socialSection: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  comingSoon: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
