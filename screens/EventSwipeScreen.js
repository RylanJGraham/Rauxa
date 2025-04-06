import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Swiper from 'react-native-deck-swiper';
import { FontAwesome } from '@expo/vector-icons';
import EventCard from '../components/matching/EventCard';

const EventSwipeScreen = () => {
  const swiperRef = useRef(null);
  const [swipeDirection, setSwipeDirection] = useState(null); // Tracks swipe direction
  const [opacityAnim] = useState(new Animated.Value(0)); // Opacity for the overlay

  const events = [
    {
      id: '1',
      name: 'Beach Party Barceloneta',
      time: '18:00-23:00',
      date: 'June 15, 2023',
      location: 'Santa Monica Beach',
      description: 'Join us for a summer beach party with live music and BBQ!',
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
        'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4'
      ],
      tags: ['Live DJ', 'BBQ', 'Bonfire', 'Drinks'],
      attendees: [
        {
          name: 'Alice',
          profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
        },
        {
          name: 'Bob',
          profilePicture: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
        },
        {
          name: 'Charlie',
          profilePicture: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
        }
      ]
    },
    {
      id: '2',
      name: 'Mountain Hike',
      time: '8:00 AM - 3:00 PM',
      date: 'July 20, 2023',
      location: 'Rocky Mountains',
      description: 'Join us for a beautiful hiking adventure in the Rockies!',
      images: [
        'https://images.unsplash.com/photo-1499905353937-efac16a41574',
        'https://images.unsplash.com/photo-1517341787854-8763467363f7',
        'https://images.unsplash.com/photo-1484102410446-bcb3de6f3f6c'
      ],
      tags: ['Hiking', 'Nature', 'Adventure'],
      attendees: [
        {
          name: 'Alice',
          profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
        },
        {
          name: 'Bob',
          profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg'
        },
        {
          name: 'Charlie',
          profilePicture: 'https://randomuser.me/api/portraits/men/2.jpg'
        }
      ]
    },
    {
      id: '3',
      name: 'Food Festival',
      time: '12:00 PM - 6:00 PM',
      date: 'August 10, 2023',
      location: 'Downtown Park',
      description: 'Taste the best local food at our vibrant food festival!',
      images: [
        'https://images.unsplash.com/photo-1505692580863-66c78923c01e',
        'https://images.unsplash.com/photo-1485108272968-b71a370e7b7b',
        'https://images.unsplash.com/photo-1506748686211-9c88bc1a7100'
      ],
      tags: ['Food', 'Festival', 'Drinks'],
      attendees: [
        {
          name: 'Alice',
          profilePicture: 'https://randomuser.me/api/portraits/women/1.jpg'
        },
        {
          name: 'Bob',
          profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg'
        },
        {
          name: 'Charlie',
          profilePicture: 'https://randomuser.me/api/portraits/men/2.jpg'
        }
      ]
    }
  ];

  useEffect(() => {
    events.forEach(event => {
      event.images.forEach(image => {
        Image.prefetch(image);
      });
    });
  }, []);

  const handleSwipeLeft = () => {
    swiperRef.current.swipeLeft();  // Trigger swipe left
    handleSwipe('left');           // Call your handleSwipe function for animations
  };
  
  const handleSwipeRight = () => {
    swiperRef.current.swipeRight();  // Trigger swipe right
    handleSwipe('right');            // Call your handleSwipe function for animations
  };

  const handleSwipe = (direction) => {
    setSwipeDirection(direction);

    // Start animating the overlay
    Animated.timing(opacityAnim, {
      toValue: 0.2,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 2000);
  };

  const renderOverlay = () => {
    if (swipeDirection === 'left') {
      return (
        <Animated.View
          style={[
            styles.overlayBackground,
            { backgroundColor: 'rgba(255, 0, 0, 0.2)', opacity: opacityAnim }, // Red for "No"
          ]}
        >
          <FontAwesome name="thumbs-down" size={60} color="white" />
          <Text style={styles.overlayText}>No Thanks</Text>
        </Animated.View>
      );
    } else if (swipeDirection === 'right') {
      return (
        <Animated.View
          style={[
            styles.overlayBackground,
            { backgroundColor: 'rgba(255, 255, 0, 0.2)', opacity: opacityAnim }, // Yellow for "Yes"
          ]}
        >
          <FontAwesome name="thumbs-up" size={60} color="black" />
          <Text style={styles.overlayText}>RSVP'd</Text>
        </Animated.View>
      );
    }
    return null;
  };

  return (
    <LinearGradient colors={['#0367A6', '#012840']} style={styles.container}>
      <View style={styles.content}>
        {events.length > 0 ? (
          <Swiper
            ref={swiperRef}
            cards={events}
            renderCard={(event) => 
              <EventCard
              event={event}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              />}
            backgroundColor="transparent"
            cardHorizontalMargin={0}
            cardVerticalMargin={0}
            stackSize={3}
            stackSeparation={15}
            infinite={false}
            animateCardOpacity
            swipeAnimationDuration={400}
            onSwipedLeft={() => handleSwipe('left')}
            onSwipedRight={() => handleSwipe('right')}
            onSwiped={(index) => {
              // Reset the overlay opacity after swipe
              Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No more events to show</Text>
          </View>
        )}
      </View>

      {/* Overlay effect */}
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
