// src/screens/onboarding/TermsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // gamit vector icons

export default function TermsScreen({ navigation }) {
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    if (!agreed) {
      Alert.alert('Required', 'You must agree to the Terms & Privacy Policy');
      return;
    }
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terms & Privacy</Text>

      <ScrollView style={styles.scroll}>
        <Text style={styles.section}>Data Collection</Text>
        <Text style={styles.paragraph}>
          RescueLink collects location data to enable crash detection and emergency alerts even when the app is closed.
        </Text>
        <Text style={styles.section}>Emergency Sharing</Text>
        <Text style={styles.paragraph}>
          In case of a detected crash, your location will be shared with emergency contacts.
        </Text>
        <Text style={styles.section}>Privacy</Text>
        <Text style={styles.paragraph}>
          We never sell your data. Your information is encrypted and only used for safety.
        </Text>
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Icon name="check" size={20} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I agree to the Terms of Service and Privacy Policy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !agreed && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!agreed}
        >
          <Text style={styles.buttonText}>CONTINUE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffffff', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginTop: 50, marginBottom: 30 },
  scroll: { flex: 1 },
  section: { fontSize: 20, fontWeight: 'bold', color: '#e74c3c', marginTop: 30, marginBottom: 12 },
  paragraph: { fontSize: 16, color: '#ddd', lineHeight: 26, marginBottom: 20 },
  bottom: { marginTop: 30, marginBottom: 40 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 30 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: { backgroundColor: '#e74c3c' },
  checkboxLabel: { color: '#fff', fontSize: 15, flex: 1, flexWrap: 'wrap' },
  button: { backgroundColor: '#e74c3c', padding: 18, borderRadius: 16, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});