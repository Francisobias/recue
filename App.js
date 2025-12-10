// App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import TermsScreen from './src/screens/onboarding/TermsScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import MainTabs from './src/navigation/MainTabs';
import { ToastProvider } from './src/components/Toast';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState('Loading');

  useEffect(() => {
    const checkAppState = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

        if (!hasSeenOnboarding) {
          setInitialRoute('Onboarding');
        } else if (!isLoggedIn) {
          setInitialRoute('Login');
        } else {
          setInitialRoute('Main');
        }
      } catch (e) {
        setInitialRoute('Onboarding');
      }

      // FULL IMMERSIVE MODE (hide status + navigation bar)
      StatusBar.setHidden(true);
      if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('hidden');
        NavigationBar.setBehaviorAsync('overlay-swipe');
      }
    };

    checkAppState();
  }, []);

  if (initialRoute === 'Loading') {
    return null; // splash screen
  }

  return (
    <ToastProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </ToastProvider>
  );
}