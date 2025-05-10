import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Linking, Platform, ActivityIndicator, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";


const EventDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const docRef = doc(db, "meetups", "Recommended_Meetups", "events", eventId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent(docSnap.data());
        } else {
          Alert.alert("Error", "Event not found.");
        }
      } catch (error) {
        console.error("Error loading event details:", error);
        Alert.alert("Error", "Failed to load event details.");
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

  const handleImageChange = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const imageIndex = Math.floor(contentOffsetX / contentOffsetXWidth); //  Use this to calculate the current index
    setCurrentImageIndex(imageIndex);
  };

  const contentOffsetXWidth = 300;  // Width of your images or container

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!event) return null;

  return (
    <LinearGradient colors={["#D9043D", "#730220"]} style={styles.gradientContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Add")}>
        <Ionicons name="arrow-back" size={36} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView style={styles.container}>
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          <ScrollView 
            horizontal
            pagingEnabled
            onScroll={handleImageChange}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gallery}
          >
            {event.photos?.map((photo, index) => (
              <Image key={index} source={{ uri: photo }} style={styles.image} />
            ))}
          </ScrollView>

          {/* Page Indicators */}
          <View style={styles.pageIndicators}>
            {event.photos?.map((_, index) => (
              <View
                key={index}
                style={[styles.indicator, currentImageIndex === index && styles.activeIndicator]}
              />
            ))}
          </View>
        </View>

        {/* Event Title and Open Map Button */}
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
                <Text style={styles.value}>{event.date || "TBD"}</Text>
            </View>

            <View style={styles.infoRow}>
                <Ionicons name="time" size={20} color="#fff" style={styles.icon} />
                <Text style={styles.label}>Time:</Text>
                <Text style={styles.value}>{event.time || "TBD"}</Text>
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
            <Image source={require('../assets/onboarding/Onboarding1.png')} style={styles.organizerImage} />
            <Text style={styles.organizerText}>
                Recommended by <Text style={styles.rauxaText}>Rauxa</Text>
            </Text>
            </View>


            <View style={styles.buttonsContainer}>
                <TouchableOpacity style={styles.rsvpButton} onPress={() => Alert.alert("RSVP", "Thanks for RSVPing!")}>
                    <Text style={styles.rsvpButtonText}>Quick Create</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.rsvpButton, { backgroundColor: "#F2BB47" }]}
                    onPress={() => {
                    navigation.navigate("CreateMeetup", {
                        mode: "edit",
                        eventData: event,
                    });
                    }}
                >
                    <Text style={styles.rsvpButtonText}>Modify Event</Text>
                </TouchableOpacity>
                </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingBottom: 40, // To prevent content from being hidden behind the gradient
  },
  galleryContainer: {
    position: "relative",
    width: "100%",
  },
  gallery: {
    width: "100%",
  },
  image: {
    width: "100%",
    height: 400,
  },
  pageIndicators: {
    position: "absolute",
    bottom: 2,
    flexDirection: "row",
    justifyContent: "center"
  },
  indicator: {
    flex: 0.33,
    height: 4,
    margin: 5,
    borderRadius: 5,
    backgroundColor: "#5B0A1F",
  },
  activeIndicator: {
    backgroundColor: "#D9043D",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 20,
  },
  title: {
    flex: 0.9,  // 60% space
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  mapButton: {
    flex: 0.1,  // 40% space
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0367A6",
    padding: 10,
    borderRadius: 25,
  },
  mapButtonText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "bold",
  },
  content: {
    paddingHorizontal: 20,
  },
  location: {
    fontSize: 18,
    color: "#bbb",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",  // Align items in the center to fix spacing
    marginVertical: 12,     // Increased margin for better separation
},
label: {
    color: "#aaa",
    fontWeight: "bold",
    fontSize: 16,           // Adjust font size for consistency
    marginLeft: 10,         // Added margin for spacing the icon
},
value: {
    color: "#fff",
    fontSize: 16,           // Consistent font size
    flex: 1,                // Allow value text to take up remaining space
    marginLeft: 10,         // Space between label and value
},
icon: {
    marginRight: 10,        // Space between icon and label
},
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  tag: {
    backgroundColor: "#F2BB47",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: "#fff",
    fontSize: 16,
  },
  descriptionBox: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 5,
  },
  description: {
    color: "#ddd",
    lineHeight: 20,
  },
  rsvpButton: {
    backgroundColor: "#0367A6",
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 25,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,  // For Android shadow
  },
  rsvpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1c1c1e",
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 30,
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 10,
    paddingHorizontal: 0,
  },
  organizerImage: {
    width: 60,
    height: 60,
    borderRadius: 40,
    marginRight: 10,
  },
  organizerText: {
    fontSize: 18,
    color: "#fff",
  },
  rauxaText: {
    color: "#007bff",  // Blue color for "Rauxa"
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

export default EventDetailsScreen;
