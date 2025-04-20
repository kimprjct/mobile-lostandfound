import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import CheckBox from 'expo-checkbox';
import Header from '../components/header';
import Footer from '../components/footer';

const VerificationForm = ({ navigation, route }) => {
    const { verificationType = 'Lost Item Verification', itemId, onSubmit } = route.params || {}; // Default to "Lost Item Verification"

    const [form, setForm] = useState({
        itemName: '',
        dateFound: new Date(),
        timeFound: new Date(),
        location: '',
        contact: '',
        description: '',
        image: null,
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [certified, setCertified] = useState(false);

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
            const fileName = result.assets[0].uri.split('/').pop();
            setForm({ ...form, image: fileName });
        }
    };

    const handleSubmit = () => {
        if (!certified) {
            Alert.alert('Certification Required', 'Please certify that the information provided is truthful.');
            return;
        }

        if (!form.itemName || !form.location || !form.contact || !form.description || !form.image) {
            Alert.alert('Error', 'Please fill out all fields and upload a photo.');
            return;
        }

        Alert.alert('Success', `${verificationType} submitted successfully!`);
        if (onSubmit) onSubmit(); // Call the onSubmit callback to update the button state
        navigation.goBack();
    };

    const handleReset = () => {
        setForm({
            itemName: '',
            dateFound: new Date(),
            timeFound: new Date(),
            location: '',
            contact: '',
            description: '',
            image: null,
        });
        setCertified(false);
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
                {/* Ensure the title is "Lost Item Verification" */}
                <Text style={styles.title}>{verificationType}</Text>
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.formCard}>
                    <ScrollView contentContainerStyle={styles.formContainer}>
                        {/* Item Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Item Name:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter item name"
                                value={form.itemName}
                                onChangeText={(value) => handleInputChange('itemName', value)}
                            />
                        </View>

                        {/* Date Found */}
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

                        {/* Time Found */}
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

                        {/* Location */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter location"
                                value={form.location}
                                onChangeText={(value) => handleInputChange('location', value)}
                            />
                        </View>

                        {/* Contact Details */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Contact Details:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter contact details"
                                value={form.contact}
                                keyboardType="numeric"
                                onChangeText={(value) => handleInputChange('contact', value)}
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description:</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Enter description of the lost item"
                                value={form.description}
                                onChangeText={(value) => handleInputChange('description', value)}
                                multiline
                            />
                        </View>

                        {/* Upload Photo */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Upload Photo:</Text>
                            {!form.image ? (
                                <TouchableOpacity style={styles.uploadPhotoButton} onPress={handleImagePick}>
                                    <Image
                                        source={require('../assets/uploadicon.png')}
                                        style={styles.uploadIcon}
                                    />
                                    <Text style={styles.uploadPhotoText}>Upload Photo</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.fileNameText}>{form.image}</Text>
                            )}
                        </View>

                        {/* Certification Checkbox */}
                        <View style={styles.checkboxContainer}>
                            <CheckBox value={certified} onValueChange={setCertified} />
                            <Text style={styles.checkboxText}>
                                I certify that I lost this item and the information provided is accurate and truthful.
                            </Text>
                        </View>

                        {/* Submit and Reset Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                                <Text style={styles.submitButtonText}>Submit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                                <Text style={styles.resetButtonText}>Reset</Text>
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
        height: 650,
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
    uploadPhotoButton: {
        backgroundColor: '#D9D9D9',
        borderRadius: 8,
        height: 40,
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
        marginBottom: 20,
    },
    fileNameText: {
        fontSize: 14,
        color: '#000',
        marginTop: 10,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 20,
    },
    checkboxText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
        flex: 1,
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
    resetButton: {
        backgroundColor: '#E6E6E6',
        padding: 10,
        borderRadius: 8,
        width: '40%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2c2c2c',
    },
    resetButtonText: {
        color: '#2c2c2c',
        fontWeight: 'bold',
    },
});

export default VerificationForm;