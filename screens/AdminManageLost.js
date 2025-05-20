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
  Dimensions,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lostItemsQuery = query(
      collection(db, 'lost_items'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(lostItemsQuery, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
          name: data.name || 'Unnamed Item',
          landMark: data.landMark || 'Unknown Location',
          contact: data.contact || 'No contact provided',
          description: data.description || 'No description available',
          images: data.images || [], // Ensure images array exists
          reporter: data.reporter || { name: 'Unknown Reporter' },
          status: data.status || 'pending',
          createdAt: data.createdAt?.toDate?.()?.toLocaleString() || 'N/A',
          dateLost: data.dateLost?.toDate?.()?.toLocaleDateString() || 'N/A',
          timeLost: data.timeLost?.toDate?.()?.toLocaleTimeString() || 'N/A'
        });
      });
      setLostItems(items);
      setFilteredItems(items);
      setLoading(false);
    });

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
            currentScreen="AdminManageLost"
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
            <View style={styles.modalImageContainer}>
              <ScrollView 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                style={styles.imageScrollView}
              >
                {selectedItem?.images && selectedItem.images.length > 0 ? (
                  selectedItem.images.map((image, index) => (
                    <Image
                      key={index}
                      source={{ uri: image.url }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  ))
                ) : (
                  <View style={styles.noImageContainer}>
                    <Text style={styles.noImageText}>No image available</Text>
                  </View>
                )}
              </ScrollView>
              {selectedItem?.images && selectedItem.images.length > 1 && (
                <View style={styles.imagePaginationDots}>
                  {selectedItem.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        { backgroundColor: '#ed213a' }
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

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
  container: { flex: 1, backgroundColor: '#D9D9D9'},
  topSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 25, // Increased from 20 to move menu down
    marginBottom: 10,
    marginLeft: 20,
    width: '100%',
  },
  sidebarInline: { 
    marginRight: 15,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, // Increased from 5 to move icon down
  },
  pageTitle: { 
    fontSize: 25, 
    fontWeight: 'bold', 
    color: '#000', 
    marginLeft: 75,
    alignSelf: 'center',
    marginTop: 10, // Increased from 5 to maintain alignment
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 20,
    width: '90%',
    height: 45,
    alignSelf: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
 
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  searchButton: { 
    padding: 10 
  },
  searchIcon: {
    width: 28,
    height: 28,
  },
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '95%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    padding: 25,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalImageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 25,
  },
  imageScrollView: {
    width: '100%',
  },
  modalImage: {
    width: Dimensions.get('window').width * 0.85,
    height: 200,
    borderRadius: 15,
  },
  noImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderRadius: 15,
  },
  imagePaginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    position: 'absolute',
    bottom: -20,
    width: '100%',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: '#ccc',
  },
  modalCloseIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDetails: {
    width: '100%',
    paddingHorizontal: 5,
    marginBottom: 20,
  },
  modalText: {
    textAlign: 'left',
    width: '100%',
    marginBottom: 12,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  description: {
    fontSize: 15,
    color: '#666',
    marginBottom: 25,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  printButton: {
    backgroundColor: '#FEE440',
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  printButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AdminManageLost;
