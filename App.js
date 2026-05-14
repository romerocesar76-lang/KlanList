// App.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

import OnboardingScreen from './src/screens/OnboardingScreen';
import ChatScreen       from './src/screens/ChatScreen';
import ListsScreen      from './src/screens/ListsScreen';
import GroupScreen      from './src/screens/GroupScreen';
import { colors }       from './src/theme';

// Keep splash visible while we check AsyncStorage
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

// Force light/white theme regardless of phone dark mode
const NavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card:       colors.surface,
    text:       colors.text,
    border:     colors.border,
    primary:    colors.accent,
  },
};

export default function App() {
  const [session, setSession] = useState(null);   // { username, groupCode, groupName }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(['kl_username', 'kl_groupCode', 'kl_groupName'])
      .then(pairs => {
        const [username, groupCode, groupName] = pairs.map(p => p[1]);
        if (username && groupCode && groupName) {
          setSession({ username, groupCode, groupName });
        }
      })
      .finally(() => {
        setLoading(false);
        SplashScreen.hideAsync();
      });
  }, []);

  if (loading) {
    return null; // SplashScreen will be visible from app.json
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <OnboardingScreen onDone={s => setSession(s)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <NavigationContainer theme={NavTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            // Header
            headerStyle:       { backgroundColor: colors.surface, elevation: 0, shadowOpacity: 0 },
            headerTitleStyle:  { fontWeight: '800', fontSize: 18, color: colors.text },
            headerTintColor:   colors.text,
            // Tab bar
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor:  colors.border,
              borderTopWidth:  1,
              elevation: 0,
            },
            tabBarActiveTintColor:   colors.accent,
            tabBarInactiveTintColor: colors.text3,
            tabBarLabelStyle:        { fontSize: 11, fontWeight: '700' },
            tabBarIcon: ({ focused, color, size }) => {
              const map = {
                Chat:   focused ? 'chatbubble'       : 'chatbubble-outline',
                Listas: focused ? 'checkmark-done'   : 'checkmark-done-outline',
                Grupo:  focused ? 'people'           : 'people-outline',
              };
              return <Ionicons name={map[route.name]} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Chat" options={{ title: 'Chat del grupo' }}>
            {() => <ChatScreen username={session.username} groupCode={session.groupCode} />}
          </Tab.Screen>

          <Tab.Screen name="Listas" options={{ title: 'Listas' }}>
            {() => <ListsScreen username={session.username} groupCode={session.groupCode} />}
          </Tab.Screen>

          <Tab.Screen name="Grupo" options={{ title: session.groupName }}>
            {() => (
              <GroupScreen
                username={session.username}
                groupCode={session.groupCode}
                groupName={session.groupName}
                onUsernameChange={name => setSession(s => ({ ...s, username: name }))}
                onLeave={() => {
                  AsyncStorage.multiRemove(['kl_username', 'kl_groupCode', 'kl_groupName']);
                  setSession(null);
                }}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
