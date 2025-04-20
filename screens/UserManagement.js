import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Header from '../components/AdminHeader';
import SidebarMenu from '../components/sidebarmenu';

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([
    { id: '1', name: 'Kimberlyn Pareja', department: 'CEIT', email: 'kpareja@ssct.edu.ph', contact: '09518920355' },
    { id: '2', name: 'Rena Rabe', department: 'CEIT', email: 'rrabe@ssct.edu.ph', contact: '0993492994' },
    { id: '3', name: 'Kimberly Talictic', department: 'CEIT', email: 'ktalictic@sscr.edu.ph', contact: '09734929766' },
    { id: '4', name: 'Cameron Servantes', department: 'COT', email: 'cservantes@ssct.edu.ph', contact: '0959342855' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    department: '',
    email: '',
    contact: '',
  });

  const handleDelete = (id) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
  };

  const handleSave = () => {
    const newId = (users.length + 1).toString();
    const userToAdd = { id: newId, ...newUser };
    setUsers((prevUsers) => [...prevUsers, userToAdd]);
    setNewUser({ name: '', department: '', email: '', contact: '' });
    setShowForm(false);
  };

  const handleCancel = () => {
    setNewUser({ name: '', department: '', email: '', contact: '' });
    setShowForm(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <View style={styles.mainWrapper}>
        <View style={styles.sidebarContainer}>
          <SidebarMenu navigation={navigation} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>USER MANAGEMENT</Text>

          <View style={styles.topBar}>
            <View style={styles.searchContainer}>
              <TextInput style={styles.searchInput} placeholder="Search for a keyword" />
              <Ionicons name="search" size={20} color="black" style={styles.searchIcon} />
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.addButtonText}>Add User</Text>
            </TouchableOpacity>
          </View>

          {/* Card View */}
          <ScrollView style={styles.scrollView}>
            <View style={styles.cardContainer}>
              {users.map((user) => (
                <LinearGradient
                  key={user.id}
                  colors={['#834d9b', '#d04ed6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{user.name}</Text>
                  </View>
                  <View style={styles.cardDivider} />
                  <Text style={styles.cardText}>Department: {user.department}</Text>
                  <Text style={styles.cardText}>Email: {user.email}</Text>
                  <Text style={styles.cardText}>Contact: {user.contact}</Text>
                  <TouchableOpacity
                    style={styles.cardButton}
                    onPress={() => handleDelete(user.id)}
                  >
                    <Text style={styles.cardButtonText}>Delete</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Add User Modal Overlay */}
      {showForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Add New User</Text>

            <TextInput
              placeholder="Full Name"
              value={newUser.name}
              onChangeText={(text) => setNewUser({ ...newUser, name: text })}
              style={styles.input}
            />
            <TextInput
              placeholder="Department"
              value={newUser.department}
              onChangeText={(text) => setNewUser({ ...newUser, department: text })}
              style={styles.input}
            />
            <TextInput
              placeholder="Email"
              value={newUser.email}
              onChangeText={(text) => setNewUser({ ...newUser, email: text })}
              style={styles.input}
            />
            <TextInput
              placeholder="Contact Number"
              value={newUser.contact}
              onChangeText={(text) => setNewUser({ ...newUser, contact: text })}
              style={styles.input}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity onPress={handleCancel} style={{ marginRight: 20 }}>
                <Text style={{ color: 'red' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}>
                <Text style={{ color: 'green' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    marginTop: 30,
    marginLeft: '-15%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: '10%',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
    flex: 2,
    marginRight: -1,
    marginLeft: -70,
    marginTop: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  searchIcon: {
    marginLeft: 5,
  },
  addButton: {
    backgroundColor: '#52C048',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10,
    marginRight: 2,
    marginTop: 20,
  },
  addButtonText: {
    color: 'black',
    fontWeight: 'normal',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    marginLeft: '-10%',

  },
  cardContainer: {
    flex: 1,
    alignItems: 'center', // Center the cards horizontally
    justifyContent: 'flex-start', // Align cards to the top
    paddingHorizontal: 10,
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    alignSelf: 'center', // Center the card horizontally
    width: '100%', // Adjust the width to fit nicely and avoid stretching
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 10,
  },
  input: {
    backgroundColor: '#eee',
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },
});

export default UserManagementScreen;
