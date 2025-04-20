import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const Footer = () => {
    return (
        <View style={styles.footer}>
            {/* Footer Icon (Left) */}
            <Image source={require('../assets/foundulogo.png')} style={styles.footerIcon} />

            {/* Center Text */}
            <Text style={styles.footerText}>
                © Copyright 2024 SNSU Lost and Found{'\n'}All Rights Reserved
            </Text>

            {/* Contact (Right) */}
            <View style={styles.contact}>
                <Text style={styles.contactLink}>lostandfound@snsu.edu.ph</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    footer: {
        width: '100%',
        position: 'absolute',
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderTopWidth: 0.3,
        borderTopColor: '#ddd',
    },
    footerIcon: {
        width: 70,
        height: 70,
    },
    footerText: {
        fontSize: 10,
        textAlign: 'center',
        color: '#333',
        flex: 1, // Allows centering
    },
    contact: {
        alignItems: 'flext-start',
    },
    contactText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    contactLink: {
        fontSize: 8,
        color: '#007BFF',
    },
});

export default Footer;
