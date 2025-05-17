import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, Modal, ScrollView, Alert } from 'react-native';
import Header from '../components/AdminHeader';  // Import the Header component
import SidebarMenu from '../components/sidebarmenu'; // Import the SidebarMenu component
import searchIcon from '../assets/search-icon.png'; // Update the path as needed
import Phone from '../assets/Phone.png'; // Update the path to your phone image
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const FoundRequests = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvalReason, setApprovalReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    // Set up real-time listener for found requests
    const foundRequestsQuery = query(
      collection(db, 'found_requests'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(foundRequestsQuery, (snapshot) => {
      const foundRequests = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        foundRequests.push({
          id: doc.id,
          ...data,
          dateFound: data.dateFound?.toDate?.()?.toLocaleDateString() || 'N/A',
          timeFound: data.timeFound?.toDate?.()?.toLocaleTimeString() || 'N/A',
          createdAt: data.createdAt?.toDate?.()?.toLocaleString() || 'N/A'
        });
      });
      setItems(foundRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.itemName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = item.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleApprove = async () => {
    try {
      // Generate system instructions for claiming
      const systemInstructions = `Your found item request has been approved!\n\nItem Details:\n- Item Name: ${selectedItem.itemName}\n- Location Found: ${selectedItem.location}\n- Date Found: ${selectedItem.dateFound}\n\nClaiming Instructions:\n1. Visit the Lost and Found Office at the Student Affairs Office (SAO)\n2. Present a valid ID and the claim code: ${selectedItem.id.slice(0, 6).toUpperCase()}\n3. Office hours: Monday-Friday, 8:00 AM - 5:00 PM\n4. Please claim within 30 days\n\nNote: The item will be held for 30 days from the approval date. After this period, it may be disposed of or donated.`;

      // Update the request status
      await updateDoc(doc(db, 'found_requests', selectedItem.id), {
        status: 'approved',
        updatedAt: serverTimestamp(),
        statusReason: systemInstructions
      });

      // Create notification for the user
      await addDoc(collection(db, 'notifications'), {
        userId: selectedItem.userId,
        type: 'found_request_approved',
        title: 'Found Request Approved',
        message: systemInstructions,
        itemId: selectedItem.id,
        itemName: selectedItem.itemName,
        status: 'unread',
        createdAt: serverTimestamp()
      });

      // Create activity for admin dashboard
      await addDoc(collection(db, 'activities'), {
        type: 'found_request_approved',
        description: `Found request for ${selectedItem.itemName} by ${selectedItem.userName} was approved`,
        itemId: selectedItem.id,
        itemName: selectedItem.itemName,
        userId: selectedItem.userId,
        userName: selectedItem.userName,
        statusReason: systemInstructions,
        status: 'unread',
        title: 'Request Approved',
        message: `Found request for ${selectedItem.itemName} was approved with standard claiming instructions.`,
        createdAt: serverTimestamp()
      });

      Alert.alert('Success', `Found request for ${selectedItem.itemName} has been approved!`);
      setModalVisible(false);
      setApprovalReason('');
    } catch (error) {
      console.error('Error approving found request:', error);
      Alert.alert('Error', 'Failed to approve the request. Please try again.');
    }
  };

  const handleReject = async () => {
    try {
      // Suggested rejection reasons
      const rejectionReasons = [
        "The item description doesn't match our records",
        "Insufficient proof of finding the item",
        "The location information is unclear or inconsistent",
        "The item has already been claimed by its owner",
        "The item reported is not in our inventory",
        "The report appears to be a duplicate",
        "The information provided is incomplete"
      ];

      // Show rejection reason picker
      Alert.alert(
        'Select Rejection Reason',
        'Choose a reason for rejecting the request:',
        rejectionReasons.map(reason => ({
          text: reason,
          onPress: async () => {
            const rejectionMessage = `Your found item request has been rejected.\n\nReason for rejection:\n${reason}\n\nIf you believe this is a mistake or have additional information to provide, please submit a new request with complete details.`;

            // Update the request status
            await updateDoc(doc(db, 'found_requests', selectedItem.id), {
              status: 'rejected',
              updatedAt: serverTimestamp(),
              statusReason: rejectionMessage
            });

            // Create notification for the user
            await addDoc(collection(db, 'notifications'), {
              userId: selectedItem.userId,
              type: 'found_request_rejected',
              title: 'Found Request Rejected',
              message: rejectionMessage,
              itemId: selectedItem.id,
              itemName: selectedItem.itemName,
              status: 'unread',
              createdAt: serverTimestamp()
            });

            // Create activity for admin dashboard
            await addDoc(collection(db, 'activities'), {
              type: 'found_request_rejected',
              description: `Found request for ${selectedItem.itemName} by ${selectedItem.userName} was rejected`,
              itemId: selectedItem.id,
              itemName: selectedItem.itemName,
              userId: selectedItem.userId,
              userName: selectedItem.userName,
              statusReason: rejectionMessage,
              status: 'unread',
              title: 'Request Rejected',
              message: `Found request for ${selectedItem.itemName} was rejected with reason: ${reason}`,
              createdAt: serverTimestamp()
            });

            Alert.alert('Success', `Found request for ${selectedItem.itemName} has been rejected!`);
            setModalVisible(false);
            setRejectReason('');
          }
        })),
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error rejecting found request:', error);
      Alert.alert('Error', 'Failed to reject the request. Please try again.');
    }
  };

  const renderCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.horizontalCard}
      onPress={() => handleViewItem(item)}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.images && item.images.length > 0 ? item.images[0].url : null }} 
          style={styles.cardImage} 
          resizeMode="cover" 
        />
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.itemName} numberOfLines={1}>{item.itemName}</Text>
        <Text style={styles.itemDetail}>Found by: {item.userName}</Text>
        <Text style={styles.itemDetail}>Date Found: {item.dateFound}</Text>
        <Text style={[styles.itemDetail, styles.statusText]}>
          Status: <Text style={item.status === 'pending' ? styles.pendingStatus : item.status === 'approved' ? styles.approvedStatus : styles.rejectedStatus}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderModal = () => (
    <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {selectedItem?.images && selectedItem.images.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.modalImageScrollView}
            >
              {selectedItem.images.map((image, index) => (
                <Image 
                  key={index}
                  source={{ uri: image.url }} 
                  style={styles.modalImage} 
                  resizeMode="contain" 
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>No image available</Text>
            </View>
          )}

          <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setModalVisible(false)}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>X</Text>
          </TouchableOpacity>

          <View style={styles.modalDetails}>
            <Text style={styles.modalItemName}>Item: {selectedItem?.itemName}</Text>
            <Text style={styles.modalDetailsText}>Date Found: {selectedItem?.dateFound}</Text>
            <Text style={styles.modalDetailsText}>Time Found: {selectedItem?.timeFound}</Text>
            <Text style={styles.modalDetailsText}>Location: {selectedItem?.location}</Text>
            <Text style={styles.modalDetailsText}>Found By: {selectedItem?.userName}</Text>
            <Text style={styles.modalDetailsText}>Contact: {selectedItem?.contact}</Text>
            <Text style={styles.modalDescription}>Description:</Text>
            <Text style={styles.modalDescriptionText}>{selectedItem?.description}</Text>
          </View>

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
  );

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

      {/* Status Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
          onPress={() => setActiveTab('approved')}
        >
          <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>Approved</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rejected' && styles.activeTab]}
          onPress={() => setActiveTab('rejected')}
        >
          <Text style={[styles.tabText, activeTab === 'rejected' && styles.activeTabText]}>Rejected</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Cards */}
      <ScrollView style={styles.scrollView}>
        {filteredItems.length === 0 ? (
          <Text style={styles.noItemsText}>No {activeTab} found requests</Text>
        ) : (
          filteredItems.map((item) => renderCard(item))
        )}
      </ScrollView>

      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D9D9D9',
  },
  headerContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  sidebarWrapper: {
    width: 55,
    paddingTop: 40,
    marginLeft: 10,
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 15,
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
  searchIcon: {
    width: 20,
    height: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
    height: 120,
  },
  imageContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#f0f0f0',
    padding: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
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
    marginBottom: 5,
  },
  itemDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  viewMore: {
    fontSize: 13,
    color: '#007BFF',
    marginTop: 5,
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
  modalImageScrollView: {
    width: '100%',
    height: 200,
    marginBottom: 10,
  },
  modalImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginHorizontal: 5,
  },
  modalDetails: {
    width: '100%',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  modalItemName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDetailsText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  modalDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  modalDescriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 5,
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
  noItemsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  statusText: {
    fontWeight: 'bold',
  },
  pendingStatus: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  approvedStatus: {
    color: '#008000',
    fontWeight: 'bold',
  },
  rejectedStatus: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  reasonContainer: {
    width: '100%',
    marginVertical: 10,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 16,
    color: '#666',
  },
});

export default FoundRequests;