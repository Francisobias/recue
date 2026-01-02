// src/services/tripRecorder.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../service/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export const TripRecorder = {
  // Start a new trip
  startTrip: async (userId, startLocation) => {
    try {
      const tripData = {
        userId: userId,
        startTime: Timestamp.now(),
        startLocation: startLocation,
        status: 'active',
        createdAt: Timestamp.now(),
      };
      
      await AsyncStorage.setItem('@current_trip', JSON.stringify(tripData));
      console.log('Trip started');
      
      // Also save to Firestore for real users
      if (userId && userId !== 'demo_user_123') {
        const docRef = await addDoc(collection(db, 'trips'), tripData);
        await AsyncStorage.setItem('@current_trip_id', docRef.id);
      }
      
    } catch (error) {
      console.log('Trip start error:', error);
    }
  },

  // Update trip with new data
  updateTrip: async (userId, location, speed) => {
    try {
      const currentTrip = await AsyncStorage.getItem('@current_trip');
      if (!currentTrip) return;
      
      const tripData = JSON.parse(currentTrip);
      tripData.lastUpdate = new Date().toISOString();
      tripData.currentSpeed = speed;
      tripData.currentLocation = location;
      
      // Calculate max speed
      if (speed > (tripData.maxSpeed || 0)) {
        tripData.maxSpeed = speed;
      }
      
      await AsyncStorage.setItem('@current_trip', JSON.stringify(tripData));
      
    } catch (error) {
      console.log('Trip update error:', error);
    }
  },

  // End and save trip
  endTrip: async (userId, endLocation) => {
    try {
      const currentTrip = await AsyncStorage.getItem('@current_trip');
      if (!currentTrip) return;
      
      const tripData = JSON.parse(currentTrip);
      const endTime = new Date();
      const startTime = new Date(tripData.startTime);
      
      // Calculate trip stats
      const durationMs = endTime - startTime;
      const durationMinutes = Math.floor(durationMs / 60000);
      
      const completedTrip = {
        ...tripData,
        endTime: endTime.toISOString(),
        endLocation: endLocation,
        duration: durationMinutes,
        avgSpeed: tripData.avgSpeed || 0,
        maxSpeed: tripData.maxSpeed || 0,
        distance: calculateDistance(tripData.startLocation, endLocation),
        status: 'completed',
      };
      
      // Save to local history
      await saveToLocalHistory(completedTrip);
      
      // Save to Firestore for real users
      if (userId && userId !== 'demo_user_123') {
        const tripId = await AsyncStorage.getItem('@current_trip_id');
        if (tripId) {
          // Update existing trip document
          await updateDoc(doc(db, 'trips', tripId), {
            ...completedTrip,
            endTime: Timestamp.fromDate(endTime),
          });
        }
      }
      
      // Clear current trip
      await AsyncStorage.multiRemove(['@current_trip', '@current_trip_id']);
      console.log('Trip saved');
      
    } catch (error) {
      console.log('Trip end error:', error);
    }
  },
};

// Helper function to calculate distance
const calculateDistance = (coord1, coord2) => {
  // Same Haversine formula as above
  // ...
};