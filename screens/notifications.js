import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/header';
import Footer from '../components/footer';

const NotificationsScreen = () => {
    const [modalVisible, setModalVisible] = useState(false); // State for modal visibility

    const handleSimulateApproval = () => {
        setModalVisible(true); // Show the modal
    };

    const handleCloseModal = () => {
        setModalVisible(false); // Close the modal
    };

    return (
        <LinearGradient
            colors={['#FFE9E9', '#EDFFBB']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            <View style={styles.headerContainer}>
                <Header />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollView}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.notificationsText}>Notifications</Text>
                    </View>

                    {/* Main Notification */}
                    <View style={styles.cardBox}>
                        <Text style={styles.title}>You Reported Lost Item</Text>
                        <Image source={require('../assets/images/wallet.webp')} style={styles.image} />
                        <Text style={styles.item}>Item Name: <Text style={styles.bold}>Lost Wallet</Text></Text>
                        <Text style={styles.item}>Landmark: <Text style={styles.bold}>Library</Text></Text>
                        <Text style={styles.statusPending}>Status: PENDING</Text>

                        <TouchableOpacity onPress={handleSimulateApproval} style={styles.buttonBlue}>
                            <Text style={styles.buttonText}>Simulate Approval</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Claim Instructions Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={handleCloseModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Claim Instructions</Text>
                        <Text style={styles.modalText}>
                            <Text style={styles.bold}>Location:</Text> USG Office{"\n"}
                            <Text style={styles.bold}>Pickup Time:</Text> Mon–Fri, 9 AM–5 PM{"\n"}
                            <Text style={styles.bold}>Bring:</Text> School ID for verification{"\n"}
                            <Text style={styles.bold}>Additional Proof:</Text> Proof of ownership like a unique identifier
                        </Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleCloseModal} // Close the modal
                        >
                            <Text style={styles.modalButtonText}>I Understand</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Footer />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        paddingTop: 150,
        paddingBottom: 20,
    },
    titleContainer: {
        marginBottom: 20,
    },
    notificationsText: {
        fontSize: 35,
        fontWeight: 'bold',
        color: 'black',
        fontFamily: 'Inter',
    },
    cardBox: {
        width: '85%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1D1B20A0',
        shadowColor: 'black',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 10,
    },
    item: {
        fontSize: 16,
        marginBottom: 5,
    },
    bold: {
        fontWeight: 'bold',
    },
    statusPending: {
        color: 'orange',
        fontWeight: 'bold',
        marginBottom: 15,
    },
    buttonBlue: {
        backgroundColor: '#4C66FF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    image: {
        width: '100%',
        height: 150,
        borderRadius: 12,
        marginBottom: 15,
        resizeMode: 'cover',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: '#4C66FF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default NotificationsScreen;
