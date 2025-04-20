import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/AdminHeader';
import SidebarMenu from '../components/sidebarmenu';

const ClaimRequestScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState(null);

  const initialClaims = [
    {
      id: '1',
      itemName: 'Flashdrive',
      claimant: 'Cameron Servantes',
      date: '2024-12-11',
      location: 'EB Room 207',
      status: 'Pending',
    },
    {
      id: '2',
      itemName: 'Record Book',
      claimant: 'Kimberlyn Pareja',
      date: '2024-12-10',
      location: 'Student Center',
      status: 'Pending',
    },
    {
      id: '3',
      itemName: 'Money',
      claimant: 'Waille Hey',
      date: '2024-12-09',
      location: 'Canteen',
      status: 'Pending',
    },
  ];

  const [claimsData, setClaimsData] = useState(initialClaims);

  const openModal = (id) => {
    setSelectedClaimId(id);
    setModalVisible(true);
  };

  const updateStatus = (id, newStatus) => {
    const updated = claimsData.map((claim) =>
      claim.id === id ? { ...claim, status: newStatus } : claim
    );
    setClaimsData(updated);
    setModalVisible(false);
  };

  const selectedClaim = claimsData.find((c) => c.id === selectedClaimId);

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <View style={styles.mainWrapper}>
        {/* Sidebar */}
        <View style={styles.sidebarContainer}>
          <SidebarMenu navigation={navigation} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>CLAIM REQUEST</Text>

          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput style={styles.searchInput} placeholder="Search for a keyword" />
            <Ionicons name="search" size={20} color="black" style={styles.searchIcon} />
          </View>

          {/* Cards */}
          <ScrollView style={styles.scrollView}>
            <View style={styles.cardContainer}>
              {claimsData.map((item) => (
                <LinearGradient
                  key={item.id}
                  colors={['#FFB75E', '#ED8F03']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.itemName}</Text>
                  </View>
                  <View style={styles.cardDivider} />
                  <Text style={[styles.cardText, { marginTop: 10 }]}>Claim Date: {item.date}</Text>
                  <Text style={styles.cardText}>Location: {item.location}</Text>
                  <Text style={styles.cardText}>Claimant: {item.claimant}</Text>
                  <Text style={[styles.cardText, styles.statusText]}>
                    Status: <Text style={item.status === 'Pending' ? styles.pendingStatus : styles.approvedStatus}>{item.status}</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.cardButton}
                    onPress={() => openModal(item.id)}
                  >
                    <Text style={styles.cardButtonText}>View Details</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Image at the top */}
            <Image source={require('../assets/Flashdrive.png')} style={styles.modalImage} />

            {/* Close Button */}
            <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>X</Text>
            </TouchableOpacity>

            {/* Details */}
            <View style={styles.modalDetails}>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Item Name:</Text> {selectedClaim?.itemName}
              </Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Reported Date:</Text> {selectedClaim?.date}
              </Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Reported Time:</Text> 1:30 pm
              </Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Location:</Text>{' '}
                <Text style={{ fontStyle: 'italic' }}>{selectedClaim?.location}</Text>
              </Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Claimant:</Text> {selectedClaim?.claimant}
              </Text>

              {/* Description */}
              <Text style={[styles.modalText, { marginTop: 10 }]}>
                <Text style={{ fontWeight: 'bold' }}>Description:</Text> I would like to claim my flashdrive. The brand is Kingston with 128GB, color is black. I have important files there such as capstone files.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => updateStatus(selectedClaimId, 'Approved')}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>APPROVE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => updateStatus(selectedClaimId, 'Rejected')}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>REJECT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#D9D9D9',
    flex: 1,
  },
  mainWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarContainer: {
    width: 55,
    paddingTop: 40,
    marginLeft: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginVertical: 10,
    marginTop: 20,
    marginLeft: '-15%',
    marginBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    width: '100%',
    marginLeft: '-10%',
    marginRight: '10%',
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  searchIcon: {
    marginLeft: 5,
  },
  scrollView: {
    flex: 1,
    marginLeft: '-10%',
    width: '100%', // Ensure the ScrollView takes the full width
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center', // Center the cards horizontally
    justifyContent: 'flex-start', // Align cards to the top
    paddingHorizontal: 10, // Add padding to prevent cards from being cut off
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    alignSelf: 'center', // Center the card horizontally
    width: '100%', // Adjust the width to fit nicely
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 3,
  },
  cardText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusText: {
    fontWeight: 'bold',
  },
  pendingStatus: {
    color: '#FF0000', // Bright red color to make "Pending" stand out
    fontWeight: 'bold',
  },
  approvedStatus: {
    color: '#008000', // Green color for approved status
    fontWeight: 'bold',
  },
  cardButton: {
    marginTop: 15,
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  cardButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 320, // Increased width for better layout
    height: 570, // Increased height to fit all content
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  modalImage: {
    width: 280, // Increased width for better visibility
    height: 200, // Increased height for better visibility
    resizeMode: 'contain',
    marginBottom: 20, // Add spacing below the image
  },
  modalCloseIcon: {
    position: 'absolute',
    top: -10,
    right: -5,
    zIndex: 1,
    backgroundColor: '#000', // Black background for the close button
    borderRadius: 15, // Circular button
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalText: {
    textAlign: 'left',
    width: '100%',
    marginBottom: 10, // Add spacing between text items
    fontSize: 14,
  },
  modalDetails: {
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20, // Add spacing below the details
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'space-between',
    width: '90%',
  },
  approveButton: {
    backgroundColor: 'green',
    flex: 1,
    marginRight: 5,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: 'red',
    flex: 1,
    marginLeft: 5,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
});

export default ClaimRequestScreen;
