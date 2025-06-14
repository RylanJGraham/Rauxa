// components/hub/ProfileGalleryOverlay.js
import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons'; // For the close icon
import ProfileImageGallery from './ProfileImageGallery'; // Your existing gallery component

const { width, height } = Dimensions.get('window');

const ProfileGalleryOverlay = ({ profileData, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(0); // State for current image in gallery

  return (
    <View style={styles.overlayContainer}>
      {/* Close Button */}
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close-circle" size={40} color="#FFD700" />
      </TouchableOpacity>

      {/* Profile Image Gallery */}
      <ProfileImageGallery
        profileData={profileData}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Dark, semi-transparent background
    justifyContent: 'center', // Center the gallery horizontally
    alignItems: 'center', // Center the gallery vertically
    zIndex: 999, // Ensure it's on top of almost everything
  },
  closeButton: {
    position: 'absolute',
    top: 50, // Adjust based on safe area/notch
    right: 20,
    zIndex: 1000, // Ensure it's above the gallery
    padding: 10,
  },
});

export default ProfileGalleryOverlay;