// src/screens/home/HomeContent.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Modal,
  TouchableOpacity,
  Vibration,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../components/Toast';
import CrashAlertScreen from '../crash/CrashAlertScreen';
import SOSAlertScreen from '../emergency/SOSAlertScreen';
import NetworkStatus from '../../components/NetworkStatus';
import { useRoute } from '@react-navigation/native';
import { Accelerometer } from 'expo-sensors';
import { 
  collection, 
  addDoc, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../service/firebase';

export default function HomeContent() {
  const route = useRoute();
  const userId = route?.params?.userId || 'demo_user';

  // Core states only
  const [drivingMode, setDrivingMode] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [showCrashAlert, setShowCrashAlert] = useState(false);
  const [showSOSAlert, setShowSOSAlert] = useState(false);
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [locationPermission, setLocationPermission] = useState(false);
  const [isMonitoringCrash, setIsMonitoringCrash] = useState(false);
  const [lastAcceleration, setLastAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [currentSeverity, setCurrentSeverity] = useState('MODERATE');
  const [currentImpactForce, setCurrentImpactForce] = useState('0.00');
  const [crashSensitivity, setCrashSensitivity] = useState('medium');
  const [crashThresholds, setCrashThresholds] = useState({
    moderate: 2.0,
    severe: 3.5,
  });
  const [userData, setUserData] = useState(null);
  const [firebaseConnected, setFirebaseConnected] = useState(true);

  // Refs
  const sosScale = useRef(new Animated.Value(1)).current;
  const sosPing = useRef(new Animated.Value(0)).current;
  const accelerometerSubscription = useRef(null);
  const locationSubscription = useRef(null);
  const toast = useToast();
  const isMounted = useRef(true);
  const speedHistory = useRef([]);

  // Constants
  const DRIVING_MODE_ACTIVATION_SPEED = 20; // km/h
  const MIN_SPEED_FOR_CRASH = 10; // km/h

  useEffect(() => {
    isMounted.current = true;

    loadUserData();
    requestLocationPermission();
    loadCrashSettings();
    checkFirebaseConnection();

    // SOS pulse animation
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(sosPing, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(sosPing, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    animation.start();

    return () => {
      isMounted.current = false;
      if (accelerometerSubscription.current) accelerometerSubscription.current.remove();
      if (locationSubscription.current) locationSubscription.current.remove();
      animation.stop();
    };
  }, []);

  // Crash monitoring effect
  useEffect(() => {
    if (drivingMode && locationPermission && !isMonitoringCrash) {
      startCrashMonitoring();
    } else if (!drivingMode && isMonitoringCrash) {
      stopCrashMonitoring();
    }
  }, [drivingMode, locationPermission]);

  // Load user data
  const loadUserData = async () => {
    try {
      const userName = await AsyncStorage.getItem('userName') || 'RescueLink User';
      const userEmail = await AsyncStorage.getItem('userEmail') || 'demo@rescuelink.com';
      setUserData({ userId, userName, userEmail, deviceId: Platform.OS });
    } catch (error) {
      setUserData({ userId, userName: 'RescueLink User', userEmail: 'demo@rescuelink.com' });
    }
  };

  // Firebase connection test
  const checkFirebaseConnection = async () => {
    try {
      await addDoc(collection(db, 'test_connections'), {
        test: true,
        timestamp: Timestamp.now(),
        userId,
      });
      setFirebaseConnected(true);
    } catch (error) {
      setFirebaseConnected(false);
      toast('No internet connection', 3000, 'warning');
    }
  };

  // Crash settings
  const loadCrashSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('@crash_sensitivity') || 'medium';
      setCrashSensitivity(saved);
      setCrashThresholds(getSensitivityThresholds(saved));
    } catch (error) {
      setCrashThresholds({ moderate: 2.0, severe: 3.5 });
    }
  };

  const getSensitivityThresholds = (sensitivity) => {
    switch (sensitivity) {
      case 'low': return { moderate: 2.5, severe: 4.0 };
      case 'high': return { moderate: 1.5, severe: 2.8 };
      default: return { moderate: 2.0, severe: 3.5 };
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(loc.coords);
        setAccuracy(loc.coords.accuracy || 0);

        const speedKmh = loc.coords.speed ? Math.round(Math.abs(loc.coords.speed) * 3.6) : 0;
        setSpeed(speedKmh);

        if (speedKmh >= DRIVING_MODE_ACTIVATION_SPEED) {
          setDrivingMode(true);
          toast('Driving Mode ACTIVATED', 2000);
        }

        startLocationTracking();
        toast('GPS Active', 2000);
      } else {
        setLocationPermission(false);
        Alert.alert('Permission Required', 'Location access is needed for crash and SOS features.', [
          { text: 'Cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
      }
    } catch (error) {
      setLocationPermission(false);
    }
  };

  const startLocationTracking = async () => {
    if (!locationPermission || locationSubscription.current) return;

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 3,
      },
      (newLocation) => {
        const coords = newLocation.coords;
        setLocation(coords);
        setAccuracy(coords.accuracy || 0);

        let speedKmh = 0;
        if (coords.speed !== null && coords.speed >= 0) {
          speedKmh = Math.round(coords.speed * 3.6);
        }

        // Smooth speed
        speedHistory.current.push(speedKmh);
        if (speedHistory.current.length > 5) speedHistory.current.shift();
        const avgSpeed = Math.round(speedHistory.current.reduce((a,b) => a+b, 0) / speedHistory.current.length);
        setSpeed(avgSpeed);

        // Driving mode logic
        if (avgSpeed >= DRIVING_MODE_ACTIVATION_SPEED && !drivingMode) {
          setDrivingMode(true);
          toast('Driving Mode ACTIVATED', 2000);
        } else if (avgSpeed < 5 && drivingMode) {
          setDrivingMode(false);
          toast('Driving Mode DEACTIVATED', 2000);
        }
      }
    );
  };

  const startCrashMonitoring = async () => {
    if (!drivingMode || isMonitoringCrash) return;
    const available = await Accelerometer.isAvailableAsync();
    if (!available) {
      toast('Crash detection not available', 3000, 'warning');
      return;
    }

    Accelerometer.setUpdateInterval(100);
    accelerometerSubscription.current = Accelerometer.addListener((data) => {
      const deltaX = Math.abs(data.x - lastAcceleration.x);
      const deltaY = Math.abs(data.y - lastAcceleration.y);
      const deltaZ = Math.abs(data.z - lastAcceleration.z);
      const totalForce = Math.sqrt(deltaX**2 + deltaY**2 + deltaZ**2);
      const force = parseFloat(totalForce.toFixed(2));

      if (speed >= MIN_SPEED_FOR_CRASH) {
        if (totalForce >= crashThresholds.severe) {
          triggerCrashAlert('SEVERE', force);
        } else if (totalForce >= crashThresholds.moderate) {
          triggerCrashAlert('MODERATE', force);
        }
      }

      setLastAcceleration(data);
    });

    setIsMonitoringCrash(true);
    toast(`Crash Detection ACTIVE (${crashSensitivity})`, 2000);
  };

  const stopCrashMonitoring = () => {
    if (accelerometerSubscription.current) {
      accelerometerSubscription.current.remove();
      accelerometerSubscription.current = null;
      setIsMonitoringCrash(false);
    }
  };

  const triggerCrashAlert = async (severity, force) => {
    stopCrashMonitoring();
    setCurrentSeverity(severity);
    setCurrentImpactForce(force.toString());

    let crashLocation = location || { latitude: 0, longitude: 0 };
    if (!location) {
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        crashLocation = pos.coords;
      } catch (e) {}
    }

    const crashEvent = {
      type: 'CRASH',
      severity,
      timestamp: new Date().toISOString(),
      location: crashLocation,
      userId,
      userName: userData?.userName || 'Unknown',
      speed,
      force,
      gpsAccuracy: accuracy,
      sensitivitySetting: crashSensitivity,
    };

    await AsyncStorage.setItem('@last_crash_event', JSON.stringify(crashEvent));

    try {
      await addDoc(collection(db, 'crashes'), {
        ...crashEvent,
        timestamp: serverTimestamp(),
        status: 'pending',
      });
    } catch (e) {
      await AsyncStorage.setItem('@pending_crash', JSON.stringify(crashEvent));
    }

    Vibration.vibrate([0, 1000, 200, 1000, 200, 1000], true);
    setShowCrashAlert(true);
  };

  const handleCrashAlertCancel = () => {
    setShowCrashAlert(false);
    Vibration.cancel();
    if (drivingMode && locationPermission) startCrashMonitoring();
  };

  const triggerSOS = () => {
    if (!locationPermission) {
      Alert.alert('GPS Required', 'Enable location to send SOS.');
      return;
    }
    Vibration.vibrate([500], false);
    setShowSOSAlert(true);
  };

  const showCrashThresholds = () => {
    Alert.alert(
      'Crash Detection Settings',
      `Sensitivity: ${crashSensitivity.toUpperCase()}\n\n` +
      `Moderate: ≥ ${crashThresholds.moderate} G\n` +
      `Severe: ≥ ${crashThresholds.severe} G\n` +
      `Min Speed: ${MIN_SPEED_FOR_CRASH} km/h`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <NetworkStatus />

      <Modal visible={showCrashAlert} transparent={false} animationType="slide">
        <CrashAlertScreen 
          onCancel={handleCrashAlertCancel}
          severity={currentSeverity}
          impactForce={currentImpactForce}
          sensitivitySetting={crashSensitivity}
        />
      </Modal>

      <Modal visible={showSOSAlert} transparent={false} animationType="slide">
        <SOSAlertScreen onClose={() => { setShowSOSAlert(false); Vibration.cancel(); }} userId={userId} />
      </Modal>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerText}>RescueLink</Text>
          <Text style={styles.locationStatus}>
            {locationPermission ? 'GPS Active' : 'GPS Off'}
          </Text>
          {!firebaseConnected && <Text style={styles.offlineStatus}>OFFLINE</Text>}
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>System Status</Text>

          <View style={styles.statusItem}>
            <View style={styles.statusLabel}><Icon name="database" size={20} color={firebaseConnected ? "#27ae60" : "#e74c3c"} /><Text>Cloud Sync</Text></View>
            <Text style={[styles.statusValue, { backgroundColor: firebaseConnected ? "#27ae60" : "#e74c3c" }]}>{firebaseConnected ? 'ONLINE' : 'OFFLINE'}</Text>
          </View>

          <View style={styles.statusItem}>
            <View style={styles.statusLabel}><Icon name="shield" size={20} color={isMonitoringCrash ? "#27ae60" : "#e74c3c"} /><Text>Crash Detection</Text></View>
            <Text style={[styles.statusValue, { backgroundColor: isMonitoringCrash ? "#27ae60" : "#e74c3c" }]}>{isMonitoringCrash ? 'ACTIVE' : 'INACTIVE'}</Text>
          </View>

          <View style={styles.statusItem}>
            <View style={styles.statusLabel}><Icon name="navigation" size={20} color={locationPermission ? "#27ae60" : "#e74c3c"} /><Text>GPS</Text></View>
            <Text style={[styles.statusValue, { backgroundColor: locationPermission ? "#27ae60" : "#e74c3c" }]}>{locationPermission ? 'Active' : 'Required'}</Text>
          </View>

          <View style={styles.speedContainer}>
            <Text style={styles.speedLabel}>CURRENT SPEED</Text>
            <View style={styles.speedDisplay}>
              <Text style={styles.speedValue}>{speed}</Text>
              <Text style={styles.speedUnit}>km/h</Text>
            </View>
            <Text style={styles.accuracyText}>Accuracy: ±{Math.round(accuracy)}m</Text>
            <Text style={[styles.autoModeText, { color: drivingMode ? '#27ae60' : '#3498db' }]}>
              {drivingMode ? 'DRIVING MODE ACTIVE' : 'Waiting for 20 km/h'}
            </Text>
          </View>
        </View>

        <View style={styles.sosContainer}>
          <Animated.View style={[styles.pingCircle, {
            opacity: sosPing.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }),
            transform: [{ scale: sosPing.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
          }]} />
          <TouchableOpacity
            onPress={triggerSOS}
            style={[styles.sosButton, { backgroundColor: locationPermission ? '#e74c3c' : '#95a5a6' }]}
            disabled={!locationPermission}
          >
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosSubText}>{locationPermission ? 'Emergency Alert' : 'GPS Required'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.testButtons}>
          <Text style={styles.sectionTitle}>Testing</Text>
          <TouchableOpacity style={[styles.testButton, { backgroundColor: '#3498db' }]} onPress={() => {
            const testForce = (crashThresholds.moderate + 0.5).toFixed(2);
            triggerCrashAlert('MODERATE', parseFloat(testForce));
          }}>
            <Icon name="activity" size={20} color="#fff" />
            <Text style={styles.testButtonText}>TEST CRASH (Moderate)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.testButton, { backgroundColor: '#9b59b6' }]} onPress={showCrashThresholds}>
            <Icon name="info" size={20} color="#fff" />
            <Text style={styles.testButtonText}>VIEW THRESHOLDS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Styles remain mostly the same — you can trim some unused ones if you want
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  content: { padding: 16, paddingBottom: 100 },
  header: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, alignItems: 'center' },
  headerText: { fontSize: 28, fontWeight: 'bold', color: '#222' },
  locationStatus: { fontSize: 12, color: '#666', marginTop: 8 },
  offlineStatus: { fontSize: 10, color: '#e74c3c', fontWeight: '600', marginTop: 2 },
  statusCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 30 },
  statusTitle: { fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 16 },
  statusItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  statusLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusValue: { color: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, fontWeight: '600', fontSize: 13 },
  speedContainer: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
  speedLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 10 },
  speedDisplay: { flexDirection: 'row', alignItems: 'baseline' },
  speedValue: { fontSize: 42, fontWeight: 'bold', color: '#222' },
  speedUnit: { fontSize: 18, color: '#666', marginLeft: 5 },
  accuracyText: { fontSize: 12, color: '#666', marginTop: 8 },
  autoModeText: { fontSize: 11, marginTop: 10, fontWeight: '600', backgroundColor: 'rgba(52, 152, 219, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  sosContainer: { alignItems: 'center', marginVertical: 40 },
  pingCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#e74c3c' },
  sosButton: { width: 180, height: 180, borderRadius: 90, justifyContent: 'center', alignItems: 'center' },
  sosText: { color: '#fff', fontSize: 48, fontWeight: 'bold' },
  sosSubText: { color: '#fff', fontSize: 14, marginTop: 8 },
  testButtons: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 10, marginLeft: 5 },
  testButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 14, gap: 8, marginBottom: 10 },
  testButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});