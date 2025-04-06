
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Image, TouchableOpacity, StyleSheet } from 'react-native';

const ImageDisplay = ({ event, currentImageIndex, isLoading, setIsLoading, handlePrevImage, handleNextImage }) => {

    useEffect(() => {
        console.log(event.images); // Log to check the images array
        if (currentImageIndex < event.images.length - 1) {
          Image.prefetch(event.images[currentImageIndex + 1]);
        }
      }, [currentImageIndex]);
      
    return (
      <View style={styles.imageContainer}>
        <TouchableOpacity
          style={styles.imageContainer}
          onPressIn={handlePrevImage}
          onPressOut={handleNextImage}
        >
          <Image
            source={{ uri: event.images[currentImageIndex] }}
            style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
            onLoadEnd={() => setIsLoading(false)}
          />
        </TouchableOpacity>
  
        {isLoading && <ActivityIndicator size="large" color="white" style={styles.loader} />}
      </View>
    );
  };

  const styles = StyleSheet.create({
    imageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',  // Ensure the container has height
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
  });
  

export default ImageDisplay;
