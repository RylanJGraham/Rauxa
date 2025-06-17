import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // Keeping FontAwesome for now, but Ionicons is used elsewhere

const SearchBar = ({ value, onChangeText, onFilterPress, isFilterActive }) => {
  return (
    <View style={styles.searchBarContainer}>
      {/* Search Input */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search for meetup inspo..."
        placeholderTextColor="#EAEAEA80" // Changed placeholder color for better visibility on dark background
        value={value}
        onChangeText={onChangeText}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: "85%",
    padding: 5,
  },
  searchBar: {
    flex: 1,
    borderWidth: 1.5, // Slightly less thick border
    borderColor: '#F2BB47', // Changed border color to the accent yellow
    borderRadius: 15, // Slightly less rounded corners to match modal
    backgroundColor: '#333333', // A darker, but not black, background for depth
    color: '#EAEAEA', // Light text color for contrast
    textAlign: 'left',
    fontSize: 16,
    paddingVertical: 12, // Reduced vertical padding slightly
    paddingHorizontal: 16,
    shadowColor: "#000", // Added shadow for a subtle lift
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default SearchBar;