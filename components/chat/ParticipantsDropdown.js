// components/chat/ParticipantsDropdown.js
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  // Removed Modal and TouchableWithoutFeedback as it's no longer a modal
} from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';

const ParticipantsDropdown = ({ onClose, participants }) => { // isVisible prop removed from destructuring
  const participantsArray = participants || [];

  return (
    // Replaced Modal with a View
    <View style={styles.dropdownContainer}>
      <View style={styles.dropdownHeader}>
        <Text style={styles.dropdownTitle}>Participants</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={participantsArray}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.participantItem} onPress={onClose}> {/* Close on participant click too */}
            {item.profileImage ? (
              <Image
                source={{ uri: item.profileImage }}
                style={styles.participantImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.participantImagePlaceholder}>
                <Text style={styles.participantImagePlaceholderText}>
                  {item.firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.participantName}>
              {item.firstName} {item.lastName}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyListText}>No participants found.</Text>
        )}
        style={styles.participantsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    width: 250, // Fixed width for a dropdown
    // maxHeight: 300, // Fixed max height for scrollability
    backgroundColor: '#024a7c', // Dark blue background
    borderRadius: 10, // Slightly less rounded for a dropdown
    padding: 10, // Reduced padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    // No absolute positioning here, handled by parent
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 0.5, // Thinner separator
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 8, // Reduced padding
  },
  dropdownTitle: {
    fontSize: 18, // Slightly smaller title for dropdown
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    padding: 5,
  },
  participantsList: {
    maxHeight: 250, // Explicit max height for the FlatList content
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8, // Reduced padding
    borderBottomWidth: 0.2, // Very thin separator
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  participantImage: {
    width: 35, // Slightly smaller image
    height: 35,
    borderRadius: 17.5,
    marginRight: 8,
    backgroundColor: '#ddd',
  },
  participantImagePlaceholder: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 8,
    backgroundColor: '#6b7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantImagePlaceholderText: {
    color: '#fff',
    fontSize: 16, // Adjusted font size
    fontWeight: 'bold',
  },
  participantName: {
    fontSize: 15, // Slightly smaller font size
    color: '#FFF',
    fontWeight: '500',
  },
  emptyListText: {
    color: '#a0aec0',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
});

export default ParticipantsDropdown;