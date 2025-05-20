import React, { useState, useEffect } from 'react';
import {  
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
  Platform,
  Modal,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { auth } from '../firebaseConfig';

import Header from '../components/AdminHeader';
import SidebarMenu from '../components/sidebarmenu';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const SCREEN_HEIGHT = Dimensions.get('window').height;

const ClaimHistoryScreen = ({ navigation }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fadeAnim = new Animated.Value(0);
  const translateY = new Animated.Value(50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = null;

    const fetchClaimHistory = async () => {
      try {
        console.log('Starting to fetch claim history...');
        
        // Get all retrieved claims
        const claimsQuery = query(
          collection(db, 'claim_requests'),
          where('status', '==', 'retrieved'),
          orderBy('retrievalDate', 'desc')
        );

        unsubscribe = onSnapshot(claimsQuery, async (snapshot) => {
          if (!isMounted) return;
          
          console.log('Snapshot received, number of docs:', snapshot.docs.length);
          const claimsMap = new Map(); // Use Map to prevent duplicates
          
          for (const docSnapshot of snapshot.docs) {
            const claimData = docSnapshot.data();
            console.log('Processing claim:', claimData);
            
            try {
              if (claimData.itemId) {
                console.log('Looking for item with ID:', claimData.itemId);
                
                // Try found_items first
                const foundItemRef = doc(db, 'found_items', claimData.itemId);
                const foundItemSnap = await getDoc(foundItemRef);

                if (foundItemSnap.exists()) {
                  console.log('Found in found_items collection');
                  const itemData = foundItemSnap.data();
                  const claim = {
                    id: docSnapshot.id,
                    itemName: claimData.itemName || itemData.itemName,
                    claimant: claimData.userName,
                    claimDate: claimData.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A',
                    retrievalDate: claimData.retrievalDate?.toDate?.()?.toLocaleDateString() || 'N/A',
                    retrievalTime: claimData.retrievalDate?.toDate?.()?.toLocaleTimeString() || 'N/A',
                    confirmedBy: claimData.retrievalConfirmedBy || 'Unknown',
                    itemType: 'found',
                    itemPhotoUrl: itemData.images?.[0]?.url || null,
                    claimantContact: claimData.contact,
                    retrievalNotes: claimData.retrievalNotes || ''
                  };
                  claimsMap.set(docSnapshot.id, claim);
                } else {
                  // Try lost_items if not found
                  const lostItemRef = doc(db, 'lost_items', claimData.itemId);
                  const lostItemSnap = await getDoc(lostItemRef);

                  if (lostItemSnap.exists()) {
                    console.log('Found in lost_items collection');
                    const itemData = lostItemSnap.data();
                    const claim = {
                      id: docSnapshot.id,
                      itemName: claimData.itemName || itemData.itemName,
                      claimant: claimData.userName,
                      claimDate: claimData.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A',
                      retrievalDate: claimData.retrievalDate?.toDate?.()?.toLocaleDateString() || 'N/A',
                      retrievalTime: claimData.retrievalDate?.toDate?.()?.toLocaleTimeString() || 'N/A',
                      confirmedBy: claimData.retrievalConfirmedBy || 'Unknown',
                      itemType: 'lost',
                      itemPhotoUrl: itemData.images?.[0]?.url || null,
                      claimantContact: claimData.contact,
                      retrievalNotes: claimData.retrievalNotes || ''
                    };
                    claimsMap.set(docSnapshot.id, claim);
                  }
                }
              }
            } catch (error) {
              console.error('Error processing claim:', error);
            }
          }

          if (isMounted) {
            const claimsList = Array.from(claimsMap.values());
            console.log('Final claims list:', claimsList);
            setClaims(claimsList);
            setLoading(false);
            setIsInitialLoad(false);
          }
        });

      } catch (error) {
        console.error('Error fetching claim history:', error);
        if (isMounted) {
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    fetchClaimHistory();

    // Cleanup function
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleDelete = (id) => {
    setClaims((prevClaims) => prevClaims.filter((item) => item.id !== id));
  };

  const handleConfirmClaim = async (claim) => {
    Alert.alert(
        "Confirm Item Claim",
        "Has the claimant physically received the item?",
        [
            {
                text: "Cancel",
                style: "cancel"
            },
            {
                text: "Confirm",
                onPress: async () => {
                    try {
                        // Update the claim status in claim_requests
                        await updateDoc(doc(db, 'claim_requests', claim.id), {
                            claimConfirmed: true,
                            dateConfirmed: serverTimestamp(),
                            confirmedBy: auth.currentUser.uid
                        });

                        // Create activity record
                        await addDoc(collection(db, 'activities'), {
                            type: 'claim_completed',
                            description: `${claim.claimant} has claimed the ${claim.itemType === 'lost' ? 'lost' : 'found'} ${claim.itemName}`,
                            itemId: claim.id,
                            createdAt: serverTimestamp(),
                            userId: claim.claimantId
                        });

                        Alert.alert("Success", "Claim has been confirmed");
                    } catch (error) {
                        console.error('Error confirming claim:', error);
                        Alert.alert("Error", "Failed to confirm claim");
                    }
                }
            }
        ]
    );
  };

  // Search filter
  const filteredClaims = claims.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.itemName?.toLowerCase().includes(q) ||
      item.claimant?.toLowerCase().includes(q) ||
      item.claimDate?.toLowerCase().includes(q) ||
      item.retrievalDate?.toLowerCase().includes(q) ||
      item.retrievalTime?.toLowerCase().includes(q)
    );
  });

  // Handler for card tap
  const handleCardPress = (claim) => {
    setSelectedClaim(claim);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <View style={styles.mainWrapper}>
        {/* Sidebar */}
        <View style={styles.sidebarContainer}>
          <SidebarMenu navigation={navigation} currentScreen="ClaimHistory" />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>CLAIM HISTORY</Text>

          {/* Search - now functional */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a keyword"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            <Ionicons name="search" size={20} color="black" style={styles.searchIcon} />
          </View>

          {/* Loading and Claims List */}
          {loading && isInitialLoad ? (
            <View style={styles.loadingContainer}>
              <Text>Loading claims...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredClaims}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.cardContainer}
              ListEmptyComponent={
                <View style={styles.noClaimsContainer}>
                  <Text style={styles.noClaimsText}>No claims in history</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleCardPress(item)} activeOpacity={0.8}>
                  <View style={styles.horizontalCardWrapper}>
                    <View style={styles.horizontalCard}>
                      {/* Left: Image */}
                      <View style={styles.cardImageContainer}>
                        {item.itemPhotoUrl ? (
                          <Image
                            source={{ uri: item.itemPhotoUrl }}
                            style={styles.cardImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.cardImage, { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }]}> 
                            <Ionicons name="image" size={32} color="#fff" />
                          </View>
                        )}
                      </View>
                      {/* Right: Details */}
                      <View style={styles.cardDetailsRight}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.cardTitleHorizontal} numberOfLines={1}>{item.itemName}</Text>
                          <LinearGradient
                            colors={item.itemType === 'lost' ? ['#FF6B6B', '#EE5253'] : ['#4CAF50', '#388E3C']}
                            style={styles.badgeHorizontal}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          >
                            <Text style={styles.badgeTextHorizontal}>
                              {item.itemType === 'lost' ? 'Claimed Item from LOST' : 'Claimed Item from FOUND'}
                            </Text>
                          </LinearGradient>
                        </View>
                        <Text style={styles.cardDetailText} numberOfLines={1}>Claimant: {item.claimant}</Text>
                        <Text style={styles.cardDetailText} numberOfLines={1}>Date: {item.claimDate}</Text>
                        <Text style={styles.cardDetailText} numberOfLines={1}>Time: {item.retrievalTime}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}

          {/* Slide-up Modal for Details - only render when modalVisible is true */}
          {modalVisible && (
            <Modal
              visible={modalVisible}
              animationType="slide"
              transparent
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.slideUpModal}>
                  <View style={styles.modalHandle} />
                  <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
                    <Text style={styles.modalTitle}>{selectedClaim?.itemName}</Text>
                    {/* Photo Gallery */}
                    {selectedClaim?.itemPhotoUrls && selectedClaim.itemPhotoUrls.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalImageGallery}>
                        {selectedClaim.itemPhotoUrls.map((url, idx) => (
                          <Image
                            key={idx}
                            source={{ uri: url }}
                            style={styles.modalImage}
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                    ) : selectedClaim?.itemPhotoUrl ? (
                      <Image
                        source={{ uri: selectedClaim.itemPhotoUrl }}
                        style={styles.modalImage}
                        resizeMode="cover"
                      />
                    ) : null}
                    <View style={styles.modalDetailsSection}>
                      <Text style={styles.modalDetail}><Ionicons name="person" size={18} /> Claimant: {selectedClaim?.claimant}</Text>
                      <Text style={styles.modalDetail}><Ionicons name="call" size={18} /> Contact: {selectedClaim?.claimantContact}</Text>
                      <Text style={styles.modalDetail}><Ionicons name="calendar" size={18} /> Claim Date: {selectedClaim?.claimDate}</Text>
                      <Text style={styles.modalDetail}><Ionicons name="checkmark-circle" size={18} /> Retrieved: {selectedClaim?.retrievalDate}</Text>
                      <Text style={styles.modalDetail}><Ionicons name="time" size={18} /> Time: {selectedClaim?.retrievalTime}</Text>
                      <Text style={styles.modalDetail}><Ionicons name="shield-checkmark" size={18} /> Confirmed By: {selectedClaim?.confirmedBy}</Text>
                      {/* Extra details if available */}
                      {selectedClaim?.description && (
                        <Text style={styles.modalDetail}><Ionicons name="document-text" size={18} /> Description: {selectedClaim.description}</Text>
                      )}
                      {selectedClaim?.location && (
                        <Text style={styles.modalDetail}><Ionicons name="location" size={18} /> Location: {selectedClaim.location}</Text>
                      )}
                      {selectedClaim?.retrievalNotes ? (
                        <Text style={styles.modalDetail}><Ionicons name="document-text" size={18} /> Notes: {selectedClaim.retrievalNotes}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
                      <Text style={styles.closeModalButtonText}>Close</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>
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
    flexDirection: 'center', // FIXED
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
    marginVertical: 20,
    marginTop: -40,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 5, // less margin
    paddingHorizontal: 15,
    width: '90%',
    height: 45,
    alignSelf: 'center',
    marginBottom: 20,
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
  cardContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  card: {
    width: '90%',
    borderRadius: 15,
    padding: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  badgeContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 10,
  },
  cardBody: {
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 10,
    flex: 1,
  },
  cardText: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.9,
  },
  cardButton: {
    marginTop: 15,
    backgroundColor: '#E01818',
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
  confirmButton: {
    marginTop: 15,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusText: {
    fontWeight: 'bold',
  },
  completedStatus: {
    color: '#32cd32', // Green color for completed status
    fontWeight: 'bold',
  },
  pendingStatus: {
    color: '#FF0000', // Red color for other statuses
    fontWeight: 'bold',
  },
  noClaimsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noClaimsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  // Compact card styles
  compactCardWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  compactCard: {
    width: '95%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 12,
    backgroundColor: '#4F4F4F',
    minHeight: 70,
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitleSmall: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeTextSmall: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  compactCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  compactCardText: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  // Slide-up modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  slideUpModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    minHeight: SCREEN_HEIGHT * 0.45,
    maxHeight: SCREEN_HEIGHT * 0.85,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: '#eee',
  },
  modalDetailsSection: {
    marginBottom: 20,
  },
  modalDetail: {
    fontSize: 15,
    color: '#333',
    marginBottom: 7,
  },
  closeModalButton: {
    backgroundColor: '#4F4F4F',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 30,
    alignSelf: 'center',
    marginTop: 10,
  },
  closeModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  horizontalCardWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: '#4F4F4F',
    borderRadius: 18,
    width: '96%',
    minHeight: 100,
    alignItems: 'center',
    padding: 0,
    overflow: 'hidden',
  },
  cardDetailsRight: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardTitleHorizontal: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  cardDetailText: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 1,
  },
  cardImageContainer: {
    width: 90,
    height: 90,
    marginRight: 0,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  badgeOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
  },
  badgeHorizontal: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeTextHorizontal: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalImageGallery: {
    flexDirection: 'row',
    marginBottom: 15,
  },
});

export default ClaimHistoryScreen;
