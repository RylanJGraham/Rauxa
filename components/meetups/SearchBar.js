import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const SearchBar = ({ value, onChangeText, onFilterPress, isFilterActive }) => {
  return (
    <View style={styles.searchBarContainer}>
      {/* Search Input */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search events by title..."
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
    borderWidth: 2,
    borderColor: '#F2BB47',
    borderRadius: 20,
    backgroundColor: '#00000060',
    color: 'white',
    textAlign: 'left',
    fontSize: 16,
    padding: 16,
  },
});

export default SearchBar;
