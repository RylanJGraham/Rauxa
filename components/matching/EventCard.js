import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Linking } from 'react-native';


const { width, height } = Dimensions.get('window');

const EventCard = ({ event }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const dotCount = event.photos.length;
  const dotWidth = (width - dotCount * 8) / dotCount; // 8px total spacing per dot (4px margin each side)

  const profilePics = [
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/men/34.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/22.jpg',
  'https://randomuser.me/api/portraits/women/12.jpg',
  'https://randomuser.me/api/portraits/men/77.jpg',
];


  const handleTap = (e) => {
    const tapX = e.nativeEvent.locationX;
    if (tapX < width / 2) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else {
      setCurrentIndex((prev) =>
        prev < event.photos.length - 1 ? prev + 1 : prev
      );
    }
  };

  const currentImage = event.photos?.[currentIndex];
  const isFirstSlide = currentIndex === 0;

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        <Image
          source={{ uri: currentImage }}
          style={styles.image}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['#D9043D80', '#0367A680']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.infoOverlay, styles.top]}
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
                const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
                Linking.openURL(url);
              }}
            >
              <Feather name="map-pin" size={24} color="white"/>
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

        {currentIndex === 0 ? (
        <View style={styles.hostOverlay}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/45.jpg' }}
            style={styles.hostCircle}
          />
          <View style={styles.hostInfo}>
            <Text style={styles.hostedBy}>Hosted by:</Text>
            <Text style={styles.hostName}>Ratadelacasa</Text>
          </View>
        </View>
      ) : currentIndex === 2 ? (
        <View style={styles.tagsOverlay}>
        <View style={styles.tagsContainer}>
          {(event.tags || []).map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      ) : (
        <View style={styles.attendeesOverlay}>
          <View style={styles.attendeeCircles}>
            {profilePics.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={[
                  styles.attendeeCircle,
                  {
                    left: i * 23,
                    zIndex: 6 - i,
                    borderWidth: 2,
                    borderColor: '#0367A6',
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.hostInfo}>
            <Text style={styles.hostedBy}>Attended by:</Text>
            <Text style={styles.hostName}>x6 People</Text>
          </View>
        </View>
      )}


        <View style={styles.pagination}>
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
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {currentIndex + 1}/{event.photos.length}
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    width,
    height,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoOverlay: {
  position: 'absolute',
  left: 0,
  right: 0,
  backgroundColor: '#D9043D80',
  paddingLeft: 0, // Adds inner padding
  paddingRight: 0, // Adds inner padding
  paddingTop: 60,
   paddingBottom: 14,
  borderRadius: 0,
  zIndex: 10,
  alignItems: 'center', // Center horizontally

  // (iOS)
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 1,
  shadowRadius: 4.65,

  // (Android)
  elevation: 8,
},
  top: {
    top: 36,
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
    top: 10,
    right: 16,
  },
  counterText: {
    color: 'white',
    fontSize: 14,
  },
  topRow: {
  flexDirection: 'column', // <-- change from 'row' to 'column'
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
  paddingHorizontal: 20,
  alignItems: 'center',
  gap: 24, // Only works if you're using React Native 0.71+
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
  flexWrap: 'wrap',   // Enable wrapping
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
  bottom: 80,
  right: 0,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#0367A6',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderTopLeftRadius: 16,
  borderBottomLeftRadius: 16,

  // (iOS)
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 1,
  shadowRadius: 4.65,

  // (Android)
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
  bottom: 80,
  right: 0,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#0367A6',
  paddingHorizontal: 12,
  paddingVertical: 8,
  maxWidth: 260, // Add this to avoid off-screen overflow on small devices
  borderTopLeftRadius: 16,
  borderBottomLeftRadius: 16,

  // (iOS)
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 1,
  shadowRadius: 4.65,

  // (Android)
  elevation: 8,
},

attendeeCircles: {
  position: 'relative',
  width: 46 + (5 * 23), // 6 circles, each offset by 23px
  height: 46,
  flexDirection: 'row',
  marginRight: 8,
},

attendeeCircle: {
  width: 46,
  height: 46,
  borderRadius: 23,
  backgroundColor: '#fff',
  position: 'absolute',
  top: 0,
},

pagination: {
  position: 'absolute',
  bottom: 46,
  left: 0,
  right: 0,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
},

dot: {
  height: 5,
  borderRadius: 3,
  marginHorizontal: 4,
},

activeDot: {
  width: 80,
  backgroundColor: '#D9043D',
},

inactiveDot: {
  width: 80,
  backgroundColor: '#D9043D',
},

tagsOverlay: {
  position: 'absolute',
  bottom: 80,
  right: 0,
  padding: 12,
  backgroundColor: '#0367A6', // outer blue background
  borderTopLeftRadius: 20,
  borderBottomLeftRadius: 20,
  flexDirection: 'row',

   // (iOS)
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 1,
  shadowRadius: 4.65,

  // (Android)
  elevation: 8,
},

tagsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 2,
},

tag: {
  backgroundColor: '#D9043D', // red pill
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

export default EventCard;
