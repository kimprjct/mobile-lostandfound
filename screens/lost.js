import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Text,
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

const LostPage = () => {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [lostItems, setLostItems] = useState([]);
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

    const fetchLostItems = async () => {
        try {
            const items = await AsyncStorage.getItem('lostItems');
            if (items) {
                const parsedItems = JSON.parse(items);
                setLostItems(parsedItems);
                setFilteredItems(parsedItems);
            }
        } catch (error) {
            console.error('Failed to fetch lost items:', error);
        }
    };

    const handleNewItem = async (newItem) => {
        try {
            const existingItems = await AsyncStorage.getItem('lostItems');
            const parsedItems = existingItems ? JSON.parse(existingItems) : [];
            const updatedItems = [newItem, ...parsedItems]; // Append new item to the list
            await AsyncStorage.setItem('lostItems', JSON.stringify(updatedItems));
            setLostItems(updatedItems); // Update state
            setFilteredItems(updatedItems); // Update filtered items
        } catch (error) {
            console.error('Failed to add new item:', error);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredItems(lostItems);
        } else {
            const filtered = lostItems.filter((item) =>
                item.name.toLowerCase().includes(query.toLowerCase()) ||
                item.description.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredItems(filtered);
        }
    };

    const handleReportPress = () => {
        if (!isLoggedIn) {
            Alert.alert('Login Required', 'Please log in to report a lost item.');
            return;
        }
        navigation.navigate('ReportLostPage', {
            onSubmit: handleNewItem,
        });
    };

    const handleFoundIt = (itemId) => {
        navigation.navigate('Verification', {
            verificationType: 'Lost Item Verification',
            itemId,
            onSubmit: () => {
                setSubmittedItems((prev) => ({ ...prev, [itemId]: true }));
            },
        });
    };

    const renderItem = ({ item }) => {
        const isSubmitted = submittedItems[item.id];

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

                <Image
                    source={
                        item.name.toLowerCase() === 'vivo'
                            ? require('../assets/images/vivo.jpg')
                            : item.name.toLowerCase() === 'wallet'
                            ? require('../assets/images/wallet.webp')
                            : item.name.toLowerCase() === 'key'
                            ? require('../assets/images/key.webp')
                            : item.image
                            ? { uri: item.image }
                            : require('../assets/images/Flashdrive.png')
                    }
                    style={styles.itemImage}
                    resizeMode="cover"
                />

                <View style={styles.itemDetailsContainer}>
                    <Text style={[styles.detailValue, styles.itemName]}>{item.name}</Text>
                    <Text style={styles.detailValue}>{item.landMark}</Text>
                    <Text style={styles.itemDetails}>
                        {item.dateLost} | {item.timeLost}
                    </Text>
                    <Text style={styles.detailValue}>{item.description}</Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.foundItButton,
                        isSubmitted && styles.foundItButtonSubmitted,
                    ]}
                    onPress={() => handleFoundIt(item.id)}
                    disabled={isSubmitted}
                >
                    <Text style={styles.foundItButtonText}>
                        {isSubmitted ? 'Marked as Found' : 'Found It'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    useFocusEffect(
        React.useCallback(() => {
            const loadItems = async () => {
                await fetchLostItems();
            };
            loadItems();
        }, [])
    );
    

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
                {/* Search Bar and Report Button */}
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

                {/* List of Lost Items */}
                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => renderItem({ item }))
                ) : (
                    <Text style={styles.emptyListText}>No lost items found.</Text>
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
});

export default LostPage;
