// src/screens/map/MapScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../components/Toast';
import { useRoute } from '@react-navigation/native';

export default function MapScreen() {
  const route = useRoute();
  const toast = useToast();

  // Optional: receive specific location from params (e.g. from HistoryScreen)
  const initialLocation = route.params?.location || route.params?.initialRegion;

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  // Load last known location (offline fallback)
  useEffect(() => {
    const loadLastLocation = async () => {
      try {
        const saved = await AsyncStorage.getItem('@last_known_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          setLocation({
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            accuracy: parsed.accuracy || 50,
          });
          setLoading(false);
        }
      } catch (e) {
        console.log('No saved location found');
      }
    };

    loadLastLocation();
  }, []);

  // Auto-save location every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (location) {
        try {
          await AsyncStorage.setItem(
            '@last_known_location',
            JSON.stringify({
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy || 20,
              timestamp: new Date().toISOString(),
            })
          );
        } catch (e) {
          console.log('Save location failed:', e);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [location]);

  // Live location tracking
  useEffect(() => {
    let subscription;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast('Location permission required', 4000, 'warning');
        setLoading(false);
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 3,
        },
        (loc) => {
          const newLocation = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy || 20,
          };

          setLocation(newLocation);

          // Smooth camera follow
          if (mapRef.current) {
            mapRef.current.animateCamera(
              {
                center: newLocation,
                pitch: 45,
                zoom: 17,
              },
              { duration: 1500 }
            );
          }
        }
      );

      setLoading(false);
    };

    startTracking();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Location Unavailable</Text>
        <Text style={styles.errorSubtext}>Please enable GPS and try again</Text>
      </View>
    );
  }

  const region = initialLocation || {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation={false}
        showsMyLocationButton={true}
        showsCompass={true}
        showsTraffic={true}
        showsBuildings={true}
        loadingEnabled={true}
      >
        {/* Custom Marker */}
        <Marker coordinate={location}>
          <View style={styles.customMarker}>
            <View style={styles.markerPulse} />
            <View style={styles.markerInner} />
          </View>
        </Marker>

        {/* Accuracy Circle */}
        <Circle
          center={location}
          radius={location.accuracy || 30}
          fillColor="rgba(52, 152, 219, 0.25)"
          strokeColor="#3498db"
          strokeWidth={2}
        />
      </MapView>

      {/* Simple Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>Live Location Active</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f8f9fc',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },

  statusBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusText: {
    backgroundColor: 'rgba(39, 174, 96, 0.95)',
    color: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '600',
  },

  customMarker: {
    width: 40,
    height: 40,
    backgroundColor: '#e74c3c',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 20,
  },
  markerPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e74c3c',
    opacity: 0.4,
  },
  markerInner: {
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
});