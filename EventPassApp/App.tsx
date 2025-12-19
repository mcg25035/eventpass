import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Auth
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Debug
import DebugMenuScreen from './src/screens/debug/DebugMenuScreen';

// Dashboard
import DashboardScreen from './src/screens/dashboard/DashboardScreen';

// Organizer
import OrganizerManagementScreen from './src/screens/organizer/OrganizerManagementScreen';
import ActivitySettingsScreen from './src/screens/organizer/ActivitySettingsScreen';
import ActivityDetailScreen from './src/screens/organizer/ActivityDetailScreen';
import IssueBadgeScreen from './src/screens/organizer/IssueBadgeScreen';
import BadgeListScreen from './src/screens/organizer/BadgeListScreen';
import BadgeEditScreen from './src/screens/organizer/BadgeEditScreen';

// Participant
import ActivityDiscoveryScreen from './src/screens/participant/ActivityDiscoveryScreen';
import ParticipantActivityScreen from './src/screens/participant/ParticipantActivityScreen';


const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="DebugMenu">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DebugMenu" component={DebugMenuScreen} options={{ title: 'Engineering Menu' }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />

          {/* Organizer Flow */}
          <Stack.Screen name="OrganizerManagement" component={OrganizerManagementScreen} options={{ title: 'Organizer' }} />
          <Stack.Screen name="ActivitySettings" component={ActivitySettingsScreen} options={{ title: 'Activity Settings' }} />
          <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} options={{ title: 'Activity Detail' }} />
          <Stack.Screen name="IssueBadge" component={IssueBadgeScreen} options={{ title: 'Issue Badge' }} />
          <Stack.Screen name="BadgeList" component={BadgeListScreen} options={{ title: 'Badges' }} />
          <Stack.Screen name="BadgeEdit" component={BadgeEditScreen} options={{ title: 'Edit Badge' }} />

          {/* Participant Flow */}
          <Stack.Screen name="ActivityDiscovery" component={ActivityDiscoveryScreen} options={{ title: 'Discovery' }} />
          <Stack.Screen name="ParticipantActivity" component={ParticipantActivityScreen} options={{ title: 'Activity' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
