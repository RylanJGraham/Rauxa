import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import EventCard from '../components/matching/EventCard';

const EventSwipeScreen = () => {
  const [swipeDirection, setSwipeDirection] = useState(null); // Tracks swipe direction
  const [opacityAnim] = useState(new Animated.Value(0)); // Opacity for the overlay
  const [drag, setDrag] = useState(new Animated.ValueXY()); // For swipe movement
  const [swipedIndex, setSwipedIndex] = useState(0);
  const events = [ /* Your event data here */ ]; // Event data as per your provided code

  // Create pan responder for handling the swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: drag.x, dy: drag.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dx > 120) {
          // Swipe Right
          handleSwipe('right');
        } else if (gestureState.dx < -120) {
          // Swipe Left
          handleSwipe('left');
        } else {
          // Reset position if not swiped enough
          resetSwipePosition();
        }
      },
    })
  ).current;

  // Handle swipe action (right/left)
  const handleSwipe = (direction) => {
    setSwipeDirection(direction);

    // Animate the card off-screen with smooth transition
    Animated.timing(drag, {
      toValue: { x: direction === 'right' ? 500 : -500, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setSwipedIndex(swipedIndex + 1);
      resetSwipePosition();
    }, 300);
  };

  // Reset swipe position
  const resetSwipePosition = () => {
    Animated.spring(drag, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Overlay animation based on swipe direction
  const renderOverlay = () => {
    if (swipeDirection === 'left') {
      return (
        <Animated.View
          style={[styles.overlayBackground, { backgroundColor: 'rgba(255, 0, 0, 0.2)', opacity: opacityAnim }]}
        >
          <FontAwesome name="thumbs-down" size={60} color="white" />
          <Text style={styles.overlayText}>No Thanks</Text>
        </Animated.View>
      );
    } else if (swipeDirection === 'right') {
      return (
        <Animated.View
          style={[styles.overlayBackground, { backgroundColor: 'rgba(0, 255, 0, 0.2)', opacity: opacityAnim }]}
        >
          <FontAwesome name="thumbs-up" size={60} color="white" />
          <Text style={styles.overlayText}>RSVP'd</Text>
        </Animated.View>
      );
    }
    return null;
  };

  return (
    <LinearGradient colors={['#0367A6', '#012840']} style={styles.container}>
      <View style={styles.content}>
        {events.length > 0 && swipedIndex < events.length ? (
          <Animated.View
            {...panResponder.panHandlers}
            style={[styles.swipeable, { transform: drag.getTranslateTransform() }]}
          >
            <EventCard event={events[swipedIndex]} />
          </Animated.View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No more events to show</Text>
          </View>
        )}
      </View>
      {renderOverlay()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  swipeable: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: 'white',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  overlayText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
});

export default EventSwipeScreen;
