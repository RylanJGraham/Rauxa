import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'; // Use Image from react-native

/**
 * A component to display an individual message item in the chat list.
 * @param {object} props - The component props.
 * @param {object} props.item - The chat item object containing details like title, sender, message, image, etc.
 * @param {function} props.onPress - Callback function when the message item is pressed.
 * @param {boolean} props.hasUnread - Indicates if the chat has unread messages.
 */
const MessageItem = ({ item, onPress, hasUnread }) => { // Now accepts hasUnread prop
  const chatImageUrl = item.image || "https://placehold.co/50x50/cccccc/000000?text=Chat"; // Fallback image

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}> {/* Wrapper for image and dot */}
        <Image
          source={{ uri: chatImageUrl }}
          style={styles.image}
          resizeMode="cover" // Default for react-native Image is 'cover' anyway
        />
        {/* Render the unread dot conditionally */}
        {hasUnread && (
          <View style={styles.unreadDot} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.timestamp}>
            {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
        <Text style={styles.message} numberOfLines={1}>
          <Text style={styles.sender}>{item.sender}: </Text>
          {item.message}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#024a7c',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative', // Essential for positioning the dot relative to the image
    width: 50,
    height: 50,
    borderRadius: 25, // Match image border radius
    marginRight: 12,
    backgroundColor: '#ddd', // Placeholder background
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 25, // Full circular image
  },
  unreadDot: {
    position: 'absolute',
    top: 0,   // Position at top-left
    left: 0,  // Position at top-left
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000', // Red color for notification
    zIndex: 1, // Ensure it's above the image
    borderWidth: 1.5, // White border for contrast
    borderColor: '#fff',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#ccc',
  },
  message: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  sender: {
    fontWeight: 'bold',
    color: '#FFD700',
  },
});

export default MessageItem;