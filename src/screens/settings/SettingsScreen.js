// src/screens/settings/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [drivingModeAuto, setDrivingModeAuto] = useState(true);
  const [crashSensitivity, setCrashSensitivity] = useState('medium');
  const [emergencyContacts, setEmergencyContacts] = useState('None set');
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const auto = await AsyncStorage.getItem('@driving_auto');
        const sens = await AsyncStorage.getItem('@crash_sensitivity');
        const vib = await AsyncStorage.getItem('@vibration');
        const snd = await AsyncStorage.getItem('@sound');

        if (auto !== null) setDrivingModeAuto(auto === 'true');
        if (sens !== null) setCrashSensitivity(sens);
        if (vib !== null) setVibrationEnabled(vib === 'true');
        if (snd !== null) setSoundEnabled(snd === 'true');
      } catch (e) {
        console.log('Settings load error:', e);
      }
    };

    loadSettings();
  }, []);

  const saveSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (e) {
      console.log(e);
    }
  };

  const resetAll = () => {
    Alert.alert('Reset All Settings', 'This will restore default values.', [
      { text: 'Cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          setDrivingModeAuto(true);
          setCrashSensitivity('medium');
          setVibrationEnabled(true);
          setSoundEnabled(true);
          await AsyncStorage.multiRemove([
            '@driving_auto',
            '@crash_sensitivity',
            '@vibration',
            '@sound',
          ]);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Settings</Text>

      {/* Auto Driving Mode */}
      <View style={styles.card}>
        <View style={styles.item}>
          <View style={styles.itemLeft}>
            <Icon name="zap" size={24} color="#e74c3c" />
            <View>
              <Text style={styles.itemTitle}>Auto Driving Mode</Text>
              <Text style={styles.itemSub}>Activates when speed ≥ 20 km/h</Text>
            </View>
          </View>
          <Switch
            value={drivingModeAuto}
            onValueChange={(value) => {
              setDrivingModeAuto(value);
              saveSetting('@driving_auto', value);
            }}
            trackColor={{ false: '#ccc', true: '#e74c3c' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Crash Sensitivity */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Crash Detection Sensitivity</Text>
        {['low', 'medium', 'high'].map((level) => (
          <TouchableOpacity
            key={level}
            style={styles.radioItem}
            onPress={() => {
              setCrashSensitivity(level);
              saveSetting('@crash_sensitivity', level);
            }}
          >
            <View style={styles.radioCircle}>
              {crashSensitivity === level && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioText}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Emergency Contacts */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => Alert.alert('Info', 'Emergency contacts feature coming soon!')}
        >
          <View style={styles.itemLeft}>
            <Icon name="phone" size={24} color="#27ae60" />
            <View>
              <Text style={styles.itemTitle}>Emergency Contacts</Text>
              <Text style={styles.itemSub}>{emergencyContacts}</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Sound & Vibration */}
      <View style={styles.card}>
        <View style={styles.item}>
          <View style={styles.itemLeft}>
            <Icon name="bell" size={24} color="#3498db" />
            <Text style={styles.itemTitle}>Sound Alerts</Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={(v) => {
              setSoundEnabled(v);
              saveSetting('@sound', v);
            }}
          />
        </View>

        <View style={styles.item}>
          <View style={styles.itemLeft}>
            <Icon name="smartphone" size={24} color="#9b59b6" />
            <Text style={styles.itemTitle}>Vibration</Text>
          </View>
          <Switch
            value={vibrationEnabled}
            onValueChange={(v) => {
              setVibrationEnabled(v);
              saveSetting('@vibration', v);
            }}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => Linking.openURL('mailto:your-email@gmail.com')}
        >
          <Icon name="mail" size={24} color="#555" />
          <Text style={styles.itemTitle}>Contact Developer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={resetAll}>
          <Icon name="rotate-cw" size={24} color="#e74c3c" />
          <Text style={[styles.itemTitle, { color: '#e74c3c' }]}>Reset All Settings</Text>
        </TouchableOpacity>

        <View style={[styles.item, { borderBottomWidth: 0 }]}>
          <Icon name="heart" size={24} color="#e74c3c" />
          <View>
            <Text style={styles.itemTitle}>RescueLink v1.0</Text>
            <Text style={styles.itemSub}>Made with love in the Philippines</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  itemTitle: { fontSize: 16, color: '#222', fontWeight: '600' },
  itemSub: { fontSize: 13, color: '#888', marginTop: 2 },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e74c3c' },
  radioText: { fontSize: 15.5, color: '#333' },
});