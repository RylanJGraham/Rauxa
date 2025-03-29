import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const LanguagesSelector = ({ selectedLanguages, onLanguageSelect }) => {
  const languageOptions = [
    'English', 'Spanish', 'French', 'German', 'Catalan', 'Chinese', 
    'Japanese', 'Korean', 'Italian', 'Portuguese', 'Russian',
    'Arabic', 'Hindi', 'Bengali', 'Turkish', 'Dutch',
    'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish'
  ];

  return (
    <View style={styles.section}>
      <View style={styles.selectionContainer}>
        {languageOptions.map((language) => (
          <TouchableOpacity
            key={language}
            style={[
              styles.bubbleContainer,
              selectedLanguages.includes(language) && styles.selectedBubble,
            ]}
            onPress={() => onLanguageSelect(language)}
          >
            <Text style={styles.bubbleText}>{language}</Text>
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

export default LanguagesSelector;