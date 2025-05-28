import React from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SponsoredEventCard = ({ event, onPress }) => {
  const handleOpenLocation = () => {
    const query = encodeURIComponent(event.location);
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${query}`,
      android: `geo:0,0?q=${query}`,
    });

    Linking.openURL(url).catch((err) => console.error("Error opening map", err));
  };

  return (
    <TouchableOpacity style={styles.meetupCard} onPress={onPress}>
      <ImageBackground
        source={{ uri: event.photos?.[0] }}
        style={styles.backgroundImage}
        imageStyle={{ borderRadius: 10 }}
      >
        {/* Dark Overlay */}
        <View style={styles.overlay} />

        {/* Sponsor Centered */}
        <View style={styles.sponsorContainer}>
          <Image source={{ uri: event.sponsorIMG }} style={styles.sponsorLogo} />
          <Text style={styles.sponsorText}>{event.sponsor}</Text>
        </View>

        {/* Location Button */}
        <TouchableOpacity onPress={handleOpenLocation} style={styles.topLeft}>
          <Ionicons name="location-sharp" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Group Size */}
        <View style={styles.topRight}>
          <Text style={styles.groupSizeText}>{event.groupSize}+ People</Text>
        </View>

        {/* Bottom Info */}
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
  sponsorContainer: {
    position: "absolute",
    top: "40%",
    left: "10%",
    right: "10%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sponsorLogo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
  },
  sponsorText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
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
    fontSize: 14,
  },
});

export default SponsoredEventCard;
