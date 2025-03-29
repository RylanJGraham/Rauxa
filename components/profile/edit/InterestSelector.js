import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const InterestsSelector = ({ selectedInterests, onInterestSelect }) => {
  const interestsOptions = [
    'Music', 'Sports', 'Karaoke', 'Clubs', 'Beach', 'Dating', 'Study', 'Language Exchange', 'Games',
    'Hiking', 'Cooking', 'Art', 'Theater', 'Movies', 'Volunteer', 'Meetups', 'Video Games', 'Tourism',
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Interests</Text>
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

export default InterestsSelector;
