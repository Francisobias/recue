// src/components/NetworkStatus.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/Feather';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState('wifi');
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? false;
      const type = state.type || 'unknown';

      setIsOnline(online);
      setConnectionType(type);

      // Animation kapag nagbago ang status
      Animated.timing(fadeAnim, {
        toValue: online ? 0 : 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });

    // Initial check
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected ?? true);
      setConnectionType(state.type || 'unknown');
    });

    return () => unsubscribe();
  }, []);

  // Kung online → walang lalabas
  if (isOnline) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Icon name="wifi-off" size={18} color="#fff" />
      <Text style={styles.text}>OFFLINE MODE</Text>
      <Text style={styles.subText}>
        {connectionType === 'cellular' ? 'Weak mobile data' : 'No internet connection'}
      </Text>
      <View style={styles.reconnect}>
        <Text style={styles.reconnectText}>Trying to reconnect...</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#c0392b',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 6,
  },
  subText: {
    color: '#ffcccc',
    fontSize: 13,
    marginTop: 4,
  },
  reconnect: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reconnectText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    marginLeft: 6,
  },
});