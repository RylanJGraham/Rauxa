import React, { useState } from 'react';
import { Modal, View, TextInput, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_KEY = '43686627-bea5035c6ed71178e9b835cb9';

const PixabayModal = ({ visible, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const fetchImages = async () => {
    if (!query) return;
    const res = await axios.get(`https://pixabay.com/api/?key=${API_KEY}&q=${query}&image_type=photo&per_page=10`);
    setResults(res.data.hits);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <TouchableOpacity onPress={onClose} style={styles.close}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        <TextInput
          placeholder="Search Pixabay..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={fetchImages}
          style={styles.input}
        />
        <ScrollView contentContainerStyle={styles.grid}>
          {results.map((img) => (
            <TouchableOpacity key={img.id} onPress={() => { onSelect(img.webformatURL); onClose(); }}>
              <Image source={{ uri: img.previewURL }} style={styles.thumb} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center' },
  close: { position: 'absolute', top: 40, right: 20 },
  input: { marginTop: 100, backgroundColor: 'white', borderRadius: 5, width: '80%', padding: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 },
  thumb: { width: 100, height: 100, margin: 5, borderRadius: 5 },
});

export default PixabayModal;
