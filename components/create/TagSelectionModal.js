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
          <Text style={styles.modalHeading}>Select Tags</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#F2BB47" />
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
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalView: {
    backgroundColor: '#0367A6',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    paddingBottom: 10, // Ensure scrollability
  },
  tag: {
    backgroundColor: '#A6B1C4',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTag: {
    backgroundColor: '#F2BB47',
    borderColor: 'white',
  },
  tagText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#D9043D',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#F2BB47',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default TagSelectionModal;