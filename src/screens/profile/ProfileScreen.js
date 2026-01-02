// src/screens/profile/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../service/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [firebaseError, setFirebaseError] = useState(false);

  // Calculate age from birthday
  const calculateAge = (birthday) => {
    if (!birthday) return 'Not specified';
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return `${age} years old`;
  };

  // Load user data from Firestore or AsyncStorage
  const loadUserData = async () => {
    try {
      setLoading(true);
      setFirebaseError(false);

      const userId = await AsyncStorage.getItem('userId');
      const storedEmail = await AsyncStorage.getItem('userEmail');
      const storedName = await AsyncStorage.getItem('userName');

      // Demo user
      if (!userId || userId === 'demo_user_123') {
        const demoBirthday = '1995-08-15';
        setUserData({
          name: storedName || 'Demo User',
          email: storedEmail || 'demo@rescuelink.com',
          birthday: demoBirthday,
          age: calculateAge(demoBirthday),
          address: 'Blk 12 Lot 5, Brgy. Bagumbayan\nQuezon City, Metro Manila',
          mobile: '0917-123-4567',
          isDemo: true,
        });
        setLoading(false);
        return;
      }

      // Try Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            name: data.name || storedName || 'User',
            email: data.email || storedEmail || 'No email',
            birthday: data.birthday || null,
            age: calculateAge(data.birthday),
            address: data.address || 'Address not set',
            mobile: data.mobile || 'Mobile not set',
            isDemo: false,
            firestoreData: true,
          });
          await AsyncStorage.setItem('userProfile', JSON.stringify(data));
        } else {
          // Fallback to AsyncStorage
          const storedProfile = await AsyncStorage.getItem('userProfile');
          if (storedProfile) {
            const data = JSON.parse(storedProfile);
            setUserData({
              name: data.name || storedName || 'User',
              email: data.email || storedEmail || 'No email',
              birthday: data.birthday || null,
              age: calculateAge(data.birthday),
              address: data.address || 'Address not set',
              mobile: data.mobile || 'Mobile not set',
              isDemo: false,
              firestoreData: false,
            });
          }
        }
      } catch (firestoreError) {
        console.log('Firestore error:', firestoreError.message);
        setFirebaseError(true);
        // Fallback to AsyncStorage
        const storedProfile = await AsyncStorage.getItem('userProfile');
        if (storedProfile) {
          const data = JSON.parse(storedProfile);
          setUserData({
            name: data.name || storedName || 'User',
            email: data.email || storedEmail || 'No email',
            birthday: data.birthday || null,
            age: calculateAge(data.birthday),
            address: data.address || 'Address not set',
            mobile: data.mobile || 'Mobile not set',
            isDemo: false,
            firestoreData: false,
          });
        }
      }
    } catch (error) {
      console.log('Error loading profile:', error);
      setFirebaseError(true);
      setUserData({
        name: 'User',
        email: 'user@example.com',
        birthday: null,
        age: 'Not available',
        address: 'Data not loaded',
        mobile: 'Not set',
        isDemo: false,
        firestoreData: false,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            const userId = await AsyncStorage.getItem('userId');
            if (userId && userId !== 'demo_user_123') await signOut(auth);
            await AsyncStorage.multiRemove([
              'isLoggedIn',
              'userId',
              'userEmail',
              'userName',
              'userProfile',
            ]);
            navigation.replace('Login');
          } catch (error) {
            Alert.alert(
              'Error',
              'Failed to logout properly. Please restart app.'
            );
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#e74c3c']}
          tintColor="#e74c3c"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.avatar}
        />
        <Text style={styles.name}>{userData?.name || 'User'}</Text>
        <Text style={styles.role}>
          {userData?.isDemo ? 'Demo Account' : 'RescueLink Member'}
        </Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        {/* Name */}
        <View style={styles.infoRow}>
          <Icon name="person" size={24} color="#3498db" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>{userData?.name || 'Not set'}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Age */}
        <View style={styles.infoRow}>
          <Icon name="cake" size={24} color="#e74c3c" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.label}>Age</Text>
            <Text style={styles.value}>{userData?.age || 'Not specified'}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Birthday */}
        <View style={styles.infoRow}>
          <Icon name="calendar-today" size={24} color="#8e44ad" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.label}>Birthday</Text>
            <Text style={styles.value}>
              {userData?.birthday || 'Not specified'}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Address */}
        <View style={styles.infoRow}>
          <Icon name="home" size={24} color="#27ae60" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{userData?.address || 'Not set'}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Mobile Number */}
        <View style={styles.infoRow}>
          <Icon name="phone" size={24} color="#f39c12" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.label}>Mobile Number</Text>
            <Text style={styles.value}>{userData?.mobile || 'Not set'}</Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
          LOGOUT
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 5,
    borderColor: '#e74c3c',
    marginBottom: 20,
  },
  name: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center' },
  role: { fontSize: 16, color: '#e74c3c', fontWeight: '600', marginTop: 6 },
  infoCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: -20, borderRadius: 24, paddingVertical: 20, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  infoTextContainer: { marginLeft: 12 },
  label: { fontSize: 14, color: '#888', marginBottom: 2 },
  value: { fontSize: 16, color: '#333', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee', marginHorizontal: 20 },
  logoutButton: { marginHorizontal: 20, backgroundColor: '#e74c3c', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 40 },
});
