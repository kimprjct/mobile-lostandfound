import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Animated,
    Easing,
    TouchableOpacity,  // Add this import
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/header';
import Footer from '../components/footer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ButtonWithAnimation = ({ onPress, style, children }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <AnimatedTouchable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                style,
                {
                    transform: [{ scale: scaleAnim }]
                }
            ]}
        >
            {children}
        </AnimatedTouchable>
    );
};

const ProfilePage = () => {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        department: '',
        program: '',
        yearLevel: '',
        gender: '',
        address: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [passwordForDeletion, setPasswordForDeletion] = useState('');

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    const fetchProfile = async () => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                console.log('No user ID found');
                return;
            }

            // First try to get data from Firestore collection 'users'
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('uid', '==', userId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                console.log('Found user data:', userData);

                setProfile(prev => ({
                    ...prev,
                    name: userData.name || '',
                    email: userData.email || '',
                    department: userData.department || '',
                    program: userData.program || '',
                    yearLevel: userData.yearLevel || '',
                    gender: userData.gender || '',
                    address: userData.address || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));

                // Cache the data
                await AsyncStorage.setItem('userProfile', JSON.stringify(userData));
            } else {
                // If not found in 'users' collection, try direct document lookup
                const userDocRef = doc(db, 'users', userId);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    console.log('Found user data from direct lookup:', userData);

                    setProfile(prev => ({
                        ...prev,
                        name: userData.name || '',
                        email: userData.email || '',
                        department: userData.department || '',
                        program: userData.program || '',
                        yearLevel: userData.yearLevel || '',
                        gender: userData.gender || '',
                        address: userData.address || '',
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    }));

                    await AsyncStorage.setItem('userProfile', JSON.stringify(userData));
                } else {
                    console.log('No user document found in either location');
                    // Try AsyncStorage as last resort
                    const storedProfile = await AsyncStorage.getItem('userProfile');
                    if (storedProfile) {
                        const parsedProfile = JSON.parse(storedProfile);
                        setProfile(prev => ({
                            ...prev,
                            ...parsedProfile
                        }));
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Failed to load profile data');
        }
    };

    useEffect(() => {
        fetchProfile();

        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            })
        ]).start();

        // Set up a listener for auth state changes
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchProfile();
            }
        });

        return () => unsubscribe();
    }, []);

    const updatePassword = () => {
        if (profile.newPassword !== profile.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match!');
            return;
        }
        Alert.alert('Success', 'Password updated successfully!');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={['#FFE9E9', '#EDFFBB']}
                style={styles.container}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Header />
                <ScrollView style={styles.scrollView}>
                    <Animated.Text 
                        style={[
                            styles.title,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }]
                            }
                        ]}
                    >
                        Profile
                    </Animated.Text>

                    {/* Personal Information Section */}
                    <Animated.View 
                        style={[
                            styles.detailSection,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                        <View style={styles.detailCard}>
                            <View style={styles.detailRow}>
                                <Ionicons name="person" size={20} color="#2E8B57" style={styles.detailIcon} />
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Full Name</Text>
                                    <Text style={styles.detailValue}>{profile.name}</Text>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <Ionicons name="male-female" size={20} color="#2E8B57" style={styles.detailIcon} />
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Gender</Text>
                                    <Text style={styles.detailValue}>{profile.gender}</Text>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <Ionicons name="location" size={20} color="#2E8B57" style={styles.detailIcon} />
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Address</Text>
                                    <Text style={styles.detailValue}>{profile.address}</Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Academic Information Section */}
                    <Animated.View 
                        style={[
                            styles.detailSection,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Academic Information</Text>
                        <View style={styles.detailCard}>
                            <View style={styles.detailRow}>
                                <Ionicons name="business" size={20} color="#2E8B57" style={styles.detailIcon} />
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Department</Text>
                                    <Text style={styles.detailValue}>{profile.department}</Text>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <Ionicons name="school" size={20} color="#2E8B57" style={styles.detailIcon} />
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Program</Text>
                                    <Text style={styles.detailValue}>{profile.program}</Text>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <Ionicons name="calendar" size={20} color="#2E8B57" style={styles.detailIcon} />
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Year Level</Text>
                                    <Text style={styles.detailValue}>{profile.yearLevel}</Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Contact Information Section */}
                    <Animated.View 
                        style={[
                            styles.detailSection,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Contact Information</Text>
                        <View style={styles.detailCard}>
                            <View style={styles.detailRow}>
                                <Ionicons name="mail" size={20} color="#2E8B57" style={styles.detailIcon} />
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Email</Text>
                                    <Text style={styles.detailValue}>{profile.email}</Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Change Password Section */}
                    <Animated.View 
                        style={[
                            styles.detailSection,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Change Password</Text>
                        <View style={styles.detailCard}>
                            <TextInput
                                style={styles.input}
                                placeholder="Current Password"
                                value={profile.currentPassword}
                                onChangeText={(value) => setProfile(prev => ({ ...prev, currentPassword: value }))}
                                secureTextEntry
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="New Password"
                                value={profile.newPassword}
                                onChangeText={(value) => setProfile(prev => ({ ...prev, newPassword: value }))}
                                secureTextEntry
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                value={profile.confirmPassword}
                                onChangeText={(value) => setProfile(prev => ({ ...prev, confirmPassword: value }))}
                                secureTextEntry
                            />
                            <ButtonWithAnimation style={styles.updateButton} onPress={updatePassword}>
                                <Text style={styles.buttonText}>Update Password</Text>
                            </ButtonWithAnimation>
                        </View>
                    </Animated.View>

                    {/* Delete Account Section */}
                    <Animated.View 
                        style={[
                            styles.detailSection,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                                marginBottom: 100, // Add extra margin specifically for this section
                            }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Delete Account</Text>
                        <View style={styles.detailCard}>
                            <Text style={styles.warningText}>
                                Once your account is deleted, all of its resources and data will be permanently deleted.
                            </Text>
                            <ButtonWithAnimation style={styles.deleteButton} onPress={() => setConfirmingDeletion(true)}>
                                <Text style={styles.buttonText}>Delete Account</Text>
                            </ButtonWithAnimation>
                        </View>
                    </Animated.View>
                </ScrollView>
                <Footer />
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        padding: 20,
        paddingBottom: 100,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    detailSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E8B57', // Changed from '#4C66FF' to forest green
        marginBottom: 12,
    },
    detailCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 15,
        padding: 16,
        elevation: 8, // Increased elevation for Android
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        marginBottom: 12,
        marginHorizontal: 2,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        transform: [{ translateY: -2 }], // Slight lift effect
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12, // Increased padding
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        marginHorizontal: 4,
    },
    detailIcon: {
        marginRight: 12,
        width: 24,
        textAlign: 'center',
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 12,
    },
    updateButton: {
        backgroundColor: '#2E8B57', // Changed from '#4C66FF' to forest green
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    deleteButton: {
        backgroundColor: '#FF4B4B',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    warningText: {
        fontSize: 14,
        color: '#FF4B4B',
        marginBottom: 12,
    },
});

export default ProfilePage;