import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { RootStackParamList, TabParamList } from './src/navigation';
import AddBottleScreen from './src/screens/AddBottleScreen';
import BottleDetailScreen from './src/screens/BottleDetailScreen';
import BulkAddScreen from './src/screens/BulkAddScreen';
import ChatScreen from './src/screens/ChatScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import DiagnosticsScreen from './src/screens/DiagnosticsScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import JournalScreen from './src/screens/JournalScreen';
import LogPourScreen from './src/screens/LogPourScreen';
import MatchScreen from './src/screens/MatchScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import RandomPourScreen from './src/screens/RandomPourScreen';
import RecommendScreen from './src/screens/RecommendScreen';
import ReleasesScreen from './src/screens/ReleasesScreen';
import ScanLabelScreen from './src/screens/ScanLabelScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import TradeScreen from './src/screens/TradeScreen';
import ScanScreen from './src/screens/ScanScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Bar: 'wine',
  Scan: 'scan',
  Pour: 'shuffle',
  Pair: 'chatbubbles',
  Match: 'people',
  Trade: 'swap-horizontal',
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
        tabBarActiveTintColor: colors.amberBright,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarIcon: ({ focused, color }) => (
          <Ionicons
            name={TAB_ICONS[route.name as keyof TabParamList]}
            size={focused ? 24 : 22}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Bar" component={InventoryScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Pour" component={RandomPourScreen} />
      <Tab.Screen name="Pair" component={ChatScreen} />
      <Tab.Screen name="Match" component={MatchScreen} />
      <Tab.Screen name="Trade" component={TradeScreen} />
    </Tab.Navigator>
  );
}

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    primary: colors.amber,
    border: colors.border,
  },
};

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NavigationContainer theme={theme}>
        <StatusBar style="light" />
        <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="AddBottle"
          component={AddBottleScreen}
          options={{ title: 'Add Bottle', presentation: 'modal' }}
        />
        <Stack.Screen
          name="BottleDetail"
          component={BottleDetailScreen}
          options={{ title: 'Bottle' }}
        />
        <Stack.Screen
          name="BulkAdd"
          component={BulkAddScreen}
          options={{ title: 'Bulk Add from Photo' }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="Releases" component={ReleasesScreen} options={{ title: 'Releases' }} />
        <Stack.Screen name="Explore" component={ExploreScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Journal" component={JournalScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Recommend" component={RecommendScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Portfolio" component={PortfolioScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ScanLabel" component={ScanLabelScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="LogPour"
          component={LogPourScreen}
          options={{ title: 'Log a Pour', presentation: 'modal' }}
        />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
