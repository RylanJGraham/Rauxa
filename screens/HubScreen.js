import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { db, auth } from '../firebase'; // Assuming correct path to firebase config
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  runTransaction,
  arrayUnion,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-community/masked-view'; // Import MaskedView

import RsvpEventCard from '../components/hub/RsvpEventCard'; // Ensure correct path
import HostedEventManagementCard from '../components/hub/HostedEventManagementCard'; // Ensure correct path
import ProfileGalleryOverlay from '../components/hub/ProfileGalleryOverlay'; // Ensure correct path
import LiveEventDetailsModal from '../components/hub/LiveEventDetailsModal'; // Ensure correct path

// Assuming you have theme files for colors, spacing, typography
// If not, replace these with your actual color/spacing values or define them directly.
const colors = {
  background: '#1a1a1a',
  cardBackground: '#333333',
  primary: '#0367A6', // Example Blue
  secondary: '#D9043D', // Example Red/Accent
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
};
const spacing = {
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xl: 32,
};
const typography = {
  regular: 'System', // Replace with your font family, e.g., 'Inter_400Regular'
  bold: 'System',    // Replace with your font family, e.g., 'Inter_700Bold'
};

const { width, height: screenHeight } = Dimensions.get('window');

const HubScreen = ({ navigation }) => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRsvps, setUserRsvps] = useState([]);
  const [hostedEventsWithUsers, setHostedEventsWithUsers] = useState([]);
  const unsubscribeRefs = useRef([]);

  const [showProfileGalleryOverlay, setShowProfileGalleryOverlay] = useState(false);
  const [selectedProfileForGallery, setSelectedProfileForGallery] = useState(null);

  const [isLiveEventDetailsModalVisible, setIsLiveEventDetailsModalVisible] = useState(false);
  const [selectedLiveEventId, setSelectedLiveEventId] = useState(null);

  // --- Auth State Listener ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      // We don't set loading to false here, as data fetching needs to complete first.
      // setLoading(false); // This will be set after all data is fetched.
    });
    return unsubscribeAuth;
  }, []);

  // --- Fetch User RSVPs ---
  useEffect(() => {
    if (!userId) {
      setUserRsvps([]); // Clear RSVPs if user logs out
      // If userId is null on initial load, ensure overall loading state is handled.
      // Potentially set loading to false here if no user means no data to fetch.
      if (!auth.currentUser && !loading) setLoading(false); // If no user and not already loading.
      return;
    }

    const rsvpCollectionRef = collection(db, 'users', userId, 'rsvp');
    const unsubscribeRsvps = onSnapshot(rsvpCollectionRef, async (rsvpSnapshot) => {
      const fetchedRsvps = [];
      for (const rsvpDoc of rsvpSnapshot.docs) {
        const eventId = rsvpDoc.id;
        const rsvpData = rsvpDoc.data();

        const eventRef = doc(db, 'live', eventId);
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) {
          console.warn(`RSVP event ${eventId} not found in 'live' collection. Removing stale RSVP.`);
          // Optionally, delete the stale RSVP document if the event no longer exists
          // await deleteDoc(doc(db, 'users', userId, 'rsvp', eventId));
          continue;
        }
        const eventDetails = { id: eventId, ...eventSnap.data() };

        const attendeeRef = doc(db, 'live', eventId, 'attendees', userId);
        const attendeeSnap = await getDoc(attendeeRef);
        const isAccepted = attendeeSnap.exists();

        fetchedRsvps.push({
          ...rsvpData,
          eventId: eventId,
          eventDetails: eventDetails,
          isAccepted: isAccepted,
        });
      }
      setUserRsvps(fetchedRsvps);
      // Mark loading as false for RSVPs if you manage separate loading states
    }, (error) => {
      console.error('Error listening to user RSVPs:', error);
      // Handle error, e.g., show an alert
    });

    return () => unsubscribeRsvps();
  }, [userId]);

  // --- Fetch Hosted Events ---
  useEffect(() => {
    if (!userId) {
      setHostedEventsWithUsers([]); // Clear hosted events if user logs out
      // If userId is null on initial load, ensure overall loading state is handled.
      if (!auth.currentUser && !loading) setLoading(false);
      return;
    }

    // Clear previous listeners to avoid memory leaks
    unsubscribeRefs.current.forEach(unsub => unsub());
    unsubscribeRefs.current = [];

    const hostedEventsQuery = query(collection(db, 'live'), where('host', '==', userId));

    const unsubscribeHostedEvents = onSnapshot(hostedEventsQuery, async (snapshot) => {
      const currentUnsubscribes = [];
      const profileCache = new Map(); // Cache profiles to avoid redundant fetches

      // Create a map of events from the main query first
      const eventsMap = new Map();
      snapshot.forEach(eventDoc => {
        eventsMap.set(eventDoc.id, {
          id: eventDoc.id,
          ...eventDoc.data(),
          users: { pending: [], accepted: [], rejected: [] } // Initialize user arrays
        });
      });

      // Function to get profile info from cache or fetch and cache
      const getProfileInfo = async (pId) => {
        if (profileCache.has(pId)) return profileCache.get(pId) || null;

        const profileRef = doc(db, 'users', pId, 'ProfileInfo', 'userinfo');
        const profileSnap = await getDoc(profileRef);

        let info;
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          info = {
            id: pId,
            displayName: `${data.displayFirstName || ''} ${data.displayLastName || ''}`.trim(),
            profileImage: data.profileImages?.[0] || null, // First image as main profile image
            displayFirstName: data.displayFirstName || '',
            displayLastName: data.displayLastName || '',
            age: data.age || '',
            gender: data.gender || '',
            bio: data.bio || '',
            education: data.education || {},
            languages: data.languages || [],
            interests: data.interests || [],
            topSongs: data.topSongs || [],
            profileImages: data.profileImages || [],
          };
        } else {
          // Fallback if profile info doesn't exist
          info = {
            id: pId,
            displayName: `User ${pId.substring(0, 4)}`,
            profileImage: null,
            displayFirstName: `User ${pId.substring(0, 4)}`,
            displayLastName: '',
            age: 'N/A', gender: 'N/A', bio: 'Profile not available.',
            education: {}, languages: [], interests: [], topSongs: [], profileImages: [],
          };
        }
        profileCache.set(pId, info);
        return info;
      };

      // Attach listeners for subcollections (pending, attendees, declined) for each event
      for (const [eventId, eventData] of eventsMap.entries()) {
        const attachSubcollectionListener = (subcollectionName, statusType) => {
          const q = collection(db, 'live', eventId, subcollectionName);
          const unsubscribe = onSnapshot(q, (subSnapshot) => {
            subSnapshot.docChanges().forEach(async (change) => {
              const userId = change.doc.id;
              const profileInfo = await getProfileInfo(userId);
              if (!profileInfo) {
                console.warn(`ProfileInfo not found for user ${userId}. Skipping.`);
                return;
              }
              const userData = {
                id: userId,
                ...change.doc.data(),
                profileInfo, // Merged profile data
                status: statusType // 'pending', 'accepted', 'rejected'
              };

              // Update the state based on changes within subcollections
              setHostedEventsWithUsers(prevEvents => {
                const newEvents = prevEvents.map(e => {
                  if (e.id === eventId) {
                    let currentUsers = e.users[statusType];
                    if (change.type === 'added') {
                      if (!currentUsers.some(u => u.id === userId)) {
                        return { ...e, users: { ...e.users, [statusType]: [...currentUsers, userData] } };
                      }
                    } else if (change.type === 'modified') {
                      return { ...e, users: { ...e.users, [statusType]: currentUsers.map(u => u.id === userId ? userData : u) } };
                    } else if (change.type === 'removed') {
                      return { ...e, users: { ...e.users, [statusType]: currentUsers.filter(u => u.id !== userId) } };
                    }
                  }
                  return e;
                });
                // If the event itself was just added and is not yet in `newEvents`, add it with the user data.
                // This scenario handles initial population for newly added hosted events.
                if (!newEvents.some(e => e.id === eventId) && eventsMap.has(eventId)) {
                    const initialEvent = { ...eventData, users: { pending: [], accepted: [], rejected: [] } };
                    initialEvent.users[statusType].push(userData);
                    return [...newEvents, initialEvent];
                }
                return newEvents;
              });
            });
          }, (error) => console.error(`Error listening to ${subcollectionName} for ${eventId}:`, error));
          currentUnsubscribes.push(unsubscribe);
        };

        attachSubcollectionListener('pending', 'pending');
        attachSubcollectionListener('attendees', 'accepted');
        attachSubcollectionListener('declined', 'rejected');
      }

      // Set initial hosted events (without subcollection users yet, which will populate async)
      setHostedEventsWithUsers(Array.from(eventsMap.values()));
      // Store subcollection unsubscribe functions
      unsubscribeRefs.current = currentUnsubscribes;
      setLoading(false); // Set overall loading to false after initial hosted events are fetched
    }, (error) => {
      console.error("Error listening to hosted events query:", error);
      setLoading(false); // Also set loading to false on error
    });

    return () => {
      // Unsubscribe from main hosted events query and all subcollection listeners
      unsubscribeHostedEvents();
      unsubscribeRefs.current.forEach(unsub => unsub());
      unsubscribeRefs.current = [];
    };
  }, [userId]);

  // --- Event Management Handlers ---
  const handleAcceptRequest = useCallback(async (eventId, requestId) => {
    const rsvpUserId = requestId;
    if (!userId) { Alert.alert("Error", "Host user not authenticated."); return; }

    try {
      const eventRef = doc(db, "live", eventId);
      const eventDoc = await getDoc(eventRef);
      if (!eventDoc.exists()) { Alert.alert("Error", "Event not found for this request."); return; }
      const eventData = eventDoc.data();
      const hostId = eventData.host;
      if (userId !== hostId) { Alert.alert("Permission Denied", "You are not the host of this event and cannot accept requests."); return; }

      const pendingRef = doc(db, 'live', eventId, 'pending', requestId);
      const attendeeRef = doc(db, 'live', eventId, 'attendees', requestId);

      let pendingRequestData = null;
      try {
        const pendingDocSnap = await getDoc(pendingRef);
        if (!pendingDocSnap.exists()) { Alert.alert("Error", "The RSVP request to be accepted does not exist."); return; }
        pendingRequestData = pendingDocSnap.data();
      } catch (fetchError) {
        console.error("Error fetching pending request data:", fetchError);
        Alert.alert("Error", "Failed to retrieve pending request data.");
        return;
      }

      await runTransaction(db, async (transaction) => {
        const transactionPendingDoc = await transaction.get(pendingRef);
        if (!transactionPendingDoc.exists()) { throw new Error("Pending request no longer exists, transaction aborted."); }
        transaction.set(attendeeRef, { ...pendingRequestData, acceptedAt: serverTimestamp() });
        transaction.delete(pendingRef);
      });
      Alert.alert("Success", "RSVP request accepted. Chat will be updated shortly.");
    } catch (error) {
      console.error('Client-side handleAcceptRequest failed:', error);
      Alert.alert("Error", `Failed to accept request: ${error.message || 'An unknown error occurred'}. Please try again.`);
    }
  }, [userId]);


  const handleDeclineRequest = useCallback(async (eventId, requestId) => {
    const rsvpUserId = requestId;
    if (!userId) { Alert.alert("Error", "Host user not authenticated."); return; }

    try {
      const eventRef = doc(db, "live", eventId);
      const eventDoc = await getDoc(eventRef);
      if (!eventDoc.exists()) { Alert.alert("Error", "Event not found for this request."); return; }
      const eventData = eventDoc.data();
      const hostId = eventData.host;
      if (userId !== hostId) { Alert.alert("Permission Denied", "You are not the host of this event and cannot decline requests."); return; }

      const pendingRef = doc(db, 'live', eventId, 'pending', requestId);
      const declinedRef = doc(db, 'live', eventId, 'declined', requestId);

      let pendingRequestData = null;
      try {
        const pendingDocSnap = await getDoc(pendingRef);
        if (!pendingDocSnap.exists()) { Alert.alert("Error", "The RSVP request to be declined does not exist."); return; }
        pendingRequestData = pendingDocSnap.data();
      } catch (fetchError) {
        console.error("Error fetching pending request data for decline:", fetchError);
        Alert.alert("Error", "Failed to retrieve pending request data.");
        return;
      }

      await runTransaction(db, async (transaction) => {
        const transactionPendingDoc = await transaction.get(pendingRef);
        if (!transactionPendingDoc.exists()) { throw new Error("Pending request no longer exists, transaction aborted."); }
        transaction.set(declinedRef, { ...pendingRequestData, declinedAt: serverTimestamp() });
        transaction.delete(pendingRef);
      });
      Alert.alert("Success", "RSVP request declined.");
    } catch (error) {
      console.error('Client-side handleDeclineRequest failed:', error);
      Alert.alert("Error", `Failed to decline request: ${error.message || 'An unknown error occurred'}. Please try again.`);
    }
  }, [userId]);

  const handleRsvpCardPress = useCallback((item) => {
    Alert.alert("Your RSVP Event", `You RSVP'd to: ${item.eventDetails.title}\nStatus: ${item.isAccepted ? 'Accepted' : 'Pending...'}`);
  }, []);

  const handleInfoPress = useCallback((eventData) => {
    setSelectedLiveEventId(eventData.id);
    setIsLiveEventDetailsModalVisible(true);
  }, []);

  const handleCloseLiveEventDetailsModal = useCallback(() => {
    setIsLiveEventDetailsModalVisible(false);
    setSelectedLiveEventId(null);
  });

  const onOpenCreateMeetupModal = useCallback((templateType, eventData) => {
    console.log(`Opening Create Meetup Modal with type: ${templateType} for event:`, eventData);
    Alert.alert("Navigate to Create Meetup", `Implement navigation to Create Meetup for ${templateType} with event: ${eventData.title}`);
  }, []);

  const handleChatPress = useCallback((eventData) => {
    navigation.navigate('Chat', {
      screen: 'ChatDetail',
      params: {
        chatId: eventData.id,
        chatTitle: eventData.title,
        eventId: eventData.id,
      },
    });
  }, [navigation]);

  const handleViewAttendeeProfile = useCallback((profileData) => {
    setSelectedProfileForGallery(profileData);
    setShowProfileGalleryOverlay(true);
  }, []);

  const handleCloseProfileGallery = useCallback(() => {
    setShowProfileGalleryOverlay(false);
    setSelectedProfileForGallery(null);
  });

  if (loading) {
    return (
      <LinearGradient colors={["#34394C", "#000"]} style={styles.fullScreenContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.loadingText}>Loading your hub...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#34394C", "#000"]} style={styles.fullScreenContainer}>
      <ScrollView contentContainerStyle={styles.scrollViewContentContainer}>
        <View style={styles.contentWrapper}>
          {/* 'Rauxa Hub' Title with Linear Gradient on Text */}
          <View style={styles.headerTitleContainer}>
            <MaskedView
              style={{ flex: 1, height: 35 }} // Adjust height based on text size
              maskElement={<Text style={styles.headerTitleMask}>Rauxa Hub</Text>}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill} // Fills the MaskedView
              />
            </MaskedView>
          </View>

          {/* Your RSVPs Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleText}>Your Meetup RSVP's</Text>
            <Text style={styles.sectionCount}>({userRsvps.length} Events)</Text>
          </View>
          <FlatList
            horizontal
            data={userRsvps}
            keyExtractor={(item) => item.eventId}
            renderItem={({ item }) => (
              <RsvpEventCard
                event={item.eventDetails}
                isAccepted={item.isAccepted}
                onPress={() => handleRsvpCardPress(item)}
                onInfoPress={() => handleInfoPress(item.eventDetails)}
                onChatPress={handleChatPress}
              />
            )}
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyListContent}>
                <Text style={styles.emptyText}>You haven't RSVP'd to any events yet.</Text>
              </View>
            }
            contentContainerStyle={styles.rsvpListContent}
          />

          {/* Your Hosted Events Section */}
          <View style={[styles.sectionHeader, styles.hostedEventsSectionHeader]}>
            <Text style={styles.sectionTitleText}>Meetups Your Hosting</Text>
            <Text style={styles.sectionCount}>({hostedEventsWithUsers.length} Events)</Text>
          </View>
          <View style={styles.hostedEventsListVertical}>
            {hostedEventsWithUsers.length > 0 ? (
              hostedEventsWithUsers.map((item) => (
                <HostedEventManagementCard
                  key={item.id}
                  event={item}
                  pendingUsers={item.users?.pending || []}
                  acceptedUsers={item.users?.accepted || []}
                  rejectedUsers={item.users?.rejected || []}
                  onAcceptRequest={handleAcceptRequest}
                  onDeclineRequest={handleDeclineRequest}
                  onViewAttendeeProfile={handleViewAttendeeProfile}
                  onViewEventDetails={() => handleInfoPress(item)}
                />
              ))
            ) : (
              <View style={styles.emptyHostedEventsContainer}>
                <Text style={styles.emptyText}>You are not hosting any events yet.</Text>
              </View>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {showProfileGalleryOverlay && selectedProfileForGallery && (
        <ProfileGalleryOverlay
          profileData={selectedProfileForGallery}
          onClose={handleCloseProfileGallery}
        />
      )}

      {isLiveEventDetailsModalVisible && (
        <LiveEventDetailsModal
          isVisible={isLiveEventDetailsModalVisible}
          eventId={selectedLiveEventId}
          onClose={handleCloseLiveEventDetailsModal}
          onOpenCreateMeetupModal={onOpenCreateMeetupModal}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.secondary,
    marginTop: spacing.small,
    fontSize: 16,
  },
  scrollViewContentContainer: {
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + spacing.medium : spacing.large * 1.5,
    paddingHorizontal: spacing.medium,
  },
  // --- Header Title for Gradient Text ---
  headerTitleContainer: {
    marginBottom: spacing.large,
    // Add any padding or alignment for the MaskedView container here if needed
  },
  headerTitleMask: {
    fontSize: 28,
    fontWeight: 'bold',
    // The color here doesn't matter for the mask, but size/font are crucial for shaping the mask
    color: 'black', // MaskedView uses the alpha channel, so 'black' makes it opaque
    alignSelf: 'flex-start', // Important for the text to take its natural width
  },
  // The LinearGradient inside MaskedView will fill this area.
  // We remove headerTitleGradientContainer
  headerTitle: {
    // This style is now applied to the text *inside* the MaskedView,
    // which serves as the *shape* for the gradient.
    fontSize: 28,
    fontWeight: 'bold',
    // The actual color is irrelevant here as it's being masked by the gradient.
    // Ensure this text is identical in style to `headerTitleMask`.
    color: 'transparent', // Set to transparent so the gradient shows through
  },
  // --- Section Headers (Your RSVPs and Your Hosted Events) ---
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: spacing.small,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: spacing.small,
  },
  sectionCount: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  // --- RSVP List (Horizontal FlatList) ---
  rsvpListContent: {
    paddingBottom: spacing.medium,
    minHeight: screenHeight * 0.2,
    justifyContent: 'center',
  },
  emptyListContent: {
    width: width - (spacing.medium * 2),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.large,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  // --- Hosted Events Section (Vertical Stack) ---
  hostedEventsSectionHeader: {
    marginTop: spacing.medium,
  },
  hostedEventsListVertical: {
    paddingVertical: spacing.small,
  },
  emptyHostedEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.large,
  },
  // --- Bottom Padding ---
  bottomPadding: {
    height: Platform.OS === 'ios' ? 110 : 120,
  },
});

export default HubScreen;