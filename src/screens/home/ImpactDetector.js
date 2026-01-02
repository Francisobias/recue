import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { map, filter } from 'rxjs/operators';
import { useNavigation } from '@react-navigation/native';

export default function ImpactDetector() {
  const navigation = useNavigation();
  const lastImpactTime = useRef(0);

  useEffect(() => {
    // 100ms sensor update (real-time but battery-safe)
    setUpdateIntervalForType(SensorTypes.accelerometer, 100);

    const subscription = accelerometer
      .pipe(
        // Remove gravity component
        map(({ x, y, z }) => {
          const g = 9.81;
          const total = Math.sqrt(x * x + y * y + z * z);
          return Math.abs(total - g);
        }),

        // Impact threshold (thesis-safe)
        filter(acc => acc > 3.0),

        // Cooldown to prevent spam
        filter(() => {
          const now = Date.now();
          if (now - lastImpactTime.current > 5000) {
            lastImpactTime.current = now;
            return true;
          }
          return false;
        })
      )
      .subscribe(accValue => {
        navigation.navigate('CrashAlert', {
          severity: accValue > 4.5 ? 'HIGH' : 'MEDIUM',
          impactForce: accValue.toFixed(2),
        });
      });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Impact Monitoring Active</Text>
      <Text style={styles.subtitle}>Device sensors are monitoring motion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#eef2f7',
    borderRadius: 16,
    margin: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 13,
    color: '#555',
    marginTop: 6,
  },
});
