// App.js
import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, StatusBar } from 'react-native';
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
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    async function initializeApp() {
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch (error) {
        console.warn('SplashScreen preventAutoHideAsync failed:', error);
      }

      try {
        const pairs = await AsyncStorage.multiGet(['kl_username', 'kl_groupCode', 'kl_groupName']);
        const [username, groupCode, groupName] = pairs.map(p => p[1]);
        if (username && groupCode && groupName) {
          setSession({ username, groupCode, groupName });
        }
      } catch (error) {
        console.warn('AsyncStorage load failed:', error);
      } finally {
        setLoading(false);
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.warn('SplashScreen hideAsync failed:', error);
        }
      }
    }

    initializeApp();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (loading || showIntro) {
    return (
      <View style={styles.splashRoot}>
        <StatusBar hidden />
        <Image
          source={require('./assets/splash.png')}
          style={styles.splashImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <StatusBar hidden={false} barStyle="dark-content" backgroundColor={colors.bg} />
        <OnboardingScreen onDone={s => setSession(s)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar hidden={false} barStyle="dark-content" backgroundColor={colors.surface} />
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
            {() => (
              <ListsScreen
                username={session.username}
                groupCode={session.groupCode}
                groupName={session.groupName}
              />
            )}
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

const styles = StyleSheet.create({
  splashRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
});
