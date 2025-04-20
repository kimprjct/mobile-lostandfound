import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, Modal, ScrollView } from 'react-native';
import Header from '../components/AdminHeader';  // Import the Header component
import SidebarMenu from '../components/sidebarmenu'; // Import the SidebarMenu component
import searchIcon from '../assets/search-icon.png'; // Update the path as needed
import Phone from '../assets/Phone.png'; // Update the path to your phone image
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

// Updated foundData structure with new field names
const foundData = [
  {
    id: '1',
    itemID: '1',
    itemName: 'Flashdrive',
    reportedDate: '2024-12-11',
    location: 'EB Room 207',
    foundBy: 'Cameron Servantes',
    description: 'I would like to inform you that this flashdrive has been found by me.',
    timeFound: '2:30 pm'
  },
  {
    id: '2',
    itemID: '2',
    itemName: 'Record Book',
    reportedDate: '2024-12-10',
    location: 'Student Center',
    foundBy: 'Kimberlyn Pareja',
    description: 'I found this record book lying on a table in the student center.',
    timeFound: '1:15 pm'
  },
  {
    id: '3',
    itemID: '3',
    itemName: 'Phone',
    reportedDate: '2024-12-11',
    location: 'EB Room 208',
    foundBy: 'James Saavedra',
    description: 'I would like to inform you that the phone from the lost items has been found by me. It is exactly the same as the one posted there—a Vivo E27 in gray color.',
    timeFound: '4:30 pm'
  },
];

const FoundRequests = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredData = foundData.filter(item =>
    item.itemName.toLowerCase().includes(searchText.toLowerCase()) ||
    item.foundBy.toLowerCase().includes(searchText.toLowerCase()) ||
    item.location.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleApprove = () => {
    // Implement approve functionality here
    console.log('Item approved:', selectedItem?.itemID);
    // You could update a status field, send to an API, etc.
    alert(`Item ${selectedItem?.itemName} has been approved!`);
    setModalVisible(false);
  };

  const handleReject = () => {
    // Implement reject functionality here
    console.log('Item rejected:', selectedItem?.itemID);
    // You could update a status field, send to an API, etc.
    alert(`Item ${selectedItem?.itemName} has been rejected!`);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header Component */}
      <Header navigation={navigation} />

      {/* Sidebar and Title */}
      <View style={styles.headerContainer}>
        <View style={styles.sidebarWrapper}>
          <SidebarMenu navigation={navigation} />
        </View>
        <View style={styles.titleWrapper}>
          <Text style={styles.title}>FOUND REQUESTS</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a keyword"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity>
          <Image source={searchIcon} style={styles.searchIcon} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Cards */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.cardContainer}>
          {filteredData.map((item) => (
            <LinearGradient
              key={item.itemID}
              colors={['#00B4DB', '#0083B0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.itemName}</Text>
              </View>
              <View style={styles.cardDivider} />
              <Text style={[styles.cardText, { marginTop: 10 }]}>Reported: {item.reportedDate}</Text>
              <Text style={styles.cardText}>Location: {item.location}</Text>
              <Text style={styles.cardText}>Found by: {item.foundBy}</Text>
              <TouchableOpacity
                style={styles.cardButton}
                onPress={() => handleViewItem(item)}
              >
                <Text style={styles.cardButtonText}>View Details</Text>
              </TouchableOpacity>
            </LinearGradient>
          ))}
        </View>
      </ScrollView>

      {/* Modal for Item Details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Image at the top */}
            <Image source={Phone} style={styles.modalImage} resizeMode="contain" />

            {/* Close Button */}
            <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>X</Text>
            </TouchableOpacity>

            {/* Details */}
            <View style={styles.modalDetails}>
              <Text style={styles.modalItemName}>Item: {selectedItem?.itemName}</Text>
              <Text style={styles.modalDetailsText}>Date Found: {selectedItem?.reportedDate}</Text>
              <Text style={styles.modalDetailsText}>Time Found: {selectedItem?.timeFound}</Text>
              <Text style={styles.modalDetailsText}>Location: {selectedItem?.location}</Text>
              <Text style={styles.modalDetailsText}>Found By: {selectedItem?.foundBy}</Text>
              <Text style={styles.modalDescription}>Description:</Text>
              <Text style={styles.modalDescriptionText}>{selectedItem?.description}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.approveButton} onPress={handleApprove}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>APPROVE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>REJECT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#D9D9D9',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Align items vertically in the center
    marginBottom: 20,
    marginTop: 10,
  },
  sidebarWrapper: {
    marginRight: 10,
    marginTop: 20, // Add spacing between the sidebar and the title
  },
  titleWrapper: {
    flex: 1, // Allow the title to take up the remaining space
    alignItems: 'center', // Center the title horizontally
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 0, 
    
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 10,
    width: '80%',
    height: 40,
    alignSelf: 'center',
    marginBottom: 3,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 16,
  },
  searchIcon: {
    width: 30,
    height: 30, // Adjust the size of the image as needed
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center', // Center the cards horizontally
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    alignSelf: 'center',
    width: '85%',
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
    color: '#fff',
    textAlign: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 3,
  },
  cardText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    textAlign : 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: 320, // Increased width for better layout
    height: 520, // Increased height to fit all content
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  modalCloseIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 1,
    backgroundColor: '#000', // Black background for the close button
    borderRadius: 15, // Circular button
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: 280, // Increased width for better visibility
    height: 200, // Increased height for better visibility
    resizeMode: 'contain',
    marginBottom: 10, // Add spacing below the image
  },
  modalDetails: {
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20, // Add spacing below the details
  },
  modalItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalDetailsText: {
    fontSize: 14,
    marginBottom: 3,
  },
  modalDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  modalDescriptionText: {
    fontSize: 14,
    marginBottom: 10,
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

export default FoundRequests;