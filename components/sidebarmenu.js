import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SidebarMenu = ({ navigation, currentScreen }) => {
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [isButtonHovered, setButtonHovered] = useState(false);
    
    // Define menuItems first
    const menuItems = [
        { screen: 'HomeAdmin', label: 'Dashboard' },
        { screen: 'AdminManageLost', label: 'Manage Lost' },
        { screen: 'AdminManageFound', label: 'Manage Found' },
        { screen: 'ClaimRequests', label: 'Claim Requests' },
        { screen: 'FoundRequests', label: 'Found Requests' },
        { screen: 'UserManagement', label: 'User Management' },
        { screen: 'ClaimHistory', label: 'Claim History' },
    ];
    
    // Then use it in animation setup
    const menuAnimation = useRef(new Animated.Value(0)).current;
    const rotateAnimation = useRef(new Animated.Value(0)).current;
    const menuItemsAnimation = useRef(menuItems.map(() => new Animated.Value(0))).current;

    const toggleMenu = () => {
        // Animate hamburger icon rotation
        Animated.timing(rotateAnimation, {
            toValue: isMenuVisible ? 0 : 1,
            duration: 300,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
        }).start();

        // Animate menu sliding
        Animated.timing(menuAnimation, {
            toValue: isMenuVisible ? 0 : 1,
            duration: 300,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
        }).start();

        // Animate menu items
        menuItemsAnimation.forEach((anim, index) => {
            Animated.timing(anim, {
                toValue: isMenuVisible ? 0 : 1,
                duration: 200,
                delay: isMenuVisible ? 0 : index * 50,
                easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                useNativeDriver: true,
            }).start();
        });

        setMenuVisible(!isMenuVisible);
    };

    const handleNavigation = (screen) => {
        toggleMenu();
        navigation.navigate(screen);
    };

    // Calculate rotation for hamburger icon
    const spin = rotateAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
    });

    // Calculate menu transform
    const menuTransform = menuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 0]
    });

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
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Ionicons name={isMenuVisible ? "close" : "menu"} size={30} color="#333" />
                </Animated.View>
            </TouchableOpacity>

            {isMenuVisible && (
                <Animated.View 
                    style={[
                        styles.menu,
                        {
                            transform: [{ translateX: menuTransform }],
                            opacity: menuAnimation
                        }
                    ]}
                >
                    {menuItems.map((item, index) => (
                        <Animated.View
                            key={index}
                            style={{
                                opacity: menuItemsAnimation[index],
                                transform: [{
                                    translateX: menuItemsAnimation[index].interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-20, 0]
                                    })
                                }]
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => handleNavigation(item.screen)}
                                style={[
                                    styles.menuItem,
                                    currentScreen === item.screen && styles.activeMenuItem
                                ]}
                            >
                                <Ionicons 
                                    name={getIconName(item.screen)} 
                                    size={24} 
                                    color={currentScreen === item.screen ? "#2E8B57" : "#666"} 
                                    style={styles.menuIcon}
                                />
                                <Text style={[
                                    styles.menuText,
                                    currentScreen === item.screen && styles.activeMenuText
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </Animated.View>
            )}
        </View>
    );
};

// Helper function to get icons for menu items
const getIconName = (screen) => {
    const icons = {
        HomeAdmin: 'home',
        AdminManageLost: 'search',
        AdminManageFound: 'checkmark-circle',
        ClaimRequests: 'receipt',
        FoundRequests: 'file-tray-full',
        UserManagement: 'people',
        ClaimHistory: 'time'
    };
    return icons[screen] || 'chevron-forward';
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 1000,
    },
    hamburgerButton: {
        padding: 5,
        borderRadius: 8,
        backgroundColor: 'transparent',
        marginRight: 15,
        marginTop: -20,
    },
    hamburgerButtonHover: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    menu: {
        position: 'absolute',
        top: 35,
        left: 0,
        width: 250,
        backgroundColor: 'white',
        borderRadius: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        zIndex: 1000,
        padding: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginVertical: 2,
    },
    activeMenuItem: {
        backgroundColor: '#f0f8f4',
    },
    menuIcon: {
        marginRight: 12,
        width: 24,
    },
    menuText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    activeMenuText: {
        color: '#2E8B57',
        fontWeight: 'bold',
    },
});

export default SidebarMenu;