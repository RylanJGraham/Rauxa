import React, { useState, useEffect } from 'react';
import { Linking, Platform, Alert, View, ScrollView, TouchableOpacity, Text, StyleSheet, TextInput, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase';
import PixabayModal from '../components/create/PixabayModal';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const { width } = Dimensions.get('window');

const CreateMeetupScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { mode, eventData } = route.params || {};
  const [isEditing, setIsEditing] = useState(mode === 'edit');

  const [title, setTitle] = useState(eventData?.title || '');
  const [date, setDate] = useState(eventData?.date || '');
  const [time, setTime] = useState(eventData?.time || '');
  const [groupSize, setGroupSize] = useState(eventData?.groupSize?.toString() || '');
  const [location, setLocation] = useState(eventData?.location || '');
  const [tags, setTags] = useState(eventData?.tags || []);
  const [photos, setPhotos] = useState(eventData?.photos || []);
  const [description, setDescription] = useState(eventData?.description || '');

  // User info states
  const [hostFirstName, setHostFirstName] = useState('');
  const [hostLastName, setHostLastName] = useState('');
  const [hostProfileImage, setHostProfileImage] = useState(null);


  const [isPixabayModalVisible, setIsPixabayModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const auth = getAuth();
  const storage = getStorage();

  const uploadImageToFirebase = async (uri, folder = 'liveEventPics') => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const extension = uri.split('.').pop();
    const filename = `${folder}/${Date.now()}.${extension}`;

    const photoRef = ref(storage, filename);
    const metadata = {
      contentType: blob.type || 'image/jpeg',
    };

    await uploadBytes(photoRef, blob, metadata);
    const downloadURL = await getDownloadURL(photoRef);
    return downloadURL;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};

  const handleOpenLocation = () => {
  // Example: Open Google Maps or just alert for now
  if (location) {
    const url = Platform.select({
      ios: `maps:0,0?q=${location}`,
      android: `geo:0,0?q=${location}`,
    });
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open map app.');
    });
  } else {
    Alert.alert('No location specified');
  }
};

