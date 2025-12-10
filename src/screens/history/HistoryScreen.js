// src/screens/history/HistoryScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';

const STORAGE_KEY = '@rescuelink_trip_history';

export default function HistoryScreen() {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    const initializeHistory = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!saved) {
          // FIRST TIME: maglalagay ng dummy data
          const dummyTrips = [
            {
              id: '1',
              startTime: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
              endTime: new Date(Date.now() - 172800000 + 5400000).toISOString(),
              maxSpeed: 102,
              avgSpeed: 64,
              distance: 48.7,
              impactDetected: false,
            },
            {
              id: '2',
              startTime: new Date(Date.now() - 86400000).toISOString(), // yesterday
              endTime: new Date(Date.now() - 86400000 + 3600000).toISOString(),
              maxSpeed: 88,
              avgSpeed: 41,           // ← FIXED NA! Walang colon
              distance: 21.3,
              impactDetected: true,
              impactTime: '15:27:43',
            },
            {
              id: '3',
              startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
              endTime: new Date().toISOString(),
              maxSpeed: 67,
              avgSpeed: 38,
              distance: 9.8,
              impactDetected: false,
            },
          ];

          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dummyTrips));
          setTrips(dummyTrips.reverse()); // newest first
        } else {
          setTrips(JSON.parse(saved).reverse());
        }
      } catch (e) {
        console.log('Error:', e);
      }
    };

    initializeHistory();
  }, []);

  const clearHistory = () => {
    Alert.alert('Clear History', 'Delete all trips?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setTrips([]);
        },
      },
    ]);
  };

  const renderTrip = ({ item }) => {
    const duration = Math.round((new Date(item.endTime) - new Date(item.startTime)) / 60000);
    const hasImpact = item.impactDetected;

    return (
      <View style={[styles.card, hasImpact && styles.impactCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.row}>
            <Icon name="calendar" size={18} color="#555" />
            <Text style={styles.date}>
              {new Date(item.startTime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            {hasImpact && (
              <View style={styles.impactBadge}>
                <Text style={styles.impactText}>IMPACT</Text>
              </View>
            )}
          </View>

          <View style={styles.row}>
            <Icon name="clock" size={16} color="#666" />
            <Text style={styles.time}>
              {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
              {new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' • '}
              {duration} min
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Top Speed</Text>
              <Text style={styles.statValue}>{item.maxSpeed} <Text style={styles.unit}>km/h</Text></Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>{item.avgSpeed} <Text style={styles.unit}>km/h</Text></Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{item.distance.toFixed(1)} <Text style={styles.unit}>km</Text></Text>
            </View>
          </View>

          {hasImpact && (
            <View style={styles.impactWarning}>
              <Icon name="alert-triangle" size={20} color="#e74c3c" />
              <Text style={styles.impactWarningText}>
                Possible collision at {item.impactTime}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
        {trips.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Icon name="trash-2" size={24} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </View>

      {trips.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="activity" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No trips yet</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderTrip}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#222' },

  card: {
    backgroundColor: '#fff',
    marginBottom: 14,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  impactCard: { borderLeftWidth: 6, borderLeftColor: '#e74c3c' },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  date: { fontSize: 16, fontWeight: '600', color: '#333' },
  time: { fontSize: 14, color: '#666' },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  stat: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#888' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#222', marginTop: 4 },
  unit: { fontSize: 12, color: '#666' },

  impactBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  impactText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  impactWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  impactWarningText: { color: '#e74c3c', fontWeight: '600', fontSize: 13 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#aaa', marginTop: 16 },
});