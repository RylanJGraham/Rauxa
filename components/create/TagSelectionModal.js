import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path if your firebase.js is not in root

const TagSelectionModal = ({
  isVisible,
  onClose,
  selectedTags, // Current selected tags array
  onSaveTags,   // Callback to save selected tags
}) => {
  const [allTags, setAllTags] = useState([]);
  const [tempSelectedTags, setTempSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        setError(null);
        const tagsDocRef = doc(db, 'tags', 'elements'); // Path to your tags document
        const docSnap = await getDoc(tagsDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.list)) {
            setAllTags(data.list);
          } else {
            setError("Tags data not found or is not an array.");
            setAllTags([]);
          }
        } else {
          setError("Tags document not found.");
          setAllTags([]);
        }
      } catch (err) {
        console.error("Error fetching tags:", err);
        setError("Failed to load tags. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (isVisible) {
      fetchTags();
      setTempSelectedTags(selectedTags); // Initialize temp with current selected tags
    }
  }, [isVisible, selectedTags]);

  const toggleTag = useCallback((tag) => {
    setTempSelectedTags((prevTags) => {
      if (prevTags.includes(tag)) {
        return prevTags.filter((t) => t !== tag);
      } else {
        return [...prevTags, tag];
      }
    });
  }, []);

  const handleSave = () => {
    onSaveTags(tempSelectedTags);
    onClose();
  };

  return (
    <Modal
      animationType="fade" // Changed to fade for smoother transition
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle-outline" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.modalHeading}>Select Event Tags</Text> {/* More descriptive title */}

          {loading ? (
            <ActivityIndicator size="large" color="#F2BB47" style={styles.loadingIndicator} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.tagsContainer}>
              {allTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.tag,
                    tempSelectedTags.includes(tag) && styles.selectedTag,
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Tags</Text>
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
    backgroundColor: 'rgba(0,0,0,0.85)', // Consistent dark overlay
  },
  modalView: {
    backgroundColor: '#1A1A2E', // Main dark background
    borderRadius: 20,
    padding: 25, // Increased padding
    width: '90%',
    maxHeight: '80%',
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
  modalHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 25, // Increased margin
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    paddingBottom: 10,
  },
  tag: {
    backgroundColor: '#0367A6', // Blue accent for unselected
    borderRadius: 25, // More rounded pills
    paddingVertical: 10,
    paddingHorizontal: 18,
    margin: 6, // Slightly increased margin
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTag: {
    backgroundColor: '#F2BB47', // Gold accent for selected
    borderColor: 'white', // White border for selected
  },
  tagText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600', // Slightly bolder
  },
  saveButton: {
    backgroundColor: '#D9043D', // Red accent
    borderRadius: 30, // More rounded
    paddingVertical: 14, // Increased padding
    paddingHorizontal: 40,
    marginTop: 20, // Increased margin
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingIndicator: {
    marginTop: 30,
    marginBottom: 20,
  },
  errorText: {
    color: '#F2BB47', // Gold for error text
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default TagSelectionModal;