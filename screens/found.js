import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/header';
import Footer from '../components/footer';
import SearchBar from '../components/searchbar';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const FoundPage = () => {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [foundItems, setFoundItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [submittedItems, setSubmittedItems] = useState({}); // Track submitted state for each item

    useEffect(() => {
        const checkLoginStatus = async () => {
            const userToken = await AsyncStorage.getItem('userToken');
            setIsLoggedIn(!!userToken);
        };
        checkLoginStatus();
    }, []);

    const fetchFoundItems = async () => {
        try {
            const items = await AsyncStorage.getItem('foundItems');
            if (items) {
                const parsedItems = JSON.parse(items);
                setFoundItems(parsedItems);
                setFilteredItems(parsedItems);
            }
        } catch (error) {
            console.error('Failed to fetch found items:', error);
        }
    };

    const clearFoundItems = async () => {
        try {
            await AsyncStorage.removeItem('foundItems');
            setFoundItems([]);
            setFilteredItems([]);
            Alert.alert('Success', 'All reported found items have been deleted.');
        } catch (error) {
            console.error('Failed to delete found items:', error);
            Alert.alert('Error', 'Failed to delete found items. Please try again.');
        }
    };

    const handleDeleteItem = async (itemId) => {
        try {
            const updatedItems = foundItems.filter((item) => item.id !== itemId); // Remove the item with the given ID
            setFoundItems(updatedItems);
            setFilteredItems(updatedItems);
            await AsyncStorage.setItem('foundItems', JSON.stringify(updatedItems)); // Update AsyncStorage
            Alert.alert('Success', 'The item has been deleted.');
        } catch (error) {
            console.error('Failed to delete the item:', error);
            Alert.alert('Error', 'Failed to delete the item. Please try again.');
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchFoundItems();
        }, [])
    );

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredItems(foundItems);
        } else {
            const filtered = foundItems.filter((item) =>
                item.name.toLowerCase().includes(query.toLowerCase()) ||
                item.description.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredItems(filtered);
        }
    };

    const handleReportPress = () => {
        if (!isLoggedIn) {
            Alert.alert('Login Required', 'Please log in to report a found item.');
            return;
        }
        navigation.navigate('ReportFoundPage'); // Navigate to the report found page
    };

    const handleClaimIt = (itemId) => {
        navigation.navigate('Verification', {
            verificationType: "Owner's Item Verification",
            itemId, // Pass the item ID to the verification form
            onSubmit: () => {
                setSubmittedItems((prev) => ({ ...prev, [itemId]: true })); // Mark the item as submitted
            },
        });
    };

    const renderItem = ({ item }) => {
        const isSubmitted = submittedItems[item.id]; // Check if the item is submitted

        return (
            <View style={styles.itemContainer} key={item.id}>
                <View style={styles.reporterContainer}>
                    <View style={styles.reporterInitialContainer}>
                        <Text style={styles.reporterInitial}>
                            {item.reporter ? item.reporter[0].toUpperCase() : '?'}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.reporterName}>{item.reporter || 'Unknown Reporter'}</Text>
                        <Text style={styles.reporterDetails}>Reporter</Text>
                    </View>
                </View>

                {/* Display specific images based on the item's name */}
                <Image
                    source={
                        item.name.toLowerCase() === 'flashdrive'
                            ? require('../assets/images/flashdrive.webp') // Flashdrive image
                            : item.name.toLowerCase() === 'vivo'
                            ? require('../assets/images/vivo.jpg') // Vivo phone image
                            : item.name.toLowerCase() === 'wallet'
                            ? require('../assets/images/wallet.webp') // Wallet image
                            : item.image
                            ? { uri: item.image }
                            : require('../assets/RecordBook.png') // Default image
                    }
                    style={styles.itemImage}
                    resizeMode="cover"
                />

                <View style={styles.itemDetailsContainer}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDetails}>{item.landMark}</Text>
                    <Text style={styles.itemDetails}>
                        {item.dateFound} | {item.timeFound}
                    </Text>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.claimItButton,
                        isSubmitted && styles.claimItButtonSubmitted,
                    ]}
                    onPress={() => handleClaimIt(item.id)}
                    disabled={isSubmitted}
                >
                    <Text style={styles.claimItButtonText}>
                        {isSubmitted ? 'Claimed' : 'Claim It'}
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
                        title="Found Items" // Updated title
                        placeholder="Search for an item"
                        onSearch={handleSearch}
                    />
                    <TouchableOpacity
                        style={styles.reportButton}
                        onPress={() => navigation.navigate('ReportFoundPage')} // Navigate to ReportFoundPage
                    >
                        <LinearGradient colors={['#00CB14', '#00650A']} style={styles.reportButtonGradient}>
                            <Text style={styles.reportButtonText}>Report</Text>
                            <Image
                                source={require('../assets/foundicon.png')} // Found icon
                                style={styles.reportButtonIcon}
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => renderItem({ item }))
                ) : (
                    <Text style={styles.emptyListText}>No found items reported.</Text>
                )}
            </ScrollView>

            <Footer />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollViewContent: {
        paddingBottom: 100, // Add padding to prevent overlap with the footer
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
        width: '35%', // Reduced width
        borderRadius: 8,
        overflow: 'hidden',
    },
    reportButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5, // Reduced padding
        height: 45, // Explicitly set the height
        borderRadius: 8,
    },
    reportButtonText: {
        color: '#fff',
        fontSize: 20, // Slightly smaller font size
        fontWeight: 'bold',
        marginRight: 5,
    },
    reportButtonIcon: {
        width: 40, // Reduced icon size
        height: 40,
        marginLeft: 5,
        resizeMode: 'contain',
    },
    deleteButton: {
        backgroundColor: '#d9534f', // Red color for the delete button
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 10,
        alignSelf: 'center',
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
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
        alignItems: 'center',
        width: '80%',
        alignSelf: 'center',
        minHeight: 300,
    },
    itemDetailsContainer: {
        alignItems: 'flex-start', // Align content to the left
        width: '100%', // Ensure it spans the full width of the container
        paddingHorizontal: 10, // Add padding for better spacing
    },
    itemName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5, // Add spacing below the item name
        color: '#333', // Ensure good contrast
    },
    itemDetails: {
        fontSize: 14,
        color: '#555',
        marginBottom: 5, // Add spacing between details
    },
    itemDescription: {
        fontSize: 12,
        color: '#777',
        marginTop: 10,
    },
    itemImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 10,
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
        backgroundColor: '#65558F', // Updated background color
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
        backgroundColor: '#65558F', // Green color for the button
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 100,
        marginTop: 10,
        alignSelf: 'flex-end',
    },
    claimItButtonSubmitted: {
        backgroundColor: '#00CB14', // Green background for submitted state
    },
    claimItButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default FoundPage;