/**
 * Root Navigation
 * Handles auth flow and main navigation
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { 
  LoginScreen, 
  RegisterScreen, 
  RegisterCaptainScreen, 
  RegisterCrewScreen, 
  HomeScreen, 
  JoinVesselScreen,
  SettingsScreen,
  ProfileScreen,
  VesselSettingsScreen,
  CrewManagementScreen,
  UpcomingTripsScreen,
  GuestTripsScreen,
  BossTripsScreen,
  AddEditTripScreen,
  DeliveryTripsScreen,
  YardPeriodTripsScreen,
  TripColorSettingsScreen,
} from '../screens';
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
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="RegisterCaptain" 
              component={RegisterCaptainScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="RegisterCrew" 
              component={RegisterCrewScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CreateVessel" 
              component={CreateVesselScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ 
                title: 'Home',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="JoinVessel" 
              component={JoinVesselScreen}
              options={{ 
                title: 'Join Vessel',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="CreateVessel" 
              component={CreateVesselScreen}
              options={{ 
                title: 'Create Vessel',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ 
                title: 'Settings',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ 
                title: 'My Profile',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="VesselSettings" 
              component={VesselSettingsScreen}
              options={{ 
                title: 'Vessel Settings',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="CrewManagement" 
              component={CrewManagementScreen}
              options={{ 
                title: 'Crew Management',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="UpcomingTrips" 
              component={UpcomingTripsScreen}
              options={{ 
                title: 'Upcoming Trips',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="GuestTrips" 
              component={GuestTripsScreen}
              options={{ 
                title: 'Guest Trips',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="BossTrips" 
              component={BossTripsScreen}
              options={{ 
                title: 'Boss Trips',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="AddEditTrip" 
              component={AddEditTripScreen}
              options={{ 
                title: 'Trip',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="DeliveryTrips" 
              component={DeliveryTripsScreen}
              options={{ 
                title: 'Delivery',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="YardPeriodTrips" 
              component={YardPeriodTripsScreen}
              options={{ 
                title: 'Yard Period',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="TripColorSettings" 
              component={TripColorSettingsScreen}
              options={{ 
                title: 'Trip colors',
                headerShown: true,
              }}
            />
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
