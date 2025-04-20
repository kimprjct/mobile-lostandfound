import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView } from 'react-native';

const Header = ({ navigation }) => {
    const [isDropdownVisible, setDropdownVisible] = useState(false); // Track dropdown visibility

    const toggleDropdown = () => {
        setDropdownVisible(!isDropdownVisible);
    };

    const handleLogout = () => {
        setDropdownVisible(false); // Close the dropdown
        // Add your logout logic here
        console.log('Logged out');
        navigation.navigate('Login'); // Navigate to the login screen (if applicable)
    };
    // Ensure the dropdown visibility toggles when the admin button is clicked
    const handleAdminButtonClick = () => {
        toggleDropdown();
    };
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
               
                {/* SNSU Logo */}
                <Image
                    source={require('../assets/logo.png')} // Ensure the file exists in the assets folder
                    style={styles.logo}
                />

                {/* Title and Subtitle */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>FoundU</Text>
                    <Text style={styles.subtitle}>Discover. Connect. Reclaim.</Text>
                </View>

                {/* Notification Bell */}
                <TouchableOpacity style={styles.notificationButton}>
                    <Image
                        source={require('../assets/bell.png')} // Replace MaterialIcons with your custom image
                        style={styles.notificationIcon}
                    />
                </TouchableOpacity>

                {/* Admin Button */}
                <View style={styles.adminContainer}>
                    <TouchableOpacity onPress={toggleDropdown} style={styles.adminButton}>
                        <Text style={styles.adminText}>admin ▾</Text> {/* Added dropdown arrow */}
                    </TouchableOpacity>

                    {/* Dropdown Menu */}
                    {isDropdownVisible && (
                        <View style={styles.dropdownMenu}>
                            <TouchableOpacity onPress={handleLogout} style={styles.dropdownItem}>
                                <Text style={styles.dropdownText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#D9D9D9', // Match the header background color
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 5,
        paddingHorizontal: 15,
        backgroundColor: 'white', // Header background color
        marginHorizontal: -15, // Overlap the container to the left and right
        borderBottomWidth: 1,
        borderBottomColor: '#D9D9D9', // Match the header background color
        marginTop: -20, // Overlap the top
        zIndex: 1, // Ensure it stays above other elements
    },
    logo: {
        width: 70,
        height: 70,
        marginTop: 50,
        marginBottom: 5,
        marginLeft: 10,
    },
    titleContainer: {
        flex: 1,
        marginLeft: 3, // Space between the logo and the title
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 40,
    },
    subtitle: {
        fontSize: 13,
        fontFamily: 'Abel-Regular', // Ensure the font is loaded in your project
        color: '#666', // Gray color for the subtitle
    },
    notificationButton: {
        marginRight: 10, // Space between the notification bell and the admin button
        marginTop: 40,
    },
    notificationIcon: {
        width: 24, // Width of the custom bell image
        height: 24, // Height of the custom bell image
    },
    adminContainer: {
        position: 'relative', // Ensure the dropdown is positioned relative to the admin button
        marginTop: 40,
        marginRight: 20, // Space between the admin button and the right edge
    },
    adminButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#FFFFFF', // White background for the button
        borderRadius: 10,
        borderWidth: 1, // Add black border
        borderColor: 'black',
    },
    adminText: {
        color: 'black', // Black text for the admin button
        fontWeight: 'normal',
        fontSize: 18,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 40, // Position the dropdown below the admin button
        right: 0,
        backgroundColor: 'white',
        borderRadius: 5,
        elevation: 5, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        zIndex: 10, // Ensure the dropdown appears above other elements
    },
    dropdownItem: {
        padding: 10,
        borderBottomWidth: 3,
        borderBottomColor: '#ccc',
        marginRight: 10,
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
    },
    headerText: {
        fontSize: 16,
        color: 'black',
        marginRight: 10,
    },
});

export default Header;
