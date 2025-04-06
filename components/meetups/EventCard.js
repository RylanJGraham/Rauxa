import React from "react";
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity } from "react-native";

const EventCard = ({ event, onPress }) => {
  return (
    <TouchableOpacity style={styles.meetupCard} onPress={onPress}>
      <ImageBackground source={{ uri: event.photos[0] }} style={styles.backgroundImage} imageStyle={{ borderRadius: 10 }}>
        {/* Dark Overlay */}
        <View style={styles.overlay} />

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
    height: 180, // Adjust as needed
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
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Dark overlay
    borderRadius: 10,
  },
  dateText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  topRight: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 69, 58, 0.8)", // A nice red shade
    paddingVertical: 4,
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
    fontSize: 14,
  },
});

export default EventCard;
