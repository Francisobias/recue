import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export default function HomeScreen({ onNavigate }) {
  const [drivingMode, setDrivingMode] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [sosPing] = useState(new Animated.Value(0));

  // SOS ping animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sosPing, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(sosPing, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleEmergencyPress = () => {
    alert('Emergency Request Triggered!');
    // TODO: Trigger actual SOS logic or API call
  };

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>RescueLink</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* System Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>System Status</Text>

          <View style={styles.statusItem}>
            <View style={styles.statusLabel}>
              <Icon name="shield" size={20} color="#333" />
              <Text style={styles.statusText}>Crash Detection</Text>
            </View>
            <View style={styles.statusValue}>
              <Text style={styles.statusValueText}>ON</Text>
            </View>
          </View>

          <View style={styles.statusItem}>
            <View style={styles.statusLabel}>
              <Icon name="wifi" size={20} color="#333" />
              <Text style={styles.statusText}>BLE Mesh</Text>
            </View>
            <View style={styles.statusValue}>
              <Text style={styles.statusValueText}>Connected</Text>
            </View>
          </View>
        </View>

        {/* SOS Button */}
        <View style={styles.sosContainer}>
          <Animated.View
            style={[
              styles.pingCircle,
              { opacity: sosPing.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] }) },
            ]}
          />
          <TouchableOpacity style={styles.sosButton} onPress={handleEmergencyPress}>
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosSubText}>Long press to send alert</Text>
          </TouchableOpacity>
          <Text style={styles.sosNote}>
            Hold for 3 seconds to trigger manual emergency alert
          </Text>
        </View>

        {/* Driving Mode */}
        <View style={styles.drivingModeCard}>
          <View>
            <Text style={styles.drivingLabel}>Driving Mode</Text>
            <Text style={styles.drivingDesc}>Auto-detect crashes while driving</Text>
          </View>
          <Switch
            value={drivingMode}
            onValueChange={setDrivingMode}
            trackColor={{ false: '#ccc', true: '#333' }}
            thumbColor="#fff"
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { name: 'home', label: 'Home', icon: 'home' },
          { name: 'history', label: 'History', icon: 'clock' },
          { name: 'map', label: 'Map', icon: 'map-pin' },
          { name: 'settings', label: 'Settings', icon: 'settings' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.navItem}
            onPress={() => handleTabPress(tab.name)}
          >
            <Icon name={tab.icon} size={24} color={activeTab === tab.name ? '#333' : '#999'} />
            <Text style={[styles.navText, activeTab !== tab.name && styles.navTextInactive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ccc', padding: 16 },
  headerText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  content: { padding: 16 },
  statusCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statusTitle: { fontSize: 14, color: '#666', marginBottom: 12 },
  statusItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 14, color: '#333' },
  statusValue: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#333', borderRadius: 12 },
  statusValueText: { color: '#fff', fontSize: 12 },
  sosContainer: { alignItems: 'center', marginBottom: 24 },
  pingCircle: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#333' },
  sosButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  sosSubText: { color: '#fff', fontSize: 12, textAlign: 'center' },
  sosNote: { textAlign: 'center', marginTop: 8, fontSize: 12, color: '#666' },
  drivingModeCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drivingLabel: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  drivingDesc: { fontSize: 12, color: '#666' },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, color: '#333', marginTop: 2 },
  navTextInactive: { fontSize: 10, color: '#999', marginTop: 2 },
});
