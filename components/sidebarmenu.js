import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SidebarMenu = ({ navigation }) => {
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [isButtonHovered, setButtonHovered] = useState(false);
    const [pressedItem, setPressedItem] = useState(null);

    const toggleMenu = () => {
        setMenuVisible(!isMenuVisible);
    };

    const handleNavigation = (screen) => {
        setMenuVisible(false);

        // Check if the user is an admin or a regular user
        if (screen === 'HomeAdmin') {
            navigation.navigate('HomeAdmin'); // Navigate to the admin home page
        } else if (screen === 'Home') {
            navigation.navigate('Home'); // Navigate to the user home page
        } else {
            navigation.navigate(screen); // Navigate to other screens
        }
    };

    const menuItems = [
        { screen: 'HomeAdmin', label: 'Dashboard' }, // Admin home page
        { screen: 'AdminManageLost', label: 'Manage Lost' },
        { screen: 'AdminManageFound', label: 'Manage Found' },
        { screen: 'ClaimRequests', label: 'Claim Requests' },
        { screen: 'FoundRequests', label: 'Found Requests' },
        { screen: 'UserManagement', label: 'User Management' },
        { screen: 'ClaimHistory', label: 'Claim History' },
    ];


    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={toggleMenu}
                onPressIn={() => setButtonHovered(true)}
                onPressOut={() => setButtonHovered(false)}
                style={[
                    styles.hamburgerButton,
                    isButtonHovered && styles.hamburgerButtonHover,
                ]}
            >
                <Text style={styles.hamburgerIcon}>☰</Text>
            </TouchableOpacity>

            {isMenuVisible && (
                <View style={styles.menu}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handleNavigation(item.screen)}
                            style={styles.menuItem}
                        >
                            <Text style={styles.menuText}>{item.label || 'Unnamed Menu'}</Text> {/* Add fallback */}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    hamburgerButton: {
        padding: 10,
        borderRadius: 5,
        backgroundColor: '#ccc',
        marginRight: 15,
        marginTop: -20,
    },
    hamburgerButtonHover: {
        backgroundColor: 'darkgrey',
    },
    hamburgerIcon: {
        color: 'black',
        fontSize: 25,
    },
    menu: {
        position: 'absolute',
        top: 35,
        left: 0,
        width: 200,
        backgroundColor: 'white',
        borderRadius: 5,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        zIndex: 999,
    },
    menuItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    menuItemPressed: {
        backgroundColor: 'darkgrey',
    },
    menuText: {
        fontSize: 16,
        color: '#333',
    },
});

export default SidebarMenu;