// src/screens/auth/SignupScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../service/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState(null); // Date object
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Handle date selection
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // keep open on iOS
    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !birthday || !address || !mobile || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Calculate age from birthday
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) age--;

    if (age < 18 || age > 100) {
      Alert.alert('Error', 'You must be between 18 and 100 years old');
      return;
    }

    setLoading(true);

    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ Firebase user created:', user.uid);

      // Build user profile
      const userProfile = {
        uid: user.uid,
        name: name.trim(),
        email: email.trim(),
        birthday: birthday.toISOString().split('T')[0], // save as YYYY-MM-DD
        age,
        address: address.trim(),
        mobile: mobile.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileComplete: true,
        emergencyContacts: [],
        settings: {
          drivingMode: true,
          crashSensitivity: 'medium',
          soundAlerts: true,
          vibration: true,
        },
      };

      // Save profile to Firestore
      await setDoc(doc(db, 'users', user.uid), userProfile);
      console.log('✅ User profile saved to Firestore');

      // Save to AsyncStorage
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userId', user.uid);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('userName', name);
      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));

      Alert.alert(
        'Success! 🎉',
        'Account created successfully!\n\nYou can now login with your credentials.',
        [
          {
            text: 'Go to Login',
            onPress: () =>
              navigation.replace('Login', {
                prefilledEmail: email,
                successMessage: 'Account created! Please login.',
              }),
          },
        ]
      );
    } catch (error) {
      console.log('❌ Signup error:', error.code, error.message);
      let errorMessage = 'Signup failed. Please try again.';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already registered. Try logging in instead.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Use at least 6 characters with letters and numbers.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Check your internet connection.';
          break;
        case 'permission-denied':
          errorMessage = 'Firestore permission denied. Check Firebase rules.';
          break;
      }

      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fill demo data
  const fillDemoData = () => {
    setName('Juan Dela Cruz');
    setEmail('juan.delacruz@example.com');
    setBirthday(new Date(1995, 0, 1)); // Jan 1, 1995
    setAddress('Blk 12 Lot 5, Brgy. Bagumbayan, Quezon City');
    setMobile('09171234567');
    setPassword('123456');
    setConfirmPassword('123456');
    Alert.alert('Demo Data', 'Demo information filled. You can modify or tap SIGN UP.');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.card}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join RescueLink today</Text>

          {/* Full Name */}
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />

          {/* Email */}
          <TextInput
            style={styles.input}
            placeholder="Email Address *"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          {/* Birthday Picker */}
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
            disabled={loading}
          >
            <Text style={{ color: birthday ? '#000' : '#999' }}>
              {birthday ? birthday.toDateString() : 'Select Birthday *'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={birthday || new Date(2000, 0, 1)}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={onDateChange}
            />
          )}

          {/* Address */}
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Home Address *"
            placeholderTextColor="#999"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            editable={!loading}
          />

          {/* Mobile */}
          <TextInput
            style={styles.input}
            placeholder="Mobile Number *"
            placeholderTextColor="#999"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            editable={!loading}
          />

          {/* Password */}
          <TextInput
            style={styles.input}
            placeholder="Password * (min. 6 characters)"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          {/* Confirm Password */}
          <TextInput
            style={styles.input}
            placeholder="Confirm Password *"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          {/* Signup Button */}
          {loading ? (
            <View style={styles.loadingButton}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : (
            <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={loading}>
              <Text style={styles.signupButtonText}>SIGN UP</Text>
            </TouchableOpacity>
          )}

          {/* Demo Button */}
          <TouchableOpacity style={styles.demoButton} onPress={fillDemoData} disabled={loading}>
            <Text style={styles.demoButtonText}>FILL DEMO DATA</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
            style={styles.loginLinkContainer}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Login</Text>
            </Text>
          </TouchableOpacity>

          {/* Requirements */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Requirements:</Text>
            <Text style={styles.infoText}>• All fields are required</Text>
            <Text style={styles.infoText}>• Password: minimum 6 characters</Text>
            <Text style={styles.infoText}>• Age: must be 18-100 years old</Text>
            <Text style={styles.infoText}>• Valid email address</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc', padding: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 20,
    alignItems: 'center',
  },
  logo: { width: 100, height: 100, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 25 },
  input: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  signupButton: {
    width: '100%',
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 15,
  },
  loadingButton: {
    width: '100%',
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 15,
    justifyContent: 'center',
    height: 58,
  },
  signupButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  demoButton: { width: '100%', backgroundColor: '#3498db', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  demoButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  loginLinkContainer: { marginTop: 10, marginBottom: 20 },
  loginText: { color: '#666', fontSize: 15 },
  loginLink: { color: '#3498db', fontWeight: 'bold' },
  infoBox: { marginTop: 15, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 12, width: '100%', borderLeftWidth: 4, borderLeftColor: '#27ae60' },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  infoText: { fontSize: 12, color: '#555', marginLeft: 5, marginBottom: 4 },
});
