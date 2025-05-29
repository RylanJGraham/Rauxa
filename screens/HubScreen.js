import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const HubScreen = () => {
  const [rsvps, setRsvps] = useState([]);
  const [connections, setConnections] = useState([]);
  const [hostingRequests, setHostingRequests] = useState([]);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    const fetchUserRsvps = async () => {
      // Fetch user's RSVP events from Firestore
      try {
        const rsvpSnapshot = await getDocs(collection(db, 'users', userId, 'rsvp'));
        const rsvpEvents = rsvpSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRsvps(rsvpEvents);
      } catch (error) {
        console.error('Error fetching RSVPs:', error);
      }
    };

    const fetchHostingRequests = async () => {
      // Fetch RSVP requests for events hosted by user
      try {
        // Query live events where current user is host
        const hostedEventsSnapshot = await getDocs(
          query(collection(db, 'live'), where('host', '==', userId))
        );
        const hostingEventIds = hostedEventsSnapshot.docs.map(doc => doc.id);

        let requests = [];

        // For each hosted event, get pending RSVP requests
        for (const eventId of hostingEventIds) {
          const pendingSnapshot = await getDocs(collection(db, 'live', eventId, 'pending'));
          pendingSnapshot.forEach(doc => {
            requests.push({ eventId, id: doc.id, ...doc.data() });
          });
        }
        setHostingRequests(requests);
      } catch (error) {
        console.error('Error fetching hosting requests:', error);
      }
    };

    // Placeholder for connections/history logic
    const fetchConnections = () => {
      // TODO: implement fetching connections or event history
      setConnections([]); 
    };

    fetchUserRsvps();
    fetchHostingRequests();
    fetchConnections();
  }, [userId]);

  const renderRsvpItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemTitle}>Event ID: {item.id}</Text>
      <Text>Swiped at: {item.swipedAt}</Text>
    </View>
  );

  const renderRequestItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemTitle}>Request for Event: {item.eventId}</Text>
      <Text>User: {item.userId || 'Unknown'}</Text>
      <View style={styles.requestButtons}>
        <TouchableOpacity style={[styles.button, styles.acceptButton]}>
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.declineButton]}>
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
        hostingRequests.map(req => (
          <View key={req.id}>{renderRequestItem({ item: req })}</View>
        ))
      ) : (
        <Text style={styles.emptyText}>No hosting requests.</Text>
      )}

      <Text style={styles.heading}>Connections & History</Text>
      {connections.length ? (
        <Text> {/* You can fill this in with FlatList or other UI */} </Text>
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
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  emptyText: {
    color: '#ccc',
    fontStyle: 'italic',
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
