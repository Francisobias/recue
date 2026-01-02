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
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
  AppState,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';

export default function SettingsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  
  // User info
  const userId = route?.params?.userId || 'guest_user';
  
  // Settings states
  const [drivingModeAuto, setDrivingModeAuto] = useState(true);
  const [crashSensitivity, setCrashSensitivity] = useState('medium');
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [backgroundModeEnabled, setBackgroundModeEnabled] = useState(true);
  const [locationUpdatesInterval, setLocationUpdatesInterval] = useState('normal');
  const [autoSOSEnabled, setAutoSOSEnabled] = useState(false);
  const [biometricLockEnabled, setBiometricLockEnabled] = useState(false);
  
  // App info
  const [appVersion] = useState('1.2.0');
  const [lastSync, setLastSync] = useState(null);
  const [storageUsage, setStorageUsage] = useState(0);
  
  // Emergency contacts modal
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Sensitivity thresholds based on setting
  const sensitivityThresholds = {
    low: { moderate: 2.5, severe: 4.0 },
    medium: { moderate: 2.0, severe: 3.5 },
    high: { moderate: 1.5, severe: 2.8 }
  };

  // Load all settings
  useEffect(() => {
    loadAllSettings();
    loadEmergencyContacts();
    checkBiometricSupport();
  }, []);

  // Check biometric support
  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        setBiometricLockEnabled(false);
        await AsyncStorage.setItem('@biometric_lock', 'false');
      }
    } catch (error) {
      console.log('Biometric check error:', error);
    }
  };

  // Load all settings
  const loadAllSettings = async () => {
    try {
      setIsLoading(true);
      
      const settings = await AsyncStorage.multiGet([
        '@driving_auto',
        '@crash_sensitivity',
        '@vibration',
        '@sound',
        '@notifications',
        '@background_mode',
        '@location_interval',
        '@auto_sos',
        '@biometric_lock',
        '@last_sync',
      ]);

      settings.forEach(([key, value]) => {
        if (value !== null) {
          switch (key) {
            case '@driving_auto':
              setDrivingModeAuto(value === 'true');
              break;
            case '@crash_sensitivity':
              setCrashSensitivity(value);
              break;
            case '@vibration':
              setVibrationEnabled(value === 'true');
              break;
            case '@sound':
              setSoundEnabled(value === 'true');
              break;
            case '@notifications':
              setNotificationsEnabled(value === 'true');
              break;
            case '@background_mode':
              setBackgroundModeEnabled(value === 'true');
              break;
            case '@location_interval':
              setLocationUpdatesInterval(value);
              break;
            case '@auto_sos':
              setAutoSOSEnabled(value === 'true');
              break;
            case '@biometric_lock':
              setBiometricLockEnabled(value === 'true');
              break;
            case '@last_sync':
              setLastSync(value);
              break;
          }
        }
      });

      // Calculate storage usage
      await calculateStorageUsage();
      
    } catch (error) {
      console.log('Settings load error:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate storage usage
  const calculateStorageUsage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const totalKeys = keys.length;
      setStorageUsage(Math.min(totalKeys * 0.5, 100)); // Simplified calculation
    } catch (error) {
      console.log('Storage calc error:', error);
    }
  };

  // Load emergency contacts
  const loadEmergencyContacts = async () => {
    try {
      const contactsJson = await AsyncStorage.getItem('@emergency_contacts');
      if (contactsJson) {
        setEmergencyContacts(JSON.parse(contactsJson));
      }
    } catch (error) {
      console.log('Contacts load error:', error);
    }
  };

  // Save setting
  const saveSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
      console.log(`Setting saved: ${key} = ${value}`);
    } catch (error) {
      console.log('Save error:', error);
      Alert.alert('Error', 'Failed to save setting');
    }
  };

  // Emergency Contacts Modal Functions
  const addEmergencyContact = async () => {
    if (!newContactName.trim() || !newContactNumber.trim()) {
      Alert.alert('Error', 'Please enter both name and number');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    if (!phoneRegex.test(newContactNumber.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    const newContact = {
      id: Date.now().toString(),
      name: newContactName.trim(),
      number: newContactNumber.trim(),
      dateAdded: new Date().toISOString(),
    };

    try {
      const updatedContacts = [...emergencyContacts, newContact];
      setEmergencyContacts(updatedContacts);
      await AsyncStorage.setItem('@emergency_contacts', JSON.stringify(updatedContacts));
      
      setNewContactName('');
      setNewContactNumber('');
      Alert.alert('Success', 'Emergency contact added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add contact');
    }
  };

  const removeEmergencyContact = (id) => {
    Alert.alert(
      'Remove Contact',
      'Remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedContacts = emergencyContacts.filter(contact => contact.id !== id);
              setEmergencyContacts(updatedContacts);
              await AsyncStorage.setItem('@emergency_contacts', JSON.stringify(updatedContacts));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove contact');
            }
          },
        },
      ]
    );
  };

  const testEmergencyCall = (contact) => {
    Alert.alert(
      `Test Call to ${contact.name}`,
      `This will attempt to call ${contact.number}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test Call',
          onPress: () => {
            const phoneNumber = `tel:${contact.number.replace(/[^0-9+]/g, '')}`;
            Linking.openURL(phoneNumber).catch(() => {
              Alert.alert('Error', 'Cannot make phone call from this device');
            });
          },
        },
      ]
    );
  };

  // Clear all trip data
  const clearTripData = () => {
    Alert.alert(
      'Clear All Trip Data',
      'This will delete ALL recorded trips and history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                '@trip_history',
                '@current_trip',
                '@last_crash_event',
                '@last_sos_event',
              ]);
              Alert.alert('Success', 'All trip data cleared');
              await calculateStorageUsage();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  // Export trip data
  const exportTripData = async () => {
    try {
      const tripsJson = await AsyncStorage.getItem('@trip_history');
      const trips = tripsJson ? JSON.parse(tripsJson) : [];
      
      if (trips.length === 0) {
        Alert.alert('No Data', 'No trip data to export');
        return;
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        userId: userId,
        totalTrips: trips.length,
        trips: trips,
      };

      const exportString = JSON.stringify(exportData, null, 2);
      
      // Create shareable content
      await Share.share({
        title: 'RescueLink Trip Data Export',
        message: `RescueLink Trip History (${trips.length} trips)\n\n${exportString.substring(0, 1000)}...`,
      });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  // Request app review
  const requestReview = () => {
    Alert.alert(
      'Enjoying RescueLink?',
      'Please consider rating our app to help others discover it!',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Rate App',
          onPress: () => {
            const storeUrl = Platform.OS === 'ios' 
              ? 'https://apps.apple.com/app/idYOUR_APP_ID' 
              : 'market://details?id=com.rescuelink.app';
            
            Linking.openURL(storeUrl).catch(() => {
              Alert.alert('Error', 'Could not open app store');
            });
          },
        },
      ]
    );
  };

  // Reset all settings
  const resetAllSettings = () => {
    Alert.alert(
      'Reset All Settings',
      'Restore all settings to default values? This will not delete your trip data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Reset state
              setDrivingModeAuto(true);
              setCrashSensitivity('medium');
              setVibrationEnabled(true);
              setSoundEnabled(true);
              setNotificationsEnabled(true);
              setBackgroundModeEnabled(true);
              setLocationUpdatesInterval('normal');
              setAutoSOSEnabled(false);
              setBiometricLockEnabled(false);
              
              // Save defaults
              await AsyncStorage.multiSet([
                ['@driving_auto', 'true'],
                ['@crash_sensitivity', 'medium'],
                ['@vibration', 'true'],
                ['@sound', 'true'],
                ['@notifications', 'true'],
                ['@background_mode', 'true'],
                ['@location_interval', 'normal'],
                ['@auto_sos', 'false'],
                ['@biometric_lock', 'false'],
              ]);
              
              Alert.alert('Success', 'Settings reset to defaults');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ]
    );
  };

  // Get interval description
  const getIntervalDescription = (interval) => {
    switch (interval) {
      case 'battery_saver': return 'Every 30 seconds';
      case 'normal': return 'Every 10 seconds';
      case 'high_accuracy': return 'Every 3 seconds';
      default: return 'Every 10 seconds';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>User: {userId.substring(0, 8)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={() => {
            const now = new Date().toISOString();
            setLastSync(now);
            saveSetting('@last_sync', now);
            Alert.alert('Synced', 'Settings synchronized');
          }}
        >
          <Icon name="refresh-cw" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* DRIVING SETTINGS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driving Settings</Text>
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="zap" size={22} color="#e74c3c" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Auto Driving Mode</Text>
                <Text style={styles.settingDescription}>
                  Automatically activates when speed reaches 20 km/h
                </Text>
              </View>
            </View>
            <Switch
              value={drivingModeAuto}
              onValueChange={(value) => {
                setDrivingModeAuto(value);
                saveSetting('@driving_auto', value);
              }}
              trackColor={{ false: '#ddd', true: '#e74c3c' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="activity" size={22} color="#3498db" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Crash Detection</Text>
                <Text style={styles.settingDescription}>
                  Sensitivity: {crashSensitivity.toUpperCase()}
                  {'\n'}Thresholds: {sensitivityThresholds[crashSensitivity].moderate}G (moderate), {sensitivityThresholds[crashSensitivity].severe}G (severe)
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.valueButton}
              onPress={() => {
                Alert.alert(
                  'Crash Sensitivity',
                  'Select detection sensitivity level:',
                  ['low', 'medium', 'high'].map(level => ({
                    text: level.toUpperCase(),
                    onPress: () => {
                      setCrashSensitivity(level);
                      saveSetting('@crash_sensitivity', level);
                    },
                    style: crashSensitivity === level ? 'default' : 'cancel'
                  }))
                );
              }}
            >
              <Text style={styles.valueText}>{crashSensitivity.toUpperCase()}</Text>
              <Icon name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="navigation" size={22} color="#27ae60" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Location Updates</Text>
                <Text style={styles.settingDescription}>
                  {getIntervalDescription(locationUpdatesInterval)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.valueButton}
              onPress={() => {
                Alert.alert(
                  'Update Interval',
                  'How often to update location:',
                  [
                    { label: 'Battery Saver (30s)', value: 'battery_saver' },
                    { label: 'Normal (10s)', value: 'normal' },
                    { label: 'High Accuracy (3s)', value: 'high_accuracy' },
                  ].map(item => ({
                    text: item.label,
                    onPress: () => {
                      setLocationUpdatesInterval(item.value);
                      saveSetting('@location_interval', item.value);
                    },
                  }))
                );
              }}
            >
              <Text style={styles.valueText}>
                {locationUpdatesInterval === 'battery_saver' ? 'Battery Saver' :
                 locationUpdatesInterval === 'high_accuracy' ? 'High Accuracy' : 'Normal'}
              </Text>
              <Icon name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* EMERGENCY SETTINGS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Settings</Text>
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowContactsModal(true)}
          >
            <View style={styles.settingInfo}>
              <Icon name="users" size={22} color="#e74c3c" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Emergency Contacts</Text>
                <Text style={styles.settingDescription}>
                  {emergencyContacts.length === 0 
                    ? 'No contacts set' 
                    : `${emergencyContacts.length} contact(s) configured`}
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="shield" size={22} color="#9b59b6" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Auto-SOS</Text>
                <Text style={styles.settingDescription}>
                  Automatically send SOS after crash detection
                </Text>
              </View>
            </View>
            <Switch
              value={autoSOSEnabled}
              onValueChange={async (value) => {
                if (value) {
                  Alert.alert(
                    'Auto-SOS Warning',
                    'This will automatically send SOS alerts to emergency contacts after crash detection. Are you sure?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Enable',
                        onPress: () => {
                          setAutoSOSEnabled(true);
                          saveSetting('@auto_sos', true);
                        },
                      },
                    ]
                  );
                } else {
                  setAutoSOSEnabled(false);
                  saveSetting('@auto_sos', false);
                }
              }}
              trackColor={{ false: '#ddd', true: '#9b59b6' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      {/* NOTIFICATION SETTINGS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications & Alerts</Text>
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="bell" size={22} color="#3498db" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive app notifications
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => {
                setNotificationsEnabled(value);
                saveSetting('@notifications', value);
              }}
              trackColor={{ false: '#ddd', true: '#3498db' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="volume-2" size={22} color="#2ecc71" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Sound Alerts</Text>
                <Text style={styles.settingDescription}>
                  Play sounds for alerts
                </Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={(value) => {
                setSoundEnabled(value);
                saveSetting('@sound', value);
              }}
              trackColor={{ false: '#ddd', true: '#2ecc71' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="smartphone" size={22} color="#f39c12" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Vibration Alerts</Text>
                <Text style={styles.settingDescription}>
                  Vibrate for alerts
                </Text>
              </View>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={(value) => {
                setVibrationEnabled(value);
                saveSetting('@vibration', value);
              }}
              trackColor={{ false: '#ddd', true: '#f39c12' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      {/* APP SETTINGS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="smartphone" size={22} color="#34495e" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Background Mode</Text>
                <Text style={styles.settingDescription}>
                  Continue monitoring in background
                </Text>
              </View>
            </View>
            <Switch
              value={backgroundModeEnabled}
              onValueChange={(value) => {
                setBackgroundModeEnabled(value);
                saveSetting('@background_mode', value);
              }}
              trackColor={{ false: '#ddd', true: '#34495e' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="lock" size={22} color="#8e44ad" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Biometric Lock</Text>
                <Text style={styles.settingDescription}>
                  Require fingerprint/face to open app
                </Text>
              </View>
            </View>
            <Switch
              value={biometricLockEnabled}
              onValueChange={async (value) => {
                if (value) {
                  try {
                    const result = await LocalAuthentication.authenticateAsync({
                      promptMessage: 'Authenticate to enable biometric lock',
                      fallbackLabel: 'Use passcode',
                    });
                    
                    if (result.success) {
                      setBiometricLockEnabled(true);
                      saveSetting('@biometric_lock', true);
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Biometric authentication failed');
                  }
                } else {
                  setBiometricLockEnabled(false);
                  saveSetting('@biometric_lock', false);
                }
              }}
              trackColor={{ false: '#ddd', true: '#8e44ad' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      {/* DATA MANAGEMENT */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionItem} onPress={exportTripData}>
            <Icon name="download" size={22} color="#3498db" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Export Trip Data</Text>
              <Text style={styles.actionDescription}>Share trip history as JSON</Text>
            </View>
            <Icon name="external-link" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={clearTripData}>
            <Icon name="trash-2" size={22} color="#e74c3c" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Clear All Trip Data</Text>
              <Text style={styles.actionDescription}>Delete all recorded trips</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.storageInfo}>
            <Icon name="hard-drive" size={18} color="#95a5a6" />
            <Text style={styles.storageText}>
              Storage: {storageUsage.toFixed(1)}% used • Last sync: {lastSync ? new Date(lastSync).toLocaleDateString() : 'Never'}
            </Text>
          </View>
        </View>
      </View>

      {/* ABOUT & SUPPORT */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About & Support</Text>
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => Linking.openURL('mailto:support@rescuelink.ph?subject=RescueLink Support')}
          >
            <Icon name="mail" size={22} color="#27ae60" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Contact Support</Text>
              <Text style={styles.actionDescription}>support@rescuelink.ph</Text>
            </View>
            <Icon name="external-link" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => Linking.openURL('https://rescuelink.ph/privacy')}
          >
            <Icon name="shield" size={22} color="#3498db" />
            <Text style={styles.actionTitle}>Privacy Policy</Text>
            <Icon name="external-link" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={requestReview}>
            <Icon name="star" size={22} color="#f39c12" />
            <Text style={styles.actionTitle}>Rate Our App</Text>
            <Icon name="external-link" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={resetAllSettings}>
            <Icon name="refresh-cw" size={22} color="#e74c3c" />
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: '#e74c3c' }]}>Reset All Settings</Text>
              <Text style={styles.actionDescription}>Restore to factory defaults</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.appInfo}>
            <View style={styles.appInfoHeader}>
              <Icon name="heart" size={24} color="#e74c3c" />
              <Text style={styles.appName}>RescueLink</Text>
            </View>
            <Text style={styles.appVersion}>Version {appVersion}</Text>
            <Text style={styles.appTagline}>Made with ❤️ in the Philippines</Text>
            <Text style={styles.appCopyright}>© 2024 RescueLink PH. All rights reserved.</Text>
          </View>
        </View>
      </View>

      {/* Spacer */}
      <View style={{ height: 30 }} />

      {/* Emergency Contacts Modal */}
      <Modal
        visible={showContactsModal}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Emergency Contacts</Text>
            <TouchableOpacity
              onPress={() => setShowContactsModal(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Add New Contact Form */}
            <View style={styles.addContactForm}>
              <Text style={styles.formTitle}>Add New Contact</Text>
              <TextInput
                style={styles.input}
                placeholder="Contact Name"
                value={newContactName}
                onChangeText={setNewContactName}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={newContactNumber}
                onChangeText={setNewContactNumber}
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={addEmergencyContact}
              >
                <Text style={styles.addButtonText}>Add Contact</Text>
              </TouchableOpacity>
            </View>

            {/* Contacts List */}
            <Text style={styles.contactsListTitle}>
              Emergency Contacts ({emergencyContacts.length})
            </Text>
            
            {emergencyContacts.length === 0 ? (
              <View style={styles.emptyContacts}>
                <Icon name="users" size={50} color="#ddd" />
                <Text style={styles.emptyContactsText}>
                  No emergency contacts added yet
                </Text>
                <Text style={styles.emptyContactsHint}>
                  Add contacts to be notified during emergencies
                </Text>
              </View>
            ) : (
              emergencyContacts.map((contact) => (
                <View key={contact.id} style={styles.contactItem}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactNumber}>{contact.number}</Text>
                    <Text style={styles.contactDate}>
                      Added: {new Date(contact.dateAdded).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      style={styles.contactActionButton}
                      onPress={() => testEmergencyCall(contact)}
                    >
                      <Icon name="phone" size={18} color="#27ae60" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.contactActionButton}
                      onPress={() => removeEmergencyContact(contact.id)}
                    >
                      <Icon name="trash-2" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <Text style={styles.contactsNote}>
              📞 These contacts will be notified during SOS alerts and crash events
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  syncButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 14,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 16,
  },
  valueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'space-between',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 6,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  actionText: {
    flex: 1,
    marginLeft: 14,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  actionDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  storageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
  },
  storageText: {
    fontSize: 12,
    color: '#95a5a6',
    marginLeft: 8,
  },
  appInfo: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  appInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginLeft: 8,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: '#95a5a6',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 11,
    color: '#bdc3c7',
    textAlign: 'center',
    marginTop: 8,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  addContactForm: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 15,
  },
  emptyContacts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContactsText: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyContactsHint: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 2,
  },
  contactDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10,
  },
  contactActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  contactsNote: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    paddingHorizontal: 10,
  },
});