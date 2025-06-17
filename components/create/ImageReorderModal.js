// components/create/ImageReorderModal.js
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const { width: screenWidth } = Dimensions.get('window');

const ImageReorderModal = ({ isVisible, onClose, photos, setPhotos }) => {
  const [tempPhotos, setTempPhotos] = useState([]);

  useEffect(() => {
    if (isVisible) {
      setTempPhotos([...photos]); // Initialize with a copy of current photos
    }
  }, [isVisible, photos]);

  const handleMovePhoto = useCallback((currentIndex, direction) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < tempPhotos.length) {
      const newArr = [...tempPhotos];
      const [movedItem] = newArr.splice(currentIndex, 1);
      newArr.splice(newIndex, 0, movedItem);
      setTempPhotos(newArr);
    }
  }, [tempPhotos]);

  const handleRemovePhoto = useCallback((indexToRemove) => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          onPress: () => {
            const newArr = tempPhotos.filter((_, i) => i !== indexToRemove);
            setTempPhotos(newArr);
          },
          style: "destructive",
        },
      ]
    );
  }, [tempPhotos]);


  const handleSaveOrder = () => {
    if (tempPhotos.length < 3) {
      Alert.alert("Photo Requirement", "You need at least 3 photos for your event. Please add more or keep the existing ones.");
      return;
    }
    setPhotos(tempPhotos); // Save the reordered/removed photos back to parent state
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle-outline" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Reorder & Manage Photos</Text>

          {tempPhotos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="image-outline" size={60} color="#888" />
              <Text style={styles.emptyStateText}>No photos to reorder yet.</Text>
              <Text style={styles.emptyStateSubText}>Add photos using the 'Add Image' button first.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.imageGrid}>
              {tempPhotos.map((uri, index) => (
                <View key={uri + index} style={styles.imageCard}>
                  <Image
                    source={{ uri }}
                    style={styles.imagePreview}
                    placeholderContent={<ActivityIndicator size="small" color="#F2BB47" />}
                    contentFit="cover"
                    transition={150}
                  />
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <Ionicons name="trash-outline" size={22} color="#D9043D" />
                    </TouchableOpacity>

                    <View style={styles.reorderButtons}>
                      <TouchableOpacity
                        style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                        onPress={() => handleMovePhoto(index, -1)}
                        disabled={index === 0}
                      >
                        <Ionicons name="chevron-back" size={20} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.reorderButton, index === tempPhotos.length - 1 && styles.reorderButtonDisabled]}
                        onPress={() => handleMovePhoto(index, 1)}
                        disabled={index === tempPhotos.length - 1}
                      >
                        <Ionicons name="chevron-forward" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveOrder}>
            <Text style={styles.saveButtonText}>Save Order & Photos ({tempPhotos.length}/3)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  modalView: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 25,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#ccc',
    fontSize: 18,
    marginTop: 15,
    fontWeight: '500',
  },
  emptyStateSubText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  imageCard: {
    width: (screenWidth * 0.90 / 2) - 20, // Roughly two columns with some margin
    margin: 8,
    backgroundColor: '#2C2C47', // Darker background for each card
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  imagePreview: {
    width: '100%',
    height: 120, // Fixed height for preview
    resizeMode: 'cover',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 10,
  },
  actionButton: {
    padding: 5,
  },
  reorderButtons: {
    flexDirection: 'row',
  },
  reorderButton: {
    backgroundColor: '#0367A6', // Blue accent
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 3,
  },
  reorderButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.6,
  },
  saveButton: {
    backgroundColor: '#F2BB47', // Gold accent
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginTop: 20,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  saveButtonText: {
    color: '#1A1A2E', // Dark text on gold button
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ImageReorderModal;