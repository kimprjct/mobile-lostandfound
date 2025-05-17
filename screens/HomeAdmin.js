import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AdminHeader from '../components/AdminHeader';
import SidebarMenu from '../components/sidebarmenu';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs, where, onSnapshot } from 'firebase/firestore';

const Home = ({ navigation }) => {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    totalFound: 0,
    totalLost: 0,
    totalClaimed: 0,
    totalUnclaimed: 0,
    pendingVerifications: 0
  });

  useEffect(() => {
    // Fetch activities
    const activitiesQuery = query(
      collection(db, 'activities'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribeActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const activitiesList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        activitiesList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toLocaleString() || 'N/A'
        });
      });
      setActivities(activitiesList);
    });

    // Fetch statistics
    const fetchStats = async () => {
      try {
        // Get lost items count
        const lostItemsQuery = query(collection(db, 'lost_items'));
        const lostSnapshot = await getDocs(lostItemsQuery);
        const totalLost = lostSnapshot.size;

        // Get found items count
        const foundItemsQuery = query(collection(db, 'found_items'));
        const foundSnapshot = await getDocs(foundItemsQuery);
        const totalFound = foundSnapshot.size;

        // Get claimed items count
        const claimedLostQuery = query(
          collection(db, 'lost_items'),
          where('status', '==', 'claimed')
        );
        const claimedFoundQuery = query(
          collection(db, 'found_items'),
          where('status', '==', 'claimed')
        );
        const [claimedLostSnapshot, claimedFoundSnapshot] = await Promise.all([
          getDocs(claimedLostQuery),
          getDocs(claimedFoundQuery)
        ]);
        const totalClaimed = claimedLostSnapshot.size + claimedFoundSnapshot.size;

        // Get unclaimed items count
        const unclaimedLostQuery = query(
          collection(db, 'lost_items'),
          where('status', '==', 'unclaimed')
        );
        const unclaimedFoundQuery = query(
          collection(db, 'found_items'),
          where('status', '==', 'unclaimed')
        );
        const [unclaimedLostSnapshot, unclaimedFoundSnapshot] = await Promise.all([
          getDocs(unclaimedLostQuery),
          getDocs(unclaimedFoundQuery)
        ]);
        const totalUnclaimed = unclaimedLostSnapshot.size + unclaimedFoundSnapshot.size;

        // Get pending verifications count
        const pendingLostQuery = query(
          collection(db, 'lost_items'),
          where('status', '==', 'pending')
        );
        const pendingFoundQuery = query(
          collection(db, 'found_items'),
          where('status', '==', 'pending')
        );
        const [pendingLostSnapshot, pendingFoundSnapshot] = await Promise.all([
          getDocs(pendingLostQuery),
          getDocs(pendingFoundQuery)
        ]);
        const totalPending = pendingLostSnapshot.size + pendingFoundSnapshot.size;

        setStats({
          totalLost,
          totalFound,
          totalClaimed,
          totalUnclaimed,
          pendingVerifications: totalPending
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    fetchStats();
    return () => unsubscribeActivities();
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

  return (
    <View style={styles.container}>
      <ScrollView>
        <AdminHeader navigation={navigation} />

        <View style={styles.dashboardHeader}>
          <SidebarMenu navigation={navigation} />
          <Text style={styles.dashboardTitle}>DASHBOARD</Text>
        </View>

        <View style={styles.dashboard}>
          <View style={[styles.card, styles.greenCard]}>
            <Text style={styles.cardTitle}>Total Number of Found Items</Text>
            <Text style={styles.cardValue}>{stats.totalFound}</Text>
          </View>
          <View style={[styles.card, styles.redCard]}>
            <Text style={styles.cardTitle}>Total Number of Lost Items</Text>
            <Text style={styles.cardValue}>{stats.totalLost}</Text>
          </View>
          <View style={[styles.card, styles.purpleCard]}>
            <Text style={styles.cardTitle}>Items Claimed</Text>
            <Text style={styles.cardValue}>{stats.totalClaimed}</Text>
          </View>
          <View style={[styles.card, styles.blueCard]}>
            <Text style={styles.cardTitle}>Unclaimed Items</Text>
            <Text style={styles.cardValue}>{stats.totalUnclaimed}</Text>
          </View>
          <View style={[styles.card, styles.yellowCard]}>
            <Text style={styles.cardTitle}>Pending Verifications</Text>
            <Text style={styles.cardValue}>{stats.pendingVerifications}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <Text style={styles.recentActivitiesTitle}>Recent Activities</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Activity Description</Text>
            <Text style={styles.tableHeaderText}>Date/Time</Text>
            <Text style={styles.tableHeaderText}>Action</Text>
          </View>

          {activities.map((activity) => (
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
          ))}
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
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginLeft: 10,
  },
  dashboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    marginTop: 30,
  },
  card: {
    width: '43%',
    height: 100,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 20,
  },
  greenCard: {
    backgroundColor: '#359969',
    marginBottom: 20,
  },
  redCard: {
    backgroundColor: '#AE0000',
    marginBottom: 20,
  },
  purpleCard: {
    backgroundColor: '#C83AF7',
  },
  blueCard: {
    backgroundColor: '#3F3CAA',
    marginBottom: 15,
  },
  yellowCard: {
    backgroundColor: '#BEA035',
    width: '41%',
    alignSelf: 'center',
  },
  cardTitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cardValue: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 5,
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
});

export default Home;
