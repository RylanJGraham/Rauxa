import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Animated, Easing, PanResponder, Platform, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { collection, doc, setDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { LinearGradient } from 'expo-linear-gradient';
import EventCard from '../components/matching/EventCard';
import SwipeOverlay from '../components/matching/SwipeOverlay';
import WaveIcon from '../assets/matching/wave.png'; // Make sure paths are correct
import NoIcon from '../assets/matching/No.png';   // Make sure paths are correct
import { onAuthStateChanged } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';

const { width, height } = Dimensions.get('screen');

const EventSwipeScreen = () => {
  const [events, setEvents] = useState([]);
  const [eventIndex, setEventIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const [currentUserId, setCurrentUserId] = useState(null);

  // Refs to store the *latest* state values for PanResponder and other callbacks to access
  const eventsRef = useRef([]);
  const eventIndexRef = useRef(0);
  const currentUserIdRef = useRef(null); // New ref for currentUserId

  // Use useEffects to keep refs updated with state
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    eventIndexRef.current = eventIndex;
  }, [eventIndex]);

  useEffect(() => { // Keep currentUserIdRef updated
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);


  // useRef to hold the set of event IDs the user has already seen (RSVP'd or declined)
  const seenEventIdsRef = useRef(new Set());

  // Using a ref for isSwiping to avoid re-renders when only animation state changes
  const isSwipingRef = useRef(false);
  const setIsSwiping = (value) => {
    isSwipingRef.current = value;
  };

  // New ref to hold the current event *being swiped*
  const swipingEventRef = useRef(null);

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
    }
  };

  // Modified: handleSwipeAnimationAndLogic now explicitly takes userId as an argument
  const handleSwipeAnimationAndLogic = useCallback(async (direction, eventToSwipe, userIdToSwipeWith) => {
    // Use the explicitly passed userId, or fall back to the ref if needed
    const actualUserId = userIdToSwipeWith || currentUserIdRef.current;

    if (!eventToSwipe || !actualUserId) {
      console.log("No event or user ID available to perform swipe animation and logic. eventToSwipe:", eventToSwipe ? eventToSwipe.id : 'None', "actualUserId:", actualUserId);
      // Ensure state is reset even if logic fails
      translateX.setValue(0);
      setIsSwiping(false);
      swipingEventRef.current = null;
      return;
    }

    setIsSwiping(true);
    const toValue = direction === 'left' ? -width * 1.5 : width * 1.5;

    Animated.timing(translateX, {
      toValue,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(async () => {
      // Perform logic AFTER animation completes
      await performSwipeLogic(direction, eventToSwipe, actualUserId); // Use actualUserId here

      // Filter out the swiped event from the current state immediately
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventToSwipe.id));
      translateX.setValue(0); // Reset position for the next card
      setIsSwiping(false); // End swiping state after logic and animation
      swipingEventRef.current = null; // Clear the swiping event ref
    });
  }, [performSwipeLogic]); // currentUserId is no longer a direct dependency, we pass it or use its ref

  const handleButtonSwipe = useCallback((direction) => {
    // Use eventsRef.current and eventIndexRef.current for latest values
    const eventToSwipe = eventsRef.current[eventIndexRef.current];
    if (eventToSwipe && currentUserIdRef.current) { // Ensure currentUserId is also available
      handleSwipeAnimationAndLogic(direction, eventToSwipe, currentUserIdRef.current);
    } else {
      console.log("No current event or user ID available for button swipe.");
    }
  }, [handleSwipeAnimationAndLogic]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderGrant: () => {
        translateX.stopAnimation();
        console.log('[onPanResponderGrant] Attempting to grab event...');
        // Use the refs to get the latest state values
        const currentEvents = eventsRef.current;
        const currentEventIndex = eventIndexRef.current;

        console.log('[onPanResponderGrant] Events at grant (from ref):', currentEvents.length, 'Event Index at grant (from ref):', currentEventIndex);
        if (currentEvents[currentEventIndex]) {
          swipingEventRef.current = currentEvents[currentEventIndex];
          setIsSwiping(true);
          console.log('[onPanResponderGrant] Event captured:', swipingEventRef.current.id);
        } else {
          console.log("No event to start swiping on. Events state (from ref):", currentEvents);
          swipingEventRef.current = null;
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (swipingEventRef.current) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        console.log('[onPanResponderRelease] Releasing swipe...');
        console.log('[onPanResponderRelease] swipingEventRef.current:', swipingEventRef.current ? swipingEventRef.current.id : 'None');
        const eventBeingSwiped = swipingEventRef.current;
        const currentUserIdAtRelease = currentUserIdRef.current; // Get currentUserId from ref at time of release

        if (!eventBeingSwiped || !currentUserIdAtRelease) {
          console.log("No current event or user ID captured to swipe on release. Resetting position. Event:", eventBeingSwiped ? eventBeingSwiped.id : 'None', "UserID:", currentUserIdAtRelease);
          translateX.setValue(0);
          setIsSwiping(false);
          swipingEventRef.current = null;
          return;
        }

        const SWIPE_THRESHOLD = 0.4 * width;
        const currentSwipeDirection = gestureState.dx > 0 ? 'right' : 'left';
        const shouldSwipeOff = Math.abs(gestureState.dx) > SWIPE_THRESHOLD;

        if (shouldSwipeOff) {
          // Pass the user ID directly
          handleSwipeAnimationAndLogic(currentSwipeDirection, eventBeingSwiped, currentUserIdAtRelease);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            friction: 4,
            useNativeDriver: true,
          }).start(() => {
            setIsSwiping(false);
            swipingEventRef.current = null;
          });
        }
      },
      onPanResponderTerminate: () => {
        setIsSwiping(false);
        swipingEventRef.current = null;
        Animated.spring(translateX, {
          toValue: 0,
          friction: 4,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Helper function to process event data (extracted for reusability and clarity)
  const processEventData = useCallback(async (eventId, eventData) => {
    try {
      const attendeesRef = collection(db, 'live', eventId, 'pending');
      const attendeesSnapshot = await getDocs(attendeesRef);
      const attendeePromises = attendeesSnapshot.docs.map(async attendeeDoc => {
        const attendeeId = attendeeDoc.data().userId;
        if (!attendeeId) return null;

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
  }, []);

  // Effect for Authentication State Changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setEvents([]);
        setEventIndex(0);
        seenEventIdsRef.current.clear();
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

    let unsubscribeLiveEvents = () => { };
    let unsubscribeRsvp = () => { };
    let unsubscribeDeclined = () => { };

    unsubscribeRsvp = onSnapshot(collection(db, 'users', currentUserId, 'rsvp'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          seenEventIdsRef.current.add(change.doc.id);
          setEvents(prevEvents => prevEvents.filter(event => event.id !== change.doc.id));
          console.log(`[RSVP Listener] Event ${change.doc.id} added to seen. Removed from stack.`);
        } else if (change.type === 'removed') {
          seenEventIdsRef.current.delete(change.doc.id);
          console.log(`[RSVP Listener] Event ${change.doc.id} removed from seen.`);
        }
      });
    }, (error) => console.error("Error listening to RSVP events:", error));

    unsubscribeDeclined = onSnapshot(collection(db, 'users', currentUserId, 'declined'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          seenEventIdsRef.current.add(change.doc.id);
          setEvents(prevEvents => prevEvents.filter(event => event.id !== change.doc.id));
          console.log(`[Declined Listener] Event ${change.doc.id} added to seen. Removed from stack.`);
        } else if (change.type === 'removed') {
          seenEventIdsRef.current.delete(change.doc.id);
          console.log(`[Declined Listener] Event ${change.doc.id} removed from seen.`);
        }
      });
    }, (error) => console.error("Error listening to Declined events:", error));

    unsubscribeLiveEvents = onSnapshot(collection(db, 'live'), async (snapshot) => {
      console.log('[Live Events Listener] Snapshot received.');
      const newProcessedEvents = [];

      for (const docChange of snapshot.docChanges()) {
        const eventData = docChange.doc.data();
        const eventId = docChange.doc.id;

        if (eventData.host === currentUserId) {
          console.log(`[Live Events Listener] Skipping self-hosted event: ${eventId}`);
          continue;
        }

        if (docChange.type === 'added' || docChange.type === 'modified') {
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
        else if (docChange.type === 'removed') {
          setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
          console.log(`[Live Events Listener] Event ${eventId} removed from Firestore. Removing from stack.`);
          seenEventIdsRef.current.delete(eventId);
        }
      }

      setEvents(prevEvents => {
        let updatedEvents = [...prevEvents];
        const prevEventIds = new Set(prevEvents.map(e => e.id));

        newProcessedEvents.forEach(newEvent => {
          if (!prevEventIds.has(newEvent.id)) {
            updatedEvents.push(newEvent);
            console.log(`[Live Events Listener] Added new event to state: ${newEvent.id}`);
          } else {
            const index = updatedEvents.findIndex(e => e.id === newEvent.id);
            if (index > -1) {
              updatedEvents[index] = newEvent;
              console.log(`[Live Events Listener] Updated existing event in state: ${newEvent.id}`);
            }
          }
        });

        updatedEvents = updatedEvents.filter(event =>
          !seenEventIdsRef.current.has(event.id) && event.host !== currentUserId
        );

        console.log(`[Live Events Listener] Final events count in state: ${updatedEvents.length}`);
        return updatedEvents;
      });

      const PREFETCH_LIMIT = 5;
      snapshot.docs.slice(0, PREFETCH_LIMIT).forEach(eventDoc => {
        const eventToPreload = eventDoc.data();
        if (eventToPreload.photos && eventToPreload.photos.length > 0) {
          eventToPreload.photos.forEach(uri => {
            if (uri) Image.prefetch(uri);
          });
        }
      });

    }, (error) => console.error("Error listening to live events:", error));

    return () => {
      unsubscribeLiveEvents();
      unsubscribeRsvp();
      unsubscribeDeclined();
      console.log("All Firestore listeners unsubscribed.");
    };
  }, [currentUserId, processEventData]);

  useEffect(() => {
    if (events.length === 0) {
      setEventIndex(0);
    } else if (eventIndex >= events.length) {
      setEventIndex(events.length - 1);
    }
    console.log(`[EventIndex Effect] Current Index: ${eventIndex}, Events Length: ${events.length}`);
  }, [events.length, eventIndex]);


  const currentEvent = events[eventIndex];
  const nextEvent = events[eventIndex + 1];

  console.log('--- Render Cycle ---');
  console.log('Events length:', events.length);
  console.log('Event Index:', eventIndex);
  console.log('Current Event:', currentEvent ? currentEvent.id : 'None');
  console.log('Is Swiping Ref:', isSwipingRef.current);
  console.log('Swiping Event Ref:', swipingEventRef.current ? swipingEventRef.current.id : 'None');
  console.log('--------------------');

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
                  onPress={() => handleButtonSwipe('left')}
                  disabled={isSwipingRef.current}
                >
                  <Image source={NoIcon} style={styles.iconImage} resizeMode="contain" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleButtonSwipe('right')}
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
            {(events.length === 0 && eventIndex === 0) ? (
              <Text style={styles.subText}>Check back later for new events!</Text>
            ) : (
              <TouchableOpacity style={styles.resetButton} onPress={() => {
                setEvents([]);
                setEventIndex(0);
                seenEventIdsRef.current.clear();
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