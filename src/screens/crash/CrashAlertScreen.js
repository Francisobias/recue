// src/screens/crash/CrashAlertScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Dimensions,
  Animated,
  Easing,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { 
  collection, 
  addDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../service/firebase';

const { width } = Dimensions.get('window');

export default function CrashAlertScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { severity = 'MODERATE', impactForce = '0.00' } = route.params || {};

  const [countdown, setCountdown] = useState(10);
  const [cancelled, setCancelled] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [userData, setUserData] = useState(null);
  const [sendingAlert, setSendingAlert] = useState(false);

  const scaleValue = useRef(new Animated.Value(1)).current;
  const countdownTimerRef = useRef(null);

  useEffect(() => {
    loadUserData();
    startPulseAnimation();

    return () => {
      Vibration.cancel();
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      scaleValue.stopAnimation();
    };
  }, []);

  const loadUserData = async () => {
    try {
      const keys = ['userId', 'userName', 'userEmail', 'userPhone'];
      const values = await AsyncStorage.multiGet(keys);
      const data = Object.fromEntries(values);

      setUserData({
        userId: data.userId || 'demo_user',
        userName: data.userName || 'RescueLink User',
        userEmail: data.userEmail || 'demo@rescuelink.com',
        userPhone: data.userPhone || 'Not set',
        deviceId: Platform.OS,
      });
    } catch (error) {
      setUserData({
        userId: 'demo_user',
        userName: 'RescueLink User',
        userEmail: 'demo@rescuelink.com',
        userPhone: 'Not set',
        deviceId: Platform.OS,
      });
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
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
    ).start();
  };

  useEffect(() => {
    if (countdown > 0 && !cancelled && !alertSent) {
      Vibration.vibrate([0, 400, 200, 400], false);

      countdownTimerRef.current = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && !cancelled && !alertSent && !sendingAlert) {
      sendAlertToFirebase();
    }
  }, [countdown, cancelled, alertSent, sendingAlert]);

  const sendAlertToFirebase = async () => {
    if (sendingAlert) return;
    setSendingAlert(true);

    try {
      let location = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          location = pos;
        }
      } catch (e) {
        console.log('Location failed:', e);
      }

      const alertData = {
        alertId: `CRASH-${Date.now()}`,
        type: 'CRASH_ALERT',
        userId: userData?.userId || 'unknown',
        userName: userData?.userName || 'Unknown User',
        userEmail: userData?.userEmail || 'No email',
        mobile: userData?.userPhone || 'Not set',
        severity: severity.toUpperCase(),
        impactForce: parseFloat(impactForce),
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
        } : {
          latitude: 0,
          longitude: 0,
          accuracy: 0,
        },
        timestamp: Timestamp.now(),
        status: 'PENDING',
        devicePlatform: Platform.OS,
        countdownExpired: true,
      };

      let success = false;
      try {
        await addDoc(collection(db, 'alerts'), alertData);
        success = true;
        console.log('Crash alert sent to Firebase');
      } catch (error) {
        console.log('Firebase failed:', error);
      }

      await saveLocally(alertData, success);

      setAlertSent(true);
      Alert.alert(
        success ? 'Alert Sent!' : 'Saved Locally',
        success
          ? 'Emergency alert has been sent with your location.'
          : 'No internet. Alert saved and will send when connected.',
        [{ text: 'OK', onPress: goBack }]
      );
    } catch (error) {
      console.error('Send alert error:', error);
      setAlertSent(true);
      Alert.alert('Error', 'Failed to process alert.', [{ text: 'OK', onPress: goBack }]);
    } finally {
      setSendingAlert(false);
    }
  };

  const saveLocally = async (data, sent) => {
    try {
      const key = sent ? '@sent_alerts' : '@pending_alerts';
      const json = await AsyncStorage.getItem(key) || '[]';
      const list = JSON.parse(json);
      list.unshift({
        ...data,
        savedAt: new Date().toISOString(),
        sentToFirebase: sent,
      });
      await AsyncStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
    } catch (e) {
      console.error('Local save failed:', e);
    }
  };

  const handleCancel = () => {
    Vibration.cancel();
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    setCancelled(true);
    setTimeout(goBack, 2000);
  };

  const handleSendNow = () => {
    setCountdown(0); // Trigger immediate send
  };

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  };

  const testConnection = async () => {
    try {
      await addDoc(collection(db, 'test_connections'), {
        test: true,
        timestamp: Timestamp.now(),
      });
      Alert.alert('Connected!', 'Firebase is working.');
    } catch (e) {
      Alert.alert('Offline', 'Cannot reach Firebase.');
    }
  };

  if (cancelled) {
    return (
      <View style={styles.containerWhite}>
        <MaterialIcons name="check-circle" size={100} color="#27ae60" />
        <Text style={styles.cancelTitle}>Alert Cancelled</Text>
        <Text style={styles.cancelSubtitle}>We're glad you're safe!</Text>
      </View>
    );
  }

  if (alertSent) {
    return (
      <View style={styles.containerSuccess}>
        <MaterialIcons name="check-circle" size={100} color="#fff" />
        <Text style={styles.successTitle}>Alert Processed</Text>
        <Text style={styles.successSubtitle}>
          Your emergency alert has been handled.
        </Text>
        <TouchableOpacity style={styles.okButton} onPress={goBack}>
          <Text style={styles.okButtonText}>OK</Text>
        </TouchableOpacity>
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

        <Text style={styles.title}>CRASH DETECTED</Text>
        <Text style={styles.message}>Sending alert in</Text>
        <Text style={styles.countdown}>{countdown}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.cancelButton]} onPress={handleCancel}>
            <MaterialIcons name="close" size={20} color="#000" />
            <Text style={styles.actionBtnText}>CANCEL</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.sosButton]} onPress={handleSendNow}>
            <MaterialIcons name="send" size={20} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>SEND NOW</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>IMPACT DETAILS</Text>
          <Text style={styles.infoText}>Severity: {severity}</Text>
          <Text style={styles.infoText}>Force: {impactForce} G</Text>
          <Text style={styles.infoText}>User: {userData?.userName || 'Loading...'}</Text>
        </View>

        {/* Hidden debug button */}
        <TouchableOpacity
          style={styles.testBtn}
          onLongPress={testConnection}
          delayLongPress={2000}
        >
          <MaterialIcons name="wifi" size={16} color="#3498db" />
          <Text style={styles.testBtnText}>Hold 2s to test connection</Text>
        </TouchableOpacity>

        {sendingAlert && (
          <View style={styles.sendingOverlay}>
            <Text style={styles.sendingText}>Sending alert...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  containerWhite: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 30,
  },
  containerSuccess: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    padding: 30,
  },
  bgPulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e74c3c',
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  alertCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#ffb3b3',
    marginTop: 8,
    textAlign: 'center',
  },
  countdown: {
    fontSize: 96,
    fontWeight: '200',
    color: '#fff',
    marginVertical: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    minWidth: 160,
  },
  cancelButton: { backgroundColor: '#fff' },
  sosButton: { backgroundColor: '#c0392b' },
  actionBtnText: { fontSize: 15, fontWeight: 'bold' },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 16,
    width: width - 60,
    marginTop: 10,
  },
  infoTitle: {
    color: '#ffb3b3',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  testBtnText: {
    color: '#3498db',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  okButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 60,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 30,
  },
  okButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  successSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 26,
    marginHorizontal: 20,
  },
  cancelTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  cancelSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  sendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});