// App.js - UPDATED WITH ONE-TIME ONBOARDING
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar, Platform, View, ActivityIndicator } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import TermsScreen from './src/screens/onboarding/TermsScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import MainTabs from './src/navigation/MainTabs';
import { ToastProvider } from './src/components/Toast';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkInitialRoute();
    setupImmersiveMode();
  }, []);

  const setupImmersiveMode = () => {
    StatusBar.setHidden(true);
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  };

  const checkInitialRoute = async () => {
    try {
      console.log('🔍 Checking initial route...');
      
      // UNAHIN: Check kung nakita na ang onboarding
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      console.log('📱 Onboarding seen:', hasSeenOnboarding === 'true');
      
      // KAPAG FIRST TIME USER (walang onboarding flag)
      if (hasSeenOnboarding !== 'true') {
        console.log('👋 First time user → Onboarding');
        setInitialRoute('Onboarding');
        setIsCheckingAuth(false);
        return;
      }
      
      // KAPAG NAKITA NA ANG ONBOARDING: Check login status
      console.log('🔑 Checking login status...');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      const userId = await AsyncStorage.getItem('userId');
      
      console.log('   - isLoggedIn:', isLoggedIn);
      console.log('   - userId:', userId);
      
      // Kapag naka-login, diretso sa Main
      if (isLoggedIn === 'true' && userId) {
        console.log('✅ User is logged in → Main');
        setInitialRoute('Main');
      } else {
        // Kapag hindi naka-login, sa Login screen
        console.log('➡️ User not logged in → Login');
        setInitialRoute('Login');
      }
      
      setIsCheckingAuth(false);
      
    } catch (error) {
      console.log('❌ Error checking initial route:', error);
      // Default to Login on error
      setInitialRoute('Login');
      setIsCheckingAuth(false);
    }
  };

  // Loading screen
  if (isCheckingAuth) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#e74c3c',
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <ActivityIndicator size="large" color="#fff" />
        <StatusBar hidden />
      </View>
    );
  }

  return (
    <ToastProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={initialRoute} 
          screenOptions={{ 
            headerShown: false,
            animation: 'fade',
          }}
        >
          {/* ONBOARDING - First time lang lalabas */}
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen}
            options={{
              gestureEnabled: false, // Disable back gesture
            }}
          />
          
          {/* TERMS - After onboarding */}
          <Stack.Screen name="Terms" component={TermsScreen} />
          
          {/* LOGIN - Kapag hindi naka-login */}
          <Stack.Screen name="Login" component={LoginScreen} />
          
          {/* SIGNUP - From login screen */}
          <Stack.Screen name="Signup" component={SignupScreen} />
          
          {/* MAIN APP - Kapag naka-login na */}
          <Stack.Screen 
            name="Main" 
            component={MainTabs}
            options={{
              gestureEnabled: false, // Prevent going back to auth screens
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ToastProvider>
  );
}