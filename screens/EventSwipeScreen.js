import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { LinearGradient } from 'expo-linear-gradient';
import EventCard from '../components/matching/EventCard';

const EventSwipeScreen = () => {
  const [events, setEvents] = useState([]);
  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    const fetchEvents = async () => {
      const snapshot = await getDocs(collection(db, 'live'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(data);
    };
    fetchEvents();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) {
          swipeCard('right');
        } else if (gesture.dx < -120) {
          swipeCard('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const swipeCard = (direction) => {
    Animated.timing(position, {
      toValue: { x: direction === 'right' ? 500 : -500, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setIndex(prev => prev + 1);
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  };

  if (index >= events.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneText}>No more events 🎉</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#0367A6', '#012840']} style={styles.container}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, { transform: position.getTranslateTransform() }]}
      >
        <EventCard event={events[index]} />
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    position: 'absolute',
    width: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneText: {
    color: 'white',
    fontSize: 20,
  },
});

export default EventSwipeScreen;
