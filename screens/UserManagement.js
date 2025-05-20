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
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  getDoc, 
  updateDoc,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { setUserAsAdmin } from '../utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from '../components/AdminHeader';
import SidebarMenu from '../components/sidebarmenu';

const UserManagementScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [program, setProgram] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users whenever search query or users list changes
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.department?.toLowerCase().includes(query) ||
      user.program?.toLowerCase().includes(query) ||
      user.yearLevel?.toString().toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const usersList = userSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          name: data.name || '',
          department: data.department || '',
          program: data.program || '',
          yearLevel: data.yearLevel || '',
          gender: data.gender || '',
          address: data.address || '',
          isAdmin: data.isAdmin || false,
          role: data.role || 'student',
          status: data.status || 'active',
          ...data
        };
      });
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCreateUser = async () => {
    // First, log the values to debug
    console.log('Form Values:', {
      email: email?.trim(),
      password: password?.trim(),
      name: name?.trim(),
      department: department?.trim(),
      program: program?.trim(),
      yearLevel: yearLevel?.toString().trim(),
      gender: gender?.trim(),
      address: address?.trim(),
    });

    // Improved validation
    if (!email?.trim() || 
        !password?.trim() || 
        !name?.trim() || 
        !department?.trim() || 
        !program?.trim() || 
        !yearLevel?.toString().trim() || 
        !gender?.trim() || 
        !address?.trim()) {
      
      // Show which fields are missing
      const missingFields = [];
      if (!email?.trim()) missingFields.push('Email');
      if (!password?.trim()) missingFields.push('Password');
      if (!name?.trim()) missingFields.push('Full Name');
      if (!department?.trim()) missingFields.push('Department');
      if (!program?.trim()) missingFields.push('Program');
      if (!yearLevel?.toString().trim()) missingFields.push('Year Level');
      if (!gender?.trim()) missingFields.push('Gender');
      if (!address?.trim()) missingFields.push('Address');

      Alert.alert(
        'Missing Fields', 
        `Please fill in the following fields:\n${missingFields.join('\n')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Prepare user data
      const userData = {
        uid: user.uid,
        email: email.trim(),
        name: name.trim(),
        department: department.trim(),
        program: program.trim(),
        yearLevel: yearLevel.toString().trim(),
        gender: gender.trim(),
        address: address.trim(),
        createdAt: serverTimestamp(),
        role: 'student',
        isAdmin: false,
        status: 'active',
        lastLogin: null,
        profileComplete: true,
        accountType: 'student'
      };

      // Save to Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, userData);

      // Save to AsyncStorage
      await AsyncStorage.setItem('userProfile', JSON.stringify({
        uid: user.uid,
        email: email.trim(),
        name: name.trim(),
        department: department.trim(),
        program: program.trim(),
        yearLevel: yearLevel.toString().trim(),
        gender: gender.trim(),
        address: address.trim(),
      }));

      Alert.alert('Success', 'Student account created successfully');
      handleCancel();
      fetchUsers();

    } catch (error) {
      console.error('Error creating user:', error);
      let errorMessage = 'Failed to create student account';
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

  const handleCancel = () => {
    setShowForm(false);
    setEmail('');
    setPassword('');
    setName('');
    setDepartment('');
    setProgram('');
    setYearLevel('');
    setGender('');
    setAddress('');
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetails(true);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const renderUserItem = (user) => (
    <View key={user.id} style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={[styles.userRole, user.isAdmin && styles.adminRole]}>
          {user.isAdmin ? 'Admin' : 'Student'}
        </Text>
      </View>
      <View style={styles.userActions}>
        {!user.isAdmin && (
          <TouchableOpacity 
            onPress={() => handleViewDetails(user)}
            style={styles.viewButton}
          >
            <Text style={styles.buttonText}>View Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

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
              <TextInput 
                style={styles.searchInput} 
                placeholder="Search for name, email, department..."
                value={searchQuery}
                onChangeText={handleSearch}
                clearButtonMode="while-editing"
              />
              <Ionicons 
                name={searchQuery ? "close-circle" : "search"} 
                size={20} 
                color="black" 
                style={styles.searchIcon}
                onPress={() => searchQuery && setSearchQuery('')} 
              />
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.addButtonText}>Add Student</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.cardContainer}>
              {filteredUsers.map(renderUserItem)}
              {filteredUsers.length === 0 && searchQuery && (
                <Text style={styles.noResultsText}>No users found</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Add User Modal */}
      {showForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Student</Text>
              <TouchableOpacity onPress={handleCancel} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScrollView}>
              {/* Account Information Section - Move this section to the top */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Account Information</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email*</Text>
                  <TextInput
                    placeholder="Enter email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Password*</Text>
                  <TextInput
                    placeholder="Enter password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Personal Information Section */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    placeholder="Enter full name"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Gender</Text>
                  <TextInput
                    placeholder="Enter gender"
                    value={gender}
                    onChangeText={setGender}
                    style={styles.input}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <TextInput
                    placeholder="Enter complete address"
                    value={address}
                    onChangeText={setAddress}
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={3}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Academic Information Section */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Academic Information</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Department</Text>
                  <TextInput
                    placeholder="Enter department"
                    value={department}
                    onChangeText={setDepartment}
                    style={styles.input}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Program</Text>
                  <TextInput
                    placeholder="Enter program"
                    value={program}
                    onChangeText={setProgram}
                    style={styles.input}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Year Level</Text>
                  <TextInput
                    placeholder="Enter year level"
                    value={yearLevel}
                    onChangeText={setYearLevel}
                    style={styles.input}
                    editable={!isLoading}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                onPress={handleCancel} 
                style={[styles.footerButton, styles.cancelButton]}
                disabled={isLoading}
              >
                <Text style={styles.footerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleCreateUser} 
                style={[styles.footerButton, styles.createButton]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.footerButtonText}>Create Student</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* View Details Modal */}
      <Modal
        visible={showDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Student Details</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            
            {selectedUser && (
              <ScrollView style={styles.detailsScrollView}>
                <View style={styles.detailsContainer}>
                  {/* Personal Information Section */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Personal Information</Text>
                    <View style={styles.detailCard}>
                      <View style={styles.detailRow}>
                        <Ionicons name="person" size={20} color="#4C66FF" style={styles.detailIcon} />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Full Name</Text>
                          <Text style={styles.detailValue}>{selectedUser.name}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons name="male-female" size={20} color="#4C66FF" style={styles.detailIcon} />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Gender</Text>
                          <Text style={styles.detailValue}>{selectedUser.gender || 'N/A'}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons name="location" size={20} color="#4C66FF" style={styles.detailIcon} />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Address</Text>
                          <Text style={styles.detailValue}>{selectedUser.address || 'N/A'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Academic Information Section */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Academic Information</Text>
                    <View style={styles.detailCard}>
                      <View style={styles.detailRow}>
                        <Ionicons name="business" size={20} color="#4C66FF" style={styles.detailIcon} />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Department</Text>
                          <Text style={styles.detailValue}>{selectedUser.department || 'N/A'}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons name="school" size={20} color="#4C66FF" style={styles.detailIcon} />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Program</Text>
                          <Text style={styles.detailValue}>{selectedUser.program || 'N/A'}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons name="calendar" size={20} color="#4C66FF" style={styles.detailIcon} />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Year Level</Text>
                          <Text style={styles.detailValue}>{selectedUser.yearLevel || 'N/A'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Contact Information Section */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Contact Information</Text>
                    <View style={styles.detailCard}>
                      <View style={styles.detailRow}>
                        <Ionicons name="mail" size={20} color="#4C66FF" style={styles.detailIcon} />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Email</Text>
                          <Text style={styles.detailValue}>{selectedUser.email}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.footerButton, styles.closeButton]}
                onPress={() => setShowDetails(false)}
              >
                <Text style={styles.footerButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 45,
    marginLeft: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginVertical: 10,
    marginTop: 25,
    marginLeft: '-15%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: '5%',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 15,
    flex: 3,
    marginRight: 5,
    marginLeft: -60,
    marginTop: 20,
    height: 45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  searchIcon: {
    padding: 5,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  addButton: {
    backgroundColor: 'green',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
    marginRight: 2,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
    zIndex: 9999,
    width: '100%',
    height: '100%',
    elevation: 1000,
  },
  modalCard: {
    width: '90%',
    height: '85%', // Added fixed height
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 0,
    elevation: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    position: 'relative',
    zIndex: 10000,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  formScrollView: {
    padding: 20,
    paddingBottom: 100, // Add padding to account for footer height
    maxHeight: '80%',   // Limit height to ensure footer visibility
  },
  formSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4C66FF',
    marginBottom: 15,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    bottom: 0,
    left: 0,
    right: 0,
    position: 'absolute',
  },
  footerButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF4B4B',
    marginRight: 10,
  },
  createButton: {
    backgroundColor: '#4C66FF',
    marginLeft: 10,
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
    color: '#4C66FF',
    fontWeight: 'bold',
  },
  adminRole: {
    color: '#4CAF50',
  },
  userActions: {
    flexDirection: 'row',
  },
  viewButton: {
    backgroundColor: '#4C66FF',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsScrollView: {
    flex: 1,
    padding: 20,
    paddingBottom: 100, // Keep padding for footer
  },
  detailsContainer: {
    flex: 1,
    gap: 24,
    paddingBottom: 80, // Keep padding for footer
  },
  detailsContainer: {
    flex: 1,
    gap: 24,
    paddingBottom: 80,   // Add more padding to account for fixed footer
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4C66FF',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 150,      // Increased from 120
    marginBottom: 15,    // Added margin bottom
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15, // Increased from 12
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailIcon: {
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#4C66FF',
    padding: 12,
    borderRadius: 8,
    width: '100%',       // Make button full width
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default UserManagementScreen;
