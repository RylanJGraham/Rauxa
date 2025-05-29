import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const SwipeOverlay = ({ translateX }) => {
  // Interpolate opacity based on swipe distance for left (red) and right (green)

  const startFadeDistance = width / 6;  // smaller fraction for earlier start

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
      {/* Left Swipe Overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.overlay,
          { backgroundColor: 'rgba(231, 76, 60, 0.8)', opacity: opacityLeft },
        ]}
      >
        <Animated.View style={[styles.content, { transform: [{ scale: scaleLeft }] }]}>
          <Feather name="x" size={80} color="white" />
          <Text style={styles.text}>Pass</Text>
        </Animated.View>
      </Animated.View>

      {/* Right Swipe Overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.overlay,
          { backgroundColor: 'rgba(46, 204, 113, 0.8)', opacity: opacityRight },
        ]}
      >
        <Animated.View style={[styles.content, { transform: [{ scale: scaleRight }] }]}>
          <Feather name="check" size={80} color="white" />
          <Text style={styles.text}>Like</Text>
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
});

export default SwipeOverlay;
