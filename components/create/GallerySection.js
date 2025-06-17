import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const GallerySection = ({
  photos,
  setPhotos,
  currentImageIndex,
  setCurrentImageIndex,
  screenWidth, // This now represents the width of the parent modal's content area
  onOpenImagePickerOptions,
  onOpenImageReorderModal,
}) => {
  // Use screenWidth directly for image and container width
  const imageDisplayWidth = screenWidth; // This will be the content width of the modal itself

  const getEmptyMessage = () => {
    if (photos.length === 0) return "Add at least 3 photos to showcase your event.";
    if (photos.length < 3) return `Add ${3 - photos.length} more photo(s).`;
    return "";
  };

  const emptyMessage = getEmptyMessage();

  const handleRemovePhoto = (indexToRemove) => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          onPress: () => {
            const newPhotos = photos.filter((_, i) => i !== indexToRemove);
            setPhotos(newPhotos);
            if (newPhotos.length === 0) {
              setCurrentImageIndex(0);
            } else if (indexToRemove === currentImageIndex) {
              setCurrentImageIndex(Math.max(0, indexToRemove - 1));
            } else if (indexToRemove < currentImageIndex) {
              setCurrentImageIndex(currentImageIndex - 1);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <>
      <View style={[styles.galleryContainer, { width: imageDisplayWidth }]}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / imageDisplayWidth);
            setCurrentImageIndex(index);
          }}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / imageDisplayWidth);
            setCurrentImageIndex(index);
          }}
        >
          {photos.length === 0 ? (
            <View style={[styles.emptyImagePlaceholder, { width: imageDisplayWidth }]}>
              <Ionicons name="images-outline" size={80} color="#888" />
              <Text style={styles.emptyImageText}>{emptyMessage}</Text>
            </View>
          ) : (
            photos.map((uri, index) => (
              <View key={uri + index} style={[styles.imageWrapper, { width: imageDisplayWidth }]}>
                <Image
                  source={{ uri }}
                  style={styles.image}
                  placeholderContent={<ActivityIndicator size="small" color="#F2BB47" />}
                  contentFit="cover"
                  transition={300}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <Ionicons name="close-circle" size={32} color="#D9043D" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {photos.length > 0 && (
          <View style={styles.paginationDotsContainer}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={[styles.indicator, currentImageIndex === i && styles.activeIndicator]}
              />
            ))}
          </View>
        )}
      </View>

      {/* The bottomButtonsContainer now directly follows the gallery and holds the action buttons */}
      <View style={[styles.bottomButtonsContainer, { width: imageDisplayWidth }]}>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onOpenImagePickerOptions}
          >
            <Ionicons name="add-circle-outline" size={28} color="#fff" />
            <Text style={styles.actionButtonText}>Add Photo</Text>
          </TouchableOpacity>

          {photos.length > 1 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onOpenImageReorderModal}
            >
              <Ionicons name="swap-vertical-outline" size={28} color="#fff" />
              <Text style={styles.actionButtonText}>Reorder</Text>
            </TouchableOpacity>
          )}

          {photos.length > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert(
                  "Remove All Photos",
                  "Are you sure you want to remove all photos?",
                  [
                      { text: "Cancel", style: "cancel" },
                      { text: "Remove All", onPress: () => { setPhotos([]); setCurrentImageIndex(0); }, style: "destructive" }
                  ]
              )}
          >
              <Ionicons name="trash-outline" size={28} color="#D9043D" />
              <Text style={[styles.actionButtonText, { color: '#D9043D' }]}>Remove All</Text>
          </TouchableOpacity>
          )}
        </View>
        {emptyMessage.length > 0 && photos.length > 0 && (
          <Text style={styles.requirementText}>{emptyMessage}</Text>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  galleryContainer: {
    height: 250,
    position: 'relative',
    borderTopLeftRadius: 15, // Only top-left rounded
    borderTopRightRadius: 15, // Only top-right rounded
    borderBottomLeftRadius: 0, // No rounding on bottom-left
    borderBottomRightRadius: 0, // No rounding on bottom-right
    overflow: 'hidden',
    marginTop: 20, // Retain top margin
    marginBottom: 0, // Removed bottom margin to connect to the next container
    alignSelf: 'center',
    backgroundColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  emptyImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C47',
    height: '100%',
    borderRadius: 15, // Keep internal placeholder rounded if desired
    paddingHorizontal: 20,
  },
  emptyImageText: {
    color: '#ccc',
    marginTop: 15,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  imageWrapper: {
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    // The image itself will respect the parent's border radius
  },
  removeButton: {
    position: 'absolute',
    top: 10,
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
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeIndicator: {
    backgroundColor: '#F2BB47',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bottomButtonsContainer: {
    backgroundColor: '#000', // Black background
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    borderTopLeftRadius: 0, // Ensure no top rounding
    borderTopRightRadius: 0, // Ensure no top rounding
    paddingBottom: 15,
    marginTop: 0, // Important: removed negative margin to be flush
    alignSelf: 'center',
    paddingHorizontal: 0,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    // The borderTop is fine as it acts as a separator line within the black container
    // No marginTop here as it's directly in the container with marginTop: 0
    paddingHorizontal: 15,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    marginTop: 5,
    fontWeight: '600',
  },
  requirementText: {
    color: '#F2BB47',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default GallerySection;