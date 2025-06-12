// ../components/chat/messages/MessageBubble.js
import React from 'react';
import { View, Text, StyleSheet, Image as RNImage } from 'react-native';
import { Image } from 'expo-image'; // Assuming expo-image for better image handling

const MessageBubble = ({ message, currentUserId, participantsInfo }) => {
  const isMyMessage = message.senderId === currentUserId;
  const senderInfo = participantsInfo[message.senderId];
  const senderDisplayName = senderInfo?.displayName || 'Unknown';
  const senderProfileImage = senderInfo?.profileImage;

  // Determine the correct source format for the Image component
  // If senderProfileImage is a string (URI), use { uri: string }
  // If senderProfileImage is a number (local require), use the number directly
  const imageSource = typeof senderProfileImage === 'string'
    ? { uri: senderProfileImage }
    : senderProfileImage;

  // Format timestamp for display
  const formattedTime = message.timestamp
    ? new Date(message.timestamp.toMillis()).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <View style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.otherMessageRow]}>
      {!isMyMessage && senderProfileImage && (
        <Image
          source={imageSource} // Use the dynamically determined image source
          style={styles.profileImage}
          contentFit="cover"
        />
      )}
      {!isMyMessage && !senderProfileImage && (
        <View style={styles.profileImagePlaceholder}>
          <Text style={styles.profileImagePlaceholderText}>
            {senderDisplayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
        ]}
      >
        {!isMyMessage && (
          <Text style={styles.senderName}>{senderDisplayName}</Text>
        )}
        <Text style={styles.messageText}>{message.text}</Text>
        <Text style={styles.messageTime}>{formattedTime}</Text>
      </View>

      {isMyMessage && senderProfileImage && (
        <Image
          source={imageSource} // Use the dynamically determined image source
          style={styles.profileImage}
          contentFit="cover"
        />
      )}
      {isMyMessage && !senderProfileImage && (
        <View style={styles.profileImagePlaceholder}>
          <Text style={styles.profileImagePlaceholderText}>
            {senderDisplayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Align bubbles to the bottom of the row
    marginVertical: 4,
  },
  myMessageRow: {
    justifyContent: 'flex-end', // Align my messages to the right
  },
  otherMessageRow: {
    justifyContent: 'flex-start', // Align other messages to the left
  },
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    maxWidth: '75%', // Limit bubble width
    flexDirection: 'column',
  },
  myMessageBubble: {
    backgroundColor: '#D9043D', // Gold for my messages
    marginLeft: 10,
    borderBottomRightRadius: 5, // A slight corner to differentiate
  },
  otherMessageBubble: {
    backgroundColor: '#3C444F', // Dark blue for others' messages
    marginRight: 10,
    borderBottomLeftRadius: 5, // A slight corner to differentiate
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#a0aec0', // Lighter text for sender name in others' messages
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  profileImagePlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
    backgroundColor: '#6b7280', // Default background for placeholder
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MessageBubble;
