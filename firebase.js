import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDotWj51D4OSUrtjb0ncA7Igo7Q6zgTu1M",
  authDomain: "rauxa-8f9bf.firebaseapp.com",
  projectId: "rauxa-8f9bf",
  storageBucket: "rauxa-8f9bf.appspot.com",
  messagingSenderId: "312076107505",
  appId: "1:312076107505:web:bbbcbe990b29068210f350"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  console.error('Error initializing auth:', error);
  // Fallback to memory persistence if AsyncStorage fails
  auth = initializeAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };