import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, Alert, StatusBar, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../utils/auth'; // Import the logout function from utils/auth
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const Header = () => {
    const [menuVisible, setMenuVisible] = useState(false);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [loginReminderModalVisible, setLoginReminderModalVisible] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigation = useNavigation();

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });

        return () => unsubscribeAuth();
    }, []);

    // Listen for unread notifications
    useEffect(() => {
        let unsubscribe = null;
        
        const loadUnreadCount = async () => {
            try {
                if (!isLoggedIn) {
                    setUnreadCount(0);
                    return;
                }

                // Load notifications from AsyncStorage only when logged in
                const storedNotifications = await AsyncStorage.getItem('notifications');
                if (storedNotifications) {
                    const notifications = JSON.parse(storedNotifications);
                    const unreadCount = notifications.filter(n => n.status === 'unread').length;
                    setUnreadCount(unreadCount);
                }

                if (auth.currentUser) {
                    // Create a query for user's notifications
                    const notificationsQuery = query(
                        collection(db, 'notifications'),
                        where('userId', '==', auth.currentUser.uid),
                        where('status', '==', 'unread')
                    );

                    unsubscribe = onSnapshot(notificationsQuery, async (snapshot) => {
                        const unreadCount = snapshot.docs.length;
                        setUnreadCount(unreadCount);

                        // Update AsyncStorage with new notifications
                        const storedNotifications = await AsyncStorage.getItem('notifications');
                        let notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
                        
                        // Update or add new notifications
                        for (const doc of snapshot.docs) {
                            const newNotification = {
                                id: doc.id,
                                ...doc.data(),
                                createdAt: doc.data().createdAt?.toDate?.()?.toLocaleString() || 'N/A'
                            };
                            
                            const existingIndex = notifications.findIndex(n => n.id === doc.id);
                            if (existingIndex >= 0) {
                                notifications[existingIndex] = newNotification;
                            } else {
                                notifications.push(newNotification);
                            }
                        }

                        await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
                    }, (error) => {
                        console.error('Error fetching notifications:', error);
                    });
                }
            } catch (error) {
                console.error('Error setting up notification listener:', error);
            }
        };

        loadUnreadCount();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [isLoggedIn]);

    const handleLogout = async () => {
        try {
            // Don't clear notifications on logout
            const { success } = await logout();
            if (success) {
                setLogoutModalVisible(false);
                setIsLoggedIn(false);
                setMenuVisible(false);
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            } else {
                Alert.alert('Error', 'Failed to logout. Please try again.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'An unexpected error occurred during logout.');
        }
    };

    const handleLoginReminder = () => {
        setLoginReminderModalVisible(true); // Show the login reminder modal
    };

    const handleMenuItemPress = (screenName) => {
        if (!isLoggedIn) {
            handleLoginReminder(); // Show login reminder if not logged in
        } else {
            navigation.navigate(screenName); // Navigate to the screen if logged in
            setMenuVisible(false); // Close the side menu
        }
    };

    return (
        <>
            <SafeAreaView style={{ backgroundColor: '#fff' }}>
                <StatusBar barStyle="dark-content" translucent={true} backgroundColor="transparent" />

                {/* Border above the header */}
                <View style={styles.borderTop} />

                <View style={styles.header}>
                    <Image source={require('../assets/logo.png')} style={styles.logo} />
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>FoundU</Text>
                        <Text style={styles.subtitle}>Discover. Connect. Reclaim</Text>
                    </View>

                    {/* Hamburger Icon with Notification Indicator */}
                    <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
                        <View style={styles.menuIconContainer}>
                            <Image source={require('../assets/menuicon.png')} style={styles.icon} />
                            {isLoggedIn && unreadCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Side Menu */}
            <Modal visible={menuVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.sideMenu}>
                        {/* Close Button (Top-Right Corner) */}
                        <TouchableOpacity onPress={() => setMenuVisible(false)} style={styles.closeButton}>
                            <Image source={require('../assets/closeicon.png')} style={styles.icon} />
                        </TouchableOpacity>

                        {/* Menu Items */}
                        <View style={styles.menuItemsContainer}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => handleMenuItemPress('Home')}
                            >
                                <Image source={require('../assets/homeicon.png')} style={styles.menuIcon} />
                                <Text style={styles.menuText}>Home</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => handleMenuItemPress('LostPage')}
                            >
                                <Image source={require('../assets/lostbuttonicon.png')} style={styles.menuIcon} />
                                <Text style={styles.menuText}>Lost</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => handleMenuItemPress('FoundPage')} // Navigate to FoundPage
                            >
                                <Image source={require('../assets/foundbuttonicon.png')} style={styles.menuIcon} />
                                <Text style={styles.menuText}>Found</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => handleMenuItemPress('Notifications')} // Navigate to Notifications
                            >
                                <View style={styles.menuItemWithBadge}>
                                    <Image source={require('../assets/notificationicon.png')} style={styles.menuIcon} />
                                    <Text style={styles.menuText}>Notifications</Text>
                                    {isLoggedIn && unreadCount > 0 && (
                                        <View style={styles.menuNotificationBadge}>
                                            <Text style={styles.menuNotificationBadgeText}>{unreadCount}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* Profile Button */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => handleMenuItemPress('Profile')}
                            >
                                <Image source={require('../assets/profileicon.png')} style={styles.menuIcon} />
                                <Text style={styles.menuText}>Profile</Text>
                            </TouchableOpacity>

                            {/* Login/Logout Button */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setMenuVisible(false);
                                    if (isLoggedIn) {
                                        setLogoutModalVisible(true); // Show the logout confirmation modal
                                    } else {
                                        navigation.navigate('Login'); // Navigate to Login
                                    }
                                }}
                            >
                                <Image
                                    source={require('../assets/signouticon.png')}
                                    style={styles.menuIcon}
                                />
                                <Text style={styles.menuText}>{isLoggedIn ? 'Logout' : 'Login'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Logout Confirmation Modal */}
            <Modal visible={logoutModalVisible} transparent animationType="fade">
                <View style={styles.logoutModalOverlay}>
                    <View style={styles.logoutModal}>
                        <Text style={styles.logoutModalTitle}>Log Out</Text>
                        <Text style={styles.logoutModalMessage}>Are you sure you want to log out?</Text>
                        <View style={styles.logoutModalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setLogoutModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleLogout}
                            >
                                <Text style={styles.confirmButtonText}>Yes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Login Reminder Modal */}
            <Modal visible={loginReminderModalVisible} transparent animationType="fade">
                <View style={styles.loginReminderModalOverlay}>
                    <View style={styles.loginReminderModal}>
                        <Text style={styles.loginReminderTitle}>Login Required</Text>
                        <Text style={styles.loginReminderMessage}>
                            Please log in to access this feature.
                        </Text>
                        <TouchableOpacity
                            style={styles.okButton}
                            onPress={() => setLoginReminderModalVisible(false)}
                        >
                            <Text style={styles.okButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    // Border top for separation
    borderTop: {
        height: 2,
        backgroundColor: '#ccc', // Light gray border
        width: '100%',
    },
    header: {
        height: 110,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 40, // Add padding to push the header down
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    logo: {
        width: 75,
        height: 75,
        resizeMode: 'contain',
    },
    textContainer: {
        flex: 1,
        marginLeft: 5,
    },
    title: {
        fontSize: 30,
        fontFamily: 'Poppins-Bold',
        color: '#000',
    },
    subtitle: {
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        color: '#666',
    },
    menuButton: {
        padding: 20,
    },
    icon: {
        width: 33,
        height: 33,
        resizeMode: 'contain',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start', // Ensure the overlay starts below the header
        marginTop: 80, // Offset the overlay to start below the header
    },
    sideMenu: {
        width: 250,
        height: '50%',
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#79747E',
        borderRadius: 10,
        padding: 20,
        alignItems: 'flex-start',
        position: 'absolute',
        top: 0, // Start at the top of the overlay
        right: 10, // Align menu to the right side
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
    },
    menuItemsContainer: {
        width: '100%',
        marginTop: 40, // Adds spacing below the close button
        alignItems: 'flex-start',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        width: '100%',
    },
    menuIcon: {
        width: 24,
        height: 24,
        marginRight: 10,
        resizeMode: 'contain',
    },
    menuText: {
        fontSize: 24,
        fontFamily: 'Poppins-Regular',
        color: '#333',
    },
    // Logout Modal Styles
    logoutModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute', // Ensure it spans the entire screen
        top: 0, // Start from the top of the screen
        left: 0,
        right: 0,
        bottom: 0, // Cover the entire screen
    },
    logoutModal: {
        width: 300,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    logoutModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    logoutModalMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    logoutModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    cancelButton: {
        backgroundColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#000',
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: '#d9534f',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    // Login Reminder Modal Styles
    loginReminderModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginReminderModal: {
        width: 300,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    loginReminderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    loginReminderMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    okButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        width: '50%',
    },
    okButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    menuIconContainer: {
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    notificationBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    menuItemWithBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    menuNotificationBadge: {
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    menuNotificationBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default Header;
