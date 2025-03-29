import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const UniversitySelector = ({ initialValue, onSelectUniversity }) => {
  const [query, setQuery] = useState('');
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(initialValue || '');
  const [universityImage, setUniversityImage] = useState(null);

  // Fetch university image from Wikimedia Commons
  const getUniversityImage = async (universityName) => {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(universityName)}&prop=pageimages&format=json&pithumbsize=100&origin=*`
      );
      const data = await response.json();
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      return pages[pageId].thumbnail?.source || null;
    } catch (error) {
      console.error("Error fetching image:", error);
      return null;
    }
  };

  useEffect(() => {
    if (selectedUniversity) {
      getUniversityImage(selectedUniversity).then(setUniversityImage);
    } else {
      setUniversityImage(null);
    }
  }, [selectedUniversity]);

  useEffect(() => {
    if (query.length < 3) {
      setUniversities([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      fetchUniversities(query);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const fetchUniversities = async (searchText) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://universities.hipolabs.com/search?name=${encodeURIComponent(searchText)}`
      );
      if (!response.ok) throw new Error("Failed to fetch universities");
      const data = await response.json();
      setUniversities(data.slice(0, 20));
    } catch (err) {
      setError("Couldn't load universities. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (university) => {
    setSelectedUniversity(university.name);
    onSelectUniversity(university);
    setQuery('');
    setUniversities([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Search your university..."
          value={query}
          onChangeText={setQuery}
          style={styles.input}
        />
        {loading && <ActivityIndicator style={styles.loader} />}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {!selectedUniversity && universities.length > 0 && (
        <FlatList
          data={universities}
          keyExtractor={(item) => `${item.name}-${item.country}`}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.item} 
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.itemText}>{item.name}</Text>
              <Text style={styles.countryText}>{item.country}</Text>
            </TouchableOpacity>
          )}
          style={styles.list}
        />
      )}

      {selectedUniversity && (
        <View style={styles.selectedContainer}>
          {universityImage && (
            <Image 
              source={{ uri: universityImage }} 
              style={styles.universityImage}
            />
          )}
          <Text style={styles.selectedText}>{selectedUniversity}</Text>
          <TouchableOpacity onPress={() => {
            setSelectedUniversity('');
            setUniversityImage(null);
            onSelectUniversity({ name: '' });
          }}>
            <FontAwesome name="times" size={16} color="#D9043D" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#F2BB47',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#00000040',
    color: 'white',
  },
  loader: {
    marginLeft: 10,
  },
  error: {
    color: '#D9043D',
    marginTop: 5,
    fontSize: 12,
  },
  list: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#F2BB47',
    borderRadius: 8,
    marginTop: 5,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  itemText: {
    color: 'white',
    fontSize: 14,
  },
  countryText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#00000040',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F2BB47',
  },
  selectedText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    marginLeft: 10,
  },
  universityImage: {
    width: 30,
    height: 30,
    borderRadius: 4,
  },
});

export default UniversitySelector;