import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AdminHeader from '../components/AdminHeader';
import SidebarMenu from '../components/sidebarmenu';
import * as Print from 'expo-print';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

import searchIcon from '../assets/search-icon.png';
import Phone from '../assets/Phone.png';

const AdminManageLost = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [lostItems, setLostItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    // Create a query to get lost items, ordered by creation time
    const q = query(
      collection(db, 'lost_items'),
      orderBy('createdAt', 'desc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
          dateLost: data.dateLost?.toDate?.()?.toLocaleDateString() || 'N/A',
          timeLost: data.timeLost?.toDate?.()?.toLocaleTimeString() || 'N/A',
        });
      });
      setLostItems(items);
      setFilteredItems(items);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredItems(lostItems);
    } else {
      const filtered = lostItems.filter((item) =>
        item.name?.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase()) ||
        item.landMark?.toLowerCase().includes(query.toLowerCase()) ||
        item.reporter?.name?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handlePrint = async () => {
    if (!selectedItem) return;

    const htmlContent = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              padding: 0;
            }
            h1 {
              text-align: center;
              color: #ed213a;
            }
            p {
              font-size: 14px;
              line-height: 1.6;
              color: #333;
            }
            .details {
              margin-bottom: 20px;
            }
            .details p {
              margin: 5px 0;
            }
            .description {
              font-style: italic;
              color: #555;
            }
          </style>
        </head>
        <body>
          <h1>Lost Item Details</h1>
          <div class="details">
            <p><strong>Item Name:</strong> ${selectedItem.name}</p>
            <p><strong>Reported Date:</strong> ${selectedItem.dateLost}</p>
            <p><strong>Time Lost:</strong> ${selectedItem.timeLost}</p>
            <p><strong>Location:</strong> ${selectedItem.landMark}</p>
            <p><strong>Lost by:</strong> ${selectedItem.reporter?.name || 'Unknown'}</p>
            <p><strong>Contact:</strong> ${selectedItem.contact || 'N/A'}</p>
          </div>
          <p class="description">
            ${selectedItem.description}
          </p>
        </body>
      </html>
    `;

    try {
      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      console.error('Error printing:', error);
    }
  };

  const handleDeleteItem = async (item) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // First, delete the lost item document
              await deleteDoc(doc(db, 'lost_items', item.id));

              // Then, find and delete all related notifications
              const notificationsQuery = query(
                collection(db, 'notifications'),
                where('itemId', '==', item.id)
              );
              const notificationsSnapshot = await getDocs(notificationsQuery);
              const deletePromises = notificationsSnapshot.docs.map(doc => 
                deleteDoc(doc.ref)
              );
              await Promise.all(deletePromises);

              Alert.alert('Success', 'Item has been deleted successfully');
              if (modalVisible) {
                handleCloseModal();
              }
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete the item. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  return (
    <View style={styles.container}>
      <AdminHeader
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
        <Text style={styles.pageTitle}>LOST ITEMS</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a keyword"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton}>
          <Image source={searchIcon} style={styles.searchIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.horizontalCard}
            onPress={() => handleViewItem(item)}
          >
            <View style={styles.imageContainer}>
              {item.images && item.images.length > 0 ? (
                <Image
                  source={{ uri: item.images[0].url }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.noImageBox}>
                  <Text style={styles.noImageText}>No Image</Text>
                </View>
              )}
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetail}>Lost: {item.dateLost}</Text>
              <Text style={styles.itemDetail}>Location: {item.landMark}</Text>
              <Text style={styles.itemDetail}>Reporter: {item.reporter?.name || 'Unknown'}</Text>
              <Text style={styles.viewMore}>Tap to view more details →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedItem?.images && selectedItem.images.length > 0 ? (
              <Image
                source={{ uri: selectedItem.images[0].url }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Text style={styles.noImageText}>No image available</Text>
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity style={styles.modalCloseIcon} onPress={handleCloseModal}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>

            {/* Details */}
            <View style={styles.modalDetails}>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Item Name:</Text> {selectedItem?.name}
              </Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Lost Date:</Text> {selectedItem?.dateLost}
              </Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Time Lost:</Text> {selectedItem?.timeLost}
              </Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Location:</Text>{' '}
                <Text style={{ fontStyle: 'italic' }}>{selectedItem?.landMark}</Text>
              </Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Lost by:</Text> {selectedItem?.reporter?.name || 'Unknown'}
              </Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Contact:</Text> {selectedItem?.contact || 'N/A'}
              </Text>

              {/* Description */}
              <Text style={[styles.modalText, { marginTop: 10 }]}>
                <Text style={{ fontWeight: 'bold' }}>Description:</Text>
              </Text>
              <Text style={styles.description}>
                {selectedItem?.description || 'No description available'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.printButton}
                onPress={handlePrint}
              >
                <Text style={styles.printButtonText}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteItem(selectedItem)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
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
  pageTitle: { fontSize: 25, fontWeight: 'bold', color: '#000', marginLeft: 85 },
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
  scrollView: { 
    flex: 1 
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
    height: 160,
  },
  imageContainer: {
    width: 160,
    height: '100%',
    backgroundColor: '#f0f0f0',
    padding: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  noImageBox: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  noImageText: {
    color: '#666',
    fontSize: 16,
  },
  cardDetails: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  itemDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  viewMore: {
    fontSize: 14,
    color: '#007BFF',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 320,
    height: 570,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  modalImage: {
    width: 280,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
    borderRadius: 10,
  },
  noImageContainer: {
    width: 280,
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 10,
  },
  modalCloseIcon: {
    position: 'absolute',
    top: -10,
    right: -5,
    zIndex: 1,
    backgroundColor: '#000',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalText: {
    textAlign: 'left',
    width: '100%',
    marginBottom: 10,
    fontSize: 14,
  },
  modalDetails: {
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 5,
    justifyContent: 'space-between',
    width: '90%',
  },
  printButton: {
    backgroundColor: '#FEE440',
    flex: 1,
    marginRight: 5,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    flex: 1,
    marginLeft: 5,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  printButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AdminManageLost;
