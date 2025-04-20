import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/header';
import Footer from '../components/footer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfilePage = () => {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [passwordForDeletion, setPasswordForDeletion] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            const userProfile = await AsyncStorage.getItem('userProfile');
            if (userProfile) {
                const { name, email } = JSON.parse(userProfile);
                setProfile((prevProfile) => ({ ...prevProfile, name, email }));
            }
        };
        fetchProfile();
    }, []);

    const handleInputChange = (field, value) => {
        setProfile({ ...profile, [field]: value });
    };

    const updatePassword = () => {
        if (profile.newPassword !== profile.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match!');
            return;
        }
        Alert.alert('Success', 'Password updated successfully!');
    };

    const confirmDeletion = () => {
        setConfirmingDeletion(true);
    };

    const deleteAccount = () => {
        if (!passwordForDeletion) {
            Alert.alert('Error', 'Please enter your password to confirm deletion.');
            return;
        }
        Alert.alert('Success', 'Account deleted successfully!');
        setConfirmingDeletion(false);
    };

    return (
        <LinearGradient
            colors={['#FFE9E9', '#EDFFBB']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            <Header />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.title}>Profile</Text>

                    {/* Display Name and Email */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Profile Information</Text>
                        <TextInput
                            style={[styles.input, styles.readOnlyInput]}
                            value={profile.name}
                            editable={false} // Make the field read-only
                        />
                        <TextInput
                            style={[styles.input, styles.readOnlyInput]}
                            value={profile.email}
                            editable={false} // Make the field read-only
                        />
                    </View>

                    {/* Update Password */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Update Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Current Password"
                            value={profile.currentPassword}
                            onChangeText={(value) =>
                                setProfile((prevProfile) => ({ ...prevProfile, currentPassword: value }))
                            }
                            secureTextEntry
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            value={profile.newPassword}
                            onChangeText={(value) =>
                                setProfile((prevProfile) => ({ ...prevProfile, newPassword: value }))
                            }
                            secureTextEntry
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            value={profile.confirmPassword}
                            onChangeText={(value) =>
                                setProfile((prevProfile) => ({ ...prevProfile, confirmPassword: value }))
                            }
                            secureTextEntry
                        />
                        <TouchableOpacity style={styles.button} onPress={updatePassword}>
                            <Text style={styles.buttonText}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Delete Account */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Delete Account</Text>
                        <Text style={styles.warningText}>
                            Once your account is deleted, all of its resources and data will be permanently deleted.
                        </Text>
                        <TouchableOpacity style={styles.dangerButton} onPress={confirmDeletion}>
                            <Text style={styles.buttonText}>Delete Account</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Deletion Modal */}
                    {confirmingDeletion && (
                        <View style={styles.modal}>
                            <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
                            <Text style={styles.modalText}>
                                Please enter your password to confirm account deletion.
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                value={passwordForDeletion}
                                onChangeText={setPasswordForDeletion}
                                secureTextEntry
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={() => setConfirmingDeletion(false)}
                                >
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.dangerButton} onPress={deleteAccount}>
                                    <Text style={styles.buttonText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            <Footer />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 100, // Add padding to prevent overlap with the footer
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    readOnlyInput: {
        color: '#888', // Gray text for read-only fields
    },
    button: {
        backgroundColor: '#2c2c2c',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    dangerButton: {
        backgroundColor: '#d9534f',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    warningText: {
        fontSize: 14,
        color: '#d9534f',
        marginBottom: 10,
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        margin: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        marginBottom: 15,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    secondaryButton: {
        backgroundColor: '#e6e6e6',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
});

export default ProfilePage;