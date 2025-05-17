import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/AdminHeader';
import SidebarMenu from '../components/sidebarmenu';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import defaultImage from '../assets/Flashdrive.png'; // Import default image

const ClaimRequestScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [claimsData, setClaimsData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [approvalReason, setApprovalReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    // Set up real-time listener for claim requests
    const claimRequestsQuery = query(
      collection(db, 'claim_requests'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(claimRequestsQuery, (snapshot) => {
      const claims = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        claims.push({
          id: doc.id,
          ...data,
          dateFound: data.dateFound?.toDate?.()?.toLocaleDateString() || 'N/A',
          timeFound: data.timeFound?.toDate?.()?.toLocaleTimeString() || 'N/A',
          createdAt: data.createdAt?.toDate?.()?.toLocaleString() || 'N/A'
        });
      });
      setClaimsData(claims);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredClaims = claimsData.filter(claim => {
    const matchesSearch = 
      claim.itemName?.toLowerCase().includes(searchText.toLowerCase()) ||
      claim.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
      claim.location?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = claim.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  const openModal = (id) => {
    setSelectedClaimId(id);
    setModalVisible(true);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const selectedClaim = claimsData.find(c => c.id === id);
      if (!selectedClaim) return;

      if (newStatus === 'approved') {
        // Generate system instructions for claiming
        const systemInstructions = `Your claim request has been approved!\n\nItem Details:\n- Item Name: ${selectedClaim.itemName}\n- Location Found: ${selectedClaim.location}\n- Date Found: ${selectedClaim.dateFound}\n\nClaiming Instructions:\n1. Visit the Lost and Found Office at the Student Affairs Office (SAO)\n2. Present a valid ID and the claim code: ${selectedClaim.id.slice(0, 6).toUpperCase()}\n3. Bring proof of ownership (if available)\n4. Office hours: Monday-Friday, 8:00 AM - 5:00 PM\n5. Please claim within 30 days\n\nNote: The item will be held for 30 days from the approval date. After this period, it may be disposed of or donated.`;

        // Update the request status
        await updateDoc(doc(db, 'claim_requests', id), {
          status: 'approved',
          updatedAt: serverTimestamp(),
          statusReason: systemInstructions
        });

        // Create notification for the user
        await addDoc(collection(db, 'notifications'), {
          userId: selectedClaim.userId,
          type: 'claim_request_approved',
          title: 'Claim Request Approved',
          message: systemInstructions,
          itemId: selectedClaim.id,
          itemName: selectedClaim.itemName,
          status: 'unread',
          createdAt: serverTimestamp()
        });

        // Create activity for admin dashboard
        await addDoc(collection(db, 'activities'), {
          type: 'claim_request_approved',
          description: `Claim request for ${selectedClaim.itemName} by ${selectedClaim.userName} was approved`,
          itemId: selectedClaim.id,
          itemName: selectedClaim.itemName,
          userId: selectedClaim.userId,
          userName: selectedClaim.userName,
          statusReason: systemInstructions,
          status: 'unread',
          title: 'Request Approved',
          message: `Claim request for ${selectedClaim.itemName} was approved with standard claiming instructions`,
          createdAt: serverTimestamp()
        });

        Alert.alert('Success', `Claim request has been approved!`);
        setModalVisible(false);
        setApprovalReason('');
      } else if (newStatus === 'rejected') {
        // Suggested rejection reasons
        const rejectionReasons = [
          "The item description doesn't match our records",
          "Insufficient proof of ownership",
          "The details provided don't match the found item",
          "The item has already been claimed by another person",
          "The item is not in our inventory",
          "The claim appears to be a duplicate",
          "The information provided is incomplete",
          "Unable to verify ownership based on provided details"
        ];

        // Show rejection reason picker
        Alert.alert(
          'Select Rejection Reason',
          'Choose a reason for rejecting the claim:',
          rejectionReasons.map(reason => ({
            text: reason,
            onPress: async () => {
              const rejectionMessage = `Your claim request has been rejected.\n\nReason for rejection:\n${reason}\n\nIf you believe this is a mistake or have additional information to provide, please submit a new claim request with complete details and proof of ownership.`;

              // Update the request status
              await updateDoc(doc(db, 'claim_requests', id), {
                status: 'rejected',
                updatedAt: serverTimestamp(),
                statusReason: rejectionMessage
              });

              // Create notification for the user
              await addDoc(collection(db, 'notifications'), {
                userId: selectedClaim.userId,
                type: 'claim_request_rejected',
                title: 'Claim Request Rejected',
                message: rejectionMessage,
                itemId: selectedClaim.id,
                itemName: selectedClaim.itemName,
                status: 'unread',
                createdAt: serverTimestamp()
              });

              // Create activity for admin dashboard
              await addDoc(collection(db, 'activities'), {
                type: 'claim_request_rejected',
                description: `Claim request for ${selectedClaim.itemName} by ${selectedClaim.userName} was rejected`,
                itemId: selectedClaim.id,
                itemName: selectedClaim.itemName,
                userId: selectedClaim.userId,
                userName: selectedClaim.userName,
                statusReason: rejectionMessage,
                status: 'unread',
                title: 'Request Rejected',
                message: `Claim request for ${selectedClaim.itemName} was rejected with reason: ${reason}`,
                createdAt: serverTimestamp()
              });

              Alert.alert('Success', `Claim request has been rejected!`);
              setModalVisible(false);
              setRejectReason('');
            }
          })),
          { cancelable: true }
        );
      }
    } catch (error) {
      console.error('Error updating claim request:', error);
      Alert.alert('Error', 'Failed to update the request. Please try again.');
    }
  };

  const selectedClaim = claimsData.find((c) => c.id === selectedClaimId);

  const renderCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.horizontalCard}
      onPress={() => openModal(item.id)}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.cardImage} 
          resizeMode="cover" 
        />
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.itemName} numberOfLines={1}>{item.itemName}</Text>
        <Text style={[styles.itemDetail, styles.statusText]}>
          Status: <Text style={item.status === 'pending' ? styles.pendingStatus : item.status === 'approved' ? styles.approvedStatus : styles.rejectedStatus}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </Text>
        <Text style={styles.viewMore}>Tap to view more details →</Text>
      </View>
    </TouchableOpacity>
  );

  const renderModal = () => (
    <Modal visible={modalVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Image 
            source={{ uri: selectedClaim?.image }} 
            style={styles.modalImage} 
            resizeMode="contain" 
          />

          <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setModalVisible(false)}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>X</Text>
          </TouchableOpacity>

          <View style={styles.modalDetails}>
            <Text style={styles.modalItemName}>Item: {selectedClaim?.itemName}</Text>
            <Text style={styles.modalDetailsText}>Claim Date: {selectedClaim?.dateFound}</Text>
            <Text style={styles.modalDetailsText}>Location: {selectedClaim?.location}</Text>
            <Text style={styles.modalDetailsText}>Claimant: {selectedClaim?.userName}</Text>
            <Text style={styles.modalDetailsText}>Contact: {selectedClaim?.contact}</Text>
            <Text style={styles.modalDescription}>Description:</Text>
            <Text style={styles.modalDescriptionText}>{selectedClaim?.description}</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => updateStatus(selectedClaimId, 'approved')}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>APPROVE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => updateStatus(selectedClaimId, 'rejected')}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>REJECT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a keyword"
              value={searchText}
              onChangeText={setSearchText}
            />
            <Ionicons name="search" size={20} color="black" style={styles.searchIcon} />
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

          {/* Cards */}
          <ScrollView style={styles.scrollView}>
            {filteredClaims.length === 0 ? (
              <Text style={styles.noItemsText}>No {activeTab} claims found</Text>
            ) : (
              filteredClaims.map((item) => renderCard(item))
            )}
          </ScrollView>
        </View>
      </View>

      {renderModal()}
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
    paddingHorizontal: 10,
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
    height: 100,
  },
  imageContainer: {
    width: 100,
    height: '100%',
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
    justifyContent: 'center',
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
  statusText: {
    fontWeight: 'bold',
  },
  pendingStatus: {
    color: '#FF0000',
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
    borderRadius: 5,
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
  noItemsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
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
});

export default ClaimRequestScreen;
