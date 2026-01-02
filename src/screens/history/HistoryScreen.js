// src/screens/history/HistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../service/firebase';

export default function HistoryScreen() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Temporary userId — replace with real auth later
  const userId = 'demo_user';

  const loadAlerts = async (isPullRefresh = false) => {
    if (!isPullRefresh) setLoading(true);
    setRefreshing(isPullRefresh);

    try {
      let allAlerts = [];

      // 1. Try to load from Firebase (no orderBy to avoid index requirement)
      try {
        const alertsQuery = query(
          collection(db, 'alerts'),
          where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(alertsQuery);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          allAlerts.push({
            id: doc.id,
            ...data,
            fromFirebase: true,
            timestamp: data.timestamp?.toDate() || new Date(),
          });
        });
      } catch (firebaseError) {
        console.log('Firebase load failed (possibly offline or no index):', firebaseError.message);
        // Continue — we'll still show local alerts
      }

      // 2. Load local alerts (sent + pending)
      try {
        const keys = ['@sent_alerts', '@pending_alerts'];
        for (const key of keys) {
          const json = await AsyncStorage.getItem(key);
          if (json) {
            const localList = JSON.parse(json);
            localList.forEach((item) => {
              allAlerts.push({
                ...item,
                fromFirebase: false,
                timestamp: new Date(item.savedAt || item.timestamp || Date.now()),
              });
            });
          }
        }
      } catch (localError) {
        console.log('Local storage error:', localError);
      }

      // 3. Deduplicate (prefer Firebase version)
      const seen = new Set();
      const uniqueAlerts = [];
      allAlerts.forEach((alert) => {
        const key = alert.alertId || alert.id || alert.timestamp.getTime();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueAlerts.push(alert);
        }
      });

      // 4. Sort by timestamp (newest first) — manually since we removed orderBy
      uniqueAlerts.sort((a, b) => b.timestamp - a.timestamp);

      setAlerts(uniqueAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const formatTimestamp = (ts) => {
    if (!ts) return 'Unknown time';
    const date = ts instanceof Date ? ts : new Date(ts);
    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' at ' + date.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLocation = (loc) => {
    if (!loc || (!loc.latitude && !loc.longitude)) return 'Unknown Location';
    return `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Responded':
        return { bg: '#2c3e50', text: '#fff' };
      case 'Delivered':
        return { bg: '#7f8c8d', text: '#fff' };
      case 'Cancelled':
        return { bg: '#bdc3c7', text: '#333' };
      case 'Pending':
      case 'Pending Offline':
        return { bg: '#95a5a6', text: '#fff' };
      default:
        return { bg: '#ecf0f1', text: '#333' };
    }
  };

  const getDeliveryInfo = (alert) => {
    if (alert.type === 'Manual SOS') {
      return { icon: 'send', color: '#3498db', text: 'Manual SOS' };
    }
    if (alert.status === 'Cancelled') {
      return { icon: 'x-circle', color: '#95a5a6', text: 'Cancelled by user' };
    }
    if (alert.status?.includes('Offline') || alert.status === 'Pending') {
      return { icon: 'wifi-off', color: '#e67e22', text: 'Pending (Offline)' };
    }
    return { icon: 'check-circle', color: '#27ae60', text: 'Delivered' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
          <Text style={styles.loadingText}>Loading alert history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alert History</Text>
        <Text style={styles.headerSubtitle}>
          {alerts.length} event{alerts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Alert List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAlerts(true)}
            colors={['#e74c3c']}
          />
        }
      >
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="bell-off" size={80} color="#ddd" />
            <Text style={styles.emptyTitle}>No Alerts Yet</Text>
            <Text style={styles.emptyText}>
              Your crash detections and SOS alerts will appear here when triggered.
            </Text>
          </View>
        ) : (
          alerts.map((alert, index) => {
            const statusStyle = getStatusStyle(alert.status || 'Delivered');
            const delivery = getDeliveryInfo(alert);

            return (
              <View key={alert.id || index} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View>
                    <Text style={styles.alertType}>
                      {alert.type === 'CRASH_ALERT' ? 'Crash Detection' : alert.type || 'Alert'}
                    </Text>
                    <Text style={styles.alertId}>
                      A-{String(alerts.length - index).padStart(3, '0')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {alert.status || 'Delivered'}
                    </Text>
                  </View>
                </View>

                <View style={styles.alertDetails}>
                  <View style={styles.detailRow}>
                    <Icon name="clock" size={16} color="#666" />
                    <Text style={styles.detailText}>{formatTimestamp(alert.timestamp)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Icon name="map-pin" size={16} color="#666" />
                    <Text style={styles.detailText}>{formatLocation(alert.location)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Icon name={delivery.icon} size={16} color={delivery.color} />
                    <Text style={[styles.detailText, { color: delivery.color }]}>
                      {delivery.text}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  header: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#222' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },

  listContent: { padding: 16, paddingBottom: 100 },

  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertType: { fontSize: 16, fontWeight: '600', color: '#333' },
  alertId: { fontSize: 13, color: '#95a5a6', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '600' },

  alertDetails: { gap: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailText: { fontSize: 14, color: '#666' },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: { fontSize: 22, fontWeight: '600', color: '#bbb', marginTop: 20 },
  emptyText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});