// src/screens/profile/ProfileScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }) {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('isLoggedIn');
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with Avatar */}
      <View style={styles.header}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.avatar}
        />
        <Text style={styles.name}>Juan Dela Cruz</Text>
        <Text style={styles.role}>RescueLink User</Text>
      </View>

      {/* Profile Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Icon name="cake" size={24} color="#e74c3c" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.label}>Age</Text>
            <Text style={styles.value}>28 years old</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Icon name="email" size={24} color="#e74c3c" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.value}>juan.delacruz@gmail.com</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Icon name="location-on" size={24} color="#e74c3c" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.label}>Home Address</Text>
            <Text style={styles.value}>Blk 12 Lot 5, Brgy. Bagumbayan{'\n'}Quezon City, Metro Manila</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Icon name="phone-android" size={24} color="#e74c3c" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.label}>Mobile Number</Text>
            <Text style={styles.value}>0917-123-4567</Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={26} color="#fff" />
        <Text style={styles.logoutText}>LOGOUT</Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={styles.version}>
        RescueLink v1.0 • Made with ❤️ in the Philippines
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 5,
    borderColor: '#e74c3c',
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  role: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '600',
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 24,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  infoTextContainer: {
    marginLeft: 20,
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 17,
    color: '#333',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#e74c3c',
    marginHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  version: {
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 30,
    color: '#999',
    fontSize: 14,
  },
});