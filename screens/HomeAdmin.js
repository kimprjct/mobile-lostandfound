import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AdminHeader from '../components/AdminHeader'; // Import the AdminHeader component
import SidebarMenu from '../components/sidebarmenu'; // Import the SidebarMenu component

const Home = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Main Content */}
      <ScrollView>
        {/* Custom Admin Header */}
        <AdminHeader navigation={navigation} /> {/* Use AdminHeader instead of Header */}

        {/* Dashboard Section */}
        <View style={styles.dashboardHeader}>
          {/* Sidebar Menu */}
          <SidebarMenu navigation={navigation} /> {/* Ensure SidebarMenu uses <Text> correctly */}

          {/* Dashboard Title */}
          <Text style={styles.dashboardTitle}>DASHBOARD</Text>
        </View>

        {/* Dashboard Cards */}
        <View style={styles.dashboard}>
          <View style={[styles.card, styles.greenCard]}>
            <Text style={styles.cardTitle}>Total Number of Found Items</Text>
            <Text style={styles.cardValue}>10</Text>
          </View>
          <View style={[styles.card, styles.redCard]}>
            <Text style={styles.cardTitle}>Total Number of Lost Items</Text>
            <Text style={styles.cardValue}>15</Text>
          </View>
          <View style={[styles.card, styles.purpleCard]}>
            <Text style={styles.cardTitle}>Items Claimed</Text>
            <Text style={styles.cardValue}>5</Text>
          </View>
          <View style={[styles.card, styles.blueCard]}>
            <Text style={styles.cardTitle}>Unclaimed Items</Text>
            <Text style={styles.cardValue}>5</Text>
          </View>
          <View style={[styles.card, styles.yellowCard]}>
            <Text style={styles.cardTitle}>Pending Verifications</Text>
            <Text style={styles.cardValue}>5</Text>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.table}>
          <Text style={styles.recentActivitiesTitle}>Recent Activities</Text>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Activity Description</Text>
            <Text style={styles.tableHeaderText}>Date/Time</Text>
            <Text style={styles.tableHeaderText}>Action</Text>
          </View>

          {/* Table Rows */}
          {[{
            description: 'Folder reported found by Maria Theresa', 
            date: '2025-03-03 10:05 AM'
          }, {
            description: 'Umbrella claimed by Soleil Riego', 
            date: '2025-03-03 10:45 AM'
          }, {
            description: 'Wallet reported lost by Maria Bautista', 
            date: '2025-03-03 11:00 AM'
          }, {
            description: 'Money reported lost by Kimberly Peraja', 
            date: '2025-03-03 8:20 AM'
          }].map((activity, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{activity.description}</Text> {/* Ensure this is inside <Text> */}
              <Text style={styles.tableCell}>{activity.date}</Text> {/* Ensure this is inside <Text> */}
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => navigation.navigate('AdminManageLost')}
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
    backgroundColor: '#D9D9D9', // Updated background color
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
    flex: 1, // Pushes the title to the center
    marginLeft: 10, // Adjusted left margin for better spacing
  },
  dashboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly', // Adjust spacing between cards
    marginTop: 30,
  },
  card: {
    width: '43%', // Adjust card width to reduce the gap
    height: 100, // Set a fixed height for all cards
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    marginLeft: 10, // Reduced left margin
    marginRight: 10, // Reduced right margin
    marginBottom: 20, // Add a little gap between each card
  },
  greenCard: {
    backgroundColor: '#359969',
    marginBottom: 20, // Add bottom margin to the green card
  },
  redCard: {
    backgroundColor: '#AE0000',
    marginBottom: 20, // Add bottom margin to the red card
  },
  purpleCard: {
    backgroundColor: '#C83AF7',
  },
  blueCard: {
    backgroundColor: '#3F3CAA',
    marginBottom: 15, // Add bottom margin to the blue card
  },
  yellowCard: {
    backgroundColor: '#BEA035',
    width: '41%', // Adjust yellow card width to match others
    alignSelf: 'center', // Center the yellow card
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
});

export default Home;
