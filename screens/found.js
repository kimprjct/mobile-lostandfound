import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    ActivityIndicator,
    Modal,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/header';
import Footer from '../components/footer';
import SearchBar from '../components/searchbar';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const FoundPage = () => {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [foundItems, setFoundItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submittedItems, setSubmittedItems] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [userClaimStatus, setUserClaimStatus] = useState({});

    useEffect(() => {
        const checkLoginStatus = async () => {
            const userToken = await AsyncStorage.getItem('userToken');
            setIsLoggedIn(!!userToken);
        };
        checkLoginStatus();

        // Set up real-time listener for found items
        const foundItemsQuery = query(
            collection(db, 'found_items'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(foundItemsQuery, (snapshot) => {
            const items = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                items.push({
                    id: doc.id,
                    ...data,
                    dateFound: data.dateFound?.toDate?.()?.toLocaleDateString() || 'N/A',
                    timeFound: data.timeFound?.toDate?.()?.toLocaleTimeString() || 'N/A',
                    createdAt: data.createdAt?.toDate?.()?.toLocaleString() || 'N/A'
                });
            });
            setFoundItems(items);
            setFilteredItems(items);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching found items:', error);
            setLoading(false);
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Load user's claim status
        if (auth.currentUser) {
            const userStatusRef = collection(db, 'user_claim_status');
            const q = query(userStatusRef, where('userId', '==', auth.currentUser.uid));
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const statusData = {};
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    statusData[data.itemId] = data.status;
                });
                setUserClaimStatus(statusData);
            });

            return () => unsubscribe();
        }
    }, [auth.currentUser]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredItems(foundItems);
        } else {
            const filtered = foundItems.filter((item) =>
                item.name?.toLowerCase().includes(query.toLowerCase()) ||
                item.description?.toLowerCase().includes(query.toLowerCase()) ||
                item.landMark?.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredItems(filtered);
        }
    };

    const handleReportPress = () => {
        if (!isLoggedIn) {
            Alert.alert('Login Required', 'Please log in to report a found item.');
            return;
        }
        navigation.navigate('ReportFoundPage');
    };

    const handleClaimIt = async (itemId) => {
        if (!isLoggedIn) {
            Alert.alert('Login Required', 'Please log in to claim an item.');
            return;
        }

        navigation.navigate('Verification', {
            verificationType: "Owner's Item Verification",
            itemId,
            onSubmit: async () => {
                try {
                    // Create admin notification
                    await addDoc(collection(db, 'activities'), {
                        type: 'claim_request',
                        itemId: itemId,
                        userId: auth.currentUser.uid,
                        status: 'unread',
                        title: 'New Claim Request',
                        message: `A user has submitted a claim request for a found item.`,
                        createdAt: serverTimestamp(),
                        userDetails: {
                            name: auth.currentUser.displayName || 'Anonymous',
                            email: auth.currentUser.email
                        }
                    });

                    // Store user's claim status
                    await addDoc(collection(db, 'user_claim_status'), {
                        userId: auth.currentUser.uid,
                        itemId: itemId,
                        status: 'under_review',
                        createdAt: serverTimestamp()
                    });

                    setSubmittedItems((prev) => ({ ...prev, [itemId]: true }));
                } catch (error) {
                    console.error('Error creating notifications:', error);
                    Alert.alert('Error', 'Failed to submit claim request. Please try again.');
                }
            },
        });
    };

    const handleImagePress = (imageUrl) => {
        // Use the full-size URL if available, otherwise fallback to thumbnail
        const fullSizeUrl = imageUrl.replace('/upload/', '/upload/q_auto,f_auto/');
        setSelectedImage(fullSizeUrl);
        setImageViewerVisible(true);
    };

    const renderItem = (item) => {
        const isSubmitted = submittedItems[item.id];
        const userStatus = userClaimStatus[item.id];
        const isUnderReview = userStatus === 'under_review';

        return (
            <View style={styles.itemContainer} key={item.id}>
                <View style={styles.reporterContainer}>
                    <View style={styles.reporterInitialContainer}>
                        <Text style={styles.reporterInitial}>
                            {item.reporter?.name ? item.reporter.name[0].toUpperCase() : '?'}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.reporterName}>{item.reporter?.name || 'Unknown Reporter'}</Text>
                        <Text style={styles.reporterDetails}>Reporter</Text>
                    </View>
                </View>

                {item.images && item.images.length > 0 && (
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.imageScrollView}
                    >
                        {item.images.map((image, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleImagePress(image.fullSizeUrl || image.url)}
                            >
                                <Image
                                    source={{ uri: image.url }}
                                    style={styles.itemImage}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                <View style={styles.itemDetailsContainer}>
                    <Text style={[styles.detailValue, styles.itemName]}>{item.name}</Text>
                    <Text style={styles.detailValue}>{item.landMark}</Text>
                    <Text style={styles.itemDetails}>
                        {item.dateFound} | {item.timeFound}
                    </Text>
                    <Text style={[styles.detailValue, styles.description]}>{item.description}</Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.claimItButton,
                        isUnderReview && styles.claimUnderReviewButton,
                        isSubmitted && styles.claimItButtonSubmitted,
                    ]}
                    onPress={() => handleClaimIt(item.id)}
                    disabled={isUnderReview || isSubmitted}
                >
                    <Text style={styles.claimItButtonText}>
                        {isUnderReview ? 'Claim Under Review' : isSubmitted ? 'Claimed' : 'Claim It'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <LinearGradient
            colors={['#FFE9E9', '#EDFFBB']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            <Header />

            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.searchContainer}>
                    <SearchBar
                        title="Found Items"
                        placeholder="Search for an item"
                        onSearch={handleSearch}
                    />
                    <TouchableOpacity
                        style={styles.reportButton}
                        onPress={handleReportPress}
                    >
                        <LinearGradient colors={['#00CB14', '#00650A']} style={styles.reportButtonGradient}>
                            <Text style={styles.reportButtonText}>Report</Text>
                            <Image
                                source={require('../assets/foundicon.png')}
                                style={styles.reportButtonIcon}
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4C66FF" />
                        <Text style={styles.loadingText}>Loading found items...</Text>
                    </View>
                ) : filteredItems.length > 0 ? (
                    filteredItems.map((item) => renderItem(item))
                ) : (
                    <Text style={styles.emptyListText}>No found items reported.</Text>
                )}
            </ScrollView>

            {/* Image Viewer Modal */}
            <Modal
                visible={imageViewerVisible}
                transparent={true}
                onRequestClose={() => setImageViewerVisible(false)}
            >
                <View style={styles.imageViewerModal}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setImageViewerVisible(false)}
                    >
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                    
                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage }}
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                        />
                    )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#4C66FF',
    },
    scrollViewContent: {
        paddingBottom: 100,
    },
    searchContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 40,
        marginBottom: 20,
    },
    reportButton: {
        marginTop: 10,
        alignSelf: 'center',
        width: '35%',
        borderRadius: 8,
        overflow: 'hidden',
    },
    reportButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
        height: 45,
        borderRadius: 8,
    },
    reportButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginRight: 5,
    },
    reportButtonIcon: {
        width: 24,
        height: 24,
        tintColor: '#fff',
    },
    itemContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        alignItems: 'flex-start',
        width: '80%',
        alignSelf: 'center',
        minHeight: 300,
    },
    itemName: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#333',
    },
    itemDetails: {
        fontSize: 14,
        color: '#555',
        textAlign: 'left',
    },
    itemDescription: {
        fontSize: 12,
        color: '#777',
        marginTop: 20,
    },
    itemImage: {
        width: 280,
        height: 200,
        borderRadius: 10,
        marginRight: 10,
        backgroundColor: '#f0f0f0',
    },
    reporterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    reporterInitialContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#65558F',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    reporterInitial: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    reporterName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    reporterDetails: {
        fontSize: 12,
        color: '#777',
    },
    claimItButton: {
        backgroundColor: '#65558F',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 100,
        marginTop: 10,
        alignSelf: 'flex-end',
    },
    claimItButtonSubmitted: {
        backgroundColor: '#00CB14',
    },
    claimItButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    itemDetailsContainer: {
        alignItems: 'flex-start',
        width: '100%',
        marginTop: 10,
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
    },
    emptyListText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 30,
    },
    description: {
        marginTop: 15,
        color: '#555',
    },
    imageScrollView: {
        width: '100%',
        height: 200,
        marginVertical: 10,
    },
    imageViewerModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    claimUnderReviewButton: {
        backgroundColor: '#00CB14',
    },
});

export default FoundPage;