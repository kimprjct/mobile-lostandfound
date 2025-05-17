import { auth, db } from './firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Test Firebase connection
const testFirebaseConnection = async () => {
  try {
    // Test Authentication first
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('✅ Firebase Auth is initialized but no user is signed in (This is normal)');
      return true; // Return true as this is an expected state before login
    }

    // If user is signed in, test Firestore
    const testCollection = collection(db, 'test');
    await addDoc(testCollection, {
      test: true,
      timestamp: serverTimestamp()
    });
    console.log('✅ Firebase Firestore is connected!');
    console.log('✅ Firebase Auth is working, user is signed in');

    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    // Provide more detailed error information
    if (error.code === 'permission-denied') {
      console.error('Firebase permissions are not properly configured');
    } else if (error.code === 'not-found') {
      console.error('Firebase project or collection not found');
    }
    return false;
  }
};

export { testFirebaseConnection }; 