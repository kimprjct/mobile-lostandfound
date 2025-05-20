import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { collection, query, orderBy, onSnapshot, doc, getDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const AdminNotification = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const activitiesQuery = query(
            collection(db, 'activities'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(activitiesQuery, async (snapshot) => {
            try {
                const notificationsList = [];
                for (const docSnapshot of snapshot.docs) {
                    const data = docSnapshot.data();
                    if (data && data.description && !data.description.includes('null')) {
                        notificationsList.push({
                            id: docSnapshot.id,
                            ...data,
                            createdAt: data.createdAt?.toDate?.()?.toLocaleString() || 'N/A'
                        });
                    }
                }
                setNotifications(notificationsList);
            } catch (error) {
                console.error('Error processing notifications:', error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const clearAllNotifications = async () => {
        try {
            Alert.alert(
                "Clear All Notifications",
                "Are you sure you want to clear all notifications? This action cannot be undone.",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Clear All",
                        onPress: async () => {
                            setLoading(true);
                            const batch = writeBatch(db);
                            
                            // Delete all activities documents in batches
                            const activitiesRef = collection(db, 'activities');
                            const activitiesSnapshot = await getDocs(activitiesRef);
                            
                            activitiesSnapshot.docs.forEach((doc) => {
                                batch.delete(doc.ref);
                            });

                            await batch.commit();
                            setNotifications([]);
                            setLoading(false);
                            Alert.alert("Success", "All notifications have been cleared");
                        },
                        style: "destructive"
                    }
                ]
            );
        } catch (error) {
            console.error('Error clearing notifications:', error);
            Alert.alert("Error", "Failed to clear notifications");
            setLoading(false);
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity 
                    onPress={clearAllNotifications}
                    style={{ marginRight: 15 }}
                >
                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'found_request':
                return <Ionicons name="search" size={20} color="#fff" />;
            case 'claim_request':
                return <Ionicons name="hand-left" size={20} color="#fff" />;
            default:
                return <Ionicons name="notifications" size={20} color="#fff" />;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'found_request':
                return ['#4CAF50', '#2E7D32'];
            case 'claim_request':
                return ['#2196F3', '#1565C0'];
            default:
                return ['#757575', '#424242'];
        }
    };

    const handleNotificationPress = (notification) => {
        // Navigate based on notification type
        if (notification.type === 'found_request') {
            navigation.navigate('FoundRequests');
        } else if (notification.type === 'claim_request') {
            navigation.navigate('ClaimRequests');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <LinearGradient
            colors={['#FFE9E9', '#EDFFBB']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <ScrollView style={styles.notificationsList}>
                {notifications.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        <Ionicons name="notifications-off-outline" size={50} color="#999" />
                        <Text style={styles.noNotificationsText}>No notifications yet</Text>
                    </View>
                ) : (
                    notifications.map((notification) => (
                        <TouchableOpacity
                            key={notification.id}
                            style={styles.notificationItem}
                            onPress={() => handleNotificationPress(notification)}
                        >
                            <LinearGradient
                                colors={getNotificationColor(notification.type)}
                                style={styles.notificationContent}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <View style={styles.iconContainer}>
                                    {getNotificationIcon(notification.type)}
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.notificationText}>
                                        {notification.description}
                                    </Text>
                                    <Text style={styles.timeText}>
                                        {notification.createdAt}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationsList: {
        flex: 1,
        padding: 16,
    },
    notificationItem: {
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
        marginRight: 8,
    },
    notificationText: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 4,
    },
    timeText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    noNotificationsText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    }
});

export default AdminNotification;