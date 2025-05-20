import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDh04QJL-JiWxYN7eHXgSnN-ZyfWDotVJ8",
  authDomain: "foundu-966dd.firebaseapp.com",
  projectId: "foundu-966dd",
  storageBucket: "foundu-966dd.firebasestorage.app",
  messagingSenderId: "1026880459333",
  appId: "1:1026880459333:web:8b58fd3074cb16766b092c",
  measurementId: "G-FKQY16Z028"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { db, auth };