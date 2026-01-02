// src/screens/auth/LoginScreen.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../service/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  // Check if there's a prefilled email from signup
  useEffect(() => {
    if (route.params?.prefilledEmail) {
      setEmail(route.params.prefilledEmail);
      if (route.params.successMessage) {
        Alert.alert('Welcome!', route.params.successMessage);
      }
    }
    
    // Check for existing session
    checkExistingSession();
  }, [route.params]);

  // Check if user is already logged in (extra safety)
  const checkExistingSession = async () => {
    try {
      setIsCheckingSession(true);
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      const userId = await AsyncStorage.getItem('userId');
      
      if (isLoggedIn === 'true' && userId) {
        console.log('⚠️ User already logged in, redirecting...');
        
        // Get user data first
        const userEmail = await AsyncStorage.getItem('userEmail');
        const userName = await AsyncStorage.getItem('userName');
        const userDataString = await AsyncStorage.getItem('userData');
        const userData = userDataString ? JSON.parse(userDataString) : null;
        
        // Small delay for better UX
        setTimeout(() => {
          navigation.replace('Main', {
            userId: userId,
            email: userEmail || '',
            displayName: userName || '',
            userData: userData,
            autoLogin: true,
          });
        }, 500);
      }
    } catch (error) {
      console.log('Session check error:', error);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const handleLogin = async () => {
    // Validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login with:', email);
      
      // Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      const user = userCredential.user;
      
      console.log('✅ Firebase login successful! User:', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      });

      // SAVE COMPLETE LOGIN STATE FOR PERSISTENT LOGIN
      await AsyncStorage.multiSet([
        ['isLoggedIn', 'true'],
        ['userId', user.uid],
        ['userEmail', user.email || email],
        ['userName', user.displayName || email.split('@')[0]],
        ['lastLogin', new Date().toISOString()],
        ['authProvider', 'firebase'],
        ['loginMethod', 'email_password'],
      ]);

      // Save comprehensive user data
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split('@')[0],
        photoURL: user.photoURL || null,
        emailVerified: user.emailVerified || false,
        lastLogin: new Date().toISOString(),
        authProvider: 'firebase',
      };
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      console.log('✅ Login data saved to persistent storage');
      
      // Navigate to Main with user data
      navigation.replace('Main', {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName,
        userData: userData,
        autoLogin: false, // Manual login (not auto-login)
      });
      
    } catch (error) {
      console.log('❌ Login error:', {
        code: error.code,
        message: error.message,
        email: email,
      });
      
      // User-friendly error messages
      let errorMessage = 'Login failed. Please try again.';
      let errorTitle = 'Login Failed';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorTitle = 'Invalid Email';
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorTitle = 'Account Disabled';
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/user-not-found':
          // Check for demo account
          if (email === 'admin@rescuelink.com' && password === '123456') {
            await handleDemoLogin(true);
            return;
          }
          errorTitle = 'Account Not Found';
          errorMessage = 'No account found with this email. Please sign up first.';
          break;
        case 'auth/wrong-password':
          errorTitle = 'Wrong Password';
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/too-many-requests':
          errorTitle = 'Too Many Attempts';
          errorMessage = 'Too many failed login attempts. Please try again in 5 minutes.';
          break;
        case 'auth/network-request-failed':
          errorTitle = 'Network Error';
          errorMessage = 'Cannot connect to server. Please check your internet connection.';
          break;
        case 'auth/invalid-credential':
          errorTitle = 'Invalid Credentials';
          errorMessage = 'Email or password is incorrect.';
          break;
        case 'auth/operation-not-allowed':
          errorTitle = 'Login Disabled';
          errorMessage = 'Email/password login is not enabled. Please contact support.';
          break;
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle demo login
  const handleDemoLogin = async (silent = false) => {
    if (!silent) {
      setEmail('admin@rescuelink.com');
      setPassword('123456');
      Alert.alert('Demo Credentials', 'Demo credentials filled. Tap LOGIN to continue.', [
        { text: 'OK' }
      ]);
      return;
    }

    // Silent demo login (for user-not-found fallback)
    try {
      console.log('🔄 Using demo account...');
      
      await AsyncStorage.multiSet([
        ['isLoggedIn', 'true'],
        ['userId', 'demo_user_123'],
        ['userEmail', 'admin@rescuelink.com'],
        ['userName', 'Demo User'],
        ['lastLogin', new Date().toISOString()],
        ['authProvider', 'demo'],
        ['loginMethod', 'demo'],
      ]);

      const demoUserData = {
        uid: 'demo_user_123',
        email: 'admin@rescuelink.com',
        displayName: 'Demo User',
        isDemo: true,
        lastLogin: new Date().toISOString(),
      };
      await AsyncStorage.setItem('userData', JSON.stringify(demoUserData));

      console.log('✅ Demo login successful');
      
      navigation.replace('Main', {
        userId: 'demo_user_123',
        email: 'admin@rescuelink.com',
        displayName: 'Demo User',
        userData: demoUserData,
        isDemo: true,
        autoLogin: false,
      });
      
    } catch (demoError) {
      console.log('Demo login error:', demoError);
      Alert.alert('Demo Login Failed', 'Could not login with demo account.');
    }
  };

  // Forgot password handler
  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Would you like to reset your password?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Password',
          onPress: () => {
            if (!email.trim()) {
              Alert.alert('Enter Email', 'Please enter your email address first.');
              return;
            }
            
            Alert.alert(
              'Password Reset',
              `A password reset link will be sent to:\n\n${email}\n\nPlease check your email.`,
              [{ text: 'OK' }]
            );
            // TODO: Implement Firebase sendPasswordResetEmail
          }
        }
      ]
    );
  };

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <View style={styles.loadingFullScreen}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Checking login status...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.card}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          returnKeyType="next"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        {/* Forgot Password */}
        <TouchableOpacity 
          onPress={handleForgotPassword}
          disabled={loading}
          style={styles.forgotPasswordButton}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        {loading ? (
          <View style={styles.loadingButton}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingButtonText}>Logging in...</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>LOGIN</Text>
          </TouchableOpacity>
        )}

        {/* Sign Up Link */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('Signup')}
          disabled={loading}
          style={styles.signupLinkContainer}
        >
          <Text style={styles.signupText}>
            Don't have an account? <Text style={styles.signupLink}>Sign up</Text>
          </Text>
        </TouchableOpacity>

        {/* Demo Button */}
        <TouchableOpacity 
          style={styles.demoButton}
          onPress={() => handleDemoLogin(false)}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.demoButtonText}>USE DEMO ACCOUNT</Text>
        </TouchableOpacity>

        {/* Demo Info */}
        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>For Testing</Text>
          <Text style={styles.demoText}>Demo: admin@rescuelink.com</Text>
          <Text style={styles.demoText}>Password: 123456</Text>
          <Text style={styles.demoNote}>
            Demo account uses local storage only
          </Text>
        </View>

        {/* Persistent Login Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            <Text style={styles.infoIcon}>🔒</Text> You will stay logged in until you manually logout
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
    justifyContent: 'center',
    padding: 24,
  },
  loadingFullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
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
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#333',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#e74c3c',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingButton: {
    width: '100%',
    backgroundColor: '#e74c3c',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 10,
    justifyContent: 'center',
    height: 58,
    flexDirection: 'row',
    gap: 10,
  },
  loadingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupLinkContainer: {
    marginTop: 15,
    marginBottom: 20,
  },
  signupText: {
    color: '#666',
    fontSize: 15,
  },
  signupLink: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  demoButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2980b9',
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  demoBox: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 6,
  },
  demoText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
  },
  demoNote: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 6,
  },
  infoBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    width: '100%',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  infoIcon: {
    fontSize: 14,
  },
});