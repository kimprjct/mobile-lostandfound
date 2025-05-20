import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import AdminHeader from '../components/AdminHeader';
import SidebarMenu from '../components/sidebarmenu';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs, where, onSnapshot, addDoc, serverTimestamp, getCountFromServer } from 'firebase/firestore';

const Home = ({ navigation }) => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [stats, setStats] = useState({
    totalFound: 0,
    totalLost: 0,
    totalClaimed: 0,
    totalUnclaimed: 0,
    pendingClaimVerifications: 0,  // Pending claim requests
    pendingFoundVerifications: 0,  // Pending found item verifications
    totalPendingVerifications: 0   // Total of both types
  });

  // Add animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    const activitiesQuery = query(
      collection(db, 'activities'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribeActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const activitiesList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Add null checks for data and description
        if (data && 
            data.description && 
            data.userName && 
            !data.description.includes('null') && 
            !data.description.includes('Unknown user')) {
          activitiesList.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toLocaleString() || 'N/A'
          });
        }
      });

      // Deduplicate activities based on referenceId and type
      const uniqueActivities = activitiesList.reduce((acc, current) => {
        const isDuplicate = acc.find(item => 
          item.referenceId === current.referenceId && 
          item.type === current.type
        );

        if (!isDuplicate) {
          return acc.concat([current]);
        }
        return acc;
      }, []);

      // Sort by date (most recent first) and limit to 10 items
      const sortedActivities = uniqueActivities
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

      setActivities(sortedActivities);
    });

    return () => unsubscribeActivities();
  }, []);

  useEffect(() => {
    // Fetch statistics
    const fetchStats = async () => {
      try {
        // Get lost items count
        const lostItemsQuery = query(collection(db, 'lost_items'));
        const lostSnapshot = await getDocs(lostItemsQuery);
        const totalLost = lostSnapshot.size;
        console.log('Total lost items:', totalLost);

        // Get found items count
        const foundItemsQuery = query(collection(db, 'found_items'));
        const foundSnapshot = await getDocs(foundItemsQuery);
        const totalFound = foundSnapshot.size;
        console.log('Total found items:', totalFound);

        // Claimed: status == 'retrieved'
        const claimedClaimReq = await getCountFromServer(query(collection(db, 'claim_requests'), where('status', '==', 'retrieved')));
        const claimedFoundReq = await getCountFromServer(query(collection(db, 'found_requests'), where('status', '==', 'retrieved')));
        const totalClaimed = claimedClaimReq.data().count + claimedFoundReq.data().count;

        // Unclaimed: status == 'approved'
        const unclaimedClaimReq = await getCountFromServer(query(collection(db, 'claim_requests'), where('status', '==', 'approved')));
        const unclaimedFoundReq = await getCountFromServer(query(collection(db, 'found_requests'), where('status', '==', 'approved')));
        const totalUnclaimed = unclaimedClaimReq.data().count + unclaimedFoundReq.data().count;

        // Pending verifications: status == 'pending'
        const pendingClaimReq = await getCountFromServer(query(collection(db, 'claim_requests'), where('status', '==', 'pending')));
        const pendingFoundReq = await getCountFromServer(query(collection(db, 'found_requests'), where('status', '==', 'pending')));
        const totalPendingVerifications = pendingClaimReq.data().count + pendingFoundReq.data().count;

        setStats({
          totalFound,
          totalLost,
          totalClaimed,
          totalUnclaimed,
          pendingClaimVerifications: pendingClaimReq.data().count,
          pendingFoundVerifications: pendingFoundReq.data().count,
          totalPendingVerifications,
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    fetchStats();

    // Run animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleViewActivity = (activity) => {
    // Navigate to appropriate screen based on activity type
    if (activity.type === 'lost_item_reported') {
      navigation.navigate('AdminManageLost');
    } else if (activity.type === 'found_item_reported') {
      navigation.navigate('AdminManageFound');
    } else if (activity.type.includes('claim')) {
      navigation.navigate('ClaimRequests');
    }
  };

  const renderActivityItem = (activity) => {
    const getActivityStyle = (type) => {
      switch (type) {
        case 'lost_item_reported':
          return styles.lostActivity;
        case 'found_item_reported':
          return styles.foundActivity;
        case 'item_claimed':
          return styles.claimedActivity;
        default:
          return {};
      }
    };

    return (
      <View key={activity.id} style={[styles.activityItem, getActivityStyle(activity.type)]}>
        <Text style={styles.activityText}>{activity.description}</Text>
        <Text style={styles.activityTime}>{activity.createdAt}</Text>
      </View>
    );
  };

  const renderCard = (title, value, color, index) => {
    const delay = index * 100;
    return (
      <Animated.View 
        style={[
          styles.card,
          { backgroundColor: color },
          { 
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ]
          }
        ]}
      >
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </Animated.View>
    );
  };

  // Replace the createActivity function with:
  const createActivity = async (type, description, referenceId) => {
    try {
        if (!type || !description || !referenceId) {
            console.error('Missing required parameters for activity creation');
            return;
        }

        // Check for existing activity with same referenceId and type
        const existingActivitiesQuery = query(
            collection(db, 'activities'),
            where('referenceId', '==', referenceId),
            where('type', '==', type),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const existingSnapshot = await getDocs(existingActivitiesQuery);
        
        // Only create new activity if one doesn't exist and description is valid
        if (existingSnapshot.empty && 
            !description.includes('null') && 
            !description.includes('Unknown user')) {
            await addDoc(collection(db, 'activities'), { 
                type,
                description,
                referenceId,
                createdAt: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error('Error creating activity:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AdminHeader navigation={navigation} />

        <View style={styles.dashboardHeader}>
          <SidebarMenu navigation={navigation} />
          <Text style={styles.dashboardTitle}>DASHBOARD</Text>
        </View>

        <Animated.View style={[styles.dashboard, { opacity: fadeAnim }]}>
          {renderCard('Total Found Items', stats.totalFound, '#4CAF50', 0)}
          {renderCard('Total Lost Items', stats.totalLost, '#F44336', 1)}
          {renderCard('Items Claimed', stats.totalClaimed, '#9C27B0', 2)}
          {renderCard('Unclaimed Items', stats.totalUnclaimed, '#2196F3', 3)}
          {renderCard('Pending Verifications', stats.totalPendingVerifications, '#FFC107', 4)}
        </Animated.View>

        <View style={styles.table}>
          <Text style={styles.recentActivitiesTitle}>Recent Activities</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Activity Description</Text>
            <Text style={styles.tableHeaderText}>Date/Time</Text>
            <Text style={styles.tableHeaderText}>Action</Text>
          </View>
          <ScrollView style={{ maxHeight: 250 }}>
            {activities.length === 0 ? (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.noActivitiesText]}>
                  No recent activities
                </Text>
              </View>
            ) : (
              activities.map((activity) => (
                <View key={activity.id} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{activity.description}</Text>
                  <Text style={styles.tableCell}>{activity.createdAt}</Text>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleViewActivity(activity)}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D9D9D9',
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
    paddingHorizontal: 10,
    marginRight: 70,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginLeft: 10,
    color: '#333',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  dashboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    marginTop: 30,
    paddingHorizontal: 10,
  },
  card: {
    width: '45%',
    height: 120,
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  greenCard: { backgroundColor: '#4CAF50' },
  redCard: { backgroundColor: '#F44336' },
  purpleCard: { backgroundColor: '#9C27B0' },
  blueCard: { backgroundColor: '#2196F3' },
  yellowCard: { backgroundColor: '#FFC107' },
  cardTitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  recentActivitiesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  table: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 5,
    marginTop: 35,
    marginLeft: 10,
    marginRight: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    backgroundColor: '#535CFF',
    padding: 5,
    borderRadius: 5,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginLeft: 15,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: 'black',
  },
  viewButton: {
    backgroundColor: '#2F92CA',
    padding: 10,
    borderRadius: 3,
    alignSelf: 'center',
  },
  viewButtonText: {
    color: 'black',
    fontSize: 14,
    textAlign: 'center',
  },
  lostActivity: {
    backgroundColor: '#AE0000',
  },
  foundActivity: {
    backgroundColor: '#359969',
  },
  claimedActivity: {
    backgroundColor: '#C83AF7',
  },
  activityItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  activityText: {
    fontSize: 14,
    color: 'black',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  noActivitiesText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
});

export default Home;
