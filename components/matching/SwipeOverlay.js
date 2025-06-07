import React from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native'; // Import Image
import { Feather } from '@expo/vector-icons'; // Keep if you still use it elsewhere, otherwise can remove
import WaveIcon from '../../assets/matching/wave.png'; // Import your WaveIcon
import NoIcon from '../../assets/matching/No.png';  // Import your NoIcon

const { width, height } = Dimensions.get('window');

const SwipeOverlay = ({ translateX }) => {
  const startFadeDistance = width / 6;

  const opacityLeft = translateX.interpolate({
    inputRange: [-startFadeDistance * 2, -startFadeDistance],
    outputRange: [0.8, 0],
    extrapolate: 'clamp',
  });

  const scaleLeft = translateX.interpolate({
    inputRange: [-width, -width / 6],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  const opacityRight = translateX.interpolate({
    inputRange: [startFadeDistance, startFadeDistance * 2],
    outputRange: [0, 0.8],
    extrapolate: 'clamp',
  });

  const scaleRight = translateX.interpolate({
    inputRange: [width / 6, width],
    outputRange: [0.7, 1],
    extrapolate: 'clamp',
  });

  return (
    <>
      {/* Left Swipe Overlay (Decline) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.overlay,
          // Set background color to D9043D with 0.8 opacity
          { backgroundColor: '#D9043D80', opacity: opacityLeft },
        ]}
      >
        <Animated.View style={[styles.content, { transform: [{ scale: scaleLeft }] }]}>
          {/* Use the NoIcon PNG */}
          <Image source={NoIcon} style={styles.overlayIcon} resizeMode="contain" />
          {/* Change text to "Decline" */}
          <Text style={styles.text}>Decline</Text>
        </Animated.View>
      </Animated.View>

      {/* Right Swipe Overlay (RSVP) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.overlay,
          // Set background color to D9B779 with 0.8 opacity
          { backgroundColor: '#D9B77980', opacity: opacityRight },
        ]}
      >
        <Animated.View style={[styles.content, { transform: [{ scale: scaleRight }] }]}>
          {/* Use the WaveIcon PNG */}
          <Image source={WaveIcon} style={styles.overlayIcon} resizeMode="contain" />
          {/* Change text to "RSVP" */}
          <Text style={styles.text}>RSVP</Text>
        </Animated.View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 10,
  },
  overlayIcon: { // New style for your PNG icons
    width: 80, // Adjust as needed
    height: 80, // Adjust as needed
  },
});

export default SwipeOverlay;