// src/screens/home/ImpactDetector.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { map, filter } from 'rxjs/operators';

export default function ImpactDetector() {
  const [impactDetected, setImpactDetected] = useState(false);

  useEffect(() => {
    // Set accelerometer update interval (ms)
    setUpdateIntervalForType(SensorTypes.accelerometer, 100); // 0.1 sec

    const subscription = accelerometer
      .pipe(
        map(({ x, y, z }) => Math.sqrt(x * x + y * y + z * z)), // Calculate total acceleration
        filter((acceleration) => acceleration > 25) // Threshold for impact (you can adjust)
      )
      .subscribe(() => {
        setImpactDetected(true);
        Alert.alert('Impact Detected!', 'A possible crash has been detected.');
        // TODO: trigger SOS or save event
      });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Impact Detector</Text>
      <Text style={styles.status}>
        {impactDetected ? 'Impact Detected!' : 'Monitoring...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  status: { fontSize: 16, color: '#333' },
});
