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
  TasksScreen,
  TasksListScreen,
  AddEditTaskScreen,
  OverdueTasksScreen,
  UpcomingTasksScreen,
  YardPeriodJobsScreen,
  AddEditYardJobScreen,
  MaintenanceLogScreen,
  AddEditMaintenanceLogScreen,
  ImportExportScreen,
  TasksCalendarScreen,
  WatchKeepingScreen,
  WatchScheduleScreen,
  CreateWatchTimetableScreen,
  ShoppingListScreen,
  AddEditShoppingListScreen,
  InventoryScreen,
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
            backgroundColor: COLORS.background,
          },
          headerShadowVisible: false,
          headerTintColor: COLORS.textPrimary,
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
                title: '',
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
            <Stack.Screen 
              name="Tasks" 
              component={TasksScreen}
              options={{ 
                title: 'Tasks',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="TasksList" 
              component={TasksListScreen}
              options={{ 
                title: 'Tasks',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="AddEditTask" 
              component={AddEditTaskScreen}
              options={{ 
                title: 'Task',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="OverdueTasks" 
              component={OverdueTasksScreen}
              options={{ 
                title: 'Overdue Tasks',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="UpcomingTasks" 
              component={UpcomingTasksScreen}
              options={{ 
                title: 'Upcoming Tasks',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="TasksCalendar" 
              component={TasksCalendarScreen}
              options={{ 
                title: 'Yard Period Calendar',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="YardPeriodJobs" 
              component={YardPeriodJobsScreen}
              options={{ 
                title: 'Yard Period',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="AddEditYardJob" 
              component={AddEditYardJobScreen}
              options={{ 
                title: 'Job',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="MaintenanceLog" 
              component={MaintenanceLogScreen}
              options={{ 
                title: 'Maintenance Log',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="AddEditMaintenanceLog" 
              component={AddEditMaintenanceLogScreen}
              options={{ 
                title: 'Log',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="ImportExport" 
              component={ImportExportScreen}
              options={{ 
                title: 'Import / Export',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="WatchKeeping" 
              component={WatchKeepingScreen}
              options={{ 
                title: 'Watch Keeping',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="WatchSchedule" 
              component={WatchScheduleScreen}
              options={{ 
                title: 'Watch Schedule',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="CreateWatchTimetable" 
              component={CreateWatchTimetableScreen}
              options={{ 
                title: 'Create',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="ShoppingList" 
              component={ShoppingListScreen}
              options={{ 
                title: 'Shopping List',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="AddEditShoppingList" 
              component={AddEditShoppingListScreen}
              options={{ 
                title: 'Shopping List',
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="Inventory" 
              component={InventoryScreen}
              options={{ 
                title: 'Inventory',
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
