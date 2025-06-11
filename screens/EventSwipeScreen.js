import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Animated, Easing, PanResponder, Platform, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { LinearGradient } from 'expo-linear-gradient';
import EventCard from '../components/matching/EventCard';
import SwipeOverlay from '../components/matching/SwipeOverlay';
import WaveIcon from '../assets/matching/wave.png';
import NoIcon from '../assets/matching/No.png';
import { onAuthStateChanged } from 'firebase/auth'; // Keep this for initial auth wait
import { serverTimestamp } from 'firebase/firestore'; // Import serverTimestamp

const { width, height } = Dimensions.get('screen');

const EventSwipeScreen = () => {
  const [events, setEvents] = useState([]);
  const [eventIndex, setEventIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const [currentUserId, setCurrentUserId] = useState(null); // New state to hold user ID

  // Using a ref for isSwiping to avoid re-renders when only animation state changes
  const isSwipingRef = useRef(false);
  const setIsSwiping = (value) => {
    isSwipingRef.current = value;
  };

  const waitForAuth = () =>
    new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          unsub();
          resolve(user);
        } else {
          // Handle case where user logs out while on this screen
          // Maybe navigate them to login or show a message
          console.log("No user authenticated during waitForAuth.");
          resolve(null); // Resolve with null if no user
        }
      });
    });

  const rotate = translateX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  const cardOpacity = translateX.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  // Passed currentUserId and currentEvent directly to performSwipeLogic
  const performSwipeLogic = async (direction, currentEventData, userId) => {
    if (!currentEventData || !userId) {
      console.log("Error: No current event data or user ID for swipe logic.");
      return;
    }

    const swipeType = direction === 'right' ? 'rsvp' : 'declined';

    // It's generally better to use serverTimestamp() for consistency and accuracy
    // rather than client-generated formatted strings.
    // If you need the formatted string for display, format it on the client
    // after fetching the timestamp.
    const swipeData = {
      swipedAt: serverTimestamp(), // Use serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'users', userId, swipeType, currentEventData.id), swipeData);
      console.log(`${swipeType.toUpperCase()} saved for ${currentEventData.id} by ${userId}`);

      if (direction === 'right') {
        const attendeeRef = doc(db, 'live', currentEventData.id, 'pending', userId); // userId of the swiper
        await setDoc(attendeeRef, {
          joinedAt: serverTimestamp(), // Use serverTimestamp()
          role: 'member',
          userId: userId, // User ID of the swiper
        });
        console.log(`User ${userId} added to event ${currentEventData.id} pending list`);
      }
    } catch (error) {
      console.error(`Firestore operation failed:`, error);
    }
  };

  const handleSwipeAnimationAndLogic = (direction) => {
    // Ensure we have a current event and user ID before starting animation and logic
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
      // Pass the current event and user ID
      await performSwipeLogic(direction, currentEvent, currentUserId);
      translateX.setValue(0);
      setEventIndex(prev => prev + 1);
    });
  };

  const handleSwipe = (direction) => {
    // Buttons should also respect the check
    handleSwipeAnimationAndLogic(direction);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderGrant: () => {
        // Stop any ongoing animation
        translateX.stopAnimation();
        setIsSwiping(true);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only update translateX if there's an event to swipe
        if (events[eventIndex]) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsSwiping(false);

        // Crucial: check if there's a current event before processing swipe
        if (!events[eventIndex]) {
          console.log("No current event to swipe on release.");
          translateX.setValue(0); // Reset position if no event
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
        // Reset position on termination, but only if there's a card
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

  useEffect(() => {
  // Listen for auth state changes and set currentUserId
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? "User is logged in (UID: " + user.uid + ")" : "User is logged out"); // ADD THIS LINE
    if (user) {
      setCurrentUserId(user.uid);
    } else {
      setCurrentUserId(null);
      setEvents([]); // Clear events if user logs out
      setEventIndex(0);
      console.log("User logged out or no user found.");
      // Potentially navigate to login screen here
    }
  });

  return () => unsubscribe(); // Cleanup auth listener
}, []); // Run once on component mount

  useEffect(() => {
    const initializeAndFetchEvents = async () => {
      if (!currentUserId) {
        console.log("Waiting for user ID to fetch events...");
        return; // Don't fetch until user ID is available
      }

      try {
        console.log('Fetching live events...');

        const [rsvpSnapshot, declinedSnapshot] = await Promise.all([
          getDocs(collection(db, 'users', currentUserId, 'rsvp')),
          getDocs(collection(db, 'users', currentUserId, 'declined'))
        ]);

        const seenEventIds = new Set([
          ...rsvpSnapshot.docs.map(doc => doc.id),
          ...declinedSnapshot.docs.map(doc => doc.id)
        ]);

        const liveEventsSnapshot = await getDocs(collection(db, 'live'));
        console.log('Live events fetched:', liveEventsSnapshot.docs.length);

        const unseenEvents = liveEventsSnapshot.docs
          .filter(doc => {
            const eventData = doc.data();
            return !seenEventIds.has(doc.id) && eventData.host !== currentUserId;
          })
          .map(doc => ({ id: doc.id, ...doc.data() }));

        console.log('Unseen and not self-hosted events:', unseenEvents.length);

        const processedEvents = await Promise.all(
          unseenEvents.map(async event => {
            // Fetch attendees
            const attendeesSnapshot = await getDocs(
              collection(db, 'live', event.id, 'attendees')
            );
            const attendeePromises = attendeesSnapshot.docs.map(async attendeeDoc => {
              const attendeeId = attendeeDoc.data().userId;
              // Ensure attendeeId is valid before fetching profile
              if (!attendeeId) {
                console.warn("Attendee ID is undefined for event:", event.id, "attendeeDoc:", attendeeDoc.id);
                return null;
              }
              try {
                // IMPORTANT: You're querying a subcollection 'ProfileInfo' of 'users'.
                // If 'ProfileInfo' contains a single document, like 'userinfo',
                // you should use doc(db, 'users', attendeeId, 'ProfileInfo', 'userinfo')
                // and then getDoc() instead of getDocs(collection(...)).
                // Assuming 'ProfileInfo' contains multiple documents and one is 'userinfo'.
                const profileInfoCollectionRef = collection(db, 'users', attendeeId, 'ProfileInfo');
                const profileDocSnap = await getDocs(profileInfoCollectionRef); // Fetching all docs in subcollection
                const userInfo = profileDocSnap.docs.find(d => d.id === 'userinfo')?.data();

                const profileImages = (userInfo?.profileImages || []).filter(Boolean);
                return { userId: attendeeId, profileImages };
              } catch (e) {
                console.warn(`Error fetching attendee profile for ${attendeeId}:`, e);
                return null;
              }
            });
            const attendeeProfiles = (await Promise.all(attendeePromises)).filter(Boolean);

            // Fetch host info
            let hostInfo = null;
            if (event.host) { // Ensure host ID exists
              try {
                 // Similar correction here for host profile info
                const hostProfileInfoCollectionRef = collection(db, 'users', event.host, 'ProfileInfo');
                const hostProfileSnap = await getDocs(hostProfileInfoCollectionRef); // Fetching all docs in subcollection
                const hostUserInfo = hostProfileSnap.docs.find(d => d.id === 'userinfo')?.data();

                const profileImages = (hostUserInfo?.profileImages || []).filter(Boolean);
                hostInfo = {
                  userId: event.host,
                  profileImages,
                  name: `${hostUserInfo?.displayFirstName || ''} ${hostUserInfo?.displayLastName || ''}`.trim(),
                };
              } catch (e) {
                console.warn("Error fetching host profile:", e);
              }
            }


            return {
              ...event,
              attendees: attendeeProfiles,
              hostInfo,
            };
          })
        );

        setEvents(processedEvents);
        console.log('Events loaded successfully:', processedEvents.length);

        const PREFETCH_LIMIT = 5;
        processedEvents.slice(0, PREFETCH_LIMIT).forEach(eventToPreload => {
          if (eventToPreload.photos && eventToPreload.photos.length > 0) {
            eventToPreload.photos.forEach(uri => {
              if (uri) Image.prefetch(uri);
            });
          }
          if (eventToPreload.hostInfo?.profileImages?.[0]) {
            Image.prefetch(eventToPreload.hostInfo.profileImages[0]);
          }
          eventToPreload.attendees?.forEach(attendee => {
            if (attendee.profileImages?.[0]) {
              Image.prefetch(attendee.profileImages[0]);
            }
          });
        });

      } catch (error) {
        console.error('Error in initializeAndFetchEvents:', error);
      }
    };

    // Only fetch events when currentUserId changes or is initially set
    initializeAndFetchEvents();
  }, [currentUserId]); // Dependency array for event fetching

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
              <EventCard event={currentEvent} isSwiping={isSwipingRef.current} /> {/* Use ref here */}
              {/* Buttons inside the animated card */}
              <View style={[styles.actionButtonsInsideCard, { bottom: buttonBottomPosition }]}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleSwipe('left')}
                  disabled={isSwipingRef.current} // Disable buttons during animation
                >
                  <Image source={NoIcon} style={styles.iconImage} resizeMode="contain" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleSwipe('right')}
                  disabled={isSwipingRef.current} // Disable buttons during animation
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
            {/* Only show reset button if there were events previously */}
            {events.length > 0 && (
              <TouchableOpacity style={styles.resetButton} onPress={() => setEventIndex(0)}>
                <Text style={styles.resetButtonText}>Reset</Text>
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