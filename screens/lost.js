import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    Modal,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/header';
import Footer from '../components/footer';
import SearchBar from '../components/searchbar';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const LostPage = () => {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [lostItems, setLostItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [submittedItems, setSubmittedItems] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [userFoundStatus, setUserFoundStatus] = useState({});

    useEffect(() => {
        const checkLoginStatus = async () => {
            const userToken = await AsyncStorage.getItem('userToken');
            setIsLoggedIn(!!userToken);
        };
        checkLoginStatus();

        // Load user's found status
        if (auth.currentUser) {
            const userStatusRef = collection(db, 'user_found_status');
            const q = query(userStatusRef, where('userId', '==', auth.currentUser.uid));
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const statusData = {};
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    statusData[data.itemId] = data.status;
                });
                setUserFoundStatus(statusData);
            });

            return () => unsubscribe();
        }
    }, [auth.currentUser]);

    const fetchLostItems = () => {
        try {
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

            // Return unsubscribe function
            return unsubscribe;
        } catch (error) {
            console.error('Failed to fetch lost items:', error);
            Alert.alert('Error', 'Failed to load lost items. Please try again.');
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            const unsubscribe = fetchLostItems();
            return () => unsubscribe && unsubscribe();
        }, [])
    );

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredItems(lostItems);
        } else {
            const filtered = lostItems.filter((item) =>
                item.name?.toLowerCase().includes(query.toLowerCase()) ||
                item.description?.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredItems(filtered);
        }
    };

    const handleReportPress = () => {
        if (!isLoggedIn) {
            Alert.alert('Login Required', 'Please log in to report a lost item.');
            return;
        }
        navigation.navigate('ReportLostPage');
    };

    const handleFoundIt = async (itemId) => {
        if (!isLoggedIn) {
            Alert.alert('Login Required', 'Please log in to report finding an item.');
            return;
        }

        navigation.navigate('Verification', {
            verificationType: 'Lost Item Verification',
            itemId,
            onSubmit: async () => {
                try {
                    // Create admin notification
                    await addDoc(collection(db, 'activities'), {
                        type: 'found_request',
                        itemId: itemId,
                        userId: auth.currentUser.uid,
                        status: 'unread',
                        title: 'New Found Item Report',
                        message: `A user has reported finding a lost item.`,
                        createdAt: serverTimestamp(),
                        userDetails: {
                            name: auth.currentUser.displayName || 'Anonymous',
                            email: auth.currentUser.email
                        }
                    });

                    // Store user's found status
                    await addDoc(collection(db, 'user_found_status'), {
                        userId: auth.currentUser.uid,
                        itemId: itemId,
                        status: 'under_review',
                        createdAt: serverTimestamp()
                    });

                    setSubmittedItems((prev) => ({ ...prev, [itemId]: true }));
                } catch (error) {
                    console.error('Error creating notifications:', error);
                    Alert.alert('Error', 'Failed to submit found item report. Please try again.');
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
        const userStatus = userFoundStatus[item.id];
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
                        {item.dateLost} | {item.timeLost}
                    </Text>
                    <Text style={[styles.detailValue, styles.description]}>{item.description}</Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.foundItButton,
                        isUnderReview && styles.foundUnderReviewButton,
                        isSubmitted && styles.foundItButtonSubmitted,
                    ]}
                    onPress={() => handleFoundIt(item.id)}
                    disabled={isUnderReview || isSubmitted}
                >
                    <Text style={styles.foundItButtonText}>
                        {isUnderReview ? 'Found Under Review' : isSubmitted ? 'Marked as Found' : 'Found It'}
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
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.searchContainer}>
                    <SearchBar
                        title="Lost Items"
                        placeholder="Search for an item"
                        onSearch={handleSearch}
                    />
                    <TouchableOpacity
                        style={styles.reportButton}
                        onPress={handleReportPress}
                    >
                        <LinearGradient
                            colors={['#991313', '#FF1F1F']}
                            style={styles.reportButtonGradient}
                        >
                            <Text style={styles.reportButtonText}>Report</Text>
                            <Image
                                source={require('../assets/losticon.png')}
                                style={styles.reportButtonIcon}
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => renderItem(item))
                ) : (
                    <Text style={styles.emptyListText}>No lost items found.</Text>
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
        height: 45,
        borderRadius: 8,
    },
    reportButtonText: {
        color: '#fff',
        fontSize: 21,
        fontWeight: 'bold',
        marginRight: 1,
        marginLeft: 4,
    },
    reportButtonIcon: {
        width: 45,
        height: 45,
        marginLeft: 3,
        resizeMode: 'contain',
    },
    emptyListText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#555',
        marginTop: 20,
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
    foundItButton: {
        backgroundColor: '#65558F',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 100,
        marginTop: 10,
        alignSelf: 'flex-end',
    },
    foundItButtonSubmitted: {
        backgroundColor: '#00CB14',
    },
    foundItButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    itemDetailsContainer: {
        alignItems: 'flex-start',
        width: '100%',
        marginTop: 10,
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
    foundUnderReviewButton: {
        backgroundColor: '#00CB14',
    },
});

export default LostPage;
