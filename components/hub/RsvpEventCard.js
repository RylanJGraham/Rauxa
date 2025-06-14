import React from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const RsvpEventCard = ({ event, isAccepted, onPress, onInfoPress, onChatPress }) => {
  // Helper function to crop the text
  const renderCroppedText = (text, maxLength) => {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  // Define intensity based on platform
  const blurIntensity = Platform.select({
    ios: 0,   // Blur intensity set to 0 for iOS
    android: 10, // Blur intensity set to 10 for Android
    default: 10, // Default blur intensity set to 10
  });

  // Define colors based on status with 50% opacity
  const acceptedOverlayColor = 'rgba(217, 183, 121, 0.5)'; // D9B779 with 50% opacity
  const acceptedIconColor = '#D9B779';

  const pendingOverlayColor = 'rgba(52, 57, 76, 0.5)'; // 34394C with 50% opacity
  const pendingIconColor = '#34394C';

  return (
    <TouchableOpacity style={styles.meetupCard} onPress={onPress}>
      <ImageBackground
        source={{ uri: event.photos[0] }}
        style={styles.backgroundImage}
        imageStyle={{ borderRadius: 10 }}
      >
        {/* Dark Overlay for readability */}
        <View style={styles.overlay} />

        {/* Top Action Buttons Container */}
        <View style={styles.topButtonsContainer}>
          {/* Info Button - Top Left (Always visible) */}
          <TouchableOpacity onPress={() => onInfoPress(event)} style={styles.iconButton}>
            <Ionicons name="information-circle" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Chat Button - Top Right (Conditionally visible based on isAccepted) */}
          {isAccepted && (
            <TouchableOpacity onPress={() => onChatPress(event)} style={styles.iconButton}>
              <Ionicons name="chatbubbles" size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Left - Title & Location */}
        <View style={styles.bottomLeft}>
          <Text style={styles.title}>{renderCroppedText(event.title, 15)}</Text>
          <Text style={styles.location}>{renderCroppedText(event.location, 20)}</Text>
        </View>

        {/* Acceptance Status Overlay */}
        <View style={styles.statusOverlayContainer}>
          {isAccepted ? (
            <BlurView intensity={blurIntensity} tint="dark" style={[styles.statusOverlayAccepted, { backgroundColor: acceptedOverlayColor }]}>
              <Ionicons name="checkmark-circle" size={48} color={acceptedIconColor} />
              <Text style={styles.statusText}>Accepted!</Text>
            </BlurView>
          ) : (
            <BlurView intensity={blurIntensity} tint="dark" style={[styles.statusOverlayPending, { backgroundColor: pendingOverlayColor }]}>
              <Ionicons name="time" size={48} color={pendingIconColor} />
              <Text style={styles.statusText}>Pending...</Text>
            </BlurView>
          )}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  meetupCard: {
    width: 200,
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 15,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'space-between',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
  },
  topButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    zIndex: 1,
  },
  iconButton: {
    backgroundColor: '#0367A6',
    padding: 6,
    borderRadius: 6,
  },
  bottomLeft: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    zIndex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  location: {
    color: '#ddd',
    fontSize: 16,
  },
  statusOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOverlayAccepted: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  statusOverlayPending: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default RsvpEventCard;