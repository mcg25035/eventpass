import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Auth
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Organizer
import PuzzleAssetsScreen from './src/screens/organizer/PuzzleAssetsScreen';
import { ApiService } from './src/services/ApiService';
// Debug
import DebugMenuScreen from './src/screens/debug/DebugMenuScreen';
import DebugOverlay from './src/components/DebugOverlay';

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
import UserBadgesScreen from './src/screens/participant/UserBadgesScreen';

// Game
import LobbyScreen from './src/screens/game/LobbyScreen';
import PuzzleGameScreen from './src/screens/game/PuzzleGameScreen';


const Stack = createNativeStackNavigator();


const App = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await ApiService.auth.renewToken();
        if (token) {
          setInitialRoute('Dashboard');
        } else {
          // Token invalid or expired
          setInitialRoute('Login'); // Or DebugMenu if you prefer strict flow
        }
      } catch (e) {
        setInitialRoute('Login');
      }
    };
    checkSession();
  }, []);

  if (!initialRoute) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DebugMenu" component={DebugMenuScreen} options={{ title: '工程選單' }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />

          {/* Organizer Flow */}
          <Stack.Screen name="OrganizerManagement" component={OrganizerManagementScreen} options={{ title: '主辦方中心' }} />
          <Stack.Screen name="ActivitySettings" component={ActivitySettingsScreen} options={{ title: '活動設定' }} />
          <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} options={{ title: '活動詳情' }} />
          <Stack.Screen name="IssueBadge" component={IssueBadgeScreen} options={{ title: '發放憑證' }} />
          <Stack.Screen name="BadgeList" component={BadgeListScreen} options={{ title: '徽章清單' }} />
          <Stack.Screen name="BadgeEdit" component={BadgeEditScreen} options={{ title: '編輯徽章' }} />
          <Stack.Screen name="PuzzleAssets" component={PuzzleAssetsScreen} options={{ title: '活動素材' }} />

          {/* Participant Flow */}
          <Stack.Screen name="ActivityDiscovery" component={ActivityDiscoveryScreen} options={{ title: '探索活動' }} />
          <Stack.Screen name="ParticipantActivity" component={ParticipantActivityScreen} options={{ title: '活動' }} />
          <Stack.Screen name="UserBadges" component={UserBadgesScreen} options={{ title: '我的憑證' }} />

          {/* Game Routes */}
          <Stack.Screen name="Lobby" component={LobbyScreen} options={{ title: '遊戲大廳' }} />
          <Stack.Screen name="PuzzleGame" component={PuzzleGameScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
      <DebugOverlay navigationRef={navigationRef} />
    </SafeAreaProvider>
  );
};

export default App;
