import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, 
    ScrollView, Platform, ActivityIndicator, Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

    // Add animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const formSlide = useRef(new Animated.Value(Dimensions.get('window').height)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(formSlide, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

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
                    <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleMain}>SNSU</Text>
                            <Text style={styles.titleSub}>Lost and Found System</Text>
                        </View>
                        
                        <Animated.View style={[
                            styles.formContainer,
                            { transform: [{ translateY: formSlide }] }
                        ]}>
                            <View style={styles.formBox}>
                                {error ? (
                                    <View style={styles.errorContainer}>
                                        <Ionicons name="alert-circle" size={24} color="#FF4444" />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                ) : null}
                                
                                <View style={styles.inputContainer}>
                                    <Ionicons name="mail-outline" size={24} color="#666" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email address"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!isLoading}
                                        placeholderTextColor="#999"
                                    />
                                </View>
                                
                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed-outline" size={24} color="#666" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Password"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        editable={!isLoading}
                                        placeholderTextColor="#999"
                                    />
                                </View>
                                
                                <View style={styles.rememberMeContainer}>
                                    <CheckBox
                                        value={rememberMe}
                                        onValueChange={setRememberMe}
                                        style={styles.checkbox}
                                        disabled={isLoading}
                                        color="#4CAF50"
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
                                        <>
                                            <Text style={styles.loginButtonText}>Sign In</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.forgotPasswordContainer}>
                                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </Animated.View>
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
        fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Bold' : 'Roboto',
        fontSize: 48,
        fontWeight: '900',
        color: '#006400',
        marginBottom: 10,
        letterSpacing: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    titleSub: {
        fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Regular' : 'Roboto',
        fontSize: 24,
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '600',
        letterSpacing: 1,
    },
    formContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    formBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 30,
        paddingVertical: 40,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 15,
    },
    input: {
        flex: 1,
        padding: 15,
        paddingLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFE8E8',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
    },
    errorText: {
        color: '#FF4444',
        marginLeft: 10,
        fontSize: 14,
        flex: 1,
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
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    disabledButton: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 18,
        marginRight: 8,
        letterSpacing: 1,
    },
    forgotPasswordContainer: {
        alignItems: 'center',
    },
    forgotPassword: {
        color: '#4CAF50',
        fontSize: 15,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});

export default Login;