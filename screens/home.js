import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import Header from '../components/header';
import Footer from '../components/footer';

const HomePage = () => {
    const navigation = useNavigation(); // Initialize navigation

    return (
        <>
            <Header />
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#FFE9E9', '#EDFFBB']}
                    style={styles.gradientBackground}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <View style={styles.textContainer}>
                        <Text style={styles.heading}>Find & Recover</Text>
                        <Text style={[styles.heading, styles.gradientText]}>With Ease</Text>
                        <Text style={styles.description}>
                            Experience effortless recovery with our dedicated lost and found service.
                        </Text>
                    </View>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.lostButton}
                            onPress={() => navigation.navigate('LostPage')} // Navigate to LostPage
                        >
                            <LinearGradient colors={['#991313', '#FF1F1F']} style={styles.buttonBackground}>
                                <Text style={styles.buttonText}>Lost</Text>
                                <Image source={require('../assets/losticon.png')} style={styles.buttonIcon} />
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.foundButton}
                            onPress={() => navigation.navigate('FoundPage')} // Navigate to FoundPage
                        >
                            <LinearGradient colors={['#00CB14', '#00650A']} style={styles.buttonBackground}>
                                <Text style={styles.buttonText}>Found</Text>
                                <Image source={require('../assets/foundicon.png')} style={styles.buttonIcon} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Home Image */}
                    <View style={styles.imageContainer}>
                        <Image source={require('../assets/home.png')} style={styles.homeImage} />
                    </View>
                    <Footer />
                </LinearGradient>
            </SafeAreaView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientBackground: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        alignItems: 'center', // Center the text horizontally
        marginTop: 50,
        paddingHorizontal: 20,
    },
    heading: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 50,
        fontWeight: 'bold',
        textAlign: 'center', // Center the text within the container
    },
    gradientText: {
        color: '#AE0000',
        textAlign: 'center', // Center the gradient text
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 7,
        color: '#000',
        paddingHorizontal: 20,
    },
    buttonContainer: {
        alignItems: 'center',
        marginBottom: -50, // Reduce the bottom margin to bring the buttons closer to the image
    },
    lostButton: {
        width: 180,
        height: 53,
        borderRadius: 10,
        marginBottom: 15,
        overflow: 'hidden',
    },
    foundButton: {
        width: 180,
        height: 53,
        borderRadius: 10,
        overflow: 'hidden',
    },
    buttonBackground: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    buttonIcon: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
        marginLeft: 10,
    },
    buttonText: {
        fontSize: 23,
        color: '#FFF',
        fontWeight: 'bold',
    },
    imageContainer: {
        alignItems: 'center',
        marginVertical: 40, 
    },
    homeImage: {
        width: 350, 
        height: 350,
        resizeMode: 'contain', 
        marginTop: -60, 
    },
});

export default HomePage;
