import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/AdminHeader';
import SidebarMenu from '../components/sidebarmenu';
import * as Print from 'expo-print';

import searchIcon from '../assets/search-icon.png';
import Phone from '../assets/Phone.png'; // Correct image import

const AdminManageLost = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const lostItems = [
    { itemID: 1, itemName: 'Phone', reportedDate: '2024-12-11', reportedTime: '16:30', location: 'EB Room 208', lostBy: 'Cameron Servantes' },
    { itemID: 2, itemName: 'Flashdrive', reportedDate: '2024-12-10', reportedTime: '14:00', location: 'Student Center', lostBy: 'Naya Young' },
    { itemID: 3, itemName: 'Book', reportedDate: '2024-12-09', reportedTime: '10:15', location: 'EB Room 207', lostBy: 'Kimberlyn Pareja' },
  ];

  const filteredItems = lostItems.filter((item) =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewItem = (itemID) => {
    setModalVisible(true);
  };

  const handlePrint = async () => {
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
            <p><strong>Item Name:</strong> Phone</p>
            <p><strong>Reported Date:</strong> 2024-12-11</p>
            <p><strong>Time Found:</strong> 4:30 pm</p>
            <p><strong>Location:</strong> EB Room 208</p>
            <p><strong>Lost by:</strong> Cameron Servantes</p>
          </div>
          <p class="description">
            I accidentally lost this phone. It’s a vivo E27, color gray. Bag-o pa gajud to tag palit. Basin maka kita mo. Tagaan nako reward.
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

  return (
    <View style={styles.container}>
      <Header
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
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchButton}>
          <Image source={searchIcon} style={styles.searchIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.tableContainer}>
        <ScrollView style={styles.scrollView}>
          {filteredItems.map((item) => (
            <LinearGradient
              key={item.itemID}
              colors={['#ed213a', '#93291e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.itemName}</Text>
              </View>
              <View style={styles.cardDivider} />
              <Text style={styles.cardText}>Reported: {item.reportedDate}</Text>
              <Text style={styles.cardText}>Time: {item.reportedTime}</Text>
              <Text style={styles.cardText}>Location: {item.location}</Text>
              <Text style={styles.cardText}>Lost by: {item.lostBy}</Text>
              <TouchableOpacity style={styles.cardButton} onPress={() => handleViewItem(item.itemID)}>
                <Text style={styles.cardButtonText}>View Details</Text>
              </TouchableOpacity>
            </LinearGradient>
          ))}
        </ScrollView>
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>

            <Image source={Phone} style={styles.modalImage} />
            <Text style={styles.modalText}>
              <Text style={styles.bold}>Item Name:</Text> Phone
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.bold}>Reported Date:</Text> 2024-12-11
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.bold}>Time Found:</Text> 4:30 pm
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.bold}>Location:</Text> EB Room 208
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.bold}>Lost by:</Text> Cameron Servantes
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.bold}>Description:</Text>
            </Text>
            <Text style={styles.description}>
              I accidentally lost this phone. It’s a vivo E27, color gray. Bag-o pa gajud to tag palit. Basin maka kita mo. Tagaan nako reward.
            </Text>

            <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
              <Text style={styles.printButtonText}>Print</Text>
            </TouchableOpacity>
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
  tableContainer: {
    backgroundColor: '#D9D9D9',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 15,
    marginHorizontal: 10,
    flex: 1,
  },
  scrollView: { flex: 1 },
  card: {
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 'auto',
    width: '80%',
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
    textAlign: 'center',
  },
  cardButton: {
    marginTop: 15,
    backgroundColor: '#007BFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    width: 320,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalImage: {
    width: 280,
    height: 160,
    borderRadius: 8,
    marginBottom: 15,
    marginTop: 20,
  },
  modalText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    width: '90%',
  },
  bold: {
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    marginTop: 2,
    color: '#333',
    marginBottom: 10,
    width: '90%',
  },
  printButton: {
    marginTop: 10,
    backgroundColor: '#FEE440',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginLeft: 160,
    height: 30,
  },
  printButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default AdminManageLost;
