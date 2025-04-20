import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/AdminHeader';
import SidebarMenu from '../components/sidebarmenu';
import searchIcon from '../assets/search-icon.png';
import recordBookImage from '../assets/RecordBook.png';

const AdminManageFound = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [foundItems, setFoundItems] = useState([
    { itemID: 1, itemName: 'Record Book', reportedDate: '2024-12-11', reportedTime: '10:30 AM', location: 'EB Room 207', foundBy: 'James Savedra', description: 'Found a red record book in the EB Room 208. Brand is Diamond.' },
    { itemID: 2, itemName: 'Flashdrive', reportedDate: '2024-12-10', reportedTime: '2:15 PM', location: 'Student Center', foundBy: 'Pashnea Dy' },
    { itemID: 3, itemName: 'Money', reportedDate: '2024-12-09', reportedTime: '1:00 PM', location: 'Canteen', foundBy: 'Maria Sy' },
  ]);

  const filteredItems = foundItems.filter(item => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      item.itemName.toLowerCase().includes(searchTerm) ||
      item.location.toLowerCase().includes(searchTerm) ||
      item.foundBy.toLowerCase().includes(searchTerm)
    );
  });

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Header
        navigation={navigation}
        toggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
      />

      <View style={styles.topSection}>
        {isSidebarVisible && (
          <SidebarMenu
            navigation={navigation}
            onClose={() => setIsSidebarVisible(false)}
            style={styles.sidebarInline}
          />
        )}
        <Text style={styles.pageTitle}>FOUND ITEMS</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a keyword"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchButton}>
          <Image source={searchIcon} style={styles.searchIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        <ScrollView style={styles.scrollView}>
          {filteredItems.map((item) => (
            <LinearGradient
              key={item.itemID}
              colors={['#1d976c', '#93f9b9']}
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
        </ScrollView>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.closeIconButton} onPress={handleCloseModal}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            <Image source={recordBookImage} style={styles.modalImage} />

            <View style={styles.modalDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Item Name:</Text>
                <Text style={styles.detailValue}>{selectedItem?.itemName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reported Date:</Text>
                <Text style={styles.detailValue}>{selectedItem?.reportedDate}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reported Time:</Text>
                <Text style={styles.detailValue}>{selectedItem?.reportedTime || 'N/A'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{selectedItem?.location}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Found by:</Text>
                <Text style={styles.detailValue}>{selectedItem?.foundBy}</Text>
              </View>

              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Description:</Text>
                <Text style={styles.descriptionText}>{selectedItem?.description || 'No description available'}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D9D9D9', padding: 5 },
  topSection: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 10 },
  sidebarInline: { marginRight: 15 },
  pageTitle: { fontSize: 25, fontWeight: 'bold', color: '#000', marginLeft: 70 },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 10,
    width: '70%',
    height: 40,
    alignSelf: 'center',
    marginBottom: 3,
  },
  searchInput: { flex: 1, padding: 0, fontSize: 16 },
  searchButton: { padding: 10 },
  searchIcon: { width: 30, height: 30 },
  cardContainer: {
    backgroundColor: '#D9D9D9',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 15,
    marginHorizontal: 10,
    flex: 1,
  },
  scrollView: { flex: 1 },
  card: {
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 'auto',
    width: '80%',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    width: 320,
    height: 500, // Increased height to fit the new field
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    position: 'relative',
  },
  closeIconButton: {
    position: 'absolute',
    right: -5,
    top: -4,
    zIndex: 8,
    width: 30,
    height: 30,
    backgroundColor: '#000',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalImage: {
    width: 295,
    height: 180,
    resizeMode: 'contain',
    marginVertical: 10,
  },
  modalDetails: {
    width: '100%',
    paddingHorizontal: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: '40%',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    width: '60%',
  },
  descriptionContainer: {
    marginTop: 5,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
});

export default AdminManageFound;