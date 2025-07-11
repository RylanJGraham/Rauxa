import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Linking } from 'react-native';

const { width, height } = Dimensions.get('screen');

const EventCard = ({ event, isSwiping }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // State to store the height of the infoOverlay
  const [infoOverlayHeight, setInfoOverlayHeight] = useState(0);

  const dotCount = event.photos.length;
  const dotWidth = (width - dotCount * 8) / dotCount;

  const handleTap = (e) => {
    if (isSwiping) return;

    const tapX = e.nativeEvent.locationX;
    const leftBoundary = width * 0.2;
    const rightBoundary = width * 0.8;

    if (tapX <= leftBoundary) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (tapX >= rightBoundary) {
      setCurrentIndex((prev) =>
        prev < event.photos.length - 1 ? prev + 1 : prev
      );
    }
  };

  // Callback function to get the layout of the infoOverlay
  const onInfoOverlayLayout = useCallback((event) => {
    const { height } = event.nativeEvent.layout;
    setInfoOverlayHeight(height);
  }, []);

  const currentImage = event.photos?.[currentIndex];
  const attendeeImages = event.attendees?.map(att => att.profileImages?.[0]).filter(Boolean) || [];

  // Determine status bar height for Android. For iOS, StatusBar.currentHeight is null.
  const androidStatusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

  // Calculate the padding top for the infoOverlay content to push it below the status bar/notch
  const infoOverlayContentPaddingTop = Platform.select({
    android: androidStatusBarHeight + 10,
    ios: 50 + 10,
    default: 30
  });

  // Calculate the top position for other overlays (host, attendees, tags)
  // This will now dynamically adjust based on infoOverlayHeight
  const otherOverlayTopPosition = infoOverlayHeight + 20; // 20 is a small margin below the infoOverlay

  // The pagination indicators should always be just below the top container
  const paginationTopPosition = infoOverlayHeight + 4; // 10 is a small margin

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={isSwiping ? null : handleTap}>
        <Image
          source={{ uri: currentImage }}
          style={styles.image}
          contentFit="cover"
        />
      </TouchableWithoutFeedback>

      <LinearGradient
        colors={['#D9043D', '#0367A6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.infoOverlay,
          { top: 0 },
          { paddingTop: infoOverlayContentPaddingTop },
          { borderRadius: styles.container.borderRadius },
        ]}
        onLayout={onInfoOverlayLayout} // Add onLayout prop here
      >
        {/* Top Row */}
        <View style={styles.topRow}>
          <Text style={styles.title}>{event.title}</Text>
          {event.description && (
            <Text style={styles.description}>{event.description}</Text>
          )}
        </View>

        {/* Bottom Row */}
        <View style={styles.bottomRow}>
          {/* Location */}
          <View style={styles.locationContainer}>
            <TouchableOpacity
              style={styles.locationWrapper}
              onPress={() => {
                const query = encodeURIComponent(event.location);
                // CORRECTED LINE HERE:
                const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
                Linking.openURL(url);
              }}
            >
              <Feather name="map-pin" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.locationText}>{event.location}</Text>
          </View>

          {/* Date */}
          <View style={styles.dateContainer}>
            <Feather name="calendar" size={24} color="white" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.dateText}>
                {event.date?.seconds
                  ? new Date(event.date.seconds * 1000).toLocaleDateString()
                  : ''}
              </Text>
              <Text style={styles.timeText}>
                {event.date?.seconds
                  ? new Date(event.date.seconds * 1000).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Other Overlays: Host, Attendees, Tags */}
      {/* Only render these if infoOverlayHeight is determined to prevent initial jump */}
      {infoOverlayHeight > 0 && (
        currentIndex === 0 ? (
          <View style={[styles.hostOverlay, { top: otherOverlayTopPosition }]}>
            <Image
              source={{ uri: event.hostInfo?.profileImages?.[0] || 'https://via.placeholder.com/150' }}
              style={styles.hostCircle}
              resizeMode="cover"
            />
            <View style={styles.hostInfo}>
              <Text style={styles.hostedBy}>Hosted by:</Text>
              <Text style={styles.hostName}>{event.hostInfo?.name || 'Unknown'}</Text>
            </View>
          </View>
        ) : currentIndex === 2 ? (
          <View style={[styles.tagsOverlay, { top: otherOverlayTopPosition }]}>
            <View style={styles.tagsContainer}>
              {(event.tags || []).map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={[styles.attendeesOverlay, { top: otherOverlayTopPosition }]}>
            <View style={styles.attendeeCircles}>
              {attendeeImages.slice(0, 5).map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={[
                    styles.attendeeCircle,
                    {
                      left: index * 26,
                      zIndex: 5 - index,
                    },
                  ]}
                  resizeMode="cover"
                />
              ))}
            </View>
            <View style={styles.hostInfo}>
              <Text style={styles.hostedBy}>Attended by:</Text>
              <Text style={styles.hostName}>x{attendeeImages.length} People</Text>
            </View>
          </View>
        )
      )}


      {/* Moved pagination here and adjusted its top position */}
      {/* Only render pagination if infoOverlayHeight is determined */}
      {infoOverlayHeight > 0 && (
        <View style={[styles.pagination, { top: paginationTopPosition }]}>
          {event.photos.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  backgroundColor: currentIndex === index ? '#D9043D' : '#D9043D40',
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width,
    height,
    position: 'relative',
    borderRadius: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 14,
    zIndex: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4.65,
    elevation: 8,
  },
  bottom: {
    bottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 0,
  },
  details: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 2,
  },
  counter: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
  },
  counterText: {
    color: 'white',
    fontSize: 14,
  },
  topRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingHorizontal: 20,
    width: '100%',
  },
  description: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 0,
    marginBottom: 2,
    maxWidth: '100%',
    fontStyle: 'italic',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  timeText: {
    color: '#ddd',
    fontSize: 12,
  },
  locationText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 6,
    flexWrap: 'wrap',
    alignSelf: 'flex-start',
    flexShrink: 1,
  },
  locationWrapper: {
    backgroundColor: '#0367A6',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    flexShrink: 1,
  },
  hostOverlay: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0367A6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4.65,
    elevation: 8,
  },
  hostCircle: {
    width: 46,
    height: 46,
    borderRadius: 30,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  hostInfo: {
    flexDirection: 'column',
  },
  hostedBy: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#ccc',
  },
  hostName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  attendeesOverlay: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0367A6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4.65,
    elevation: 8,
  },
  attendeeCircles: {
    position: 'relative',
    height: 46,
    width: 100,
    marginRight: 24,
    flexDirection: 'row',
  },
  attendeeCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 0,
    borderWidth: 2,
    borderColor: '#0367A6',
  },
  pagination: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  dot: {
    height: 5,
    borderRadius: 3,
    marginHorizontal: 4,
  },
});

export default EventCard;