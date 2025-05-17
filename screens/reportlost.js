import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '../components/header';
import Footer from '../components/footer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageUpload from '../components/ImageUpload';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ReportLostPage = ({ navigation }) => {
    const [form, setForm] = useState({
        name: '',
        landMark: '',
        contact: '',
        dateLost: new Date(),
        timeLost: new Date(),
        description: '',
        images: [],
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const handleImagesUploaded = (images) => {
        setForm(prev => ({
            ...prev,
            images: images.map(img => ({
                url: img.url,
                publicId: img.publicId
            }))
        }));
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);

            // Validate form
            if (!form.name || !form.landMark || !form.contact || !form.description) {
                Alert.alert('Error', 'Please fill in all required fields');
                return;
            }

            if (form.images.length === 0) {
                Alert.alert('Error', 'Please upload at least one image');
                return;
            }

            const userProfile = await AsyncStorage.getItem('userProfile');
            if (!userProfile) {
                Alert.alert('Error', 'User profile not found. Please log in again.');
                return;
            }

            const { name: reporterName, email: reporterEmail } = JSON.parse(userProfile);
            const currentUser = auth.currentUser;

            if (!currentUser) {
                Alert.alert('Error', 'You must be logged in to report a lost item.');
                return;
            }

            // Create the lost item document in Firestore
            const lostItemData = {
                name: form.name,
                landMark: form.landMark,
                contact: form.contact,
                dateLost: form.dateLost,
                timeLost: form.timeLost,
                description: form.description,
                images: form.images,
                reporter: {
                    uid: currentUser.uid,
                    name: reporterName,
                    email: reporterEmail
                },
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Add to Firestore
            const docRef = await addDoc(collection(db, 'lost_items'), lostItemData);

            // Create notification for the user
            const notificationData = {
                userId: currentUser.uid,
                type: 'lost_item_reported',
                title: 'Lost Item Report Submitted',
                message: `You have reported a lost ${form.name}. We will notify you of any updates.`,
                itemId: docRef.id,
                itemName: form.name,
                status: 'unread',
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'notifications'), notificationData);

            // Create activity for admin dashboard
            const activityData = {
                type: 'lost_item_reported',
                description: `${reporterName} reported a lost ${form.name}`,
                itemId: docRef.id,
                itemName: form.name,
                userId: currentUser.uid,
                userName: reporterName,
                userEmail: reporterEmail,
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'activities'), activityData);

            Alert.alert(
                'Success',
                'Lost item reported successfully!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error submitting lost item:', error);
            Alert.alert('Error', 'Failed to save the lost item. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
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

            <View style={styles.titleContainer}>
                <Text style={styles.title}>Report Lost Item</Text>
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.formCard}>
                    <ScrollView contentContainerStyle={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Item Name:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter item name"
                                value={form.name}
                                onChangeText={(value) => handleInputChange('name', value)}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Landmark:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter location landmark"
                                value={form.landMark}
                                onChangeText={(value) => handleInputChange('landMark', value)}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Contact:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter contact number"
                                value={form.contact}
                                keyboardType="numeric"
                                onChangeText={(value) => handleInputChange('contact', value)}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Date Lost:</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateTimeInput}>
                                <Text style={styles.dateTimeText}>
                                    {form.dateLost ? form.dateLost.toDateString() : ''}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={form.dateLost}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            handleInputChange('dateLost', selectedDate);
                                        }
                                    }}
                                />
                            )}
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Time Lost:</Text>
                            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.dateTimeInput}>
                                <Text style={styles.dateTimeText}>
                                    {form.timeLost ? form.timeLost.toLocaleTimeString() : ''}
                                </Text>
                            </TouchableOpacity>
                            {showTimePicker && (
                                <DateTimePicker
                                    value={form.timeLost}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedTime) => {
                                        setShowTimePicker(false);
                                        if (selectedTime) {
                                            handleInputChange('timeLost', selectedTime);
                                        }
                                    }}
                                />
                            )}
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description:</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Enter item description"
                                value={form.description}
                                onChangeText={(value) => handleInputChange('description', value)}
                                multiline
                                numberOfLines={4}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Upload Photos:</Text>
                            <ImageUpload
                                onImagesUploaded={handleImagesUploaded}
                                existingImages={form.images.map(img => img.url)}
                                maxImages={3}
                            />
                        </View>

                        <TouchableOpacity 
                            style={[
                                styles.submitButton,
                                isSubmitting && styles.submitButtonDisabled
                            ]} 
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Report</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>

            <View style={styles.footerContainer}>
                <Footer navigation={navigation} />
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingTop: 20,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    titleContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    formCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    formContainer: {
        paddingBottom: 20,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: '#333',
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    dateTimeInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    dateTimeText: {
        color: '#333',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonDisabled: {
        backgroundColor: '#A5D6A7', // lighter green
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerContainer: {
        marginTop: 'auto',
    },
});

export default ReportLostPage;