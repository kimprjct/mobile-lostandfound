import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, Modal, ScrollView } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const Header = ({ navigation }) => {
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);

    useEffect(() => {
        // Query for all admin notifications (activities)
        const activitiesQuery = query(
            collection(db, 'activities'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(activitiesQuery, async (snapshot) => {
            try {
                const notificationsList = [];
                for (const docSnapshot of snapshot.docs) {
                    const data = docSnapshot.data();
                    let itemData = null;

                    // Fetch related item details if itemId exists
                    if (data.itemId) {
                        try {
                            const collectionName = data.type.includes('lost') ? 'lost_items' : 'found_items';
                            const itemDocRef = doc(db, collectionName, data.itemId);
                            const itemDocSnap = await getDoc(itemDocRef);
                            if (itemDocSnap.exists()) {
                                itemData = {
                                    ...itemDocSnap.data(),
                                    id: itemDocSnap.id
                                };
                            }
                        } catch (error) {
                            console.error('Error fetching item details:', error);
                        }
                    }

                    notificationsList.push({
                        id: docSnapshot.id,
                        ...data,
                        itemData,
                        createdAt: data.createdAt?.toDate?.()?.toLocaleString() || 'N/A'
                    });
                }
                setNotifications(notificationsList);
                setUnreadCount(notificationsList.filter(n => n.status === 'unread').length);
            } catch (error) {
                console.error('Error processing notifications:', error);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleNotificationPress = () => {
        setShowNotifications(true);
    };

    const handleLogout = () => {
        setDropdownVisible(false);
        navigation.navigate('Login');
    };

    const toggleDropdown = () => {
        setDropdownVisible(!isDropdownVisible);
    };

    const getNotificationIcon = () => {
        if (unreadCount > 0) {
            return (
                <View style={styles.notificationContainer}>
                    <Image
                        source={require('../assets/bell.png')}
                        style={styles.notificationIcon}
                    />
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount}</Text>
                    </View>
                </View>
            );
        }
        return (
            <Image
                source={require('../assets/bell.png')}
                style={styles.notificationIcon}
            />
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* SNSU Logo */}
                <Image
                    source={require('../assets/logo.png')}
                    style={styles.logo}
                />

                {/* Title and Subtitle */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>FoundU</Text>
                    <Text style={styles.subtitle}>Discover. Connect. Reclaim.</Text>
                </View>

                {/* Notification Bell */}
                <TouchableOpacity 
                    style={styles.notificationButton}
                    onPress={handleNotificationPress}
                >
                    {getNotificationIcon()}
                </TouchableOpacity>

                {/* Admin Button and Dropdown */}
                <View style={styles.adminContainer}>
                    <TouchableOpacity onPress={toggleDropdown} style={styles.adminButton}>
                        <Text style={styles.adminText}>admin ▾</Text>
                    </TouchableOpacity>

                    {/* Dropdown Menu */}
                    {isDropdownVisible && (
                        <View style={styles.dropdownMenu}>
                            <TouchableOpacity onPress={handleLogout} style={styles.dropdownItem}>
                                <Text style={styles.dropdownText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* Notifications Modal */}
            <Modal
                visible={showNotifications}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowNotifications(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Notifications</Text>
                            <TouchableOpacity 
                                style={styles.closeButton}
                                onPress={() => setShowNotifications(false)}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.notificationsList}>
                            {notifications.length === 0 ? (
                                <Text style={styles.noNotifications}>No new notifications</Text>
                            ) : (
                                notifications.map((notification) => (
                                    <View key={notification.id} style={styles.notificationItem}>
                                        <View style={styles.notificationHeader}>
                                            <View style={[
                                                styles.statusDot,
                                                notification.status === 'unread' && styles.unreadDot
                                            ]} />
                                            <Text style={styles.notificationTitle}>{notification.title}</Text>
                                        </View>
                                        <Text style={styles.notificationMessage}>{notification.message}</Text>
                                        <Text style={styles.notificationTime}>{notification.createdAt}</Text>
                                        <TouchableOpacity 
                                            style={styles.viewDetailsButton}
                                            onPress={() => {
                                                setShowNotifications(false);
                                                setSelectedNotification(notification);
                                            }}
                                        >
                                            <Text style={styles.viewDetailsText}>View Details</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        {selectedNotification?.itemData && selectedNotification.itemData.images && (
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                style={styles.modalImageScrollView}
                            >
                                {selectedNotification.itemData.images.map((image, index) => (
                                    <Image 
                                        key={index}
                                        source={{ uri: image.url }}
                                        style={styles.modalImage}
                                        resizeMode="cover"
                                    />
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#fff',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        paddingTop: 30,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    logo: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
    },
    titleContainer: {
        flex: 1,
        marginLeft: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
    },
    notificationButton: {
        padding: 10,
        marginRight: 10,
    },
    notificationIcon: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
    },
    adminContainer: {
        position: 'relative',
    },
    adminButton: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    adminText: {
        color: 'black',
        fontWeight: 'normal',
        fontSize: 18,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 40,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 5,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        zIndex: 10,
    },
    dropdownItem: {
        padding: 10,
        borderBottomWidth: 3,
        borderBottomColor: '#ccc',
        marginRight: 10,
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
    },
    notificationContainer: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        right: -6,
        top: -3,
        backgroundColor: 'red',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        backgroundColor: '#000',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    notificationsList: {
        flex: 1,
    },
    notificationItem: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#999',
        marginRight: 8,
    },
    unreadDot: {
        backgroundColor: '#ff3b30',
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    notificationTime: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    noNotifications: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 20,
    },
    viewDetailsButton: {
        backgroundColor: '#4C66FF',
        padding: 8,
        borderRadius: 5,
        alignSelf: 'flex-end',
    },
    viewDetailsText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    modalImageScrollView: {
        width: '100%',
        height: 250,
        marginVertical: 10,
    },
    modalImage: {
        width: 300,
        height: 250,
        borderRadius: 12,
        marginRight: 10,
        backgroundColor: '#f0f0f0',
    },
});

export default Header;
