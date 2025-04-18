import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const InterestsSelector = ({ selectedInterests, onInterestSelect }) => {
  const interestsOptions = [
    'Music', 'Sports', 'Karaoke', 'Clubs', 'Beach', 'Dating', 'Study', 'Language Exchange', 'Games',
    'Hiking', 'Cooking', 'Art', 'Theater', 'Movies', 'Volunteer', 'Meetups', 'Video Games', 'Tourism',
  ];

  return (
    <View style={styles.section}>
      <View style={styles.selectionContainer}>
        {interestsOptions.map((interest) => (
          <TouchableOpacity
            key={interest}
            style={[
              styles.bubbleContainer,
              selectedInterests.includes(interest) && styles.selectedBubble,
            ]}
            onPress={() => onInterestSelect(interest)}
          >
            <Text style={styles.bubbleText}>{interest}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 0,
    paddingBottom: 0,
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
    marginTop: 0,
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

export default InterestsSelector;
