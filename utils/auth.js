import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const loginWithEmailAndPassword = async (email, password) => {
    try {
        console.log('Starting login process for email:', email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Firebase auth successful for user:', user.uid);
        
        // Check if user is admin by querying Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        let userProfile = null;
        // Set isAdmin true if email is admin@gmail.com
        const isAdmin = email.toLowerCase() === 'admin@gmail.com';
        console.log('Initial admin check based on email:', isAdmin);

        if (!querySnapshot.empty) {
            // Update existing user document if needed
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            console.log('Existing user data:', userData);
            
            // If this is the admin email but the document doesn't show admin status, update it
            if (isAdmin && !userData.isAdmin) {
                console.log('Updating user document to set admin status');
                await updateDoc(doc(db, 'users', userDoc.id), {
                    isAdmin: true
                });
            }
            
            userProfile = {
                uid: user.uid,
                email: user.email,
                name: userData.name || email.split('@')[0],
                isAdmin: isAdmin || userData.isAdmin
            };
        } else {
            console.log('Creating new user document with admin status:', isAdmin);
            // If no user document exists, create one
            userProfile = {
                uid: user.uid,
                email: user.email,
                name: email.split('@')[0],
                isAdmin: isAdmin,
                createdAt: new Date()
            };
            
            // Create the user document in Firestore
            await addDoc(collection(db, 'users'), userProfile);
        }
        
        console.log('Final user profile to be saved:', userProfile);
        // Save user info to AsyncStorage
        await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
        await AsyncStorage.setItem('userToken', user.uid);
        
        return {
            success: true,
            user: userProfile
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: error.code
        };
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
        await AsyncStorage.removeItem('userProfile');
        await AsyncStorage.removeItem('userToken');
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export const getCurrentUser = async () => {
    try {
        const userProfile = await AsyncStorage.getItem('userProfile');
        return userProfile ? JSON.parse(userProfile) : null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

export const setUserAsAdmin = async (uid) => {
    try {
        // Find the user document
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            // Update the user document to set isAdmin to true
            await updateDoc(doc(db, 'users', userDoc.id), {
                isAdmin: true
            });
            
            // Update local storage if this is the current user
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.uid === uid) {
                const userProfile = await AsyncStorage.getItem('userProfile');
                if (userProfile) {
                    const profile = JSON.parse(userProfile);
                    profile.isAdmin = true;
                    await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
                }
            }
            return { success: true };
        }
        return { success: false, error: 'User document not found' };
    } catch (error) {
        console.error('Error setting user as admin:', error);
        return { success: false, error: error.message };
    }
}; 