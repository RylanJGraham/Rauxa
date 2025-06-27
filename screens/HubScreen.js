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
  Image,
} from 'react-native';
import { db, auth } from '../firebase';
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

import RsvpEventCard from '../components/hub/RsvpEventCard';
import HostedEventManagementCard from '../components/hub/HostedEventManagementCard';
import ProfileGalleryOverlay from '../components/hub/ProfileGalleryOverlay';
import LiveEventDetailsModal from '../components/hub/LiveEventDetailsModal';

const colors = {
  background: '#1a1a1a',
  cardBackground: '#333333',
  primary: '#0367A6',
  secondary: '#D9043D',
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
  regular: 'System',
  bold: 'System',
};

const { width, height: screenHeight } = Dimensions.get('window');

const HubScreen = ({ navigation }) => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpsLoading, setRsvpsLoading] = useState(true); // New loading state for RSVPs
  const [hostedEventsLoading, setHostedEventsLoading] = useState(true); // New loading state for hosted events

  const [userRsvps, setUserRsvps] = useState([]);
  const [hostedEventsWithUsers, setHostedEventsWithUsers] = useState([]);
  const unsubscribeRefs = useRef([]); // Used for hosted event subcollection listeners

  const [showProfileGalleryOverlay, setShowProfileGalleryOverlay] = useState(false);
  const [selectedProfileForGallery, setSelectedProfileForGallery] = useState(null);

  const [isLiveEventDetailsModalVisible, setIsLiveEventDetailsModalVisible] = useState(false);
  const [selectedLiveEventId, setSelectedLiveEventId] = useState(null);

  // --- Combined Loading State Effect ---
  // This effect ensures overall `loading` is true as long as any individual data fetch is pending
  useEffect(() => {
    setLoading(rsvpsLoading || hostedEventsLoading);
  }, [rsvpsLoading, hostedEventsLoading]);

  // --- Auth State Listener ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return unsubscribeAuth;
  }, []);

  // --- Handle Accept Request --- (Keep your existing logic, ensuring it updates RSVP status)
  const handleAcceptRequest = useCallback(async (eventId, userIdToUpdate) => {
    if (!userId) { Alert.alert("Error", "Host user not authenticated."); return; }

    // References for the documents to be updated/deleted
    const userRsvpRef = doc(db, 'users', userIdToUpdate, 'rsvp', eventId);
    const eventPendingRef = doc(db, 'live', eventId, 'pending', userIdToUpdate);
    const eventAttendeesRef = doc(db, 'live', eventId, 'attendees', userIdToUpdate);

    try {
      await runTransaction(db, async (transaction) => {
        // Get the pending request document
        const pendingDoc = await transaction.get(eventPendingRef);
        if (!pendingDoc.exists()) {
          throw new Error("User not found in pending requests for this event.");
        }
        const userData = pendingDoc.data();

        // 1. Move from 'pending' to 'attendees' subcollection
        transaction.set(eventAttendeesRef, {
          ...userData,
          acceptedAt: serverTimestamp() // Add a timestamp for when they were accepted
        });
        // 2. Delete from 'pending' subcollection
        transaction.delete(eventPendingRef);

        // 3. Update the user's personal RSVP document status to 'accepted'
        transaction.update(userRsvpRef, { status: 'accepted', lastUpdated: serverTimestamp() });
      });
      Alert.alert("Success", "User request accepted. Chat will be updated shortly.");
    } catch (error) {
      console.error("Error accepting request:", error);
      Alert.alert("Error", `Failed to accept request: ${error.message || 'An unknown error occurred'}`);
    }
  }, [userId]);


  // --- Handle Decline Request --- (Keep your existing logic, ensuring it updates RSVP status)
  const handleDeclineRequest = useCallback(async (eventId, userIdToUpdate) => {
    if (!userId) { Alert.alert("Error", "Host user not authenticated."); return; }

    // References for the documents to be updated/deleted
    const userRsvpRef = doc(db, 'users', userIdToUpdate, 'rsvp', eventId);
    const eventPendingRef = doc(db, 'live', eventId, 'pending', userIdToUpdate);
    const eventDeclinedRef = doc(db, 'live', eventId, 'declined', userIdToUpdate);

    try {
      await runTransaction(db, async (transaction) => {
        // Get the pending request document
        const pendingDoc = await transaction.get(eventPendingRef);
        if (!pendingDoc.exists()) {
          throw new Error("User not found in pending requests for this event.");
        }
        const userData = pendingDoc.data();

        // 1. Move from 'pending' to 'declined' subcollection
        transaction.set(eventDeclinedRef, {
          ...userData,
          declinedAt: serverTimestamp() // Add a timestamp for when they were declined
        });
        // 2. Delete from 'pending' subcollection
        transaction.delete(eventPendingRef);

        // 3. Update the user's personal RSVP document status to 'rejected'
        transaction.update(userRsvpRef, { status: 'rejected', lastUpdated: serverTimestamp() });
      });
      Alert.alert("Success", "User request declined.");
    } catch (error) {
      console.error("Error declining request:", error);
      Alert.alert("Error", `Failed to decline request: ${error.message || 'An unknown error occurred'}`);
    }
  }, [userId]);


  // --- NEW/UPDATED: Handle Delete Meetup ---
  const handleDeleteMeetup = useCallback(async (eventId) => {
    if (!userId) {
      Alert.alert("Error", "You must be logged in to delete meetups.");
      return;
    }

    Alert.alert(
      "Delete Meetup",
      "Are you sure you want to permanently delete this meetup and all associated data (attendees, chat, user RSVPs)? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const eventRef = doc(db, 'live', eventId);
              const eventSnap = await getDoc(eventRef);

              if (!eventSnap.exists()) {
                Alert.alert("Error", "Meetup not found or already deleted. UI will refresh.");
                // Immediately remove from UI if it's already gone from Firestore
                // This is an optimistic update that we'll reinforce with the onSnapshot listener
                setHostedEventsWithUsers(prevEvents => prevEvents.filter(e => e.id !== eventId));
                return;
              }

              const eventData = eventSnap.data();
              if (eventData.host !== userId) {
                Alert.alert("Permission Denied", "You are not the host of this meetup and cannot delete it.");
                return;
              }

              console.log(`[HubScreen] Attempting to delete live event document: live/${eventId}`);
              await deleteDoc(eventRef); // This triggers the Cloud Function

              console.log(`[HubScreen] Successfully initiated delete for live event: ${eventId}`);
              Alert.alert("Meetup Deletion Initiated", "The meetup and all its data are being removed. This may take a moment.");

              // OPTIMISTIC UI UPDATE: Remove the card immediately from the host's view.
              // This is crucial for responsiveness. The onSnapshot will confirm/correct this.
              setHostedEventsWithUsers(prevEvents => prevEvents.filter(e => e.id !== eventId));

            } catch (error) {
              console.error("[HubScreen] Client-side error deleting meetup:", error);
              if (error.code) { // Firebase specific error codes
                Alert.alert("Error Deleting Meetup", `Firebase Error (${error.code}): ${error.message}`);
              } else {
                Alert.alert("Error Deleting Meetup", `An unexpected error occurred: ${error.message}`);
              }
            }
          }
        }
      ],
      { cancelable: true }
    );
  }, [userId]);
  // --- END UPDATED: Handle Delete Meetup ---


  // --- Fetch User RSVPs ---
  useEffect(() => {
    if (!userId) {
      setUserRsvps([]);
      setRsvpsLoading(false);
      return;
    }

    const rsvpCollectionRef = collection(db, 'users', userId, 'rsvp');
    const unsubscribeRsvps = onSnapshot(rsvpCollectionRef, async (rsvpSnapshot) => {
      const fetchedRsvps = [];
      const eventPromises = [];

      for (const rsvpDoc of rsvpSnapshot.docs) {
        const eventId = rsvpDoc.id;
        const rsvpData = rsvpDoc.data();
        const rsvpStatus = rsvpData.status || 'pending'; // Default status

        const eventRef = doc(db, 'live', eventId);
        eventPromises.push(
          getDoc(eventRef).then(eventSnap => {
            if (!eventSnap.exists()) {
              console.warn(`[HubScreen] RSVP event ${eventId} not found in 'live' collection. Removing stale RSVP.`);
              // If the event itself is gone, the user's RSVP doc should be removed too.
              // This ensures cleanup of stale RSVPs on client side.
              deleteDoc(doc(db, 'users', userId, 'rsvp', eventId)).catch(err => {
                console.error(`[HubScreen] Error auto-deleting stale RSVP for ${eventId}:`, err);
              });
              return null; // Don't add this RSVP to the list
            }
            const eventDetails = { id: eventId, ...eventSnap.data() };
            return {
              ...rsvpData,
              eventId: eventId,
              eventDetails: eventDetails,
              isAccepted: rsvpStatus === 'accepted', // Based on the 'status' field in RSVP doc
              status: rsvpStatus,
            };
          }).catch(error => {
            console.error(`[HubScreen] Error fetching event details for RSVP ${eventId}:`, error);
            return null; // Skip if there's an error fetching event details
          })
        );
      }

      const resolvedRsvps = await Promise.all(eventPromises);
      setUserRsvps(resolvedRsvps.filter(Boolean)); // Filter out any nulls from failed fetches
      setRsvpsLoading(false);
    }, (error) => {
      console.error('[HubScreen] Error listening to user RSVPs:', error);
      Alert.alert("Error", "Failed to load your RSVPs.");
      setRsvpsLoading(false);
    });

    return () => unsubscribeRsvps(); // Cleanup on unmount
  }, [userId]);


  // --- UPDATED: Fetch Hosted Events ---
  useEffect(() => {
    if (!userId) {
      setHostedEventsWithUsers([]);
      setHostedEventsLoading(false);
      return;
    }

    // Clear previous subcollection listeners to avoid memory leaks
    unsubscribeRefs.current.forEach(unsub => unsub());
    unsubscribeRefs.current = [];

    const hostedEventsQuery = query(collection(db, 'live'), where('host', '==', userId));

    // Main listener for hosted events
    const unsubscribeHostedEvents = onSnapshot(hostedEventsQuery, async (snapshot) => {
      const currentUnsubscribes = [];
      const profileCache = new Map(); // Cache user profiles
      
      // We will build the new state here
      const newHostedEventsMap = new Map();

      // First, iterate through the *entire* snapshot to get the latest state of events
      for (const docSnapshot of snapshot.docs) {
        const eventId = docSnapshot.id;
        const eventData = {
          id: eventId,
          ...docSnapshot.data(),
          users: { pending: [], accepted: [], rejected: [] } // Initialize user arrays
        };
        newHostedEventsMap.set(eventId, eventData);
      }

      // Cleanup subcollection listeners for events that are no longer in the main snapshot
      // This handles cases where an event was removed from the main query
      unsubscribeRefs.current = unsubscribeRefs.current.filter(item => {
        if (!newHostedEventsMap.has(item.eventId)) {
          item.unsub(); // Unsubscribe if the event is no longer in the hosted events list
          return false; // Remove from our ref list
        }
        return true; // Keep
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

      // Attach or re-attach listeners for subcollections (pending, attendees, declined) for each event
      for (const [eventId, eventData] of newHostedEventsMap.entries()) {
        const existingUnsubForEvent = unsubscribeRefs.current.find(item => item.eventId === eventId);
        
        // Only attach subcollection listeners if we don't already have one for this event
        if (!existingUnsubForEvent) {
          const attachSubcollectionListener = (subcollectionName, statusType) => {
            const q = collection(db, 'live', eventId, subcollectionName);
            const unsubscribe = onSnapshot(q, (subSnapshot) => {
              subSnapshot.docChanges().forEach(async (change) => {
                // IMPORTANT: Before processing, check if the parent event still exists in our current map
                if (!newHostedEventsMap.has(eventId)) {
                  console.warn(`[HubScreen] Subcollection change for event ${eventId} but parent event no longer exists. Skipping.`);
                  return; // Don't process if parent event is gone
                }

                const userId = change.doc.id;
                const profileInfo = await getProfileInfo(userId);
                if (!profileInfo) {
                  console.warn(`[HubScreen] ProfileInfo not found for user ${userId}. Skipping.`);
                  return;
                }
                const userData = {
                  id: userId,
                  ...change.doc.data(),
                  profileInfo, // Merged profile data
                  status: statusType // 'pending', 'accepted', 'rejected'
                };

                // Update the state using a functional update, being careful with nested state
                setHostedEventsWithUsers(prevEvents => {
                  const updatedEvents = prevEvents.map(e => {
                    if (e.id === eventId) {
                      let updatedUsers = { ...e.users }; // Shallow copy of the users object

                      // Filter out the user from all lists first to ensure uniqueness
                      updatedUsers.pending = updatedUsers.pending.filter(u => u.id !== userId);
                      updatedUsers.accepted = updatedUsers.accepted.filter(u => u.id !== userId);
                      updatedUsers.rejected = updatedUsers.rejected.filter(u => u.id !== userId);

                      if (change.type === 'added' || change.type === 'modified') {
                        // Add the user to the correct status list
                        updatedUsers[statusType] = [...updatedUsers[statusType], userData];
                      }
                      // For 'removed' type, the user would already be filtered out above.
                      return { ...e, users: updatedUsers };
                    }
                    return e;
                  });
                  return updatedEvents;
                });
              });
            }, (error) => console.error(`[HubScreen] Error listening to ${subcollectionName} for ${eventId}:`, error));
            
            currentUnsubscribes.push({ eventId, unsub: unsubscribe }); // Store the new listener
          };

          // Attach subcollection listeners
          attachSubcollectionListener('pending', 'pending');
          attachSubcollectionListener('attendees', 'accepted');
          attachSubcollectionListener('declined', 'rejected');
        }
      }

      // Finally, set the hosted events based on the main snapshot's current state
      // This update should effectively "reset" or confirm the state after any main document changes
      // The individual subcollection listeners will then layer on top of this.
      setHostedEventsWithUsers(Array.from(newHostedEventsMap.values()));
      
      // Update the global unsubscribeRefs to include all currently active listeners
      unsubscribeRefs.current = currentUnsubscribes; // Replaces previous list with new ones
      setHostedEventsLoading(false); // Set overall loading to false after initial hosted events are fetched
    }, (error) => {
      console.error("[HubScreen] Error listening to hosted events query:", error);
      Alert.alert("Error", "Failed to load your hosted events.");
      setHostedEventsLoading(false); // Also set loading to false on error
    });

    return () => {
      // Unsubscribe from main hosted events query and all subcollection listeners
      unsubscribeHostedEvents();
      unsubscribeRefs.current.forEach(item => item.unsub());
      unsubscribeRefs.current = [];
    };
  }, [userId]); // Dependency array, re-run if userId changes


  // --- Event Management Handlers (your existing ones) ---
  const handleRsvpCardPress = useCallback((item) => {
    Alert.alert("Your RSVP Event", `You RSVP'd to: ${item.eventDetails.title}\nStatus: ${item.status === 'accepted' ? 'Accepted' : 'Pending...'}`);
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
          <View style={styles.imageContainer}>
            <Image
              source={require('../assets/RAUXAHub.png')} // Make sure this path is correct
              style={styles.rauxaHubImage}
              resizeMode="contain"
            />
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
                  onRemoveMeetup={handleDeleteMeetup} // Pass the new delete function
                />
              ))
            ) : (
              <View style={styles.emptyHostedEventsContainer}>
                <Text style={styles.emptyText}>You are not hosting any events yet.</Text>
              </View>
            )}
          </View>

          {/* Final bottom padding - ensures content doesn't get cut off by bottom nav/tabs */}
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
    flex: 1, // Ensures the gradient fills the entire screen
  },
  loadingContent: { // For the initial loading state (full screen)
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.secondary,
    marginTop: spacing.small,
    fontSize: 16,
  },
  // --- ScrollView and its content container ---
  scrollViewContentContainer: { // This style is applied to ScrollView's contentContainerStyle
    flexGrow: 1, // Crucial: Allows the contentWrapper to expand and push empty space to the bottom
    backgroundColor: 'transparent', // The gradient from fullScreenContainer shows through
    // No horizontal padding here. Put it on the contentWrapper.
  },
  contentWrapper: { // This is the new wrapper View *inside* the ScrollView
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + spacing.medium : spacing.large * 2.4,
    paddingHorizontal: spacing.medium, // Apply overall horizontal padding here to all content
  },
  imageContainer: {
    alignSelf: 'flex-start', // Align the image to the start (left)
    marginBottom: spacing.medium, // Space below the image
  },
  rauxaHubImage: {
    width: 200, // Adjust as needed
    height: 50, // Adjust as needed
    resizeMode: 'contain',
  },
  // --- Section Headers (Your RSVPs and Your Hosted Events) ---
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: spacing.small, // Consistent small margin below this header
  },
  sectionTitleText: { // Renamed to clearly indicate it's a text style
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
  rsvpListContent: { // FlatList's contentContainerStyle
    // Optional: minHeight for visual consistency if you want the section to always take up space
    minHeight: screenHeight * 0.2, // Example: At least 20% of screen height
    justifyContent: 'center', // Centers content vertically within its minHeight
    // For horizontal FlatList, the items themselves define the width.
    // We don't want flex:1 here as it would try to take all available width.
  },
  emptyListContent: { // Style for the ListEmptyComponent of the RSVP FlatList
    // For a horizontal FlatList's empty component, give it explicit width
    width: width - (spacing.medium * 2), // Should match the horizontal padding of the parent
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
    // This `marginTop` is crucial for the consistent gap *after* the RSVP section
    marginTop: spacing.medium, // Ensures a 16px gap (our defined spacing.medium)
    // Inherits other styles from `sectionHeader` due to `[styles.sectionHeader, ...]`
  },
  hostedEventsListVertical: {
    // No flexGrow here. Children (HostedEventManagementCards) will stack naturally.
    paddingVertical: spacing.small, // Add some padding around the list of cards
  },
  emptyHostedEventsContainer: { // Style for the empty state of Hosted Events
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.large,
  },
  // --- Bottom Padding ---
  bottomPadding: {
    height: Platform.OS === 'ios' ? 110 : 120, // Adjust this based on your bottom navigation bar's height
                                            // to ensure content scrolls above it.
  },
});

export default HubScreen;