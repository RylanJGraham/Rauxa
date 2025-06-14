// components/hub/AttendeeProfileCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons'; // For icons like 'checkmark-circle', 'close-circle'

const AttendeeProfileCard = ({ user, status, onAccept, onDecline, onCardPress, eventId }) => { // Removed onChat
  const profileImageSource = user.profileImage ? { uri: user.profileImage } : require('../../assets/onboarding/Onboarding1.png'); // Generic fallback

  // Determine if the card is clickable for profile view
  const isProfileViewable = status === 'accepted' && onCardPress;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={isProfileViewable ? () => onCardPress(user) : undefined} // Only callable if accepted and handler exists
      activeOpacity={isProfileViewable ? 0.7 : 1} // Visual feedback for clickable cards
    >
      <Image
        source={profileImageSource}
        style={styles.profileImage}
        contentFit="cover"
      />
      <View style={styles.infoContainer}>
        <Text style={styles.userName}>{user.displayName || 'Unknown User'}</Text>
        {status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={() => onAccept(eventId, user.id)} style={[styles.actionButton, styles.acceptButton]}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDecline(eventId, user.id)} style={[styles.actionButton, styles.declineButton]}>
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        {status === 'accepted' && (
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
            <Text style={styles.statusTextAccepted}>Accepted</Text>
            {/* Removed chat button */}
          </View>
        )}
        {status === 'rejected' && (
          <View style={styles.statusContainer}>
            <Ionicons name="close-circle-outline" size={20} color="#f44336" />
            <Text style={styles.statusTextRejected}>Rejected</Text>
            {/* Removed chat button */}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#024a7c',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 160,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#ddd',
    borderWidth: 1,
    borderColor: '#0367A6',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 5,
  },
  actionButton: {
    padding: 5,
    borderRadius: 5,
    marginRight: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#f44336',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusTextAccepted: {
    color: '#4CAF50',
    marginLeft: 5,
    fontWeight: '600',
  },
  statusTextRejected: {
    color: '#f44336',
    marginLeft: 5,
    fontWeight: '600',
  },
});

export default AttendeeProfileCard;