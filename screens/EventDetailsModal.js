import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Linking, Platform, ActivityIndicator, Alert, Dimensions, StatusBar } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import dayjs from "dayjs";

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

// Add onOpenCreateMeetupModal prop
const EventDetailsModal = ({ isVisible, eventId, sourceCollection, onClose, onOpenCreateMeetupModal }) => {
  const navigation = useNavigation();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // If the component is not visible, return null immediately
  if (!isVisible) {
    return null;
  }

  useEffect(() => {
    // Reset state when modal is opened (isVisible becomes true)
    // No need to reset when it closes since it unmounts/re-mounts
    setEvent(null);
    setLoading(true);
    setCurrentImageIndex(0);

    const fetchEventDetails = async () => {
      if (!eventId || !sourceCollection) {
        console.error("EventDetailsModal: Missing eventId or sourceCollection for data fetch.");
        Alert.alert("Error", "Invalid event details provided.");
        setLoading(false);
        onClose();
        return;
      }

      try {
        const docRef = doc(db, "meetups", sourceCollection, "events", eventId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.warn("EventDetailsModal: No such document found for path:", `meetups/${sourceCollection}/events/${eventId}`);
          Alert.alert("Error", "Event not found.");
          onClose();
        }
      } catch (error) {
        console.error("EventDetailsModal: Error during data fetch:", error);
        Alert.alert("Error", "Failed to load event details.");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, sourceCollection]); // Removed isVisible from dependency array as we return null if not visible

  const handleOpenLocation = () => {
    if (!event?.location) return;
    const query = encodeURIComponent(event.location);
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${query}`,
      android: `geo:0,0?q=${query}`,
    });
    Linking.openURL(url).catch((err) => console.error("Error opening map", err));
  };

  const handleImageChange = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const modalContentWidth = screenWidth - 40;
    const imageIndex = Math.floor(contentOffsetX / modalContentWidth);
    setCurrentImageIndex(imageIndex);
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

  const modalActualWidth = screenWidth - 40;

  // Status bar and navigation bar color management (unchanged)
  useEffect(() => {
    if (Platform.OS === 'android') {
      const modalNavColor = "#730220";
      const defaultNavColor = "rgba(0,0,0,0)";

      if (isVisible) {
        StatusBar.setBackgroundColor('rgba(0, 0, 0, 0.6)', false);
        StatusBar.setBarStyle('light-content');

        if (StatusBar.setNavigationBarColor) {
          StatusBar.setNavigationBarColor(modalNavColor, false);
        }
      } else {
        StatusBar.setBackgroundColor('rgba(0,0,0,0)', false);
        StatusBar.setBarStyle('light-content');

        if (StatusBar.setNavigationBarColor) {
          StatusBar.setNavigationBarColor(defaultNavColor, false);
        }
      }
    }
  }, [isVisible]);

  if (loading) {
    return (
      <View style={styles.modalOverlayFull}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!event) return null; // If event is still null after loading, nothing to display

  return (
    <View style={styles.modalOverlayFull}>
      <LinearGradient colors={["#D9043D", "#730220"]} style={[styles.modalContentContainer, { width: modalActualWidth }]}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={30} color="#FFFFFF" />
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
                <Image key={index} source={{ uri: photo }} style={[styles.image, { width: modalActualWidth - 20 }]} />
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

            <View style={styles.organizerRow}>
              {event.sponsored && event.sponsor && event.sponsorIMG ? (
                <>
                  <Image source={{ uri: event.sponsorIMG }} style={styles.organizerImage} />
                  <Text style={styles.organizerText}>
                    Sponsored by <Text style={styles.rauxaText}>{event.sponsor}</Text>
                  </Text>
                </>
              ) : (
                <>
                  <Image source={require('../assets/onboarding/Onboarding1.png')} style={styles.organizerImage} />
                  <Text style={styles.organizerText}>
                    Recommended by <Text style={styles.rauxaText}>Rauxa</Text>
                  </Text>
                </>
              )}
            </View>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.rsvpButton}
                onPress={() => {
                  onClose(); // Close EventDetailsModal
                  onOpenCreateMeetupModal(event.sponsored ? "sponsored_template" : "template", event);
                }}
              >
                <Text style={styles.rsvpButtonText}>Quick Create</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rsvpButton, { backgroundColor: "#F2BB47" }]}
                onPress={() => {
                  onClose(); // Close EventDetailsModal
                  onOpenCreateMeetupModal(event.sponsored ? "sponsored_template" : "template", event);
                }}
              >
                <Text style={styles.rsvpButtonText}>Modify Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlayFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Ensure it's on top of other content
  },
  modalContentContainer: {
    maxHeight: screenHeight * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
    paddingTop: 10,
    paddingBottom: 20,
  },
  // ... (rest of your styles remain the same)
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
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
    marginHorizontal: 10,
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
  rsvpButton: {
    backgroundColor: "#0367A6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rsvpButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 1,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 25,
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 10,
    paddingHorizontal: 0,
  },
  organizerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 8,
  },
  organizerText: {
    fontSize: 16,
    color: "#fff",
  },
  rauxaText: {
    color: "#007bff",
    fontWeight: "bold",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

export default EventDetailsModal;