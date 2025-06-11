import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, Image, StyleSheet, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Dimensions is not used directly for gallery sizing inside the modal,
// as the screenWidth prop is passed from the parent.
// const { width } = Dimensions.get('window');

const GallerySection = ({ photos, setPhotos, currentImageIndex, setCurrentImageIndex, handlePickImage, setIsPixabayModalVisible, screenWidth, onCloseGallery }) => {
  // Use the screenWidth prop to calculate the dynamic width for the gallery images
  const galleryImageWidth = screenWidth - 20; // Account for the margin applied in EventDetailsModal's image style

  return (
    <>
      <View style={[styles.galleryContainer, { width: screenWidth }]}> {/* Use screenWidth for container width */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            // Use galleryImageWidth for calculation to ensure correct pagination
            const index = Math.floor(event.nativeEvent.contentOffset.x / galleryImageWidth);
            setCurrentImageIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {photos.map((uri, index) => (
            <View key={index} style={[styles.imageWrapper, { width: galleryImageWidth }]}> {/* Apply dynamic width */}
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  const newPhotos = [...photos];
                  newPhotos.splice(index, 1);
                  setPhotos(newPhotos);
                  if (currentImageIndex >= newPhotos.length && newPhotos.length > 0) {
                    setCurrentImageIndex(newPhotos.length - 1);
                  } else if (newPhotos.length === 0) {
                    setCurrentImageIndex(0);
                  }
                }}
              >
                <Ionicons name="close-circle" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Close Button positioned at top-left of the gallery container */}
        <TouchableOpacity style={styles.closeButtonGallery} onPress={onCloseGallery}>
          <Ionicons name="close-circle" size={40} color="white" />
        </TouchableOpacity>

        <View style={styles.paginationDotsContainer}>
          {photos.map((_, i) => (
            <View
              key={i}
              style={[styles.indicator, currentImageIndex === i && styles.activeIndicator]}
            />
          ))}
        </View>
      </View>

      <View style={styles.thumbnailAndButtonsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailsScroll}>
          {photos.map((uri, index) => (
            <View key={index} style={styles.thumbnailWrapper}>
              <Image source={{ uri }} style={styles.thumbnail} />

              {index > 0 && (
                <TouchableOpacity
                  style={[styles.arrowButton, styles.leftArrow]}
                  onPress={() => {
                    const newPhotos = [...photos];
                    [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];
                    setPhotos(newPhotos);
                    setCurrentImageIndex(index - 1);
                  }}
                >
                  <Ionicons name="arrow-back-circle" size={18} color="#fff" />
                </TouchableOpacity>
              )}

              {index < photos.length - 1 && (
                <TouchableOpacity
                  style={[styles.arrowButton, styles.rightArrow]}
                  onPress={() => {
                    const newPhotos = [...photos];
                    [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];
                    setPhotos(newPhotos);
                    setCurrentImageIndex(index + 1);
                  }}
                >
                  <Ionicons name="arrow-forward-circle" size={18} color="#fff" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setCurrentImageIndex(index)}
                style={[
                  styles.thumbnailTouchable,
                  currentImageIndex === index && styles.activeThumbnailBorder,
                  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
                ]}
              />
            </View>
          ))}
        </ScrollView>

        <View style={styles.iconButtonsRow}>
          <TouchableOpacity style={styles.iconButton} onPress={handlePickImage}>
            <Ionicons name="cloud-upload-outline" size={28} color="#fff" />
            <Text style={styles.iconButtonText}>Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              if (photos.length >= 3) {
                  Alert.alert("Photo Limit", "You can only add a maximum of 3 photos.");
                  return;
              }
              setIsPixabayModalVisible(true);
            }}
          >
            <Ionicons name="images-outline" size={28} color="#fff" />
            <Text style={styles.iconButtonText}>Pixabay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  // New style for the close button within the gallery
  closeButtonGallery: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 2,
    zIndex: 11,
  },
  galleryContainer: {
    // Height is now 250, matching EventDetailsModal
    height: 250,
    position: 'relative',
    borderRadius: 15, // Added borderRadius for consistency with EventDetailsModal gallery
    overflow: 'hidden', // Added overflow for consistency with EventDetailsModal gallery
    marginHorizontal: 0, // Removed marginHorizontal as it's handled by image width
  },
  imageWrapper: {
    // Width is now set dynamically by `galleryImageWidth`
    // Height is now 250, matching EventDetailsModal
    height: 250,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 15, // Changed to 15 to match EventDetailsModal
  },
  removeButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 2,
    zIndex: 10,
  },
  paginationDotsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: '#666',
  },
  activeIndicator: {
    backgroundColor: '#F2BB47',
  },
  thumbnailAndButtonsContainer: {
    flexDirection: 'row',
    backgroundColor: '#730220',
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thumbnailsScroll: {
    flexGrow: 0,
    flex: 1,
  },
  thumbnailTouchable: {
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeThumbnailBorder: {
    borderWidth: 2,
    borderColor: '#F2BB47',
  },
  thumbnailWrapper: {
    position: 'relative',
    marginHorizontal: 4,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    resizeMode: 'cover',
    backgroundColor: '#000',
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 2,
  },
  leftArrow: {
    left: 2,
  },
  rightArrow: {
    right: 2,
  },
  iconButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  iconButton: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  iconButtonText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default GallerySection;