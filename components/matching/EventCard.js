import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

import TopBar from './subcomponents/TopBar';
import YesNoButtons from './subcomponents/YesNoButtons';
import Indicators from './subcomponents/Indicators';

const { width, height } = Dimensions.get('window');

const EventCard = ({ event, onSwipeLeft, onSwipeRight }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [noPressed, setNoPressed] = useState(false);
  const [yesPressed, setYesPressed] = useState(false);

  useEffect(() => {
    // Prefetch next image
    if (currentImageIndex < event.images.length - 1) {
      Image.prefetch(event.images[currentImageIndex + 1]);
    }
  }, [currentImageIndex]);

  const handleNextImage = () => {
    if (currentImageIndex < event.images.length - 1) {
      setIsLoading(true);
      setCurrentImageIndex(prevIndex => prevIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setIsLoading(true);
      setCurrentImageIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleLeftTap = () => {
    handlePrevImage();
  };

  const handleRightTap = () => {
    handleNextImage();
  };

  return (
    <View style={styles.card}>
      {/* Image display */}
      <TouchableOpacity 
        style={styles.imageContainer} 
        onPressIn={handleLeftTap} // Handles the tap on the left side of the image
        onPressOut={handleRightTap} // Handles the tap on the right side of the image
      >
        <Image
          source={{ uri: event.images[currentImageIndex] }}
          style={styles.image}
          onLoadEnd={() => setIsLoading(false)}
        />
      </TouchableOpacity>

      {/* Loader */}
      {isLoading && (
        <ActivityIndicator size="large" color="white" style={styles.loader} />
      )}

      {/* Top Bar */}
      <TopBar event={event} />
      
      {/* Yes/No Buttons */}
      <YesNoButtons 
        noPressed={noPressed} 
        setNoPressed={setNoPressed} 
        yesPressed={yesPressed} 
        setYesPressed={setYesPressed} 
        onSwipeLeft={onSwipeLeft} 
        onSwipeRight={onSwipeRight}
      />

      {/* Image Navigation */}
      <TouchableOpacity style={styles.touchLeft} onPress={handlePrevImage} disabled={currentImageIndex === 0} />
      <TouchableOpacity style={styles.touchRight} onPress={handleNextImage} disabled={currentImageIndex === event.images.length - 1} />
      
      {/* Bottom Indicators */}
      <Indicators 
        event={event} 
        currentImageIndex={currentImageIndex} 
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    height: height,
    width: width,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
  },
  topBar: {
    backgroundColor: '#0367A680',
    padding: 15,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    marginTop: 20,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dateTimeColumn: {
    marginLeft: 4,
    alignItems: 'flex-start',
  },
  dateText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 16,
    color: 'white',
  },
  groupIcon: {
    marginLeft: 20,
    marginRight: 6,
  },
  attendeesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginLeft: 10,
    position: 'relative',
  },
  attendeeProfilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: -12,
  },
  indicatorContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  indicator: {
    height: 4,
    marginHorizontal: 4,
    borderRadius: 3,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',  // Center the buttons horizontally
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
    zIndex: 3,
    paddingHorizontal: 100,
  },
  buttonContainer: {
    backgroundColor: 'white',
    borderRadius: 50,  // Circular background
    padding: 15,
    marginHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  buttonIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  noPressed: {
    backgroundColor: '#FF4C4C',  // Slightly red when pressed
  },
  yesPressed: {
    backgroundColor: '#FFD700',  // Slightly yellow when pressed
  },
  attendeesCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: 'white',
    marginLeft: 10,
  },
  touchLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '50%',
    zIndex: 1,
  },
  touchRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '50%',
    zIndex: 1,
  },
});

export default EventCard;
