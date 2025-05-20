import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, Modal, ScrollView } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createNotification, notificationTypes } from '../services/NotificationService';

// Add this function near the top of the file
const getNotificationColor = (type) => {
    switch (type) {
        case 'found_request':
            return '#4CAF50';
        case 'claim_request':
            return '#2196F3';
        case 'claim_approved':
        case 'found_approved':
            return '#8BC34A';
        case 'claim_rejected':
        case 'found_rejected':
            return '#F44336';
        default:
            return '#757575';
    }
};

// Add this function before the Header component
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';

  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

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

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'found_item_submitted':
                return <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />;
            case 'lost_item_reported':
                return <Ionicons name="search" size={24} color="#FF9800" />;
            case 'claim_request':
                return <Ionicons name="hand-left" size={24} color="#2196F3" />;
            case 'found_request':
                return <Ionicons name="location" size={24} color="#9C27B0" />;
            case 'claim_approved':
            case 'found_approved':
                return <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />;
            case 'claim_rejected':
            case 'found_rejected':
                return <Ionicons name="close-circle" size={24} color="#F44336" />;
            default:
                return <Ionicons name="notifications" size={24} color="#757575" />;
        }
    };

    const handleNotificationClick = (notification) => {
        setShowNotifications(false); // Close notifications modal

        switch (notification.type) {
            case 'claim_request':
                navigation.navigate('ClaimRequests', {
                    openModalForId: notification.itemId,
                    claimId: notification.claimId
                });
                break;
            case 'found_item_reported':
                navigation.navigate('AdminManageFound', {
                    openModalForId: notification.itemId
                });
                break;
            case 'lost_item_reported':
                navigation.navigate('AdminManageLost', {
                    openModalForId: notification.itemId
                });
                break;
            default:
                console.log('Unknown notification type:', notification.type);
        }
    };

    const handleApproveClaim = async () => {
        // ... existing approval logic ...
        await createNotification(
            notificationTypes.CLAIM_APPROVED,
            'Claim Approved',
            `Claim for ${itemName} has been approved`,
            itemId,
            userId
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
                    <View style={styles.notificationContainer}>
                        <Ionicons name="notifications-outline" size={24} color="#333" />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
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
                            <Text style={styles.modalTitle}>Recent Activities</Text>
                            <TouchableOpacity 
                                style={styles.closeButton}
                                onPress={() => setShowNotifications(false)}
                            >
                                <Ionicons name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.notificationsList}>
                            {notifications.length === 0 ? (
                                <View style={styles.emptyStateContainer}>
                                    <Ionicons name="notifications-off-outline" size={50} color="#ccc" />
                                    <Text style={styles.noNotifications}>No notifications yet</Text>
                                </View>
                            ) : (
                                notifications.map((notification) => (
                                    <TouchableOpacity 
                                        key={notification.id} 
                                        style={[
                                            styles.notificationItem,
                                            notification.status === 'unread' && styles.unreadNotification
                                        ]}
                                        onPress={() => handleNotificationClick(notification)}
                                    >
                                        <View style={styles.notificationContent}>
                                            <View style={[
                                                styles.notificationIconContainer,
                                                { backgroundColor: getNotificationColor(notification.type) }
                                            ]}>
                                                {getNotificationIcon(notification.type)}
                                            </View>
                                            <View style={styles.notificationTextContainer}>
                                                <Text style={styles.notificationTitle}>
                                                    {notification.description || notification.title}
                                                </Text>
                                                <Text style={styles.notificationTime}>
                                                    {formatTimestamp(notification.createdAt)}
                                                </Text>
                                            </View>
                                            <Ionicons 
                                                name="chevron-forward" 
                                                size={20} 
                                                color="#ccc" 
                                                style={styles.chevron}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
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
        padding: 5,
        paddingTop: 5,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    logo: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
    },
    titleContainer: {
        flex: 1,
        marginLeft: 2,
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
        marginRight: 6,
    },
    notificationIcon: {
        width: 28,
        height: 28,
        resizeMode: 'contain',
    },
    adminContainer: {
        position: 'relative',
    },
    adminButton: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 9,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginRight: 10,
    },
    adminText: {
        color: 'black',
        fontWeight: 'normal',
        fontSize: 14,
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
        right: -8,
        top: -8,
        backgroundColor: '#FF3B30',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#fff',
        marginTop: 100, // Increased from 60 to push content lower
        maxHeight: '90%', // Add this to limit height
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15, // Reduced from 20
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20, // Reduced from 24
        fontWeight: 'bold',
        color: '#333',
    },
    notificationsList: {
        flex: 1,
    },
    notificationItem: {
        backgroundColor: '#fff',
        padding: 12, // Reduced from 16
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    unreadNotification: {
        backgroundColor: '#F8F9FA',
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationIconContainer: {
        width: 32, // Reduced from 40
        height: 32, // Reduced from 40
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8, // Reduced from 12
    },
    notificationTextContainer: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 14, // Reduced from 16
        color: '#333',
        marginBottom: 2, // Reduced from 4
        lineHeight: 20, // Reduced from 22
    },
    notificationTime: {
        fontSize: 12, // Reduced from 13
        color: '#999',
    },
    chevron: {
        marginLeft: 12,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    noNotifications: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    }
});

export default Header;
