// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCexxAZdyj1oXm4u-gA3N_aLUHfD2Eu36o",
  authDomain: "rescuelink-ba8d6.firebaseapp.com",
  projectId: "rescuelink-ba8d6",
  storageBucket: "rescuelink-ba8d6.firebasestorage.app",
  messagingSenderId: "231386611136",
  appId: "1:231386611136:web:03c255c132ba55b985dc25",
  measurementId: "G-NQCVHN0PBY"
};

let app;
let auth;
let db;

try {
  // Check if Firebase is already initialized
  if (!global._FIREBASE_APP) {
    app = initializeApp(firebaseConfig);
    global._FIREBASE_APP = app; // Mark as initialized globally
    console.log('✅ Firebase initialized');
  } else {
    app = global._FIREBASE_APP;
    console.log('✅ Using existing Firebase app');
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.log('❌ Firebase init error:', error.message);
}

export { auth, db };