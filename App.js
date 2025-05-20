import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { auth, db, storage } from './firebaseConfig'; // Import Firebase services
import { testFirebaseConnection } from './firebase-test';
import Login from './screens/login';
import HomePage from './screens/home';
import LostPage from './screens/lost';
import ReportLostPage from './screens/reportlost';
import ProfilePage from './screens/profile';
import NotificationsScreen from './screens/notifications';
import VerificationForm from './screens/verification';
import FoundPage from './screens/found';
import ReportFoundPage from './screens/reportfound';
import HomeAdmin from './screens/HomeAdmin'; // Import HomeAdmin.js
import AdminManageLost from './screens/AdminManageLost'; // Import AdminManageLost.js
import AdminManageFound from './screens/AdminManageFound'; // Import AdminManageFound.js
import ClaimRequests from './screens/ClaimRequests'; // Import ClaimRequests.js
import FoundRequests from './screens/FoundRequests'; // Import FoundRequests.js
import UserManagementScreen from './screens/UserManagement'; // Import UserManagement.js
import ClaimHistoryScreen from './screens/ClaimHistory'; // Import ClaimHistory.js
import AdminNotification from './screens/AdminNotification'; // Import AdminNotification.js

const Stack = createStackNavigator();

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#4CAF50" />
    <Text style={{ marginTop: 10 }}>Loading...</Text>
  </View>
);

const ErrorScreen = ({ error, resetError }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <Text style={{ color: 'red', marginBottom: 20, textAlign: 'center' }}>
      {error.message || 'An error occurred'}
    </Text>
    <TouchableOpacity
      onPress={resetError}
      style={{
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
      }}
    >
      <Text style={{ color: 'white' }}>Retry</Text>
    </TouchableOpacity>
  </View>
);

const App = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [error, setError] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                console.log('Initializing app...');
                // Test Firebase connection
                const success = await testFirebaseConnection();
                if (!success) {
                    throw new Error('Firebase initialization failed');
                }

                // Check for existing auth state
                const token = await AsyncStorage.getItem('userToken');
                const userProfile = await AsyncStorage.getItem('userProfile');
                console.log('Stored token:', token);
                console.log('Stored user profile:', userProfile);
                
                if (token && userProfile) {
                    const user = auth.currentUser;
                    if (user && user.uid === token) {
                        setUserToken(token);
                        const profile = JSON.parse(userProfile);
                        console.log('Setting admin status:', profile.isAdmin);
                        setIsAdmin(profile.isAdmin);
                    } else {
                        // Token is invalid, clear it
                        await AsyncStorage.removeItem('userToken');
                        await AsyncStorage.removeItem('userProfile');
                        setUserToken(null);
                        setIsAdmin(false);
                    }
                }
            } catch (e) {
                console.error('App initialization failed:', e);
                setError(e);
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();

        // Initialize Firebase Auth listener
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            try {
                console.log('Auth state changed. User:', user?.email);
                if (user) {
                    // User is signed in
                    await AsyncStorage.setItem('userToken', user.uid);
                    const userProfile = await AsyncStorage.getItem('userProfile');
                    console.log('Retrieved user profile:', userProfile);
                    if (userProfile) {
                        const profile = JSON.parse(userProfile);
                        console.log('Setting admin status from auth change:', profile.isAdmin);
                        setIsAdmin(profile.isAdmin);
                    }
                    setUserToken(user.uid);
                } else {
                    // User is signed out
                    await AsyncStorage.removeItem('userToken');
                    await AsyncStorage.removeItem('userProfile');
                    setUserToken(null);
                    setIsAdmin(false);
                }
            } catch (e) {
                console.error('Auth state change error:', e);
                setError(e);
            }
        });

        return () => unsubscribe();
    }, []);

    const resetError = () => {
        setError(null);
        setIsLoading(true);
        // Re-initialize the app
        initializeApp();
    };

    if (error) {
        return <ErrorScreen error={error} resetError={resetError} />;
    }

    if (isLoading) {
        return <LoadingScreen />;
    }

    // Use different navigation options for web
    const screenOptions = Platform.select({
        web: {
            headerShown: false,
            animationEnabled: false,
        },
        default: {
            headerShown: false,
            animationEnabled: true,
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
        },
    });

    // Add console log for render
    console.log('Rendering App. isAdmin:', isAdmin, 'userToken:', userToken);

    return (
        <NavigationContainer
            fallback={<LoadingScreen />}
        >
            <Stack.Navigator 
                screenOptions={screenOptions}
                initialRouteName={isAdmin ? 'HomeAdmin' : userToken ? 'Home' : 'Login'}
            >
                {/* Always include all possible screens */}
                <Stack.Screen
                    name="Login"
                    component={Login}
                    options={{
                        title: 'Sign in',
                        animationTypeForReplace: userToken ? 'push' : 'pop',
                    }}
                />
                
                {/* Admin Screens */}
                <Stack.Screen name="HomeAdmin" component={HomeAdmin} />
                <Stack.Screen name="AdminNotification" 
                    component={AdminNotification}
                    options={{
                        title: 'Notifications',
                        headerShown: true,
                        headerStyle: {
                            backgroundColor: '#fff',
                        },
                        headerTintColor: '#333',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />
                <Stack.Screen name="AdminManageLost" component={AdminManageLost} />
                <Stack.Screen name="AdminManageFound" component={AdminManageFound} />
                <Stack.Screen name="ClaimRequests" component={ClaimRequests} />
                <Stack.Screen name="FoundRequests" component={FoundRequests} />
                <Stack.Screen name="UserManagement" component={UserManagementScreen} />
                <Stack.Screen name="ClaimHistory" component={ClaimHistoryScreen} />
                
                {/* User Screens */}
                <Stack.Screen name="Home" component={HomePage} />
                <Stack.Screen name="LostPage" component={LostPage} />
                <Stack.Screen name="ReportLostPage" component={ReportLostPage} />
                <Stack.Screen name="Profile" component={ProfilePage} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="Verification" component={VerificationForm} />
                <Stack.Screen name="FoundPage" component={FoundPage} />
                <Stack.Screen name="ReportFoundPage" component={ReportFoundPage} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;
