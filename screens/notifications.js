import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
    Modal,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/header';
import Footer from '../components/footer';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getNotificationColor = (type) => {
    if (type.includes('approved')) return '#4CAF50';
    if (type.includes('rejected')) return '#FF3B30';
    if (type.includes('submitted')) return '#4C66FF';
    return '#666';
};

const getNotificationIcon = (type) => {
    if (type.includes('approved')) return '✓';
    if (type.includes('rejected')) return '✕';
    if (type.includes('submitted')) return '!';
    return '•';
};

const NotificationsScreen = () => {
    const [notifications, setNotifications] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [selectedNotifications, setSelectedNotifications] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(user ? true : false);
        });

        return () => unsubscribeAuth();
    }, []);

    // Set up notifications listener when user is authenticated
    useEffect(() => {
        let unsubscribeNotifications = null;

        const loadNotifications = async () => {
            try {
                // Load notifications from AsyncStorage
                const storedNotifications = await AsyncStorage.getItem('notifications');
                if (storedNotifications) {
                    setNotifications(JSON.parse(storedNotifications));
                }

                if (user) {
                    // Create a query for user's notifications
                    const notificationsQuery = query(
                        collection(db, 'notifications'),
                        where('userId', '==', user.uid),
                        orderBy('createdAt', 'desc')
                    );

                    // Set up real-time listener
                    unsubscribeNotifications = onSnapshot(notificationsQuery, async (snapshot) => {
                        try {
                            const promises = snapshot.docs.map(async (docSnapshot) => {
                                const data = docSnapshot.data();
                                let itemData = null;

                                // Fetch item details if itemId exists
                                if (data.itemId) {
                                    try {
                                        // Determine the collection name based on the notification type
                                        let collectionName;
                                        if (data.type.includes('claim_request')) {
                                            collectionName = 'claim_requests';
                                        } else if (data.type.includes('found_request')) {
                                            collectionName = 'found_requests';
                                        } else if (data.type.includes('lost')) {
                                            collectionName = 'lost_items';
                                        } else {
                                            collectionName = 'found_items';
                                        }

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

                                return {
                                    id: docSnapshot.id,
                                    ...data,
                                    itemData,
                                    createdAt: data.createdAt?.toDate?.()?.toLocaleString() || 'N/A'
                                };
                            });

                            const resolvedNotifications = await Promise.all(promises);
                            
                            // Store notifications in AsyncStorage
                            await AsyncStorage.setItem('notifications', JSON.stringify(resolvedNotifications));
                            setNotifications(resolvedNotifications);
                        } catch (error) {
                            console.error('Error processing notifications:', error);
                            Alert.alert(
                                'Error',
                                'There was an error loading your notifications. Please try again later.'
                            );
                        } finally {
                            setLoading(false);
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading notifications:', error);
                setLoading(false);
            }
        };

        loadNotifications();

        return () => {
            if (unsubscribeNotifications) {
                unsubscribeNotifications();
            }
        };
    }, [user]);

    const handleNotificationPress = async (notification) => {
        if (isSelectionMode) {
            // Handle selection
            const newSelected = new Set(selectedNotifications);
            if (newSelected.has(notification.id)) {
                newSelected.delete(notification.id);
            } else {
                newSelected.add(notification.id);
            }
            setSelectedNotifications(newSelected);
            return;
        }

        setSelectedNotification(notification);
        setModalVisible(true);

        // Mark notification as read if it's unread
        if (notification.status === 'unread') {
            try {
                // Update in Firestore if user is logged in
                if (user) {
                    await updateDoc(doc(db, 'notifications', notification.id), {
                        status: 'read'
                    });
                }

                // Update in local storage
                const updatedNotifications = notifications.map(n => 
                    n.id === notification.id ? { ...n, status: 'read' } : n
                );
                await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
                setNotifications(updatedNotifications);
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }
    };

    const handleLongPress = (notification) => {
        setIsSelectionMode(true);
        setSelectedNotifications(new Set([notification.id]));
    };

    const handleDeleteSelected = async () => {
        Alert.alert(
            'Delete Notifications',
            'Are you sure you want to delete selected notifications?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Delete from Firestore if user is logged in
                            if (user) {
                                const deletePromises = Array.from(selectedNotifications).map(id =>
                                    deleteDoc(doc(db, 'notifications', id))
                                );
                                await Promise.all(deletePromises);
                            }

                            // Delete from local storage
                            const updatedNotifications = notifications.filter(
                                n => !selectedNotifications.has(n.id)
                            );
                            await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
                            setNotifications(updatedNotifications);
                            setSelectedNotifications(new Set());
                            setIsSelectionMode(false);
                        } catch (error) {
                            console.error('Error deleting notifications:', error);
                            Alert.alert('Error', 'Failed to delete notifications');
                        }
                    }
                }
            ]
        );
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedNotification(null);
    };

    const renderNotificationCard = (notification) => {
        const color = getNotificationColor(notification.type);
        const icon = getNotificationIcon(notification.type);
        const isSelected = selectedNotifications.has(notification.id);
        
        return (
            <TouchableOpacity
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
                onLongPress={() => handleLongPress(notification)}
                style={[
                    styles.cardBox,
                    notification.status === 'unread' && styles.unreadCard,
                    isSelected && styles.selectedCard,
                    { borderLeftColor: color }
                ]}
            >
                {isSelectionMode && (
                    <View style={styles.checkboxContainer}>
                        <View style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected
                        ]}>
                            {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                    </View>
                )}
                <View style={styles.notificationHeader}>
                    <View style={[styles.statusIcon, { backgroundColor: color }]}>
                        <Text style={styles.statusIconText}>{icon}</Text>
                    </View>
                    <Text style={styles.title}>{notification.title}</Text>
                </View>
                
                {notification.itemData && notification.itemData.images && notification.itemData.images.length > 0 && (
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.imageScrollView}
                    >
                        {notification.itemData.images.map((image, index) => (
                            <Image 
                                key={index}
                                source={{ uri: image.url }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>
                )}
                
                <Text style={styles.message}>{notification.message}</Text>
                <Text style={styles.timestamp}>{notification.createdAt}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <LinearGradient
            colors={['#FFE9E9', '#EDFFBB']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            <View style={styles.headerContainer}>
                <Header />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollView}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.notificationsText}>Notifications</Text>
                        {isSelectionMode && (
                            <View style={styles.selectionHeader}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        setIsSelectionMode(false);
                                        setSelectedNotifications(new Set());
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={handleDeleteSelected}
                                >
                                    <Text style={styles.deleteButtonText}>Delete Selected</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {!user ? (
                        <Text style={styles.emptyText}>Please log in to view notifications</Text>
                    ) : loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4C66FF" />
                            <Text style={styles.loadingText}>Loading notifications...</Text>
                        </View>
                    ) : notifications.length === 0 ? (
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    ) : (
                        notifications.map(renderNotificationCard)
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={handleCloseModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleCloseModal}
                        >
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>
                            {selectedNotification?.title}
                        </Text>
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
                        <ScrollView style={styles.modalDetails}>
                            <Text style={styles.modalText}>
                                {selectedNotification?.message}
                            </Text>
                            {selectedNotification?.itemData && (
                                <View style={styles.itemDetails}>
                                    <Text style={styles.itemDetailText}>Item Name: {selectedNotification.itemData.name}</Text>
                                    <Text style={styles.itemDetailText}>Location: {selectedNotification.itemData.landMark}</Text>
                                    <Text style={styles.itemDetailText}>
                                        {selectedNotification.type === 'lost_item_reported' ? 'Date Lost: ' : 'Date Found: '}
                                        {selectedNotification.itemData.dateLost?.toDate?.()?.toLocaleDateString() || 
                                         selectedNotification.itemData.dateFound?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                    </Text>
                                    <Text style={styles.itemDetailText}>Description: {selectedNotification.itemData.description}</Text>
                                    <Text style={styles.itemDetailText}>Status: {selectedNotification.itemData.status}</Text>
                                    <Text style={styles.itemDetailText}>Contact: {selectedNotification.itemData.contact}</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Footer />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#4C66FF',
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        width: '100%',
        zIndex: 10,
    },
    keyboardView: {
        flex: 1,
        width: '100%',
    },
    scrollView: {
        flexGrow: 1,
        alignItems: 'center',
        paddingTop: 150,
        paddingBottom: 20,
    },
    titleContainer: {
        marginBottom: 20,
    },
    notificationsText: {
        fontSize: 35,
        fontWeight: 'bold',
        color: 'black',
        fontFamily: 'Inter',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    cardBox: {
        width: 350,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1D1B20A0',
        shadowColor: 'black',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
        marginBottom: 15,
    },
    unreadCard: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderLeftWidth: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        marginBottom: 10,
        color: '#333',
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
    },
    imageScrollView: {
        marginVertical: 10,
        height: 150,
    },
    image: {
        width: 150,
        height: 150,
        borderRadius: 12,
        marginRight: 10,
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
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalImageScrollView: {
        marginVertical: 10,
        maxHeight: 250,
    },
    modalImage: {
        width: 250,
        height: 250,
        borderRadius: 12,
        marginRight: 10,
    },
    modalText: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 20,
    },
    itemDetails: {
        width: '100%',
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
    },
    itemDetailText: {
        fontSize: 14,
        marginBottom: 8,
        color: '#333',
    },
    modalButton: {
        backgroundColor: '#4C66FF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        position: 'absolute',
        right: 10,
        top: 10,
        zIndex: 1,
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
    modalDetails: {
        maxHeight: '60%',
        width: '100%',
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    statusIconText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    selectedCard: {
        backgroundColor: 'rgba(76, 102, 255, 0.1)',
    },
    checkboxContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4C66FF',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    checkboxSelected: {
        backgroundColor: '#4C66FF',
    },
    checkmark: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    selectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 10,
    },
    cancelButton: {
        padding: 10,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
        padding: 10,
        borderRadius: 5,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default NotificationsScreen;
