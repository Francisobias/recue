// src/screens/onboarding/OnboardingScreen.js
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';

const { width } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: 'Real-Time Crash Detection',
    text: 'Automatically detects accidents using phone sensors and alerts emergency contacts',
    image: require('../../../assets/onboard1.png'),
  },
  {
    key: '2',
    title: 'Live Location Tracking',
    text: 'Share your exact location with rescuers even when offline',
    image: require('../../../assets/onboard2.png'),
  },
  {
    key: '3',
    title: 'Emergency SOS Alert',
    text: '10-second countdown with vibration — cancelable if you\'re okay',
    image: require('../../../assets/onboard3.png'),
  },
  {
    key: '4',
    title: 'Ready to Save Lives?',
    text: 'Join thousands of Filipinos protected by RescueLink',
    image: require('../../../assets/onboard4.png'),
  },
];

export default function OnboardingScreen({ navigation }) {
  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        <Image source={item.image} style={styles.image} />
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.text}>{item.text}</Text>
      </View>
    );
  };

  // FIXED: Tama na ang structure!
  const renderNextButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <Text style={styles.buttonText}>Next</Text>
        <Text style={styles.arrow}>›</Text>
      </View>
    );
  };

  const renderDoneButton = () => {
    return (
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.replace('Terms')}
      >
        <Text style={styles.doneText}>Get Started</Text>
      </TouchableOpacity>
    );
  };

  const renderSkipButton = () => {
    return (
      <TouchableOpacity onPress={() => navigation.replace('Terms')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppIntroSlider
        data={slides}
        renderItem={renderItem}
        showSkipButton={true}
        showNextButton={true}
        onDone={() => navigation.replace('Terms')}
        onSkip={() => navigation.replace('Terms')}
        renderNextButton={renderNextButton}
        renderDoneButton={renderDoneButton}
        renderSkipButton={renderSkipButton}
        dotStyle={styles.dot}
        activeDotStyle={styles.activeDot}
        bottomButton
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffffff' },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffffff',
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 30,
  },
  buttonCircle: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  arrow: { color: '#fff', fontSize: 24, marginLeft: 8 },
  doneButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
  },
  doneText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  skipText: { color: '#999', fontSize: 16, fontWeight: '600' },
  dot: { backgroundColor: '#333', width: 10, height: 10, borderRadius: 5 },
  activeDot: { backgroundColor: '#e74c3c', width: 20, height: 10, borderRadius: 5 },
});