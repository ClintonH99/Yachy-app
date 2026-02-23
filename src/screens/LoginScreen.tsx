/**
 * Login Screen
 * Maritime / superyacht industry–focused sign-in
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
  StatusBar,
} from 'react-native';
import { Button, Input } from '../components';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import authService from '../services/auth';
import { useAuthStore } from '../store';

const MARITIME = {
  bgDark: '#0f172a',       // Deep navy
  bgMid: '#1e293b',        // Slate navy
  accent: '#0ea5e9',       // Ocean blue
  accentMuted: 'rgba(14, 165, 233, 0.25)',
  gold: '#c9a227',         // Brass / maritime accent
  textOnDark: '#f8fafc',
  textMuted: '#94a3b8',
};

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
      const { user } = await authService.signIn({ email, password });

      if (user) {
        setUser(user);
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={MARITIME.bgDark} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero: maritime branding */}
          <View style={styles.hero}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>Y</Text>
            </View>
            <Text style={styles.appName}>Nautical Ops</Text>
            <Text style={styles.tagline}>
              Operations for superyacht & maritime crews
            </Text>
            <View style={styles.horizon} />
          </View>

          {/* Sign-in card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardSubtitle}>
              Enter your credentials to access your vessel operations
            </Text>

            <Input
              label="Email"
              placeholder="crew@vessel.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />

            <Button
              title="Sign in"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              variant="primary"
              style={styles.signInButton}
            />
          </View>

          {/* Create account */}
          <View style={styles.createSection}>
            <Text style={styles.createSectionTitle}>Don’t have an account?</Text>

            <View style={styles.optionCard}>
              <View style={styles.optionIconWrap}>
                <Text style={styles.optionIcon}>⚓</Text>
              </View>
              <Text style={styles.optionTitle}>Captain</Text>
              <Text style={styles.optionDescription}>
                Create your vessel and invite your crew
              </Text>
              <Button
                title="Create captain account"
                onPress={() => navigation.navigate('RegisterCaptain')}
                variant="primary"
                fullWidth
                style={styles.optionButton}
              />
            </View>

            <View style={styles.optionCard}>
              <View style={[styles.optionIconWrap, styles.optionIconWrapCrew]}>
                <Text style={styles.optionIcon}>👥</Text>
              </View>
              <Text style={styles.optionTitle}>Crew member</Text>
              <Text style={styles.optionDescription}>
                Join a vessel with an invite code
              </Text>
              <Button
                title="Create crew account"
                onPress={() => navigation.navigate('RegisterCrew')}
                variant="outline"
                fullWidth
                style={styles.optionButtonOutline}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Apple & Google sign-in coming soon
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MARITIME.bgDark,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: 56,
    paddingBottom: SPACING['2xl'],
  },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: MARITIME.accentMuted,
    borderWidth: 1,
    borderColor: MARITIME.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoMarkText: {
    fontSize: 28,
    fontWeight: '800',
    color: MARITIME.accent,
    letterSpacing: -0.5,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: MARITIME.textOnDark,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: FONTS.sm,
    color: MARITIME.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  horizon: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: MARITIME.gold,
    marginTop: SPACING.lg,
    opacity: 0.9,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontSize: FONTS.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  signInButton: {
    marginTop: SPACING.md,
  },
  createSection: {
    marginBottom: SPACING.xl,
  },
  createSectionTitle: {
    fontSize: FONTS.base,
    fontWeight: '600',
    color: MARITIME.textOnDark,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  optionCard: {
    backgroundColor: MARITIME.bgMid,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: MARITIME.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  optionIconWrapCrew: {
    backgroundColor: 'rgba(248, 250, 252, 0.12)',
  },
  optionIcon: {
    fontSize: 22,
  },
  optionTitle: {
    fontSize: FONTS.lg,
    fontWeight: '700',
    color: MARITIME.textOnDark,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: FONTS.sm,
    color: MARITIME.textMuted,
    marginBottom: SPACING.md,
  },
  optionButton: {
    marginTop: 0,
  },
  optionButtonOutline: {
    marginTop: 0,
    borderColor: MARITIME.textMuted,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  footerText: {
    fontSize: FONTS.xs,
    color: MARITIME.textMuted,
    fontStyle: 'italic',
  },
});
