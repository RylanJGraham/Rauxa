import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const GenderSelector = ({ selectedGender, onGenderSelect }) => {
  const genderOptions = [
    'Male', 'Female', 'Non-Binary', 'Genderqueer', 'Genderfluid', 'Agender', 'Bigender',
    'Two-Spirit', 'Other',
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Gender</Text>
      <View style={styles.selectionContainer}>
        {genderOptions.map((gender) => (
          <TouchableOpacity
            key={gender}
            style={[
              styles.bubbleContainer,
              selectedGender === gender && styles.selectedBubble,
            ]}
            onPress={() => onGenderSelect(gender)}
          >
            <Text style={styles.bubbleText}>{gender}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  bubbleContainer: {
    padding: 8,
    margin: 3,
    borderRadius: 10,
    backgroundColor: '#00000040',
    borderWidth: 2,
    borderColor: '#F2BB47',
  },
  selectedBubble: {
    backgroundColor: '#F2BB47',
  },
  bubbleText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default GenderSelector;
