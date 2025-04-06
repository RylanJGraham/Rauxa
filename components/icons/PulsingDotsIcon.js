import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

const LiquidDotAnimation = ({ color, focused }) => {
  // Create animated values for the position and scale of the dots
  const dot1Position = useRef(new Animated.Value(0)).current; // Dot 1 (center)
  const dot2Position = useRef(new Animated.Value(30)).current; // Dot 2 (above), initially moved up
  const scaleDot1 = useRef(new Animated.Value(1)).current; // Scale for Dot 1
  const scaleDot2 = useRef(new Animated.Value(1)).current; // Scale for Dot 2

  useEffect(() => {
    const liquidAnimation = () => {
      // Phase 1: Start with the central dot
      Animated.timing(dot1Position, {
        toValue: 0, // Dot remains at center
        duration: 1000,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();

      // Phase 2: The second dot rises after 1 second and scales up as it connects with the first dot
      Animated.sequence([
        Animated.delay(1000), // Delay the second dot for 1 second
        Animated.timing(dot2Position, {
          toValue: 0, // Move the second dot to the position directly above dot 1
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scaleDot1, {
          toValue: 1.3, // Slightly scale up dot1 to emphasize the connection
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleDot2, {
          toValue: 1.3, // Slightly scale up dot2
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    };

    liquidAnimation(); // Run the animation once

    // Loop the animation for a continuous effect
    const interval = setInterval(() => {
      liquidAnimation();
    }, 3000); // Loop every 3 seconds

    return () => clearInterval(interval); // Cleanup the interval when component unmounts
  }, []);

  return (
    <View style={styles.container}>
      {/* Central dot */}
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: focused ? '#0367A6' : color,
            transform: [{ translateY: dot1Position }],
            transform: [{ scale: scaleDot1 }],
          },
        ]}
      />
      {/* Second dot above the first one */}
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: focused ? '#0367A6' : color,
            transform: [{ translateY: dot2Position }],
            transform: [{ scale: scaleDot2 }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute', // Position the dots on top of each other
  },
});

export default LiquidDotAnimation;
