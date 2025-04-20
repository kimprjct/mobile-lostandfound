import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CheckBox from 'expo-checkbox';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import Footer from '../components/footer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    const navigation = useNavigation();

    useEffect(() => {
        async function checkLoginStatus() {
            const userToken = await AsyncStorage.getItem('userToken');
            console.log('User Token:', userToken); // Debugging
            setIsLoggedIn(!!userToken); // Set login state based on token
        }

        checkLoginStatus();
    }, []);

    const handleLogin = async () => {
        if (email === 'admin@gmail.com' && password === '12345678') {
            const adminProfile = { name: 'Admin', email }; // Example admin profile
            await AsyncStorage.setItem('userProfile', JSON.stringify(adminProfile));
            await AsyncStorage.setItem('userToken', 'adminToken'); // Save a token for admin
            if (onLogin) {
                await onLogin('adminToken'); // Call the onLogin function passed from App.js
            }
            setTimeout(() => {
                navigation.navigate('HomeAdmin'); // Navigate to HomeAdmin after login
            }, 0); // Ensure state updates before navigation
        } else if (email === 'kpareja@ssct.edu.ph' && password === '12345678') {
            const userProfile = { name: 'K. Pareja', email }; // Example profile
            await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
            await AsyncStorage.setItem('userToken', 'dummyToken'); // Save a dummy token
            if (onLogin) {
                await onLogin('dummyToken'); // Call the onLogin function passed from App.js
            }
            setTimeout(() => {
                navigation.navigate('Home'); // Navigate to Home after login
            }, 0); // Ensure state updates before navigation
        } else {
            setError('Invalid email or password'); // Display error message
        }
    };

    return (
        <LinearGradient 
            colors={['#FFE9E9', '#EDFFBB']} 
            style={styles.container}
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} // Left to Right Gradient
        >
            <View style={styles.headerContainer}>
                <Header />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollView} keyboardShouldPersistTaps="handled">
                    <View style={styles.titleContainer}>
                        <Text style={styles.snsuText}>SNSU</Text>
                        <Text style={styles.lostFoundText}>Lost and Found System</Text>
                    </View>
                    
                    <View style={styles.loginBox}>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Email address" 
                            placeholderTextColor="#4A4A4A" 
                            keyboardType="email-address" 
                            value={email} 
                            onChangeText={setEmail}
                        />

                        <TextInput 
                            style={styles.input} 
                            placeholder="Password" 
                            placeholderTextColor="#4A4A4A" 
                            secureTextEntry 
                            value={password} 
                            onChangeText={setPassword}
                        />

                        <View style={styles.rememberContainer}>
                            <CheckBox value={rememberMe} onValueChange={setRememberMe} />
                            <Text style={styles.rememberText}>Remember me</Text>
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <TouchableOpacity onPress={handleLogin} style={styles.button}>
                            <Text style={styles.buttonText}>Log in</Text>
                        </TouchableOpacity>

                        <TouchableOpacity>
                            <Text style={styles.forgotPassword}>Forgot your password?</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Footer />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        justifyContent: 'center',
        paddingTop: 5, 
    },
    titleContainer: {
        marginTop: -100,
        alignItems: 'center',
        marginBottom: 40,
    },
    snsuText: {
        fontSize: 50,
        fontWeight: '800',
        color: 'green',
        fontFamily: 'Inter',
    },
    lostFoundText: {
        fontSize: 35,
        fontWeight: 'bold',
        color: 'black',
        fontFamily: 'Inter',
    },
    loginBox: {
        width: '80%',
        backgroundColor: 'rgba(255, 255, 255, 0.32)',
        padding: 40,
        borderRadius: 24,
        borderWidth: 1,
        marginTop: 30, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, // Smaller shadow offset
        shadowOpacity: 0.1, // Lighter shadow
        shadowRadius: 3, // Smaller shadow radius
        elevation: -2, // Subtle shadow for Android
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#F2FDFF',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 12,
        paddingHorizontal: 15,
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#000',
        marginBottom: 15,
    },
    rememberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    rememberText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
        fontFamily: 'Inter',
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        borderRadius: 24,
        alignItems: 'center',
        width: '50%',
        alignSelf: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Inter',
    },
    forgotPassword: {
        fontSize: 14,
        color: '#007BFF',
        textAlign: 'center',
        fontFamily: 'Inter',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
});

export default Login;