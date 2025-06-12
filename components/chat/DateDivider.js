// components/chat/DateDivider.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Renders a date divider in the chat list.
 * @param {object} props - The component props.
 * @param {string} props.dateLabel - The formatted date string to display (e.g., "Today", "Yesterday").
 */
const DateDivider = ({ dateLabel }) => {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.dateText}>{dateLabel}</Text>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15, // Provides spacing around the divider
  },
  line: {
    flex: 1, // Allows the line to take up available space
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)', // A subtle white line
  },
  dateText: {
    marginHorizontal: 10, // Spacing between the line and text
    color: '#a0aec0', // Light grey color for the text
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default DateDivider;
