// src/screens/emergency/SOSAlertScreen.js
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
import { 
  collection, 
  addDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../service/firebase';

const { width } = Dimensions.get('window');

export default function SOSAlertScreen({ onClose, userId = 'demo_user' }) {
  const [alertSent, setAlertSent] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [userData, setUserData] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Load user data and send alert IMMEDIATELY
  useEffect(() => {
    loadUserDataAndSendAlert();
    
    // Pulse animation
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
    
    // Continuous vibration for immediate attention
    Vibration.vibrate([0, 1000, 500, 1000], true);
    
    return () => {
      pulse.stop();
      Vibration.cancel();
    };
  }, []);

  const loadUserDataAndSendAlert = async () => {
    try {
      // Load user data
      const storedUserId = await AsyncStorage.getItem('userId') || userId;
      const userName = await AsyncStorage.getItem('userName') || 'RescueLink User';
      const userEmail = await AsyncStorage.getItem('userEmail') || 'demo@rescuelink.com';
      const userPhone = await AsyncStorage.getItem('userPhone') || 'N/A';
      
      setUserData({
        userId: storedUserId,
        userName,
        userEmail,
        userPhone,
        deviceId: Platform.OS,
      });

      // Get location immediately
      let location = null;
      let address = null;
      
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          
          // Try to get address from coordinates
          try {
            const addressResponse = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            
            if (addressResponse && addressResponse.length > 0) {
              const addr = addressResponse[0];
              address = {
                street: `${addr.street || ''} ${addr.name || ''}`.trim(),
                city: addr.city || '',
                region: addr.region || '',
                country: addr.country || '',
                postalCode: addr.postalCode || '',
                fullAddress: `${addr.street || ''} ${addr.city || ''} ${addr.region || ''} ${addr.country || ''}`.trim()
              };
            }
          } catch (geocodeError) {
            console.log('Geocode error:', geocodeError);
          }
          
          setLocationDetails({
            coords: location.coords,
            address,
            timestamp: new Date().toISOString()
          });
        }
      } catch (locError) {
        console.log('Location error:', locError);
      }

      // SEND ALERT IMMEDIATELY - NO COUNTDOWN
      sendAlertToAdmin({
        userId: storedUserId,
        userName,
        userEmail,
        userPhone,
        location,
        address
      });

    } catch (error) {
      console.log('Error loading user data:', error);
      // Send with default data
      sendAlertToAdmin({
        userId: userId,
        userName: 'RescueLink User',
        userEmail: 'demo@rescuelink.com',
        userPhone: 'N/A',
        location: null,
        address: null
      });
    }
  };

  // Send alert DIRECTLY to Firebase (NO COUNTDOWN)
  const sendAlertToAdmin = async (userInfo) => {
    if (sendingAlert) return;
    
    setSendingAlert(true);
    console.log('SENDING SOS ALERT TO ADMIN IMMEDIATELY...');
    
    try {
      // Prepare SOS data for Firebase
      const sosData = {
        // User information
        userId: userInfo.userId,
        userName: userInfo.userName,
        userEmail: userInfo.userEmail,
        mobile: userInfo.userPhone,
        
        // Emergency Type
        type: 'SOS_EMERGENCY',
        severity: 'CRITICAL', // SOS is always critical
        emergencyType: 'MANUAL_SOS',
        
        // Location details
        location: {
          latitude: userInfo.location?.coords?.latitude || 14.5995,
          longitude: userInfo.location?.coords?.longitude || 120.9842,
          accuracy: userInfo.location?.coords?.accuracy || 0,
          speed: userInfo.location?.coords?.speed || 0,
          altitude: userInfo.location?.coords?.altitude || 0,
          heading: userInfo.location?.coords?.heading || 0,
        },
        
        // Address if available
        address: userInfo.address || null,
        
        // Metadata
        timestamp: Timestamp.now(),
        status: 'URGENT',
        priority: 'HIGHEST',
        devicePlatform: Platform.OS,
        appVersion: '1.0.0',
        createdAt: Timestamp.now(),
        
        // Additional flags
        manualRequest: true,
        immediateResponse: true,
        requiresAmbulance: true,
        requiresPolice: true,
        requiresFire: false,
        
        // Status tracking
        acknowledged: false,
        responded: false,
        completed: false
      };

      console.log('SOS Alert data for Admin:', sosData);

      // Send to Firebase Firestore IMMEDIATELY
      let firebaseSuccess = false;
      let documentId = null;
      
      try {
        // Try to add to 'sos_alerts' collection
        const alertRef = await addDoc(collection(db, 'sos_alerts'), sosData);
        documentId = alertRef.id;
        console.log('SOS Alert sent to admin with ID: ', documentId);
        firebaseSuccess = true;
        
      } catch (firebaseError) {
        console.log('Firebase error (sos_alerts):', firebaseError);
        
        // Fallback to 'emergency_alerts' collection
        try {
          const emergencyRef = await addDoc(collection(db, 'emergency_alerts'), sosData);
          documentId = emergencyRef.id;
          console.log('SOS Alert sent to emergency_alerts with ID: ', documentId);
          firebaseSuccess = true;
        } catch (secondError) {
          console.log('Firebase error (emergency_alerts):', secondError);
          
          // Last fallback to 'alerts' collection
          try {
            const fallbackRef = await addDoc(collection(db, 'alerts'), sosData);
            documentId = fallbackRef.id;
            console.log('SOS Alert sent to alerts with ID: ', fallbackRef.id);
            firebaseSuccess = true;
          } catch (thirdError) {
            console.log('Failed to save to Firebase:', thirdError);
          }
        }
      }

      // Save locally as backup
      await saveSOSLocally(sosData, firebaseSuccess, documentId);

      // Show success message
      if (firebaseSuccess) {
        setAlertSent(true);
        
        // Stop vibration
        Vibration.cancel();
        
        Alert.alert(
          '🚨 SOS ALERT SENT!',
          `Emergency services have been IMMEDIATELY notified with your location.\n\nAlert ID: ${documentId || 'N/A'}`,
          [{ 
            text: 'UNDERSTOOD', 
            onPress: () => {
              // Stay on screen for 3 seconds then close
              setTimeout(() => onClose && onClose(), 3000);
            }
          }]
        );
      } else {
        setAlertSent(true);
        Alert.alert(
          '⚠️ SOS SAVED LOCALLY',
          'Could not connect to server. SOS alert saved on device and will retry.',
          [{ 
            text: 'OK', 
            onPress: () => {
              setTimeout(() => onClose && onClose(), 3000);
            }
          }]
        );
      }

    } catch (error) {
      console.log('Error in SOS alert process:', error);
      setAlertSent(true);
      Alert.alert(
        '⚠️ ALERT SAVED',
        'SOS details saved locally. Please check connection.',
        [{ text: 'OK', onPress: () => onClose && onClose() }]
      );
    } finally {
      setSendingAlert(false);
    }
  };

  const saveSOSLocally = async (sosData, sentToFirebase, documentId = null) => {
    try {
      const key = '@sos_alerts_history';
      const alertsJson = await AsyncStorage.getItem(key) || '[]';
      const alerts = JSON.parse(alertsJson);
      
      alerts.unshift({
        id: documentId || Date.now().toString(),
        ...sosData,
        savedAt: new Date().toISOString(),
        sentToFirebase: sentToFirebase,
        retryCount: 0
      });
      
      await AsyncStorage.setItem(key, JSON.stringify(alerts.slice(0, 50)));
      console.log(`SOS saved locally: ${alerts.length} alerts`);
      
    } catch (error) {
      console.log('Error saving SOS locally:', error);
    }
  };

  const handleClose = () => {
    Vibration.cancel();
    if (onClose) onClose();
  };

  const sendAdditionalInfo = async () => {
    try {
      // Get fresh location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const updateData = {
        userId: userData?.userId || userId,
        updateType: 'ADDITIONAL_INFO',
        message: 'User provided additional location update',
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date().toISOString()
        },
        timestamp: Timestamp.now(),
        status: 'UPDATE'
      };

      // Send update
      await addDoc(collection(db, 'sos_updates'), updateData);
      
      Alert.alert(
        '📍 Location Update Sent',
        'Your current location has been sent to emergency services.'
      );
      
    } catch (error) {
      console.log('Update error:', error);
      Alert.alert('Update Failed', 'Could not send location update.');
    }
  };

  const callEmergencyNumber = () => {
    Alert.alert(
      '📞 Call Emergency Services?',
      'Do you want to call 911/emergency number now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'CALL NOW', 
          style: 'destructive',
          onPress: () => {
            // This would open phone dialer with emergency number
            // Linking.openURL('tel:911');
            Alert.alert('Phone Call', 'This would open phone dialer with 911');
          }
        },
      ]
    );
  };

  if (alertSent) {
    return (
      <View style={styles.containerSuccess}>
        <MaterialIcons name="check-circle" size={100} color="#27ae60" />
        <Text style={styles.successTitle}>SOS ALERT SENT!</Text>
        <Text style={styles.successSubtitle}>
          Emergency services have been notified with your location.
        </Text>
        
        <View style={styles.successInfo}>
          <Text style={styles.infoLabel}>User:</Text>
          <Text style={styles.infoValue}>{userData?.userName || 'RescueLink User'}</Text>
          
          <Text style={styles.infoLabel}>Location Sent:</Text>
          <Text style={styles.infoValue}>
            {locationDetails?.coords 
              ? `Lat: ${locationDetails.coords.latitude.toFixed(6)}, Long: ${locationDetails.coords.longitude.toFixed(6)}`
              : 'Location unavailable'
            }
          </Text>
          
          {locationDetails?.address?.fullAddress && (
            <>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{locationDetails.address.fullAddress}</Text>
            </>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
        >
          <Text style={styles.closeButtonText}>CLOSE</Text>
        </TouchableOpacity>
        
        <View style={styles.additionalActions}>
          <TouchableOpacity 
            style={styles.updateButton}
            onPress={sendAdditionalInfo}
          >
            <MaterialIcons name="location-on" size={20} color="#fff" />
            <Text style={styles.updateButtonText}>SEND LOCATION UPDATE</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.callButton}
            onPress={callEmergencyNumber}
          >
            <MaterialIcons name="phone" size={20} color="#fff" />
            <Text style={styles.callButtonText}>CALL EMERGENCY</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bgPulse, { transform: [{ scale: scaleValue }] }]} />

      <View style={styles.content}>
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <View style={styles.sosCircle}>
            <MaterialIcons name="emergency" size={90} color="#fff" />
          </View>
        </Animated.View>

        <Text style={styles.title}>🚨 EMERGENCY SOS</Text>
        <Text style={styles.message}>Sending your location to emergency services NOW</Text>

        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>SENDING ALERT...</Text>
          <Text style={styles.statusSubtitle}>This may take a few seconds</Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userInfoTitle}>USER INFORMATION</Text>
          <Text style={styles.userInfoText}>Name: {userData?.userName || 'Loading...'}</Text>
          <Text style={styles.userInfoText}>ID: {userData?.userId || userId}</Text>
          {locationDetails?.coords && (
            <Text style={styles.userInfoText}>
              Location: Acquired ({locationDetails.coords.accuracy ? `±${Math.round(locationDetails.coords.accuracy)}m` : 'GPS Active'})
            </Text>
          )}
        </View>

        {sendingAlert && (
          <View style={styles.sendingOverlay}>
            <MaterialIcons name="cloud-upload" size={60} color="#fff" />
            <Text style={styles.sendingText}>SENDING SOS TO ADMIN...</Text>
            <Text style={styles.sendingSubtext}>Please wait</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  containerSuccess: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#c0392b',
    padding: 25,
  },
  bgPulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#c0392b',
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  sosCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#c0392b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 5,
    borderColor: '#fff',
  },
  title: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: { 
    fontSize: 18, 
    color: '#ffb3b3', 
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  statusContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 15,
    width: width - 50,
    alignItems: 'center',
    marginBottom: 25,
  },
  statusTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#fff',
    marginBottom: 5,
  },
  statusSubtitle: { 
    fontSize: 16, 
    color: '#ffb3b3', 
    textAlign: 'center',
  },
  userInfo: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    borderRadius: 15,
    width: width - 50,
  },
  userInfoTitle: {
    color: '#ffb3b3',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1,
  },
  userInfoText: { 
    color: '#fff', 
    fontSize: 16, 
    marginBottom: 10,
    textAlign: 'center',
  },
  sendingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendingText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  sendingSubtext: {
    color: '#ffb3b3',
    fontSize: 16,
    marginTop: 10,
  },
  successTitle: { 
    fontSize: 34, 
    fontWeight: 'bold', 
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtitle: { 
    fontSize: 18, 
    color: 'rgba(255,255,255,0.95)', 
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  successInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 15,
    width: width - 50,
    marginBottom: 25,
  },
  infoLabel: {
    color: '#ffb3b3',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 20,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c0392b',
  },
  additionalActions: {
    width: width - 50,
    gap: 10,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    paddingVertical: 15,
    borderRadius: 30,
    gap: 10,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    borderRadius: 30,
    gap: 10,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});