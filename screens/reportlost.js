import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '../components/header';
import Footer from '../components/footer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ReportLostPage = ({ navigation }) => {
    const [form, setForm] = useState({
        name: '',
        landMark: '',
        contact: '',
        dateLost: new Date(),
        timeLost: new Date(),
        description: '',
        image: null,
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const handleInputChange = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const handleImagePick = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need permission to access your photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setForm({ ...form, image: result.assets[0].uri });
        }
    };

    const handleSubmit = async () => {
        try {
            const userProfile = await AsyncStorage.getItem('userProfile');
            if (!userProfile) {
                Alert.alert('Error', 'User profile not found. Please log in again.');
                return;
            }

            const { name: reporterName } = JSON.parse(userProfile);

            const newItem = {
                id: Date.now().toString(),
                name: form.name,
                landMark: form.landMark,
                contact: form.contact,
                dateLost: form.dateLost.toDateString(),
                timeLost: form.timeLost.toLocaleTimeString(),
                description: form.description,
                image: form.image,
                reporter: reporterName, // Use logged-in user's name
            };

            // Overwrite the lost items with the new item
            await AsyncStorage.setItem('lostItems', JSON.stringify([newItem]));

            Alert.alert('Success', 'Lost item reported successfully!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to save the lost item. Please try again.');
            console.error(error);
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

            {/* Title outside the form card */}
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
                                placeholder="" // Empty placeholder
                                value={form.name}
                                onChangeText={(value) => handleInputChange('name', value)}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Landmark:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="" // Empty placeholder
                                value={form.landMark}
                                onChangeText={(value) => handleInputChange('landMark', value)}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Contact:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="" // Empty placeholder
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
                                placeholder="" // Empty placeholder
                                value={form.description}
                                onChangeText={(value) => handleInputChange('description', value)}
                                multiline
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Upload Photo:</Text>
                            <TouchableOpacity style={styles.uploadPhotoButton} onPress={handleImagePick}>
                                <Image
                                    source={require('../assets/uploadicon.png')} // Replace with your upload icon
                                    style={styles.uploadIcon}
                                />
                                <Text style={styles.uploadPhotoText}>Upload Photo</Text>
                            </TouchableOpacity>
                            {form.image && (
                                <Image source={{ uri: form.image }} style={styles.previewImage} />
                            )}
                        </View>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                                <Text style={styles.submitButtonText}>Submit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>

            <Footer />
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
        marginTop: 140, // Adjust to position below the header
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
        height: 580,
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
        width: 100, // Adjust width to align labels
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
        height: 30,
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    dateTimeText: {
        color: '#000',
    },
    uploadPhotoButton: {
        backgroundColor: '#D9D9D9',
        borderRadius: 8,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    uploadIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
    uploadPhotoText: {
        fontSize: 16,
        color: '#000',
    },
    previewImage: {
        width: '100%',
        height: 150,
        borderRadius: 10,
        marginBottom: 10,
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
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    closeButton: {
        backgroundColor: '#E6E6E6',
        padding: 10,
        borderRadius: 8,
        width: '40%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2c2c2c',
    },
    closeButtonText: {
        color: '#2c2c2c',
        fontWeight: 'bold',
    },
});

export default ReportLostPage;