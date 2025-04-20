import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SearchBar = ({ placeholder, onSearch, title }) => {
    return (
        <View style={styles.container}>
            {/* Title Text */}
            {title && <Text style={styles.title}>{title}</Text>}

            {/* Search Bar */}
            <LinearGradient
                colors={['#CC0000', '#000000', '#000000', '#11D300']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBorder}
            >
                <View style={styles.innerContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder={placeholder || 'Item Name'}
                        placeholderTextColor="#AAA"
                        onChangeText={onSearch}
                    />
                    <Ionicons name="search" size={24} color="black" style={styles.icon} />
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: 20, // Add spacing below the search bar
    },
    title: {
        fontSize: 35,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 20, // Add spacing below the title
        textAlign: 'center',
    },
    gradientBorder: {
        width: 360,
        height: 50,
        borderRadius: 28,
        padding: 2, // Space for the gradient border
    },
    innerContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff', // Background color inside the gradient border
        borderRadius: 28,
        paddingHorizontal: 20,
    },
    input: {
        flex: 1,
        fontSize: 20,
        color: '#000', // Text color inside the input
        borderWidth: 0, // Remove any border
        outlineStyle: 'none', // Remove focus outline (for web compatibility)
    },
    icon: {
        marginLeft: 10,
    },
});

export default SearchBar;
