import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const FilterComponent = ({ filterType, setFilterType, filterOptions }) => {
  return (
    <View style={styles.filterContainer}>
      <Image source={require('../assets/filter-icon.png')} style={styles.filterIcon} />
      <Picker
        selectedValue={filterType}
        style={styles.filterPicker}
        onValueChange={(itemValue) => setFilterType(itemValue)}
      >
        {filterOptions.map((option) => (
          <Picker.Item key={option.value} label={option.label} value={option.value} />
        ))}
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  filterIcon: {
    width: 25, // Adjust the size of the icon
    height: 25,
    marginRight: 10, // Add spacing between the icon and the picker
  },
  filterPicker: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 5,
  },
});

export default FilterComponent;