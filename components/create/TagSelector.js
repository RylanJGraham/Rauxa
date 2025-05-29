import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ALL_TAGS = ['Music', 'Sports', 'Karaoke', 'Clubs', 'Beach', 'Dating'];

const TagSelector = ({ tags, setTags }) => {
  const toggleTag = (tag) => {
    setTags(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]);
  };

  return (
    <View style={styles.container}>
      {ALL_TAGS.map((tag) => (
        <TouchableOpacity
          key={tag}
          onPress={() => toggleTag(tag)}
          style={[styles.tag, tags.includes(tag) && styles.selected]}
        >
          <Text style={styles.text}>{tag}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10 },
  tag: { backgroundColor: '#ccc', padding: 8, margin: 5, borderRadius: 5 },
  selected: { backgroundColor: '#D9043D' },
  text: { color: 'white' },
});

export default TagSelector;
