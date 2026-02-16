/**
 * Root Navigation
 * Handles auth flow and main navigation
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { LoginScreen, RegisterScreen, RegisterCaptainScreen, RegisterCrewScreen, HomeScreen, JoinVesselScreen } from '../screens';
import { CreateVesselScreen } from '../screens/CreateVesselScreen';
import { useAuthStore } from '../store';
import authService from '../services/auth';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        const session = await authService.getSession();
        if (session?.user) {
          const userData = await authService.getUserProfile(session.user.id);
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen to auth state changes
    const { data: authListener } = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="RegisterCaptain" component={RegisterCaptainScreen} />
            <Stack.Screen name="RegisterCrew" component={RegisterCrewScreen} />
            <Stack.Screen name="CreateVessel" component={CreateVesselScreen} />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="JoinVessel" component={JoinVesselScreen} />
            <Stack.Screen name="CreateVessel" component={CreateVesselScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
