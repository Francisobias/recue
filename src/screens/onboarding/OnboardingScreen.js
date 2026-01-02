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
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

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
    text: 'Share your exact location with rescuers even when offline or in remote areas',
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
  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    try {
      // Mark as onboarding completed
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      console.log('✅ Onboarding completed, marked as seen');
      
      // Navigate to Terms screen
      navigation.replace('Terms');
    } catch (error) {
      console.log('❌ Error saving onboarding status:', error);
      // Still navigate even if save fails
      navigation.replace('Terms');
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.contentContainer}>
          <Image source={item.image} style={styles.image} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderNextButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <Text style={styles.buttonText}>Next</Text>
      </View>
    );
  };

  const renderDoneButton = () => {
    return (
      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleOnboardingComplete}
      >
        <Text style={styles.doneText}>Get Started</Text>
      </TouchableOpacity>
    );
  };

  const renderSkipButton = () => {
    return (
      <TouchableOpacity onPress={handleOnboardingComplete}>
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
        onDone={handleOnboardingComplete}
        onSkip={handleOnboardingComplete}
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
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  image: {
    width: width * 0.75,
    height: width * 0.75,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: width * 0.85,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonCircle: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  doneButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  doneText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  skipText: { 
    color: '#666', 
    fontSize: 16, 
    fontWeight: '600',
    paddingHorizontal: 20,
  },
  dot: { 
    backgroundColor: '#ddd', 
    width: 10, 
    height: 10, 
    borderRadius: 5 
  },
  activeDot: { 
    backgroundColor: '#e74c3c', 
    width: 20, 
    height: 10, 
    borderRadius: 5 
  },
});