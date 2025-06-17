import React, { useState } from 'react';
import { Modal, View, TextInput, ScrollView, TouchableOpacity, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Image } from 'expo-image'; // Use expo-image

const API_KEY = '43686627-bea5035c6ed71178e9b835cb9';

const PixabayModal = ({ visible, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchImages = async () => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=20&orientation=horizontal`); // Increased per_page, horizontal orientation
      if (res.data.hits.length === 0) {
        setError("No images found for this query.");
        setResults([]);
      } else {
        setResults(res.data.hits);
      }
    } catch (err) {
      console.error('Pixabay API error:', err);
      setError("Failed to fetch images. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-circle-outline" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Search Pixabay Images</Text>

          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search for images..."
              placeholderTextColor="#aaa"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={fetchImages}
              style={styles.input}
            />
            <TouchableOpacity onPress={fetchImages} style={styles.searchButton}>
              <Ionicons name="search" size={24} color="#1A1A2E" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#F2BB47" style={styles.loadingIndicator} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.grid}>
              {results.map((img) => (
                <TouchableOpacity key={img.id} onPress={() => { onSelect(img.webformatURL); }}>
                  <Image
                    source={{ uri: img.previewURL }}
                    style={styles.thumb}
                    placeholderContent={<ActivityIndicator size="small" color="#0367A6" />}
                    contentFit="cover"
                    transition={150}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)', // Darker background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1A1A2E', // Main dark background
    borderRadius: 20,
    padding: 20,
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
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    backgroundColor: '#2C2C47', // Darker input background
    color: 'white',
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    borderRadius: 10,
    marginRight: -1, // Overlap for seamless look with button
  },
  searchButton: {
    backgroundColor: '#F2BB47', // Gold button
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  loadingIndicator: {
    marginTop: 30,
  },
  errorText: {
    color: '#D9043D', // Red for errors
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  thumb: {
    width: 90, // Slightly smaller thumbnails for more per row
    height: 90,
    margin: 6,
    borderRadius: 10, // More rounded
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', // Subtle border
  },
});

export default PixabayModal;