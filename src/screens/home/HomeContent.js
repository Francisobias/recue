// src/screens/home/HomeContent.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Animated,
  StatusBar,
  Platform,
  Modal,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useToast } from '../../components/Toast';
import CrashAlertScreen from '../crash/CrashAlertScreen';
import NetworkStatus from '../../components/NetworkStatus'; // ← IMPORT DITO LANG

export default function HomeContent() {
  const [drivingMode, setDrivingMode] = useState(false);
  const [sosPing] = useState(new Animated.Value(0));
  const drivingTimer = useRef(null);
  const [speed, setSpeed] = useState(0);
  const [showCrashAlert, setShowCrashAlert] = useState(false);

  const toast = useToast();

  // Hide status bar
  useEffect(() => {
    StatusBar.setHidden(true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
  }, []);

  // SOS pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sosPing, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(sosPing, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Driving mode auto detection
  useEffect(() => {
    if (speed >= 20 && !drivingMode) {
      setDrivingMode(true);
      if (drivingTimer.current) clearTimeout(drivingTimer.current);
      toast('Driving Mode Activated', 3000);
    } else if (speed < 20 && drivingMode) {
      if (drivingTimer.current) clearTimeout(drivingTimer.current);
      drivingTimer.current = setTimeout(() => {
        setDrivingMode(false);
        toast('Driving Mode OFF', 3000);
      }, 10000);
    }
  }, [speed, drivingMode]);

  // Simulated speed (for testing)
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeed(Math.floor(Math.random() * 50));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* OFFLINE INDICATOR */}
      <NetworkStatus />

      {/* CRASH ALERT FULL SCREEN */}
      <Modal visible={showCrashAlert} transparent={false} animationType="slide">
        <CrashAlertScreen onCancel={() => setShowCrashAlert(false)} />
      </Modal>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>RescueLink</Text>
        </View>

        {/* System Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>System Status</Text>

          <View style={styles.statusItem}>
            <View style={styles.statusLabel}>
              <Icon name="shield" size={20} color="#333" />
              <Text style={styles.statusText}>Crash Detection</Text>
            </View>
            <Text style={styles.statusValueText}>ON</Text>
          </View>

          <View style={styles.statusItem}>
            <View style={styles.statusLabel}>
              <Icon name="wifi" size={20} color="#333" />
              <Text style={styles.statusText}>BLE Mesh</Text>
            </View>
            <Text style={styles.statusValueText}>Connected</Text>
          </View>

          <Text style={styles.speedText}>
            Speed: <Text style={{ fontWeight: 'bold' }}>{speed} km/h</Text>
          </Text>
        </View>

        {/* SOS Button */}
        <View style={styles.sosContainer}>
          <Animated.View
            style={[
              styles.pingCircle,
              {
                opacity: sosPing.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
                transform: [
                  {
                    scale: sosPing.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.45],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.sosButtonContainer}>
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosSubText}>Long press to send alert</Text>
          </View>
          <Text style={styles.sosNote}>Hold for 3 seconds</Text>
        </View>

        {/* TEST CRASH BUTTON (delete later) */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => setShowCrashAlert(true)}
        >
          <Text style={styles.testButtonText}>TEST CRASH ALERT</Text>
        </TouchableOpacity>

        {/* Driving Mode */}
        <View style={styles.drivingModeCard}>
          <View>
            <Text style={styles.drivingLabel}>Driving Mode</Text>
            <Text style={styles.drivingDesc}>Auto-detect when driving</Text>
          </View>
          <Switch
            value={drivingMode}
            onValueChange={setDrivingMode}
            trackColor={{ false: '#ccc', true: '#e74c3c' }}
            thumbColor="#fff"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  content: { padding: 16, paddingBottom: 80 },

  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerText: { fontSize: 26, fontWeight: 'bold', color: '#222' },

  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statusTitle: { fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 16 },
  statusItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  statusLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusText: { fontSize: 15, color: '#333' },
  statusValueText: {
    backgroundColor: '#27ae60',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    fontWeight: '600',
  },
  speedText: { marginTop: 12, fontSize: 15, color: '#444' },

  sosContainer: { alignItems: 'center', marginVertical: 40 },
  pingCircle: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#e74c3c',
  },
  sosButtonContainer: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 20,
  },
  sosText: { color: '#fff', fontSize: 44, fontWeight: 'bold' },
  sosSubText: { color: '#fff', fontSize: 14, marginTop: 6 },
  sosNote: { marginTop: 16, fontSize: 13, color: '#666' },

  testButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: 'center',
    marginVertical: 20,
  },
  testButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  drivingModeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  drivingLabel: { fontSize: 17, fontWeight: 'bold', color: '#222' },
  drivingDesc: { fontSize: 13, color: '#666', marginTop: 4 },
});