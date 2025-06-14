// components/LiveEventDetailsModal.js
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase"; // Ensure this path is correct for your Firebase config
import LiveEventDetailsContent from './LiveEventDetailsContent';
import { Ionicons } from "@expo/vector-icons";

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const LiveEventDetailsModal = ({ isVisible, eventId, onClose }) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const slideAnimation = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnimation = useRef(new Animated.Value(0)).current;

  // Manages the status bar and navigation bar appearance for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const modalBarColor = 'rgba(0, 0, 0, 0.6)'; // Semi-transparent black for modal overlay
      const defaultBarColor = 'rgba(0,0,0,0)'; // Transparent for normal app state

      if (isVisible) {
        StatusBar.setBackgroundColor(modalBarColor, false);
        StatusBar.setBarStyle('light-content');
        if (StatusBar.setNavigationBarColor) {
          StatusBar.setNavigationBarColor(modalBarColor, false);
        }
      } else {
        // Reset to app's default status bar style when modal closes
        StatusBar.setBackgroundColor(defaultBarColor, false);
        StatusBar.setBarStyle('light-content');
        if (StatusBar.setNavigationBarColor) {
          StatusBar.setNavigationBarColor(defaultBarColor, false);
        }
      }
    }
  }, [isVisible]);

  // Handles the slide-in/slide-out animations and data fetching
  useEffect(() => {
    if (isVisible) {
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0, // Slide up to cover the screen
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 1, // Fade in background
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      fetchEventDetails();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: screenHeight, // Slide down off screen
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 0, // Fade out background
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setEvent(null); // Clear event data after animation out completes
        setLoading(true); // Reset loading state
      });
    }
  }, [isVisible, eventId]);

  // Fetches event details from Firestore, including host and attendee profiles
  const fetchEventDetails = useCallback(async () => {
    if (!eventId) {
      console.error("LiveEventDetailsModal: Missing eventId for data fetch.");
      Alert.alert("Error", "Invalid event details provided.");
      setLoading(false);
      onClose();
      return;
    }

    setLoading(true);
    setEvent(null);
    try {
      const eventRef = doc(db, "live", eventId);
      const eventSnap = await getDoc(eventRef);

      if (eventSnap.exists()) {
        const eventData = { id: eventSnap.id, ...eventSnap.data() };

        // Fetch Host Info
        if (eventData.host) {
          const hostProfileRef = doc(db, 'users', eventData.host, 'ProfileInfo', 'userinfo');
          const hostProfileSnap = await getDoc(hostProfileRef);
          if (hostProfileSnap.exists()) {
            const hostData = hostProfileSnap.data();
            eventData.hostInfo = {
              id: eventData.host,
              displayName: `${hostData.displayFirstName || ''} ${hostData.displayLastName || ''}`.trim() || 'Unknown',
              profileImages: hostData.profileImages || [],
            };
          } else {
            console.warn(`Host profile not found for user ID: ${eventData.host}`);
            eventData.hostInfo = { displayName: 'Unknown Host', profileImages: [] };
          }
        }

        // Fetch Attendees Info from subcollection
        const attendeesCollectionRef = collection(db, 'live', eventId, 'attendees');
        const attendeesSnap = await getDocs(attendeesCollectionRef);
        const fetchedAttendees = await Promise.all(attendeesSnap.docs.map(async (attendeeDoc) => {
          const attendeeId = attendeeDoc.id; // The document ID is the UID
          const attendeeProfileRef = doc(db, 'users', attendeeId, 'ProfileInfo', 'userinfo');
          const attendeeProfileSnap = await getDoc(attendeeProfileRef);
          if (attendeeProfileSnap.exists()) {
            return {
              id: attendeeId,
              profileImages: attendeeProfileSnap.data().profileImages || [],
              displayName: `${attendeeProfileSnap.data().displayFirstName || ''} ${attendeeProfileSnap.data().displayLastName || ''}`.trim(),
            };
          }
          return null;
        }));
        eventData.attendees = fetchedAttendees.filter(Boolean); // Filter out any null entries

        setEvent(eventData);
      } else {
        console.warn("LiveEventDetailsModal: No such document found for path:", `live/${eventId}`);
        Alert.alert("Error", "Event not found.");
        onClose();
      }
    } catch (error) {
      console.error("LiveEventDetailsModal: Error during data fetch:", error);
      Alert.alert("Error", "Failed to load event details.");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [eventId, onClose]);

  // If not visible and animation is complete, don't render anything
  if (!isVisible && slideAnimation._value === screenHeight) {
    return null;
  }

  // Render loading state while data is being fetched
  if (loading || !event) {
    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.loadingOverlay,
          { opacity: opacityAnimation },
        ]}
      >
        <Animated.View
          style={[
            styles.loadingContainer,
            { transform: [{ translateY: slideAnimation }] },
          ]}
        >
          <ActivityIndicator size="large" color="#D9043D" />
          <Text style={styles.loadingText}>Loading event...</Text>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        styles.modalOverlayFull,
        { opacity: opacityAnimation },
      ]}
    >
      <Animated.View
        style={[
          styles.modalContentWrapper,
          { transform: [{ translateY: slideAnimation }] },
        ]}
      >
        <LiveEventDetailsContent event={event} />

        {/* Close button positioned at top right */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>

        {/* Removed Quick Create and Modify Event Buttons */}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalOverlayFull: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContentWrapper: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'black',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#D9043D',
    marginTop: 10,
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50, // Adjust for status bar/notch
    right: 20, // Positioned on the right
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 5,
  },
  // Removed styles for bottomButtonsContainer, actionButton, quickCreateButton, modifyEventButton, actionButtonText
});

export default LiveEventDetailsModal;