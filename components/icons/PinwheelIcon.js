import React, { useRef, useEffect } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // For Ionicons
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'; // For MaterialCommunityIcons

const SpinningIcons = ({ color }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotate the whole gallery along the Y-axis and adjust depth (scale)
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'], // Rotation degrees
  });

  const icons = [
    <Icon key="music" name="musical-notes" size={30} color={color} />, // Ionicons music icon
    <MaterialIcon key="sport" name="soccer" size={30} color={color} />, // MaterialCommunityIcon sport icon
    <Icon key="location" name="location-outline" size={30} color={color} />, // Ionicons location icon (valid)
    // Add more icons here as needed
  ];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ rotateY: rotate }],
          perspective: 800, // Add perspective to create the 3D effect
        },
      ]}>
      {icons.map((icon, index) => {
        // Calculating angle for each icon along the X-axis for the circular path
        const angle = (index / icons.length) * 360;
        const rotateAngle = `${angle}deg`;

        // Adjust scale for the 3D effect
        const scale = 1 + 0.5 * Math.sin((angle * Math.PI) / 180); // Use sin to create a depth effect

        return (
          <Animated.View
            key={index}
            style={[
              styles.iconWrapper,
              {
                transform: [
                  { rotateY: rotateAngle }, // Rotate around the Y-axis for a circle
                  { translateX: 50 }, // Move along the X-axis (radius of the circle)
                  { scale }, // Apply scale based on depth
                ],
              },
            ]}
          >
            {icon}
          </Animated.View>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    // Perspective added to create 3D effect
  },
  iconWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 30, // Adjust size of each icon
    height: 30, // Adjust size of each icon
    marginTop: -15, // Centering the icon
    marginLeft: -15, // Centering the icon
  },
});

export default SpinningIcons;
