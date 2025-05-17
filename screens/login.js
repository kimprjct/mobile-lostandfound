import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CheckBox from 'expo-checkbox';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import Footer from '../components/footer';
import { loginWithEmailAndPassword } from '../utils/auth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            console.log('Attempting login with email:', email);
            const result = await loginWithEmailAndPassword(email, password);
            console.log('Login result:', result);
            
            if (result.success) {
                console.log('Login successful. User is admin:', result.user.isAdmin);
                // Use navigation.reset to clear the navigation stack and set the initial route
                if (result.user.isAdmin) {
                    console.log('Navigating to HomeAdmin');
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'HomeAdmin' }],
                    });
                } else {
                    console.log('Navigating to Home');
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Home' }],
                    });
                }
            } else {
                // Handle different error codes
                switch (result.error) {
                    case 'auth/invalid-email':
                        setError('Invalid email address');
                        break;
                    case 'auth/user-disabled':
                        setError('This account has been disabled');
                        break;
                    case 'auth/user-not-found':
                        setError('No account found with this email');
                        break;
                    case 'auth/wrong-password':
                        setError('Incorrect password');
                        break;
                    default:
                        setError('Error logging in. Please try again.');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <LinearGradient
                colors={['#FFE9E9', '#EDFFBB']}
                style={styles.gradient}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Header />
                    <View style={styles.contentContainer}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleMain}>SNSU</Text>
                            <Text style={styles.titleSub}>Lost and Found System</Text>
                        </View>
                        
                        <View style={styles.formContainer}>
                            <View style={styles.formBox}>
                                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                                
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email address"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                                
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    editable={!isLoading}
                                />
                                
                                <View style={styles.rememberMeContainer}>
                                    <CheckBox
                                        value={rememberMe}
                                        onValueChange={setRememberMe}
                                        style={styles.checkbox}
                                        disabled={isLoading}
                                    />
                                    <Text style={styles.rememberMeText}>Remember me</Text>
                                </View>
                                
                                <TouchableOpacity 
                                    style={[styles.loginButton, isLoading && styles.disabledButton]}
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.loginButtonText}>Log in</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity>
                                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <Footer />
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        marginTop: -80,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    titleMain: {
        fontSize: 42,
        fontWeight: '900',
        color: '#006400',
        marginBottom: 10,
        letterSpacing: 2,
        textShadowColor: 'rgba(0, 100, 0, 0.15)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    titleSub: {
        fontSize: 34,
        color: 'black',
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '600',
        letterSpacing: 1,
        opacity: 0.9,
    },
    formContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    formBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 30,
        paddingVertical: 40,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 8,
    },
    input: {
        backgroundColor: '#F5F5F5',
        padding: 15,
        paddingVertical: 18,
        borderRadius: 8,
        marginBottom: 20,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    checkbox: {
        marginRight: 8,
    },
    rememberMeText: {
        color: '#666',
    },
    loginButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        paddingVertical: 18,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    disabledButton: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    errorText: {
        color: '#ff0000',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
        textAlign: 'center',
    },
    forgotPassword: {
        color: '#4CAF50',
        textAlign: 'center',
        textDecorationLine: 'underline',
    }
});

export default Login;