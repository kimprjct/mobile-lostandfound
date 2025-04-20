import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const Stack = createStackNavigator();
const PERSISTENCE_KEY = 'NAVIGATION_STATE';

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [initialState, setInitialState] = useState();

    useEffect(() => {
        async function checkLoginStatus() {
            const userToken = await AsyncStorage.getItem('userToken');
            console.log('User Token:', userToken); // Debugging
            setIsLoggedIn(!!userToken); // Set login state based on token
        }

        checkLoginStatus();
    }, []);

    useEffect(() => {
        async function restoreNavigationState() {
            const savedState = await AsyncStorage.getItem(PERSISTENCE_KEY);
            if (savedState) {
                setInitialState(JSON.parse(savedState));
            }
        }

        restoreNavigationState();
    }, []);

    const handleLogin = async (token) => {
        await AsyncStorage.setItem('userToken', token);
        setIsLoggedIn(true); // Update the login state
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('userToken');
        setIsLoggedIn(false);
    };

    return (
        <NavigationContainer
            initialState={initialState}
            onStateChange={(state) =>
                AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state))
            }
        >
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animationEnabled: true,
                    cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
                }}
            >
                {/* Login Screen */}
                <Stack.Screen
                    name="Login"
                    component={Login}
                    initialParams={{ onLogin: handleLogin }}
                />

                {/* Screens available after login */}
                {isLoggedIn && (
                    <>
                        <Stack.Screen
                            name="Home"
                            component={HomePage}
                            initialParams={{ onLogout: handleLogout }}
                        />
                        <Stack.Screen
                            name="HomeAdmin"
                            component={HomeAdmin}
                            initialParams={{ onLogout: handleLogout }}
                        />
                        <Stack.Screen
                            name="AdminManageLost"
                            component={AdminManageLost}
                        />
                        <Stack.Screen
                            name="AdminManageFound"
                            component={AdminManageFound}
                        />
                        <Stack.Screen
                            name="ClaimRequests"
                            component={ClaimRequests}
                        />
                        <Stack.Screen
                            name="FoundRequests"
                            component={FoundRequests}
                        />
                        <Stack.Screen
                            name="UserManagement"
                            component={UserManagementScreen}
                        />
                        <Stack.Screen
                            name="ClaimHistory" // Register the ClaimHistory screen
                            component={ClaimHistoryScreen}
                        />
                        <Stack.Screen name="LostPage" component={LostPage} />
                        <Stack.Screen name="ReportLostPage" component={ReportLostPage} />
                        <Stack.Screen name="Profile" component={ProfilePage} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} />
                        <Stack.Screen name="Verification" component={VerificationForm} />
                        <Stack.Screen name="FoundPage" component={FoundPage} />
                        <Stack.Screen name="ReportFoundPage" component={ReportFoundPage} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;
