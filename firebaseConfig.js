import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
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

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    // The current browser/platform doesn't support persistence
    console.warn('The current platform doesn\'t support persistence');
  }
});

// Initialize Storage
const storage = getStorage(app);

export { auth, db, storage }; 