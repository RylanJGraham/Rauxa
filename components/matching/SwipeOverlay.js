import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import WaveIcon from '../../assets/matching/wave.png'; // Make sure paths are correct
import NoIcon from '../../assets/matching/No.png';   // Make sure paths are correct

const { width, height } = Dimensions.get('window'); // Get full width AND height

const SwipeOverlay = ({ translateX }) => {
  // Background opacity for "NO" (red) - increases as you swipe left
  const rejectBgOpacity = translateX.interpolate({
    inputRange: [-width / 2, 0], // From -width/2 (full opacity) to 0 (transparent)
    outputRange: [0.7, 0], // Max opacity 0.7 for background to still see content
    extrapolate: 'clamp',
  });

  // Background opacity for "YES" (blue) - increases as you swipe right
  const acceptBgOpacity = translateX.interpolate({
    inputRange: [0, width / 2], // From 0 (transparent) to width/2 (full opacity)
    outputRange: [0, 0.7], // Max opacity 0.7 for background
    extrapolate: 'clamp',
  });

  // Opacity for the "NO" indicator (icon and text)
  const rejectOpacity = translateX.interpolate({
    inputRange: [-width / 4, 0], // Fades in when swiping left
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Scale for "NO" indicator
  const rejectScale = translateX.interpolate({
    inputRange: [-width / 2, -width / 4, 0],
    outputRange: [1.2, 1, 0.8], // Slightly scales up as it becomes more visible
    extrapolate: 'clamp',
  });

  // Opacity for the "YES" indicator (icon and text)
  const acceptOpacity = translateX.interpolate({
    inputRange: [0, width / 4], // Fades in when swiping right
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Scale for "YES" indicator
  const acceptScale = translateX.interpolate({
    inputRange: [0, width / 4, width / 2],
    outputRange: [0.8, 1, 1.2], // Slightly scales up as it becomes more visible
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      {/* Full-screen animated background for NO (red) */}
      <Animated.View
        style={[
          styles.fullScreenBg,
          { backgroundColor: '#34394C', opacity: rejectBgOpacity }, // <--- Changed background color here
        ]}
      />
      {/* Full-screen animated background for YES (blue) */}
      <Animated.View
        style={[
          styles.fullScreenBg,
          { backgroundColor: 'rgba(52, 152, 219, 0.5)', opacity: acceptBgOpacity },
        ]}
      />

      {/* "NO" Indicator (centered, only its opacity and scale animate) */}
      <Animated.View
        style={[
          styles.indicatorCentered,
          { opacity: rejectOpacity, transform: [{ scale: rejectScale }, { translateX: -60 }, { translateY: -60 }] },
        ]}
      >
        <Image source={NoIcon} style={styles.indicatorImage} contentFit="contain" />
        <Text style={styles.indicatorText}>NO</Text>
      </Animated.View>

      {/* "YES" Indicator (centered, only its opacity and scale animate) */}
      <Animated.View
        style={[
          styles.indicatorCentered,
          { opacity: acceptOpacity, transform: [{ scale: acceptScale }, { translateX: -60 }, { translateY: -60 }] },
        ]}
      >
        <Image source={WaveIcon} style={styles.indicatorImage} contentFit="contain" />
        <Text style={styles.indicatorText}>YES</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  fullScreenBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  indicatorCentered: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 120,
    height: 120,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorImage: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  indicatorText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
});

export default SwipeOverlay;