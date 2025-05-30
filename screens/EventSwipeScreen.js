import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Image  } from 'react-native';
import { collection, getDocs, doc, setDoc, } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { LinearGradient } from 'expo-linear-gradient';
import EventCard from '../components/matching/EventCard';
import SwipeOverlay from '../components/matching/SwipeOverlay';  // adjust the path as needed
import { Feather } from '@expo/vector-icons';
import { Animated, Easing } from 'react-native';
import { PanResponder } from 'react-native';
import WaveIcon from '../assets/matching/wave.png';
import NoIcon from '../assets/matching/No.png';
import { onAuthStateChanged } from 'firebase/auth';



const { width, height } = Dimensions.get('window');

const EventSwipeScreen = () => {
 const [events, setEvents] = useState([]);
  const [eventIndex, setEventIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const waitForAuth = () =>
  new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub();
        resolve(user);
      }
    });
  });

  const rotate = translateX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  const opacity = translateX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: [0.5, 1, 0.5],
    extrapolate: 'clamp',
  });

  const [isSwiping, setIsSwiping] = useState(false);

  const panResponder = useRef(
  PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
    onPanResponderGrant: () => setIsSwiping(true),
    onPanResponderMove: (_, gestureState) => translateX.setValue(gestureState.dx),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 120) {
        handleSwipe('right');
      } else if (gestureState.dx < -120) {
        handleSwipe('left');
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
      setIsSwiping(false);
    },
    onPanResponderTerminate: () => {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      setIsSwiping(false);
    },
  })
).current;


  useEffect(() => {
  const initializeAndFetchEvents = async () => {
    try {
      console.log('Fetching live events...');
      const user = await waitForAuth();
      const userId = user.uid;
      console.log('User ID:', userId);

      // Get all RSVP and declined event IDs
      const [rsvpSnapshot, declinedSnapshot] = await Promise.all([
        getDocs(collection(db, 'users', userId, 'rsvp')),
        getDocs(collection(db, 'users', userId, 'declined'))
      ]);

      // Create a Set of all event IDs the user has already interacted with
      const seenEventIds = new Set([
        ...rsvpSnapshot.docs.map(doc => doc.id),
        ...declinedSnapshot.docs.map(doc => doc.id)
      ]);

      // Get all live events
      const liveEventsSnapshot = await getDocs(collection(db, 'live'));
      console.log('Live events fetched:', liveEventsSnapshot.docs.length);

      // Filter out events the user has already seen
      const unseenEvents = liveEventsSnapshot.docs
        .filter(doc => !seenEventIds.has(doc.id))
        .map(doc => ({ id: doc.id, ...doc.data() }));

      console.log('Unseen events:', unseenEvents.length);

      // Process event data (attendees, host info, etc.)
      const processedEvents = await Promise.all(
        unseenEvents.map(async event => {
          const attendeesSnapshot = await getDocs(
            collection(db, 'live', event.id, 'attendees')
          );

          const attendeeProfiles = await Promise.all(
            attendeesSnapshot.docs.map(async attendeeDoc => {
              const attendeeId = attendeeDoc.data().userId;
              try {
                const profileDoc = await getDocs(
                  collection(db, 'users', attendeeId, 'ProfileInfo')
                );
                const userInfo = profileDoc.docs.find(d => d.id === 'userinfo')?.data();
                const profileImages = (userInfo?.profileImages || []).filter(Boolean);
                return { userId: attendeeId, profileImages };
              } catch {
                return null;
              }
            })
          );

          let hostInfo = null;
          try {
            const hostProfileSnap = await getDocs(
              collection(db, 'users', event.host, 'ProfileInfo')
            );
            const userInfo = hostProfileSnap.docs.find(d => d.id === 'userinfo')?.data();
            const profileImages = (userInfo?.profileImages || []).filter(Boolean);
            hostInfo = {
              userId: event.host,
              profileImages,
              name: `${userInfo?.displayFirstName || ''} ${userInfo?.displayLastName || ''}`.trim(),
            };
          } catch {}

          return {
            ...event,
            attendees: attendeeProfiles.filter(Boolean),
            hostInfo,
          };
        })
      );

      setEvents(processedEvents);
    } catch (error) {
      console.error('Error in initializeAndFetchEvents:', error);
    }
  };

  initializeAndFetchEvents();
}, []);

  const handleSwipe = async (direction) => {
  const current = events[eventIndex];
  const user = auth.currentUser;

  if (!current || !user) return;

  const swipeType = direction === 'right' ? 'rsvp' : 'declined';
  const toValue = direction === 'left' ? -width * 1.5 : width * 1.5;

  // Create timestamp in the desired format
  const formatTimestamp = () => {
    const now = new Date();
    const options = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Europe/Berlin' // UTC+2 timezone
    };
    
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(now);
    return `${formattedDate} UTC+2`;
  };

  const formattedTimestamp = formatTimestamp();

  // Animate the card
  Animated.timing(translateX, {
    toValue,
    duration: 300,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  }).start(async () => {
    translateX.setValue(0);

    try {
      // Save to user's collection (rsvp or declined)
      await setDoc(doc(db, 'users', user.uid, swipeType, current.id), {
        swipedAt: formattedTimestamp,
      });
      console.log(`${swipeType.toUpperCase()} saved for ${current.id}`);

      // If user RSVP'd (swiped right), add them to event's attendees
      if (direction === 'right') {
        const attendeeRef = doc(db, 'live', current.id, 'pending', user.uid);
        await setDoc(attendeeRef, {
        joinedAt: new Date().toISOString(), // Store ISO string for querying
        joinedAtFormatted: formattedTimestamp, // Store formatted string for display
        role: 'member',
        userId: user.uid
      });
        console.log(`User added to event ${current.id} pending list`);
      }
    } catch (error) {
      console.error(`Firestore operation failed:`, error);
    }

    setEventIndex(prev => prev + 1);
  });
};

  const currentEvent = events[eventIndex];
  console.log('Current event:', currentEvent);

  const nextEvent = events[eventIndex + 1];

  const nextCardOpacity = translateX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: [1, 0.4, 1],
    extrapolate: 'clamp',
  });

  return (
      <LinearGradient colors={['#0367A6', '#012840']} style={styles.container}>
    <View style={styles.cardContainer}>
      {currentEvent ? (
        <>
          {/* Next card under current card */}
          {nextEvent && (
          <Animated.View
            style={[
              styles.nextCard,
              {
                opacity: nextCardOpacity,
              },
            ]}
            pointerEvents="none"
          >
            <EventCard event={nextEvent} isSwiping={false} />
          </Animated.View>
        )}

          {/* Current swipable card */}
          <Animated.View
            {...panResponder.panHandlers}
            style={{
              transform: [{ translateX }, { rotate }],
              opacity,
              position: 'absolute', // make sure current card is on top
            }}
          >
            <EventCard event={currentEvent} isSwiping={isSwiping} />
            {/* Buttons inside the animated card */}
            <View style={styles.actionButtonsInsideCard}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleSwipe('left')}
              >
                <Image source={NoIcon} style={styles.iconImage} resizeMode="contain" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleSwipe('right')}
              >
                <Image source={WaveIcon} style={styles.iconImage} resizeMode="contain" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Swipe overlay */}
          <SwipeOverlay translateX={translateX} />
        </>
      ) : (
        <View style={styles.endContainer}>
          <Text style={styles.doneText}>No more events</Text>
          <TouchableOpacity style={styles.resetButton} onPress={() => setEventIndex(0)}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
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
    alignItems: 'center', // important
    paddingHorizontal: 0,
    paddingTop: 0,
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
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 40,
  },

  nextCard: {
  position: 'absolute',
  width: '100%',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: -1,
},
});

export default EventSwipeScreen;
