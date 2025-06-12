// components/chat/EventDetailsOverlay.js
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Platform, ActivityIndicator, Dimensions } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import dayjs from "dayjs";
import { Image } from 'expo-image';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

const EventDetailsOverlay = ({ eventId, onClose, onOpenCreateMeetupModal }) => {
  const navigation = useNavigation();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setEvent(null);
    setLoading(true);
    setCurrentImageIndex(0);

    const fetchEventDetails = async () => {
      if (!eventId) {
        console.error("EventDetailsOverlay: Missing eventId for data fetch.");
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "live", eventId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.warn("EventDetailsOverlay: No such document found for path:", `live/${eventId}`);
          setEvent(null);
        }
      } catch (error) {
        console.error("EventDetailsOverlay: Error during data fetch:", error);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const handleOpenLocation = () => {
    if (!event?.location) return;
    const query = encodeURIComponent(event.location);
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${query}`,
      android: `geo:0,0?q=${query}`,
    });
    Linking.openURL(url).catch((err) => console.error("Error opening map", err));
  };

  const overlayContentWidth = screenWidth - 40; // Represents the width of the overlay's main content area
  const effectiveImageWidth = overlayContentWidth - (styles.galleryContainer.paddingHorizontal * 2 || 0);

  const handleImageChange = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    if (effectiveImageWidth > 0) {
        const imageIndex = Math.floor(contentOffsetX / effectiveImageWidth);
        setCurrentImageIndex(imageIndex);
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return { date: "TBD", time: "TBD" };
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return {
      date: dayjs(date).format('MMMM D, YYYY'),
      time: dayjs(date).format('h:mm A')
    };
  };

  const { date: formattedDate, time: formattedTime } = formatDateTime(event?.date);


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Event details not found.</Text>
        {/* Keeping this close button consistent for the error state too */}
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.overlayBackground}>
        <LinearGradient
            colors={["#D9043D", "#730220"]}
            style={[
                styles.modalContentContainer,
                { width: overlayContentWidth }
            ]}
        >
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
                {/* CHANGED: From "arrow-back" to "close" icon */}
                <Ionicons name="close" size={30} color="#FFFFFF" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.galleryContainer}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        onScroll={handleImageChange}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.gallery}
                        scrollEventThrottle={16}
                    >
                        {event.photos?.map((photo, index) => (
                            <Image key={index} source={{ uri: photo }} style={[styles.image, { width: effectiveImageWidth }]} />
                        ))}
                    </ScrollView>

                    <View style={styles.pageIndicators}>
                        {event.photos?.map((_, index) => (
                            <View
                                key={index}
                                style={[styles.indicator, currentImageIndex === index && styles.activeIndicator]}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.titleRow}>
                    <Text style={styles.title}>{event.title}</Text>
                    <TouchableOpacity style={styles.mapButton} onPress={handleOpenLocation}>
                        <Ionicons name="location" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={styles.location}>{event.location}</Text>

                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={20} color="#fff" style={styles.icon} />
                        <Text style={styles.label}>Date:</Text>
                        <Text style={styles.value}>{formattedDate}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="time" size={20} color="#fff" style={styles.icon} />
                        <Text style={styles.label}>Time:</Text>
                        <Text style={styles.value}>{formattedTime}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="people" size={20} color="#fff" style={styles.icon} />
                        <Text style={styles.label}>Group Size:</Text>
                        <Text style={styles.value}>{event.groupSize}+</Text>
                    </View>

                    {event.tags && (
                        <View style={styles.tagsContainer}>
                            {event.tags.map((tag, index) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {event.description && (
                        <View style={styles.descriptionBox}>
                            <Text style={styles.sectionTitle}>About This Meetup</Text>
                            <Text style={styles.description}>{event.description}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContentContainer: {
    maxHeight: screenHeight * 0.95,
    marginBottom: Platform.OS === 'ios' ? 20 : 40,
    borderRadius: 20,
    overflow: 'hidden',
    paddingTop: 10,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  errorText: {
      color: '#FFF',
      fontSize: 18,
      marginBottom: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  galleryContainer: {
    position: "relative",
    width: "100%",
    height: 250,
    borderRadius: 15,
    overflow: 'hidden',
    paddingHorizontal: 10,
  },
  gallery: {
    // No specific width here, images inside handle their width
  },
  image: {
    height: 250,
    resizeMode: 'cover',
    borderRadius: 15,
  },
  pageIndicators: {
    position: "absolute",
    bottom: 10,
    width: '100%',
    flexDirection: "row",
    justifyContent: "center",
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    backgroundColor: "#5B0A1F",
  },
  activeIndicator: {
    backgroundColor: "#D9043D",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 20,
  },
  title: {
    flex: 0.9,
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },
  mapButton: {
    flex: 0.1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0367A6",
    padding: 8,
    borderRadius: 20,
  },
  content: {
    paddingHorizontal: 20,
  },
  location: {
    fontSize: 16,
    color: "#bbb",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  label: {
    color: "#aaa",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 10,
  },
  value: {
    color: "#fff",
    fontSize: 15,
    flex: 1,
    marginLeft: 10,
  },
  icon: {
    marginRight: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  tag: {
    backgroundColor: "#F2BB47",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: "#fff",
    fontSize: 14,
  },
  descriptionBox: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 5,
  },
  description: {
    color: "#ddd",
    lineHeight: 18,
    fontSize: 14,
  },
  backButton: {
    position: "absolute",
    top: 20,
    right: 20, // This positions it top-right
    zIndex: 1,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 25,
  },
  // Note: There's also a `closeButton` style specifically for the error state.
  // The request was for the main "back arrow" to be an "x".
  closeButton: { // This one is only for the error state message
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 25,
  }
});

export default EventDetailsOverlay;