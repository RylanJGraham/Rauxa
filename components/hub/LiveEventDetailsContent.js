// components/LiveEventDetailsContent.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Linking } from 'react-native';
import dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import useSafeAreaInsets

const { width, height } = Dimensions.get('screen');

const LiveEventDetailsContent = ({ event, isSwiping = false }) => {
  const insets = useSafeAreaInsets(); // Get safe area insets
  const [currentIndex, setCurrentIndex] = useState(0);
  const dotCount = event.photos ? event.photos.length : 0;

  const handleTap = (e) => {
    if (isSwiping) return;

    const tapX = e.nativeEvent.locationX;
    const leftBoundary = width * 0.2;
    const rightBoundary = width * 0.8;

    if (tapX <= leftBoundary) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (tapX >= rightBoundary) {
      setCurrentIndex((prev) =>
        prev < (event.photos?.length || 0) - 1 ? prev + 1 : prev
      );
    }
  };

  const currentImage = event.photos?.[currentIndex];
  const attendeeImages = event.attendees?.map(att => att.profileImages?.[0]).filter(Boolean) || [];

  const formatDateTime = (timestamp) => {
    if (!timestamp) return { date: "TBD", time: "TBD" };
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return {
      date: dayjs(date).format('MMMM D, YYYY'),
      time: dayjs(date).format('h:mm A')
    };
  };

  const { date: formattedDate, time: formattedTime } = formatDateTime(event.date);

  const androidStatusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

  const infoOverlayContentPaddingTop = Platform.select({
    android: androidStatusBarHeight + 10,
    ios: insets.top + 10, // Use insets.top for iOS
    default: 30
  });

  const otherOverlayTopPosition = Platform.select({
    android: androidStatusBarHeight + 144,
    ios: insets.top + 144, // Adjust based on insets.top
    default: 210
  });

  // Calculate pagination bottom position
  const paginationBottomPosition = Platform.select({
    ios: insets.bottom + 60, // 20 units above the safe area bottom
    android: 120, // A fixed value for Android (adjust as needed to clear navigation bar)
    default: 20
  });

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
      >
        <View style={styles.topRow}>
          <Text style={styles.title}>{event.title}</Text>
          {event.description && (
            <Text style={styles.description}>{event.description}</Text>
          )}
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.locationContainer}>
            <TouchableOpacity
              style={styles.locationWrapper}
              onPress={() => {
                if (!event.location) return;
                const query = encodeURIComponent(event.location);
                const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
                Linking.openURL(url).catch(err => console.error("Couldn't open map URL", err));
              }}
            >
              <Feather name="map-pin" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.locationText}>{event.location}</Text>
          </View>

          <View style={styles.dateContainer}>
            <Feather name="calendar" size={24} color="white" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.dateText}>
                {formattedDate}
              </Text>
              <Text style={styles.timeText}>
                {formattedTime}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {currentIndex === 0 ? (
        <View style={[styles.hostOverlay, { top: otherOverlayTopPosition }]}>
          <Image
            source={{ uri: event.hostInfo?.profileImages?.[0] || 'https://via.placeholder.com/150' }}
            style={styles.hostCircle}
            resizeMode="cover"
          />
          <View style={styles.hostInfo}>
            <Text style={styles.hostedBy}>Hosted by:</Text>
            <Text style={styles.hostName}>{event.hostInfo?.displayName || 'Unknown'}</Text>
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
      )}

      {/* Moved pagination to bottom and adjusted styling for non-full width */}
      {dotCount > 0 && (
        <View style={[styles.pagination, { bottom: paginationBottomPosition }]}>
          {event.photos.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  width: currentIndex === index ? 48 : 48, // Active dot wider, inactive narrower
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
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 0,
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
    // Removed left: 0, right: 0 to allow centering
    flexDirection: 'row',
    justifyContent: 'center', // Center the dots
    alignSelf: 'center', // Center the pagination container itself horizontally
    alignItems: 'center',
    zIndex: 100,
    // gap: 4, // You could use gap instead of marginHorizontal on dots for newer RN versions
  },
  dot: {
    height: 5,
    borderRadius: 3,
    marginHorizontal: 4, // Spacing between dots
  },
  tagsOverlay: {
    position: 'absolute',
    right: 0,
    padding: 12,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4.65,
    elevation: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  tag: {
    backgroundColor: '#0367A6',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 4,
    marginBottom: 2,
  },
  tagText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  },
});

export default LiveEventDetailsContent;