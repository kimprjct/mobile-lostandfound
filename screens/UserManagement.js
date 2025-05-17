import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { setUserAsAdmin } from '../utils/auth';

import Header from '../components/AdminHeader';
import SidebarMenu from '../components/sidebarmenu';

const UserManagementScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const usersList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCreateUser = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Add user details to Firestore
      await addDoc(collection(db, 'users'), {
        uid: user.uid,
        email: email,
        name: name,
        createdAt: new Date(),
        isAdmin: false
      });

      Alert.alert('Success', 'User account created successfully');
      setEmail('');
      setPassword('');
      setName('');
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error('Error creating user:', error);
      let errorMessage = 'Failed to create user account';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        default:
          errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const makeUserAdmin = async (uid) => {
    try {
      setIsLoading(true);
      const result = await setUserAsAdmin(uid);
      if (result.success) {
        Alert.alert('Success', 'User has been made an admin');
        fetchUsers(); // Refresh the users list
      } else {
        Alert.alert('Error', result.error || 'Failed to make user an admin');
      }
    } catch (error) {
      console.error('Error making user admin:', error);
      Alert.alert('Error', 'Failed to make user an admin');
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserItem = (user) => (
    <View key={user.id} style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.userRole}>{user.isAdmin ? 'Admin' : 'User'}</Text>
      </View>
      <View style={styles.userActions}>
        {!user.isAdmin && (
          <TouchableOpacity 
            onPress={() => makeUserAdmin(user.uid)}
            style={styles.adminButton}
          >
            <Text style={styles.buttonText}>Make Admin</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

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
              {users.map(renderUserItem)}
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
              value={name}
              onChangeText={setName}
              style={styles.input}
              editable={!isLoading}
            />
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              editable={!isLoading}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              editable={!isLoading}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity onPress={handleCancel} style={{ marginRight: 20 }}>
                <Text style={{ color: 'red' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateUser} style={{ marginRight: 20 }}>
                <Text style={{ color: 'green' }}>Create User</Text>
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
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  userRole: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  userActions: {
    flexDirection: 'row',
  },
  adminButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default UserManagementScreen;