const handlePickImage = async () => {
  if (photos.length >= 3) {
    Alert.alert("Limit", "Max 3 photos allowed.");
    return;
  }

  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    Alert.alert("Permission Required", "Please allow access to your photos.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.75,
  });

  if (!result.canceled && result.assets?.[0]) {
    try {
      // Resize and convert to WEBP
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.WEBP }
      );

      const uploadedUrl = await uploadImageToFirebase(manipulatedImage.uri, 'liveEventPics');
      setPhotos(prev => [...prev, uploadedUrl]);
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert("Upload Failed", "Could not upload image. Please try again.");
    }
  }
};

  useEffect(() => {
    const fetchUserInfo = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Assuming your user profile is stored in 'users/{uid}/ProfileInfo/userinfo'
        const profileDoc = await getDoc(doc(db, 'users', user.uid, 'ProfileInfo', 'userinfo'));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setHostFirstName(data.displayFirstName || '');
          setHostLastName(data.displayLastName || '');
          // set profile pic from first element of profileImages array if exists
          if (Array.isArray(data.profileImages) && data.profileImages.length > 0) {
            setHostProfileImage(data.profileImages[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  // ... rest of your existing functions (handlePickImage, handleOpenLocation)...

  const handleSubmit = async () => {
  if (!title.trim() || !date.trim() || !location.trim() || !groupSize.trim()) {
    Alert.alert("Missing Fields", "Please fill in all required fields: Title, Date, Location, Group Size.");
    return;
  }

  if (isNaN(parseInt(groupSize)) || parseInt(groupSize) <= 0) {
    Alert.alert("Invalid Group Size", "Group Size must be a positive number.");
    return;
  }

    try {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Authentication", "User not logged in.");
      return;
    }

    const photoUrls = [];

    for (let photo of photos) {
  if (photo.startsWith('http')) {
    photoUrls.push(photo); // Already uploaded
  } else {
    try {
      const uploadedUrl = await uploadImageToFirebase(photo);
      photoUrls.push(uploadedUrl);
    } catch (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }
  }
}

    const now = new Date();
    const parsedDate = new Date(date); // Assumes `date` includes both date and time in string

    const docRef = await addDoc(collection(db, "live"), {
      Sponsor: "",
      active: true,
      attendeesCount: 1,
      createdAt: now,
      updatedAt: now,
      date: parsedDate,
      description: description.trim(),
      full: false,
      groupSize: parseInt(groupSize),
      host: user.uid,
      location: location.trim(),
      photos: photoUrls,
      sponsored: false,
      tags,
      title: title.trim()
    });

    // Optionally: show success and go back
    Alert.alert("Success", "Event created successfully!");
    navigation.goBack();

  } catch (error) {
  console.error("Full error:", error);
  console.error("Error code:", error.code);
  console.error("Error message:", error.message);
  console.error("Server response:", error.customData?.serverResponse);
  Alert.alert("Error", `Failed to create event: ${error.code}\n${error.message}`);
}
};


  return (
    <LinearGradient colors={["#D9043D", "#730220"]} style={styles.gradient}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={30} color="white" />
      </TouchableOpacity>

      {/* Image Gallery */}
      <View style={styles.galleryContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const index = Math.floor(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {photos.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.image} />
              {/* X delete button */}
              {currentImageIndex === index && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    const newPhotos = [...photos];
                    newPhotos.splice(index, 1);
                    setPhotos(newPhotos);
                    if (currentImageIndex >= newPhotos.length) {
                      setCurrentImageIndex(newPhotos.length - 1);
                    }
                  }}
                >
                  <Ionicons name="close-circle" size={28} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Pagination dots */}
        <View style={styles.paginationDotsContainer}>
          {photos.map((_, i) => (
            <View
              key={i}
              style={[styles.indicator, currentImageIndex === i && styles.activeIndicator]}
            />
          ))}
        </View>
      </View>

      {/* Thumbnails + Upload + Pixabay row with dark red background */}
      <View style={styles.thumbnailAndButtonsRow}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailsScroll}>
    {photos.map((uri, index) => (
      <View key={index} style={styles.thumbnailWrapper}>
        <Image source={{ uri }} style={styles.thumbnail} />
        
        {/* Move Left */}
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

        {/* Move Right */}
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

        {/* Select Thumbnail */}
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

  {/* Upload + Pixabay Buttons */}
  <View style={styles.iconButtonsRow}>
    <TouchableOpacity style={styles.iconButton} onPress={handlePickImage}>
      <Ionicons name="cloud-upload-outline" size={28} color="#fff" />
      <Text style={styles.iconButtonText}>Upload</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.iconButton}
      onPress={() => {
        if (photos.length >= 3) return Alert.alert("Limit", "Max 3 photos allowed.");
        setIsPixabayModalVisible(true);
      }}
    >
      <Ionicons name="images-outline" size={28} color="#fff" />
      <Text style={styles.iconButtonText}>Pixabay</Text>
    </TouchableOpacity>
  </View>
</View>

      {/* Fields */}
      {renderField("Title", title, setTitle, isEditing)}
      {renderField("Date", date, setDate, isEditing)}
      {renderField("Time", time, setTime, isEditing)}
      {renderField("Group Size", groupSize, setGroupSize, isEditing, "numeric")}
      {renderField("Location", location, setLocation, isEditing, "default", true, handleOpenLocation)}
      {renderField("Description", description, setDescription, isEditing, "default")}

      {/* Host info row */}
      <View style={styles.hostRow}>
        {hostProfileImage ? (
          <Image source={{ uri: hostProfileImage }} style={styles.hostImage} />
        ) : (
          <View style={[styles.hostImage, styles.hostImagePlaceholder]} />
        )}
        <View style={styles.hostInfo}>
          <Text style={styles.hostLabel}>Host</Text>
          <Text style={styles.hostName}>{hostFirstName} {hostLastName}</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: isEditing ? "#5B0A1F" : "#F2BB47" }]}
          onPress={() => setIsEditing(prev => !prev)}
        >
          <Text style={styles.buttonText}>{isEditing ? "Done Editing" : "Edit Meetup"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#0367A6" }]}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <PixabayModal
        visible={isPixabayModalVisible}
        onClose={() => setIsPixabayModalVisible(false)}
        onSelect={(url) => {
          setPhotos(prev => [...prev, url]);
          setIsPixabayModalVisible(false);
        }}
      />
    </LinearGradient>
  );
};

const renderField = (
  label,
  value,
  setter,
  editable,
  keyboardType = 'default',
  isLocation = false,
  onPressLocation
) => (
  <View style={styles.infoRow}>
    <Ionicons
      name={
        label === "Title" ? "chatbubble-ellipses-outline" :
        label === "Date" ? "calendar-outline" :
        label === "Time" ? "time-outline" :
        label === "Group Size" ? "people-outline" :
        label === "Location" ? "location-outline" : "information-circle-outline"
      }
      size={20}
      color="#fff"
      style={styles.icon}
    />
    <Text style={styles.label}>{label}:</Text>
    {editable ? (
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          value={value}
          onChangeText={setter}
          keyboardType={keyboardType}
          style={[styles.input, { flex: 1, color: '#fff' }]}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#aaa"
        />
        {isLocation && (
          <TouchableOpacity onPress={onPressLocation} style={{ marginLeft: 10 }}>
            <Ionicons name="map-outline" size={20} color="#F2BB47" />
          </TouchableOpacity>
        )}
      </View>
    ) : (
      <Text style={styles.value}>{value || "N/A"}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginRight: 15,
  },
  icon: { marginRight: 8 },
  label: { color: '#fff', fontWeight: 'bold', width: 100 },
  value: { color: '#fff', flex: 1 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    paddingVertical: 2,
    fontSize: 16,
    color: '#fff',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  hostImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ccc',
  },
  hostImagePlaceholder: {
    backgroundColor: '#555',
  },
  hostInfo: {
    marginLeft: 12,
  },
  hostLabel: {
    color: '#F2BB47',
    fontWeight: 'bold',
    fontSize: 14,
  },
  hostName: {
    color: '#fff',
    fontSize: 16,
  },
  galleryContainer: {
    width,
    height: 300,
    position: 'relative',
  },
  imageWrapper: {
    width,
    height: 300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 10,
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
  bottomRow: {
    flexDirection: 'column',
  },
 thumbnailAndButtonsRow: {
    flexDirection: 'row',
    backgroundColor: '#730220', // dark red background
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
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
  backgroundColor: '#000', // optional fallback
},
  arrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -10,
    backgroundColor: '#0006',
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 30,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
});

export default CreateMeetupScreen;
