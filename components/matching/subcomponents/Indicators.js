import React from 'react';
import { View, StyleSheet } from 'react-native';

const Indicators = ({ event, currentImageIndex }) => (
  <View style={styles.indicatorContainer}>
    {event.images.map((_, index) => (
      <View
        key={index}
        style={{
          ...styles.indicator,
          width: `${60 / event.images.length}%`,
          backgroundColor: index === currentImageIndex ? '#D9043D' : '#730220',
        }}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
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
});

export default Indicators;
