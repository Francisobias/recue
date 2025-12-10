// src/screens/crash/CrashAlertScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // ← GAMITIN NATIN ITO PARA SURE

const { width } = Dimensions.get('window');

export default function CrashAlertScreen({ onCancel }) {
  const [countdown, setCountdown] = useState(10);
  const [cancelled, setCancelled] = useState(false);
  const scaleValue = new Animated.Value(1);

  // PULSE ANIMATION — FIXED NA!
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.15,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // COUNTDOWN + VIBRATION
  useEffect(() => {
    if (countdown > 0 && !cancelled) {
      Vibration.vibrate([0, 400, 200, 400], false);
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !cancelled) {
      console.log('SOS SENT AUTOMATICALLY!');
      // Later: auto send location + SMS
    }
  }, [countdown, cancelled]);

  if (cancelled) {
    return (
      <View style={styles.container}>
        <View style={styles.cancelledCard}>
          <MaterialIcons name="check-circle" size={100} color="#27ae60" />
          <Text style={styles.title}>Alert Cancelled</Text>
          <Text style={styles.subtitle}>We're glad you're safe!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bgPulse, { transform: [{ scale: scaleValue }] }]} />

      <View style={styles.content}>
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <View style={styles.alertCircle}>
            <MaterialIcons name="warning" size={90} color="#fff" />
          </View>
        </Animated.View>

        <Text style={styles.title}>CRASH DETECTED!</Text>
        <Text style={styles.message}>Emergency alert in {countdown} seconds</Text>

        <View style={styles.ringContainer}>
          <View style={styles.ringBg} />
          <View
            style={[
              styles.ringProgress,
              { transform: [{ rotate: `${360 - (countdown / 10) * 360}deg` }] },
            ]}
          />
          <Text style={styles.countdownNumber}>{countdown}</Text>
        </View>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            Vibration.cancel();
            setCancelled(true);
            setTimeout(() => onCancel?.(), 1500);
          }}
        >
          <Text style={styles.cancelText}>I'M OKAY — CANCEL</Text>
        </TouchableOpacity>

        <View style={styles.sensorBox}>
          <Text style={styles.sensorTitle}>Impact Analysis</Text>
          <Text style={styles.sensorLine}>Force: 8.7G</Text>
          <Text style={styles.sensorLine}>Speed: 65 km/h</Text>
          <Text style={styles.sensorLine}>Multiple impacts: Yes</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bgPulse: { ...StyleSheet.absoluteFillObject, backgroundColor: '#e74c3c', opacity: 0.3 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  alertCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#e74c3c', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 38, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  message: { fontSize: 18, color: '#ff8888', marginTop: 10, textAlign: 'center' },
  ringContainer: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center', marginVertical: 50 },
  ringBg: { ...StyleSheet.absoluteFillObject, borderWidth: 10, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 110 },
  ringProgress: { ...StyleSheet.absoluteFillObject, borderWidth: 10, borderColor: '#fff', borderRadius: 110, borderRightColor: 'transparent', borderBottomColor: 'transparent' },
  countdownNumber: { fontSize: 100, fontWeight: '200', color: '#fff' },
  cancelBtn: { backgroundColor: '#fff', paddingHorizontal: 40, paddingVertical: 20, borderRadius: 30, minWidth: 280 },
  cancelText: { color: '#000', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  sensorBox: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 16, width: width - 60, marginTop: 30 },
  sensorTitle: { color: '#ff9999', fontSize: 14, textAlign: 'center', marginBottom: 10 },
  sensorLine: { color: '#fff', fontSize: 16, marginVertical: 4 },
  cancelledCard: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 40 },
});