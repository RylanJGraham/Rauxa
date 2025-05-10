import React, { useState } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet, Image, ScrollView, FlatList, Dimensions, Modal } from 'react-native';
import { db, storage } from '../firebase'; // Assuming you have your firebase setup
import { collection, addDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient
import { useNavigation } from '@react-navigation/native'; // Import useNavigation for navigation
import { Ionicons } from '@expo/vector-icons'; // Import back button icon
import EditableFieldEvent from '../components/particles/EditableFieldEvent'; // Adjust path as needed
import EditableDateTimeRow from '../components/particles/EditableDateTimeRow';
import axios from 'axios';
import { useRoute } from "@react-navigation/native";


const { width } = Dimensions.get('window'); // Get screen width

const CreateMeetupScreen = () => {
  const route = useRoute();
  const { mode, eventData } = route.params || {};

  const [title, setTitle] = useState(eventData?.title || '');
  const [date, setDate] = useState(eventData?.date ? new Date(eventData.date) : new Date());
  const [time, setTime] = useState(eventData?.time || '');
  const [groupSize, setGroupSize] = useState(eventData?.groupSize?.toString() || '');
  const [location, setLocation] = useState(eventData?.location || '');
  const [tags, setTags] = useState(eventData?.tags || []);
  const [photos, setPhotos] = useState(
    eventData?.photos?.length ? eventData.photos : [require('../assets/default.jpg')]
  );
  const [isPixabayModalVisible, setIsPixabayModalVisible] = useState(false);
  const [pixabaySearch, setPixabaySearch] = useState('');
  const [pixabayImages, setPixabayImages] = useState([]);

  const [activeIndex, setActiveIndex] = useState(0);

  const fetchPixabayImages = async (query) => {
    if (!query) return;
    
    try {
      const response = await axios.get(`https://pixabay.com/api/`, {
        params: {
          key: '43686627-bea5035c6ed71178e9b835cb9',  // Replace with your actual API key
          q: query,
          image_type: 'photo',
          per_page: 10,
        },
      });
  
      setPixabayImages(response.data.hits);
    } catch (error) {
      console.error("Error fetching Pixabay images:", error);
      alert('Error fetching images. Please try again.');
    }
  };


  const navigation = useNavigation(); // Initialize the navigation hook

  const [editModes, setEditModes] = useState({
    title: false,
    date: true, // Keep date always editable
    time: true,  // Keep time always editable
    groupSize: false,
    location: false,
  });

  const toggleEditMode = (field) => {
    setEditModes((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newPhotoUri = result.assets[0].uri;
      setPhotos([newPhotoUri]); // Update photos with selected image
    }
  };

  // Function to handle form submission
  const handleSubmit = async () => {
    if (!title || !date || !location) {
      alert('Please fill in all required fields.');
      return;
    } else {
      console.log("Submitting the meetup details:");
      console.log("Title: ", title);
      console.log("Date: ", date);
      console.log("Time: ", time);
      console.log("Group Size: ", groupSize);
      console.log("Location: ", location);
      console.log("Tags: ", tags);

      try {
        // Upload photos to Firebase Storage (Optional)
        const photoUrls = [];
        for (let photo of photos) {
          const response = await fetch(photo);
          const blob = await response.blob();
          const ref = storage.ref().child(`meetups/${Date.now()}.jpg`);
          await ref.put(blob);
          const photoUrl = await ref.getDownloadURL();
          photoUrls.push(photoUrl);
        }

        // Save meetup details to Firestore
        await addDoc(collection(db, "meetups"), {
          title,
          date,
          time,
          groupSize: parseInt(groupSize),
          location,
          tags,
          photos: photoUrls,
        });

        alert('Meetup created successfully!');
      } catch (error) {
        console.error("Error creating meetup:", error);
        alert('Error creating meetup. Please try again.');
      }
    }
  };

  // Handle tag selection (Example: hardcoded tags)
  const handleTagSelect = (tag) => {
    setTags((prevTags) =>
      prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]
    );
  };

   // Function to handle image delete
   const handleImageDelete = (index) => {
    // Prevent deletion if the image is the default image
    if (photos[index] === require('../assets/default.jpg')) {
      return;
    }
    
    setPhotos((prevPhotos) => {
      const newPhotos = [...prevPhotos];
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };
  return (
    <LinearGradient
      colors={["#D9043D", "#730220"]} // Gradient colors
      style={styles.container} // Apply gradient as background
    >
      
      <ScrollView contentContainerStyle={styles.innerContainer}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()} // Go back to previous screen
        >
          <Ionicons name="arrow-back" size={30} color="white" />
        </TouchableOpacity>

        {/* Conditional Upload Button */}
        {photos.length === 0 && (
          <TouchableOpacity onPress={pickImage} style={styles.uploadButtonAbove}>
            <Ionicons name="cloud-upload" size={24} color="white" />
          </TouchableOpacity>
        )}

        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          <FlatList
            data={photos} // Use the photos array for the image gallery
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (width * 0.8));
              setActiveIndex(index); // Update active image index
            }}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.imageContainer}>
                <Image
                  source={typeof item === 'string' ? { uri: item } : item} // Check if it's URI or local image
                  style={styles.profileImage}
                  onError={() => console.error('Error loading image:', item)}
                />

                {/* X Delete Button */}
                {item !== require('../assets/default.jpg') && (  // Only show delete button if it's not the default image
                  <View style={styles.deleteIconWrapper}>
                    <LinearGradient colors={["#F2BB47", "#D9043D"]} style={styles.addIconButton}>
                      <TouchableOpacity onPress={() => handleImageDelete(index)}>
                        <Ionicons name="close" size={20} color="#fff" />
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                )}
              </View>
            )}
          />
          {/* Image Indicators */}
          <View style={styles.indicatorContainer}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={{
                  ...styles.indicator,
                  width: `${60 / photos.length}%`,
                  backgroundColor: index === activeIndex ? '#D9043D' : '#730220',
                }}
              />
            ))}
          </View>

          {/* Upload Button Positioned Inside Gallery when Photos Exist */}
          {photos.length > 0 && (
            <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
              <Ionicons name="cloud-upload" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <EditableFieldEvent
          title="Title"
          value={title}
          isEditing={editModes.title}
          onEdit={() => toggleEditMode('title')}
          onChangeText={setTitle}
        />

        {/* Editable DateTime Row */}
        <EditableDateTimeRow
          date={date} 
          setDate={setDate} 
          time={time}  // Pass the time prop
          setTime={setTime}  // Add the setTime function to handle time updates
          isEditing={true}  // Always in editing mode
        />

        <EditableFieldEvent
          title="Group Size"
          value={groupSize}
          isEditing={editModes.groupSize}
          onEdit={() => toggleEditMode('groupSize')}
          onChangeText={setGroupSize}
          keyboardType="numeric"
        />

        <EditableFieldEvent
          title="Location"
          value={location}
          isEditing={editModes.location}
          onEdit={() => toggleEditMode('location')}
          onChangeText={setLocation}
        />

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {['Music', 'Sports', 'Karaoke', 'Clubs', 'Beach', 'Dating'].map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagButton, tags.includes(tag) && styles.selectedTag]}
              onPress={() => handleTagSelect(tag)}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => setIsPixabayModalVisible(true)} style={styles.pixabayButton}>
        <Ionicons name="image" size={24} color="white" />
      </TouchableOpacity>

      {isPixabayModalVisible && (
  <Modal
    animationType="slide"
    transparent={true}
    visible={isPixabayModalVisible}
    onRequestClose={() => setIsPixabayModalVisible(false)}
  >
    <View style={styles.modalContainer}>
      {/* Close Button */}
      <TouchableOpacity
        onPress={() => setIsPixabayModalVisible(false)}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={30} color="white" />
      </TouchableOpacity>

      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search for images..."
        value={pixabaySearch}
        onChangeText={setPixabaySearch}
        onSubmitEditing={() => fetchPixabayImages(pixabaySearch)}
      />

      {/* Image Results */}
      <ScrollView>
        {pixabayImages.map((image, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setPhotos([...photos, image.largeImageURL]);
              setIsPixabayModalVisible(false);  // Close modal after selecting image
            }}
          >
            <Image source={{ uri: image.previewURL }} style={styles.pixabayImage} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  </Modal>
)}

      <FlatList
        data={photos}
        horizontal
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Image source={{ uri: item }} style={styles.profileImage} />}
      />

        {/* Submit Button */}
        <Button title="Create Meetup" onPress={handleSubmit} />
      </ScrollView>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  innerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40, // Add space for the bottom content
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // White with opacity
    padding: 10,
    borderRadius: 30, // Circle shape
    zIndex: 1, // Make sure it's above other content
  },
  galleryContainer: {
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    marginBottom: 20, // Spacing between the gallery and the rest of the form
    position: 'relative', // Set the parent container's position relative for absolute positioning of the button
  },
  profileImage: {
    width: width, // Image width is 80% of screen width
    height: width, // Image height is 1.2x the width for a wide view
    resizeMode: 'cover',
  },
  indicatorContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    height: 4,
    margin: 6,
    borderRadius: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  tagButton: {
    backgroundColor: '#ccc',
    padding: 8,
    margin: 5,
    borderRadius: 5,
  },
  selectedTag: {
    backgroundColor: '#D9043D',
  },
  tagText: {
    color: 'white',
  },
  uploadButton: {
    position: 'absolute',
    bottom: 10, // Positioned just above the images
    left: 10, // Left corner of the gallery
    backgroundColor: '#0367A6', // Blue color
    padding: 15,
    borderRadius: 50, // Circle shape
    zIndex: 2, // Ensure it's on top of the gallery
  },
  uploadButtonAbove: {
    alignSelf: 'center',
    backgroundColor: '#0367A6', // Blue color
    padding: 15,
    borderRadius: 50, // Circle shapepixabaybutton: {    position: 'absolute',    top: 10,    right: 10,    backgroundColor: '#0367A6',%20%20%20%20padding:%2015,%20%20%20%20borderRadius:%2050,%20%20%20%20zIndex:%202,%20%20},%20%20modalContainer:%20{%20%20%20%20flex:%201,%20%20%20%20justifyContent:%20'center',%20%20%20%20alignItems:%20'center',%20%20%20%20backgroundColor:%20'rgba(0,%200,%200,%200.5)',%20%20},%20%20searchInput:%20{%20%20%20%20width:%20'80%',%20%20%20%20padding:%2010,%20%20%20%20marginBottom:%2020,%20%20%20%20backgroundColor:%20'white',%20%20%20%20borderRadius:%205,%20%20%20%20textAlign:%20'center',%20%20},%20%20pixabayImage:%20{%20%20%20%20width:%20100,%20%20%20%20height:%20100,%20%20%20%20margin:%205,%20%20%20%20borderRadius:%205,%20%20},
    zIndex: 2, // Ensure it's above the form
    marginBottom: 20, // Space above the title
  },
  deleteIconWrapper: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  addIconButton: {
    padding: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pixabayButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#0367A6',
    padding: 15,
    borderRadius: 50,
    zIndex: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  searchInput: {
    width: '80%',
    marginTop: 60,
    padding: 10,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 5,
    textAlign: 'center',
  },
  pixabayImage: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Optional: to make the close button background semi-transparent
    borderRadius: 20,
    padding: 10,
  },
});

export default CreateMeetupScreen;
