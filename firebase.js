import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDotWj51D4OSUrtjb0ncA7Igo7Q6zgTu1M",
  authDomain: "rauxa-8f9bf.firebaseapp.com",
  projectId: "rauxa-8f9bf",
  storageBucket: "rauxa-8f9bf.firebasestorage.app",
  messagingSenderId: "312076107505",
  appId: "1:312076107505:web:bbbcbe990b29068210f350"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

export { auth, db };