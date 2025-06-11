import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import dayjs from 'dayjs'; // REPLACED: import moment from 'moment';

const { width, height } = Dimensions.get('window');

const PreviewModal = ({
  isVisible,
  onClose,
  eventDetails,
  hostInfo
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setCurrentIndex(0);
    }
  }, [isVisible]);

  if (!eventDetails) {
    return null;
  }

  const {
    title,
    selectedDate,
    groupSize,
    location,
    description,
    photos = [],
    tags = []
  } = eventDetails;

  const { hostFirstName, hostLastName, hostProfileImage } = hostInfo;
  const hostName = `${hostFirstName || ''} ${hostLastName || ''}`.trim();

  const contentMap = [
    'host',
    'groupSize',
    'tags'
  ];
  const currentContentKey = contentMap[currentIndex % contentMap.length];

  const handleTap = useCallback((e) => {
    const tapX = e.nativeEvent.locationX;
    const imageWidth = width;

    const leftBoundary = imageWidth * 0.3;
    const rightBoundary = imageWidth * 0.7;

    if (photos.length <= 1) {
        return;
    }

    if (tapX <= leftBoundary) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    } else if (tapX >= rightBoundary) {
      setCurrentIndex((prev) =>
        prev < photos.length - 1 ? prev + 1 : 0
      );
    }
  }, [photos.length]);

  const formatDate = (dateObj) => {
    return dateObj ? dayjs(dateObj).format('MMMM D,YYYY') : 'Not set'; // REPLACED moment with dayjs
  };

  const formatTime = (dateObj) => {
    return dateObj ? dayjs(dateObj).format('h:mm A') : 'Not set';       // REPLACED moment with dayjs
  };

  const handleOpenMaps = () => {
    if (location) {
      const query = encodeURIComponent(location);
      const url = Platform.select({
        ios: `maps:0,0?q=${query}`,
        android: `geo:0,0?q=${query}`,
      });

      if (url) {
        Linking.openURL(url).catch((err) =>
          Alert.alert('Error', 'Could not open map application. Please ensure a map app is installed.')
        );
      } else {
        Alert.alert('Error', 'Unable to generate map URL for this platform.');
      }
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close-circle" size={40} color="white" />
        </TouchableOpacity>

        {/* Image Display with Tap Navigation */}
        {photos.length > 0 ? (
          <TouchableWithoutFeedback onPress={handleTap}>
            <Image
              source={{ uri: photos[currentIndex] }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableWithoutFeedback>
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={80} color="#ccc" />
            <Text style={styles.noImageText}>No images selected</Text>
          </View>
        )}

        {/* Info Overlay (Top section with Title, Description, Location, Date) */}
        <LinearGradient
          colors={['#D9043D80', '#0367A680']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.infoOverlay, styles.top]}
        >
          <View style={styles.topRow}>
            <Text style={styles.title}>{title || 'Untitled Event'}</Text>
            {description ? (
              <Text style={styles.description}>{description}</Text>
            ) : null}
          </View>

          <View style={styles.bottomRow}>
            {/* Location */}
            <View style={styles.locationContainer}>
              <TouchableOpacity
                style={styles.locationWrapper}
                onPress={handleOpenMaps}
              >
                <Feather name="map-pin" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.locationText}>{location || 'Location not set'}</Text>
            </View>

            {/* Date & Time */}
            <View style={styles.dateContainer}>
              <Feather name="calendar" size={24} color="white" />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.dateText}>
                  {formatDate(selectedDate)}
                </Text>
                <Text style={styles.timeText}>
                  {formatTime(selectedDate)}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Dynamic Overlays (Host, Group Size, Tags) */}
        {currentContentKey === 'host' && (
          <View style={styles.hostOverlay}>
            <Image
              source={{ uri: hostProfileImage || 'https://via.placeholder.com/150' }}
              style={styles.hostCircle}
              resizeMode="cover"
            />
            <View style={styles.hostInfo}>
              <Text style={styles.hostedBy}>Hosted by:</Text>
              <Text style={styles.hostName}>{hostName || 'Unknown'}</Text>
            </View>
          </View>
        )}

        {currentContentKey === 'groupSize' && (
          <View style={styles.attendeesOverlay}>
            <Feather name="users" size={30} color="white" style={{marginRight: 10}}/>
            <View style={styles.hostInfo}>
              <Text style={styles.hostedBy}>Group Size:</Text>
              <Text style={styles.hostName}>{groupSize || 'Not set'}</Text>
            </View>
          </View>
        )}

        {currentContentKey === 'tags' && (
          <View style={styles.tagsOverlay}>
            {tags.length > 0 ? (
                <View style={styles.tagsContainer}>
                  {tags.map((tag, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
            ) : (
                <Text style={styles.noTagsText}>No tags selected</Text>
            )}
          </View>
        )}

        {/* Pagination Dots */}
        {photos.length > 1 && (
          <View style={styles.pagination}>
            {photos.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: currentIndex === index ? '#D9043D' : '#D9043D40' },
                ]}
                onPress={() => setCurrentIndex(index)}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#ccc',
    marginTop: 10,
    fontSize: 18,
  },
  infoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#D9043D80',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 60,
    paddingBottom: 14,
    borderRadius: 0,
    zIndex: 10,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
  },
  top: {
    top: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#eee',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  topRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  locationWrapper: {
    backgroundColor: '#0367A6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginRight: 8,
  },
  locationText: {
    color: 'white',
    fontSize: 16,
    flexShrink: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  timeText: {
    color: '#ddd',
    fontSize: 14,
  },
  hostOverlay: {
    position: 'absolute',
    top: height * 0.25, // <-- Change this line
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0367A6',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
  },
  hostCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#F2BB47',
  },
  hostInfo: {
    flexDirection: 'column',
  },
  hostedBy: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#ccc',
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  attendeesOverlay: {
    position: 'absolute',
    top: height * 0.25, // This one is already set to 0.8 in your provided code
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0367A6',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
  },
  pagination: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
    width: 25,
  },
  tagsOverlay: {
    position: 'absolute',
    top: height * 0.25, // <-- Change this line
    right: 0,
    paddingVertical: 10,
    paddingLeft: 15,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: width * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#0367A6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  tagText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noTagsText: {
    color: '#ccc',
    fontSize: 16,
    paddingRight: 15,
  },
});

export default PreviewModal;