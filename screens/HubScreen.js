import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc, setDoc, getDoc, runTransaction, FieldValue } from 'firebase/firestore';
import { arrayUnion, serverTimestamp } from 'firebase/firestore'; // For v9+ modular SDK

const HubScreen = () => {
  const [rsvps, setRsvps] = useState([]);
  const [connections, setConnections] = useState([]);
  const [hostingRequests, setHostingRequests] = useState([]);

  const userId = auth.currentUser?.uid; // Host's UID

  useEffect(() => {
    if (!userId) return;

    const fetchUserRsvps = async () => {
      try {
        const rsvpSnapshot = await getDocs(collection(db, 'users', userId, 'rsvp'));
        const rsvpEvents = rsvpSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRsvps(rsvpEvents);
      } catch (error) {
        console.error('Error fetching RSVPs:', error);
      }
    };

    const fetchHostingRequests = async () => {
      try {
        const hostedEventsSnapshot = await getDocs(
          query(collection(db, 'live'), where('host', '==', userId))
        );
        const hostingEventIds = hostedEventsSnapshot.docs.map(doc => doc.id);

        let requests = [];
        for (const eventId of hostingEventIds) {
          const pendingSnapshot = await getDocs(collection(db, 'live', eventId, 'pending'));
          pendingSnapshot.forEach(doc => {
            requests.push({ eventId, requestId: doc.id, ...doc.data() });
          });
        }
        setHostingRequests(requests);
      } catch (error) {
        console.error('Error fetching hosting requests:', error);
      }
    };

    const fetchConnections = () => {
      setConnections([]);
    };

    fetchUserRsvps();
    fetchHostingRequests();
    fetchConnections();
  }, [userId]);

  const handleAcceptRequest = async (requestItem) => {
    const { eventId, requestId, userId: rsvpUserId } = requestItem; // userId is the swiper's UID

    if (!userId) { // Host's UID
      Alert.alert("Error", "Host user not authenticated.");
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const pendingRef = doc(db, 'live', eventId, 'pending', requestId);
        // Changed 'approved' to 'attendees' here
        const attendeeRef = doc(db, 'live', eventId, 'attendees', requestId);

        const pendingDoc = await transaction.get(pendingRef);

        if (!pendingDoc.exists()) {
          throw "Request does not exist!";
        }

        // Move the request from 'pending' to 'attendees'
        transaction.set(attendeeRef, { ...pendingDoc.data(), acceptedAt: serverTimestamp() }); // Changed to acceptedAt
        transaction.delete(pendingRef);
      });

      setHostingRequests(prevRequests =>
        prevRequests.filter(req => req.requestId !== requestId)
      );

      Alert.alert("Success", "RSVP request accepted. Chat will be created/updated.");

    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert("Error", "Failed to accept request. Please try again.");
    }
  };

  const handleDeclineRequest = async (requestItem) => {
    const { eventId, requestId } = requestItem;
    try {
      await deleteDoc(doc(db, 'live', eventId, 'pending', requestId));
      setHostingRequests(prevRequests =>
        prevRequests.filter(req => req.requestId !== requestId)
      );
      Alert.alert("Declined", "RSVP request declined.");
    } catch (error) {
      console.error('Error declining request:', error);
      Alert.alert("Error", "Failed to decline request.");
    }
  };

  const renderRsvpItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemTitle}>Event ID: {item.id}</Text>
      <Text style={styles.itemText}>Swiped at: {item.swipedAt?.toDate().toLocaleString() || 'N/A'}</Text>
    </View>
  );

  const renderRequestItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemTitle}>Request for Event: {item.eventId}</Text>
      <Text style={styles.itemText}>User: {item.userId || 'Unknown'}</Text>
      <View style={styles.requestButtons}>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item)}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={() => handleDeclineRequest(item)}
        >
          <Text style={styles.buttonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Your RSVPs</Text>
      {rsvps.length ? (
        <FlatList
          data={rsvps}
          keyExtractor={item => item.id}
          renderItem={renderRsvpItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.list}
        />
      ) : (
        <Text style={styles.emptyText}>No RSVP events yet.</Text>
      )}

      <Text style={styles.heading}>Hosting Requests</Text>
      {hostingRequests.length ? (
        <FlatList
          data={hostingRequests}
          keyExtractor={item => item.requestId}
          renderItem={renderRequestItem}
          scrollEnabled={false}
        />
      ) : (
        <Text style={styles.emptyText}>No hosting requests.</Text>
      )}

      <Text style={styles.heading}>Connections & History</Text>
      {connections.length ? (
        <Text style={styles.emptyText}> </Text>
      ) : (
        <Text style={styles.emptyText}>No connections or history yet.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#012840',
    padding: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 12,
  },
  list: {
    marginBottom: 24,
  },
  item: {
    backgroundColor: '#024a7c',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    marginBottom: 12,
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  itemText: {
    color: '#ccc',
    fontSize: 14,
  },
  emptyText: {
    color: '#ccc',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  requestButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default HubScreen;