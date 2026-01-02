// src/services/BackgroundService.js
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

// Define the background task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    if (location) {
      // Save location to AsyncStorage
      await AsyncStorage.setItem('@last_background_location', 
        JSON.stringify(location.coords));
      
      // Check speed for crash detection
      const speedKmh = Math.abs(location.coords.speed) * 3.6;
      if (speedKmh > 20) {
        // User is driving - could trigger monitoring
        await AsyncStorage.setItem('@background_driving', 'true');
      }
    }
  }
});

// Register the background task
export const registerBackgroundTask = async () => {
  try {
    await Location.requestBackgroundPermissionsAsync();
    
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 50, // Update every 50 meters
      timeInterval: 30000, // Update every 30 seconds
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'RescueLink is monitoring your drive',
        notificationBody: 'Crash detection is active',
        notificationColor: '#e74c3c',
      },
    });
    
    console.log('✅ Background task registered');
    return true;
  } catch (error) {
    console.error('❌ Background task failed:', error);
    return false;
  }
};