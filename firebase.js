import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Import Firebase Storage

const firebaseConfig = {
  apiKey: "AIzaSyDotWj51D4OSUrtjb0ncA7Igo7Q6zgTu1M",
  authDomain: "rauxa-8f9bf.firebaseapp.com",
  projectId: "rauxa-8f9bf",
  storageBucket: "rauxa-8f9bf.firebasestorage.app",
  messagingSenderId: "312076107505",
  appId: "1:312076107505:web:bbbcbe990b29068210f350"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Firebase Storage

export { auth, db, storage };