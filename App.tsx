import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text } from 'react-native';

import { RootStackParamList, TabParamList } from './src/navigation';
import AddBottleScreen from './src/screens/AddBottleScreen';
import BottleDetailScreen from './src/screens/BottleDetailScreen';
import BulkAddScreen from './src/screens/BulkAddScreen';
import ChatScreen from './src/screens/ChatScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import MatchScreen from './src/screens/MatchScreen';
import RandomPourScreen from './src/screens/RandomPourScreen';
import TradeScreen from './src/screens/TradeScreen';
import ScanScreen from './src/screens/ScanScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, string> = {
  Bar: '🥃',
  Scan: '📷',
  Pour: '🎲',
  Pair: '💬',
  Match: '🤝',
  Trade: '🔁',
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.textDim,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>
            {TAB_ICONS[route.name as keyof TabParamList]}
          </Text>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
