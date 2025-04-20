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

const ReportItemForm = ({ formType, onSubmit }) => {
    const [form, setForm] = useState({
        name: '',
        landMark: '',
        contact: '',
        date: new Date(),
        time: new Date(),
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

    const handleSubmit = () => {
        if (!form.name || !form.landMark || !form.contact || !form.description || !form.image) {
            Alert.alert('Error', 'Please fill out all fields and upload a photo.');
            return;
        }

        onSubmit({
            ...form,
            date: form.date.toDateString(),
            time: form.time.toLocaleTimeString(),
        });
    };

    return (
        <View style={styles.formCard}>
            <ScrollView contentContainerStyle={styles.formContainer}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Item Name:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={`Enter ${formType.toLowerCase()} item name`}
                        value={form.name}
                        onChangeText={(value) => handleInputChange('name', value)}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Landmark:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter landmark"
                        value={form.landMark}
                        onChangeText={(value) => handleInputChange('landMark', value)}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contact:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter contact details"
                        value={form.contact}
                        keyboardType="numeric"
                        onChangeText={(value) => handleInputChange('contact', value)}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{`Date ${formType}:`}</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateTimeInput}>
                        <Text style={styles.dateTimeText}>
                            {form.date ? form.date.toDateString() : ''}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={form.date}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) {
                                    handleInputChange('date', selectedDate);
                                }
                            }}
                        />
                    )}
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{`Time ${formType}:`}</Text>
                    <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.dateTimeInput}>
                        <Text style={styles.dateTimeText}>
                            {form.time ? form.time.toLocaleTimeString() : ''}
                        </Text>
                    </TouchableOpacity>
                    {showTimePicker && (
                        <DateTimePicker
                            value={form.time}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selectedTime) => {
                                setShowTimePicker(false);
                                if (selectedTime) {
                                    handleInputChange('time', selectedTime);
                                }
                            }}
                        />
                    )}
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description:</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Enter description"
                        value={form.description}
                        onChangeText={(value) => handleInputChange('description', value)}
                        multiline
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Upload Photo:</Text>
                    <TouchableOpacity style={styles.uploadPhotoButton} onPress={handleImagePick}>
                        <Image
                            source={require('../assets/uploadicon.png')}
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
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    formCard: {
        width: '90%',
        backgroundColor: 'rgba(255, 254, 254, 0.4)',
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        padding: 20,
        marginTop: 20,
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
        justifyContent: 'center',
        marginTop: 20,
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
});

export default ReportItemForm;