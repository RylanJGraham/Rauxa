import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Animated, Easing, PanResponder, Platform, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { collection, doc, setDoc, onSnapshot, getDocs, query, where } from 'firebase/firestore'; // Import query and where
import { db, auth } from '../firebase';
import { LinearGradient } from 'expo-linear-gradient';
import EventCard from '../components/matching/EventCard';
import SwipeOverlay from '../components/matching/SwipeOverlay';
import WaveIcon from '../assets/matching/wave.png';
import NoIcon from '../assets/matching/No.png';
import { onAuthStateChanged } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';

const { width, height } = Dimensions.get('screen');

const EventSwipeScreen = () => {
  const [events, setEvents] = useState([]);
  const [eventIndex, setEventIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const [currentUserId, setCurrentUserId] = useState(null);

  // useRef to hold the set of event IDs the user has already seen (RSVP'd or declined)
  const seenEventIdsRef = useRef(new Set());

  // Using a ref for isSwiping to avoid re-renders when only animation state changes
  const isSwipingRef = useRef(false);
  const setIsSwiping = (value) => {
    isSwipingRef.current = value;
  };

  const rotate = translateX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  const cardOpacity = translateX.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const performSwipeLogic = async (direction, currentEventData, userId) => {
    if (!currentEventData || !userId) {
      console.log("Error: No current event data or user ID for swipe logic.");
      return;
    }

    const swipeType = direction === 'right' ? 'rsvp' : 'declined';
    const swipeData = {
      swipedAt: serverTimestamp(),
    };

    try {
      // Record the swipe for the user
      await setDoc(doc(db, 'users', userId, swipeType, currentEventData.id), swipeData);
      console.log(`${swipeType.toUpperCase()} saved for ${currentEventData.id} by ${userId}`);

      // Add to seenEventIdsRef immediately on successful swipe
      seenEventIdsRef.current.add(currentEventData.id);

      // Filter out the swiped event from the current state immediately
      setEvents(prevEvents => prevEvents.filter(event => event.id !== currentEventData.id));
      setEventIndex(prev => {
        // If we swiped the last event, ensure index doesn't go out of bounds
        return prev >= (events.length - 1) ? 0 : prev; // Reset to 0 if no more or stay at current for next
      });


      if (direction === 'right') {
        // Add user to event's pending list
        const attendeeRef = doc(db, 'live', currentEventData.id, 'pending', userId);
        await setDoc(attendeeRef, {
          joinedAt: serverTimestamp(),
          role: 'member',
          userId: userId,
        });
        console.log(`User ${userId} added to event ${currentEventData.id} pending list`);
      }
    } catch (error) {
      console.error(`Firestore operation failed:`, error);
      // Optional: If swipe logic fails, you might want to revert the UI changes or show an error.
      // For now, we'll let it stay swiped if it visually disappeared.
    }
  };

  const handleSwipeAnimationAndLogic = (direction) => {
    const currentEvent = events[eventIndex];
    if (!currentEvent || !currentUserId) {
      console.log("No current event or user ID available to perform swipe.");
      return;
    }

    const toValue = direction === 'left' ? -width * 1.5 : width * 1.5;

    Animated.timing(translateX, {
      toValue,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(async () => {
      // Perform logic AFTER animation completes
      await performSwipeLogic(direction, currentEvent, currentUserId);
      translateX.setValue(0); // Reset position for the next card

      // Note: setEventIndex is handled within performSwipeLogic now for immediate UI update.
    });
  };

  const handleSwipe = useCallback((direction) => {
    handleSwipeAnimationAndLogic(direction);
  }, [events, eventIndex, currentUserId]); // Depend on events, eventIndex, currentUserId

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderGrant: () => {
        translateX.stopAnimation();
        setIsSwiping(true);
      },
      onPanResponderMove: (_, gestureState) => {
        if (events[eventIndex]) { // Only allow move if there's a card
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsSwiping(false);

        if (!events[eventIndex]) {
          console.log("No current event to swipe on release.");
          translateX.setValue(0);
          return;
        }

        const SWIPE_THRESHOLD = 0.4 * width;
        const currentSwipeDirection = gestureState.dx > 0 ? 'right' : 'left';
        const shouldSwipeOff = Math.abs(gestureState.dx) > SWIPE_THRESHOLD;

        if (shouldSwipeOff) {
          handleSwipeAnimationAndLogic(currentSwipeDirection);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            friction: 4,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        setIsSwiping(false);
        if (events[eventIndex]) {
          Animated.spring(translateX, {
            toValue: 0,
            friction: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Helper function to process event data (extracted for reusability and clarity)
  // This function fetches attendees and host profile info.
  const processEventData = useCallback(async (eventId, eventData) => {
    try {
      // Fetch attendees (pending/attendees can be the same structure for simplicity here)
      const attendeesRef = collection(db, 'live', eventId, 'pending'); // Or 'attendees' if you move accepted users there
      const attendeesSnapshot = await getDocs(attendeesRef);
      const attendeePromises = attendeesSnapshot.docs.map(async attendeeDoc => {
        const attendeeId = attendeeDoc.data().userId;
        if (!attendeeId) return null; // Skip if no userId

        try {
          const profileInfoCollectionRef = collection(db, 'users', attendeeId, 'ProfileInfo');
          const profileDocSnap = await getDocs(profileInfoCollectionRef);
          const userInfo = profileDocSnap.docs.find(d => d.id === 'userinfo')?.data();
          const profileImages = (userInfo?.profileImages || []).filter(Boolean);
          return { userId: attendeeId, profileImages, name: `${userInfo?.displayFirstName || ''} ${userInfo?.displayLastName || ''}`.trim() };
        } catch (e) {
          console.warn(`Error fetching attendee profile for ${attendeeId}:`, e);
          return null;
        }
      });
      const attendeeProfiles = (await Promise.all(attendeePromises)).filter(Boolean);

      // Fetch host info
      let hostInfo = null;
      if (eventData.host) {
        try {
          const hostProfileInfoCollectionRef = collection(db, 'users', eventData.host, 'ProfileInfo');
          const hostProfileSnap = await getDocs(hostProfileInfoCollectionRef);
          const hostUserInfo = hostProfileSnap.docs.find(d => d.id === 'userinfo')?.data();
          const profileImages = (hostUserInfo?.profileImages || []).filter(Boolean);
          hostInfo = {
            userId: eventData.host,
            profileImages,
            name: `${hostUserInfo?.displayFirstName || ''} ${hostUserInfo?.displayLastName || ''}`.trim(),
          };
        } catch (e) {
          console.warn("Error fetching host profile:", e);
        }
      }

      return {
        id: eventId,
        ...eventData,
        attendees: attendeeProfiles,
        hostInfo,
      };
    } catch (error) {
      console.error(`Error processing event ${eventId}:`, error);
      return null;
    }
  }, []); // No dependencies as it uses db from closure and passes eventId/eventData

  // Effect for Authentication State Changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setEvents([]); // Clear events if user logs out
        setEventIndex(0);
        seenEventIdsRef.current.clear(); // Clear seen IDs too
        console.log("User logged out or no user found.");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Effect for Real-time Event Data (Live, RSVP, Declined)
  useEffect(() => {
    if (!currentUserId) {
      console.log("No currentUserId, skipping event listeners setup.");
      return;
    }

    // Unsubscribe functions for cleanup
    let unsubscribeLiveEvents = () => {};
    let unsubscribeRsvp = () => {};
    let unsubscribeDeclined = () => {};

    // 1. Setup real-time listener for RSVP events
    unsubscribeRsvp = onSnapshot(collection(db, 'users', currentUserId, 'rsvp'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          seenEventIdsRef.current.add(change.doc.id);
          // Filter out the event immediately from the visible stack
          setEvents(prevEvents => prevEvents.filter(event => event.id !== change.doc.id));
          console.log(`[RSVP Listener] Event ${change.doc.id} added to seen. Removed from stack.`);
        } else if (change.type === 'removed') {
          seenEventIdsRef.current.delete(change.doc.id);
          // If you want to re-add, you'd need to re-fetch and add to events,
          // but typically not needed for a swipe screen.
          console.log(`[RSVP Listener] Event ${change.doc.id} removed from seen.`);
        }
      });
      // After any change, ensure our index is not out of bounds if events array shrunk
      setEventIndex(prev => Math.min(prev, events.length > 0 ? events.length - 1 : 0));
    }, (error) => console.error("Error listening to RSVP events:", error));

    // 2. Setup real-time listener for Declined events
    unsubscribeDeclined = onSnapshot(collection(db, 'users', currentUserId, 'declined'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          seenEventIdsRef.current.add(change.doc.id);
          // Filter out the event immediately from the visible stack
          setEvents(prevEvents => prevEvents.filter(event => event.id !== change.doc.id));
          console.log(`[Declined Listener] Event ${change.doc.id} added to seen. Removed from stack.`);
        } else if (change.type === 'removed') {
          seenEventIdsRef.current.delete(change.doc.id);
          console.log(`[Declined Listener] Event ${change.doc.id} removed from seen.`);
        }
      });
      setEventIndex(prev => Math.min(prev, events.length > 0 ? events.length - 1 : 0));
    }, (error) => console.error("Error listening to Declined events:", error));

    // 3. Setup real-time listener for Live events
    unsubscribeLiveEvents = onSnapshot(collection(db, 'live'), async (snapshot) => {
      console.log('[Live Events Listener] Snapshot received.');
      const newProcessedEvents = [];

      // Process only changes
      for (const docChange of snapshot.docChanges()) {
        const eventData = docChange.doc.data();
        const eventId = docChange.doc.id;

        // Skip events hosted by the current user
        if (eventData.host === currentUserId) {
          console.log(`[Live Events Listener] Skipping self-hosted event: ${eventId}`);
          continue;
        }

        // Handle 'added' and 'modified' events
        if (docChange.type === 'added' || docChange.type === 'modified') {
          // Only consider if not already seen
          if (!seenEventIdsRef.current.has(eventId)) {
            const processedEvent = await processEventData(eventId, eventData);
            if (processedEvent) {
              newProcessedEvents.push(processedEvent);
              console.log(`[Live Events Listener] Processed and queued for addition/update: ${eventId}`);
            } else {
              console.warn(`[Live Events Listener] Failed to process event ${eventId}. Skipping.`);
            }
          } else {
            console.log(`[Live Events Listener] Event ${eventId} already seen by user. Skipping.`);
          }
        }
        // Handle 'removed' events
        else if (docChange.type === 'removed') {
          setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
          console.log(`[Live Events Listener] Event ${eventId} removed from Firestore. Removing from stack.`);
          // Remove from seen IDs if it was somehow in there (e.g., host deleted event after swipe)
          seenEventIdsRef.current.delete(eventId);
        }
      }

      setEvents(prevEvents => {
        let updatedEvents = [...prevEvents];
        const prevEventIds = new Set(prevEvents.map(e => e.id));

        // Add new/modified events if they are not already in the array
        newProcessedEvents.forEach(newEvent => {
          if (!prevEventIds.has(newEvent.id)) {
            updatedEvents.push(newEvent);
            console.log(`[Live Events Listener] Added new event to state: ${newEvent.id}`);
          } else {
            // If it's a modified event, find it and update it
            const index = updatedEvents.findIndex(e => e.id === newEvent.id);
            if (index > -1) {
              updatedEvents[index] = newEvent;
              console.log(`[Live Events Listener] Updated existing event in state: ${newEvent.id}`);
            }
          }
        });

        // Finally, filter out any events that are now in seenEventIdsRef or are self-hosted
        // This ensures consistency after any internal state changes or external swipes.
        updatedEvents = updatedEvents.filter(event =>
          !seenEventIdsRef.current.has(event.id) && event.host !== currentUserId
        );

        console.log(`[Live Events Listener] Final events count in state: ${updatedEvents.length}`);
        return updatedEvents;
      });

      // Prefetch images for the next few events
      const PREFETCH_LIMIT = 5;
      snapshot.docs.slice(0, PREFETCH_LIMIT).forEach(eventDoc => {
        const eventToPreload = eventDoc.data();
        if (eventToPreload.photos && eventToPreload.photos.length > 0) {
          eventToPreload.photos.forEach(uri => {
            if (uri) Image.prefetch(uri);
          });
        }
        // Host and attendee profile images would also need to be preloaded here,
        // but `processEventData` isn't fully integrated here for preloading specific URLs.
        // This can be an enhancement later.
      });

    }, (error) => console.error("Error listening to live events:", error));

    // Cleanup all listeners when currentUserId changes or component unmounts
    return () => {
      unsubscribeLiveEvents();
      unsubscribeRsvp();
      unsubscribeDeclined();
      console.log("All Firestore listeners unsubscribed.");
    };
  }, [currentUserId, processEventData]); // Dependencies for this effect

  // Ensure eventIndex stays valid if events array changes
  useEffect(() => {
    if (eventIndex >= events.length && events.length > 0) {
      setEventIndex(events.length - 1);
    } else if (events.length === 0) {
      setEventIndex(0);
    }
  }, [events.length, eventIndex]);


  const currentEvent = events[eventIndex];
  const nextEvent = events[eventIndex + 1];

  const nextCardOpacity = translateX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: [1, 0.7, 1],
    extrapolate: 'clamp',
  });

  const buttonBottomPosition = Platform.select({
    ios: 100,
    android: 100 + (StatusBar.currentHeight || 0),
    default: 100,
  });

  return (
    <LinearGradient colors={['#0367A6', '#012840']} style={styles.container}>
      <View style={styles.cardContainer}>
        {currentEvent ? (
          <>
            {/* Next card under current card */}
            {nextEvent && (
              <Animated.View
                key={nextEvent.id}
                style={[
                  styles.nextCard,
                  { width: width, height: height },
                  { opacity: nextCardOpacity },
                ]}
                pointerEvents="none"
              >
                <EventCard event={nextEvent} isSwiping={false} />
              </Animated.View>
            )}

            {/* Current swipable card */}
            <Animated.View
              key={currentEvent.id}
              {...panResponder.panHandlers}
              style={[
                {
                  transform: [{ translateX }, { rotate }],
                  opacity: cardOpacity,
                  position: 'absolute',
                },
                { width: width, height: height },
              ]}
            >
              <EventCard event={currentEvent} isSwiping={isSwipingRef.current} />
              <View style={[styles.actionButtonsInsideCard, { bottom: buttonBottomPosition }]}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleSwipe('left')}
                  disabled={isSwipingRef.current}
                >
                  <Image source={NoIcon} style={styles.iconImage} resizeMode="contain" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleSwipe('right')}
                  disabled={isSwipingRef.current}
                >
                  <Image source={WaveIcon} style={styles.iconImage} resizeMode="contain" />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Swipe overlay - Ensure it's above the current card during swipe */}
            <SwipeOverlay translateX={translateX} />
          </>
        ) : (
          <View style={styles.endContainer}>
            <Text style={styles.doneText}>No more events</Text>
            {/* Show reset button if there were events previously or new events can be added */}
            {(events.length === 0 && eventIndex === 0) ? (
              <Text style={styles.subText}>Check back later for new events!</Text>
            ) : (
               // You can decide if you want a reset button in a live stream
               // For a continuous stream, a reset button might not be meaningful.
               // If you keep it, make sure it re-fetches or re-evaluates the stack.
               // For now, let's assume it implies clearing and starting over.
               <TouchableOpacity style={styles.resetButton} onPress={() => {
                 setEvents([]);
                 setEventIndex(0);
                 seenEventIdsRef.current.clear();
                 // Re-trigger fetch by briefly nulling then setting currentUserId, or adding a specific fetch function call
                 // For now, relying on the listener to refill.
               }}>
                 <Text style={styles.resetButtonText}>Refresh Events</Text>
               </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconButton: {
    backgroundColor: '#fff',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },

  iconImage: {
    width: 36,
    height: 36,
  },

  doneText: {
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
  subText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
  },

  endContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  resetButton: {
    marginTop: 20,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },

  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  actionButtonsInsideCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 40,
  },

  nextCard: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
});

export default EventSwipeScreen;