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
import AsyncStorage from '@react-native-async-storage/async-storage'; // ← NA-ADD NA!
import { useToast } from '../../components/Toast';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const toast = useToast();

  // AUTO-SAVE LAST LOCATION EVERY 10 SECONDS (OFFLINE MODE)
  useEffect(() => {
    const saveLocationInterval = setInterval(async () => {
      if (location) {
        try {
          await AsyncStorage.setItem(
            '@last_known_location',
            JSON.stringify({
              ...location,
              speed: speedKmh,
              timestamp: new Date().toISOString(),
            })
          );
        } catch (e) {
          console.log('Failed to save location offline:', e);
        }
      }
    }, 10000); // every 10 seconds

    return () => clearInterval(saveLocationInterval);
  }, [location, speedKmh]);

  // MAIN LOCATION TRACKING
  useEffect(() => {
    let subscription;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast('Location permission required!');
        setLoading(false);
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 3,
          ...(Platform.OS === 'ios' && { activityType: Location.ActivityType.AutomotiveNavigation }),
        },
        (loc) => {
          const newCoords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy,
          };

          setLocation(newCoords);

          const speed = loc.coords.speed || 0;
          const speedInKmh = speed > 0 ? Math.round(speed * 3.6) : 0;
          setSpeedKmh(speedInKmh);

          mapRef.current?.animateCamera({
            center: newCoords,
            zoom: 17.5,
            pitch: 45,
          }, { duration: 1000 });
        }
      );

      // Initial position
      try {
        const initial = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
          accuracy: initial.coords.accuracy,
        });
      } catch (e) {
        toast('Failed to get initial location');
      } finally {
        setLoading(false);
      }
    };

    startTracking();

    return () => {
      subscription?.remove();
    };
  }, []);

  if (loading || !location) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Getting live location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        followsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsTraffic={true}
      >
        <Marker coordinate={location} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.marker}>
            <View style={styles.markerInner} />
          </View>
        </Marker>

        <Circle
          center={location}
          radius={location.accuracy || 20}
          fillColor="rgba(100, 180, 255, 0.3)"
          strokeColor="rgba(50, 130, 255, 0.8)"
          strokeWidth={2}
        />
      </MapView>

      {/* SPEED + ACCURACY CARD */}
      <View style={styles.speedCard}>
        <Text style={styles.speedText}>{speedKmh}</Text>
        <Text style={styles.speedUnit}>km/h</Text>
        <Text style={styles.accuracyText}>
          ±{Math.round(location.accuracy || 0)}m
        </Text>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>Live Tracking • Location Active</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#555' },

  speedCard: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'baseline',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },
  speedText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  speedUnit: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 6,
    marginBottom: 6,
  },
  accuracyText: {
    fontSize: 12,
    color: '#aaa',
    position: 'absolute',
    bottom: 6,
    right: 16,
  },

  statusBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 35,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusText: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 13,
    color: '#27ae60',
    fontWeight: '600',
  },

  marker: {
    width: 36,
    height: 36,
    backgroundColor: '#e74c3c',
    borderRadius: 18,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 15,
  },
  markerInner: {
    width: 14,
    height: 14,
    backgroundColor: '#fff',
    borderRadius: 7,
  },
});