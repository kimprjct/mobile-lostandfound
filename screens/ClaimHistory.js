import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Header from '../components/AdminHeader';
import SidebarMenu from '../components/sidebarmenu';

const ClaimHistoryScreen = ({ navigation }) => {
  const [claims, setClaims] = useState([
    { id: '1', itemName: 'Flashdrive', claimant: 'Cameron Servantes', date: '2024-12-11', status: 'Completed' },
    { id: '2', itemName: 'Bag', claimant: 'Maria Sy', date: '2025-03-16', status: 'Completed' },
    { id: '3', itemName: 'Wallet', claimant: 'Soliel Riego', date: '2025-03-17', status: 'Completed' },
    { id: '4', itemName: 'Umbrella', claimant: 'Kajik Mercadejas', date: '2025-03-18', status: 'Completed' },
  ]);

  const handleDelete = (id) => {
    setClaims(prevClaims => prevClaims.filter(item => item.id !== id));
  };

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, styles.centered]}>{item.id}</Text>
      <Text style={styles.cell}>{item.itemName}</Text>
      <Text style={styles.cell}>{item.claimant}</Text>
      <Text style={styles.cell}>{item.date}</Text>
      <Text style={styles.cell}>{item.status}</Text>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
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
          <Text style={styles.title}>CLAIM HISTORY</Text>

          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput style={styles.searchInput} placeholder="Search for a keyword" />
            <Ionicons name="search" size={20} color="black" style={styles.searchIcon} />
          </View>

          {/* Scrollable Cards */}
          <ScrollView style={styles.scrollView}>
            <View style={styles.cardContainer}>
              {claims.map((item) => (
                <LinearGradient
                  key={item.id}
                  colors={['slategray', 'slategray']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.itemName}</Text>
                  </View>
                  <View style={styles.cardDivider} />
                  <Text style={[styles.cardText, { marginTop: 10 }]}>Claimant: {item.claimant}</Text>
                  <Text style={styles.cardText}>Claim Date: {item.date}</Text>
                  <Text style={[styles.cardText, styles.statusText]}>
                    Status: <Text style={item.status === 'Completed' ? styles.completedStatus : styles.pendingStatus}>{item.status}</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.cardButton}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Text style={styles.cardButtonText}>Delete</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ))}
            </View>
          </ScrollView>
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
    marginVertical: 40,
    marginTop: -50,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    width: '80%',
    marginLeft: '10%',
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
    width: '100%',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center', // Center the cards horizontally
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    alignSelf: 'center',
    width: '85%',
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
    color: '#fff',
    textAlign: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 3,
  },
  cardText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
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
});

export default ClaimHistoryScreen;
