// components/chat/matches/EventMatchCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'; // Import Image directly from react-native

/**
 * A card component to display a new event match.
 * @param {object} props - The component props.
 * @param {object} props.event - The event object containing id, title, and image.
 * @param {function} props.onPress - Callback function when the card is pressed.
 */
const EventMatchCard = ({ event, onPress }) => {
  const imageUrl = event.image || "https://placehold.co/100x100/0367A6/ffffff?text=Event"; // Fallback image URL

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(event.id, event.title, event.eventId)}>
      <Image // Use react-native's Image component
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover" // Equivalent to contentFit="cover" for react-native Image
        onError={(e) => console.log("EventMatchCard Image load error:", e.nativeEvent.error)}
        onLoad={() => console.log("EventMatchCard Image loaded successfully")}
      />
      <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 100, // Fixed width for each card
    height: 120, // Adjusted height to accommodate title
    marginHorizontal: 8,
    borderRadius: 15,
    backgroundColor: '#024a7c', // Darker blue background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30, // Make it circular
    marginBottom: 5,
    backgroundColor: '#ddd', // Placeholder background
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default EventMatchCard;
