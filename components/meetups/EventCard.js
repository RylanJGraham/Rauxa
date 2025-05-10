import React from "react";
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, Platform, Linking } from "react-native";
import { Ionicons } from '@expo/vector-icons';

const EventCard = ({ event, onPress }) => {
  const handleOpenLocation = () => {
    const query = encodeURIComponent(event.location); // e.g. "Sagrada Familia"
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${query}`,
      android: `geo:0,0?q=${query}`,
    });

    Linking.openURL(url).catch(err => console.error("Error opening map", err));
  };

  return (
    <TouchableOpacity style={styles.meetupCard} onPress={onPress}>
      <ImageBackground
        source={{ uri: event.photos[0] }}
        style={styles.backgroundImage}
        imageStyle={{ borderRadius: 10 }}
      >
        {/* Dark Overlay */}
        <View style={styles.overlay} />

        {/* Map Button - Top Left */}
        <TouchableOpacity onPress={handleOpenLocation} style={styles.topLeft}>
          <Ionicons name="location-sharp" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Group Size - Top Right */}
        <View style={styles.topRight}>
          <Text style={styles.groupSizeText}>{event.groupSize}+ People</Text>
        </View>

        {/* Bottom Left - Title & Location */}
        <View style={styles.bottomLeft}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.location}>{event.location}</Text>
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
    overflow: "hidden",
    marginRight: 15,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "space-between",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 10,
  },
  topLeft: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#D9B779",
    padding: 6,
    borderRadius: 6,
  },
  topRight: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 69, 58, 0.8)",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  groupSizeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  bottomLeft: {
    position: "absolute",
    bottom: 10,
    left: 10,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  location: {
    color: "#ddd",
    fontSize: 16,
  },
});

export default EventCard;
