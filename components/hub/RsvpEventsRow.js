// components/hub/RsvpEventsRow.js
import React, { useState, useEffect, useCallback, useRef } from 'react'; // Import useRef
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import RsvpEventCard from './RsvpEventCard';

const RsvpEventsRow = ({ userId, onEventPress, onInfoPress, onChatPress }) => { // Add onInfoPress, onChatPress
  const [rsvpedEvents, setRsvpedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const unsubscribeRefs = useCallback(useRef([]), []);

  useEffect(() => {
    if (!userId) {
      setRsvpedEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const cleanupListeners = () => {
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
    };

    cleanupListeners();

    try {
      const rsvpCollectionRef = collection(db, 'users', userId, 'rsvp');
      const unsubscribeRsvps = onSnapshot(rsvpCollectionRef, async (rsvpSnapshot) => {
        if (rsvpSnapshot.empty) {
          setRsvpedEvents([]);
          setLoading(false);
          return;
        }

        const newRsvpEventIds = rsvpSnapshot.docs.map(doc => doc.id);
        const eventPromises = newRsvpEventIds.map(async (eventId) => {
          const liveEventRef = doc(db, 'live', eventId);
          const attendeesCollectionRef = collection(db, 'live', eventId, 'attendees');

          return new Promise((resolve) => {
            const eventUnsubscribe = onSnapshot(liveEventRef, async (eventDoc) => {
              if (!eventDoc.exists()) {
                console.warn(`Event ${eventId} no longer exists.`);
                resolve(null);
                return;
              }
              const eventData = eventDoc.data();

              const attendeesUnsubscribe = onSnapshot(attendeesCollectionRef, (attendeesSnapshot) => {
                const isAccepted = attendeesSnapshot.docs.some(attendeeDoc => attendeeDoc.id === userId);
                resolve({ id: eventId, ...eventData, isAccepted });
              }, (err) => {
                console.error(`Error listening to attendees for ${eventId}:`, err);
                resolve(null);
              });

              unsubscribeRefs.current.push(attendeesUnsubscribe);
            }, (err) => {
              console.error(`Error listening to live event ${eventId}:`, err);
              resolve(null);
            });
            unsubscribeRefs.current.push(eventUnsubscribe);
          });
        });

        const fetchedEvents = (await Promise.all(eventPromises)).filter(Boolean);
        setRsvpedEvents(fetchedEvents);
        setLoading(false);
      }, (err) => {
        console.error('Error listening to user RSVPs:', err);
        setError('Failed to load your RSVPs.');
        setLoading(false);
      });

      unsubscribeRefs.current.push(unsubscribeRsvps);

    } catch (err) {
      console.error('Initial setup error for RSVP events:', err);
      setError('Failed to initialize RSVP events.');
      setLoading(false);
    }

    return cleanupListeners;
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D9043D" />
        <Text style={styles.loadingText}>Loading RSVPs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (rsvpedEvents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>You haven't RSVP'd to any events yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rsvpedEvents}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <RsvpEventCard
          event={item}
          isAccepted={item.isAccepted}
          onPress={() => onEventPress(item)}
          onInfoPress={onInfoPress} // Pass down
          onChatPress={onChatPress} // Pass down
        />
      )}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContentContainer}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 10,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#D9043D',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#ccc',
    fontStyle: 'italic',
  },
  listContentContainer: {
    paddingHorizontal: 5,
    paddingBottom: 0,
  },
});

export default RsvpEventsRow;