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

const ReportFoundPage = ({ navigation }) => {
    const [form, setForm] = useState({
        name: '',
        landMark: '',
        contact: '',
        dateFound: new Date(),
        timeFound: new Date(),
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
                Alert.alert('Error', 'You must be logged in to report a found item.');
                return;
            }

            // Create the found item document in Firestore
            const foundItemData = {
                name: form.name,
                landMark: form.landMark,
                contact: form.contact,
                dateFound: form.dateFound,
                timeFound: form.timeFound,
                description: form.description,
                images: form.images,
                reporter: {
                    uid: currentUser.uid,
                    name: reporterName
                },
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Add to Firestore
            const docRef = await addDoc(collection(db, 'found_items'), foundItemData);

            // Create notification for the user
            const notificationData = {
                userId: currentUser.uid,
                type: 'found_item_reported',
                title: 'Found Item Report Submitted',
                message: `You have reported a found ${form.name}. We will notify you of any updates.`,
                itemId: docRef.id,
                itemName: form.name,
                status: 'unread',
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'notifications'), notificationData);

            // Create activity for admin dashboard
            const activityData = {
                type: 'found_item_reported',
                description: `${reporterName} reported a found ${form.name}`,
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
                'Found item reported successfully!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error submitting found item:', error);
            Alert.alert('Error', 'Failed to save the found item. Please try again.');
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
                <Text style={styles.title}>Report Found Item</Text>
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
                            <Text style={styles.label}>Date Found:</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateTimeInput}>
                                <Text style={styles.dateTimeText}>
                                    {form.dateFound ? form.dateFound.toDateString() : ''}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={form.dateFound}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            handleInputChange('dateFound', selectedDate);
                                        }
                                    }}
                                />
                            )}
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Time Found:</Text>
                            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.dateTimeInput}>
                                <Text style={styles.dateTimeText}>
                                    {form.timeFound ? form.timeFound.toLocaleTimeString() : ''}
                                </Text>
                            </TouchableOpacity>
                            {showTimePicker && (
                                <DateTimePicker
                                    value={form.timeFound}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedTime) => {
                                        setShowTimePicker(false);
                                        if (selectedTime) {
                                            handleInputChange('timeFound', selectedTime);
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

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity 
                                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelButton} 
                                onPress={() => navigation.goBack()}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    titleContainer: {
        marginTop: 140,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    contentContainer: {
        flex: 1,
        marginTop: 20,
        alignItems: 'center',
    },
    formCard: {
        width: 382,
        height: 600,
        backgroundColor: 'rgba(255, 254, 254, 0.4)',
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        padding: 20,
    },
    formContainer: {
        flexGrow: 1,
        paddingBottom: 50,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
        width: 100,
    },
    input: {
        backgroundColor: '#D9D9D9',
        borderRadius: 8,
        height: 40,
        flex: 1,
        paddingHorizontal: 10,
    },
    textArea: {
        height: 108,
    },
    dateTimeInput: {
        backgroundColor: '#D9D9D9',
        borderRadius: 8,
        height: 40,
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    dateTimeText: {
        color: '#000',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
    },
    submitButton: {
        backgroundColor: '#2c2c2c',
        padding: 10,
        borderRadius: 8,
        width: '40%',
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#999',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#E6E6E6',
        padding: 10,
        borderRadius: 8,
        width: '40%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2c2c2c',
    },
    cancelButtonText: {
        color: '#2c2c2c',
        fontWeight: 'bold',
    },
    footerContainer: {
        marginTop: 'auto',
    },
});

export default ReportFoundPage;