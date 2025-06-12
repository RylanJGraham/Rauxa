import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, ScrollView, TouchableOpacity, Text, StyleSheet, Dimensions, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase';
import * as ImagePicker from 'expo-image-manipulator';
import * as ImageManipulator from 'expo-image-manipulator';
import dayjs from 'dayjs';

import GallerySection from '../components/create/GallerySection';
import FieldsSection from '../components/create/FieldsSection';
import GenericEditModal from '../components/create/GenericEditModal';
import HostInfo from '../components/create/HostInfo';
import PixabayModal from '../components/create/PixabayModal';
import PreviewModal from '../components/create/PreviewModal';
import TagSelectionModal from '../components/create/TagSelectionModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

const CreateMeetupScreen = ({ isVisible, onClose, eventData, mode }) => {
  // State variables for event details, initialized from eventData or empty
  const [title, setTitle] = useState(eventData?.title || '');
  const [selectedDate, setSelectedDate] = useState(null);
  const [groupSize, setGroupSize] = useState(eventData?.groupSize?.toString() || '');
  const [location, setLocation] = useState(eventData?.location || '');
  const [tags, setTags] = useState(eventData?.tags || []);
  const [photos, setPhotos] = useState(eventData?.photos || []);
  const [description, setDescription] = useState(eventData?.description || '');

  // New state to track if the event originated from a sponsored template
  const [isSponsoredTemplate, setIsSponsoredTemplate] = useState(false);

  // State variables for the generic modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [tempModalValue, setTempModalValue] = useState('');
  const [tempSelectedDate, setTempSelectedDate] = useState(new Date());

  // State variables for host information (always fetched for the current user)
  const [hostFirstName, setHostFirstName] = useState('');
  const [hostLastName, setHostLastName] = useState('');
  const [hostProfileImage, setHostProfileImage] = useState(null);

  // State for Pixabay image selection modal
  const [isPixabayModalVisible, setIsPixabayModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // State for Preview Modal
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);

  // State for Tags Modal
  const [isTagsModalVisible, setIsTagsModalVisible] = useState(false);

  const auth = getAuth();
  const storage = getStorage();

  const uploadImageToFirebase = useCallback(async (uri, folderPath) => {
    try {
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return uri;
      }

      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `${folderPath}/${Date.now()}.${Math.random().toString(36).substring(7)}.webp`;

      const photoRef = ref(storage, filename);
      const metadata = { contentType: 'image/webp' };

      await uploadBytes(photoRef, blob, metadata);
      const downloadURL = await getDownloadURL(photoRef);
      return downloadURL;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }, [storage]);

  const handlePickImage = useCallback(async () => {
    if (photos.length >= 3) {
      Alert.alert("Photo Limit", "You can only select a maximum of 3 photos per event.");
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photos to select images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]) {
      try {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.85, format: ImageManipulator.SaveFormat.WEBP }
        );
        setPhotos(prev => [...prev, manipulatedImage.uri]);
      } catch (error) {
        console.error('Image manipulation error:', error);
        Alert.alert("Image Processing Failed", "Could not process image. Please try again.");
      }
    }
  }, [photos]);

  const handleSelectPixabayImage = useCallback((imageUrl) => {
    if (photos.length >= 3) {
      Alert.alert("Photo Limit", "You can only select a maximum of 3 photos per event.");
      return;
    }
    setPhotos(prev => [...prev, imageUrl]);
    setIsPixabayModalVisible(false);
  }, [photos]);


  useEffect(() => {
    if (isVisible) {
      setTitle(eventData?.title || '');
      let initialDate = new Date();
      if (eventData?.date) {
        if (eventData.date.seconds) {
          initialDate = new Date(eventData.date.seconds * 1000);
        } else if (eventData.date instanceof Date) {
          initialDate = eventData.date;
        }
      }
      setSelectedDate(initialDate);
      setTempSelectedDate(initialDate);
      setGroupSize(eventData?.groupSize?.toString() || '');
      setLocation(eventData?.location || '');
      setTags(eventData?.tags || []);
      setPhotos(eventData?.photos || []);
      setDescription(eventData?.description || '');
      setIsSponsoredTemplate(mode === 'sponsored_template');
    }
  }, [isVisible, eventData, mode]);


  useEffect(() => {
    const fetchUserInfo = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const profileDoc = await getDoc(doc(db, 'users', user.uid, 'ProfileInfo', 'userinfo'));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setHostFirstName(data.displayFirstName || '');
          setHostLastName(data.displayLastName || '');
          if (Array.isArray(data.profileImages) && data.profileImages.length > 0) {
            setHostProfileImage(data.profileImages[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile info:', error);
      }
    };

    fetchUserInfo();
  }, [auth]);


  const handleDateOrTimeChange = useCallback((event, newPickedDate) => {
    if (event.type === 'set' && newPickedDate) {
      setTempSelectedDate(newPickedDate);
    } else if (event.type === 'dismissed') {
      setIsModalOpen(false);
      setEditingField(null);
      setModalTitle('');
    }
  }, []);

  const handleConfirmModal = useCallback(() => {
    switch (editingField) {
      case 'title':
        setTitle(tempModalValue);
        break;
      case 'groupSize':
        const parsedGroupSize = parseInt(tempModalValue);
        if (!isNaN(parsedGroupSize) && parsedGroupSize > 0) {
          setGroupSize(tempModalValue);
        } else {
          Alert.alert("Invalid Input", "Group Size must be a positive number.");
          setGroupSize('');
        }
        break;
      case 'location':
        setLocation(tempModalValue);
        break;
      case 'description':
        setDescription(tempModalValue);
        break;
      case 'date':
      case 'time':
        setSelectedDate(tempSelectedDate);
        break;
      default:
        break;
    }
    setIsModalOpen(false);
    setEditingField(null);
    setModalTitle('');
    setTempModalValue('');
    setTempSelectedDate(selectedDate || new Date());
  }, [editingField, tempModalValue, tempSelectedDate, selectedDate]);

  const handleCancelModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingField(null);
    setModalTitle('');
    setTempModalValue('');
    setTempSelectedDate(selectedDate || new Date());
  }, [selectedDate]);

  const formatDateForDisplay = (dateObj) => {
    if (!dateObj) return '';
    return dayjs(dateObj).format('MMMM D,YYYY');
  };

  const formatTimeForDisplay = (dateObj) => {
    if (!dateObj) return '';
    return dayjs(dateObj).format('h:mm A');
  };

  const openEditModal = useCallback((fieldKey, currentFieldValue, title) => {
    setEditingField(fieldKey);
    setModalTitle(title);
    if (fieldKey === 'date' || fieldKey === 'time') {
      setTempSelectedDate(currentFieldValue || new Date());
    } else {
      setTempModalValue(currentFieldValue);
    }
    setIsModalOpen(true);
  }, []);

  const handleSaveTags = useCallback((newTags) => {
    setTags(newTags);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (photos.length < 3) {
      Alert.alert("Missing Photos", "Please upload at least 3 photos for your event.");
      return;
    }

    if (!title.trim() || !location.trim() || !groupSize.trim() || !selectedDate) {
      Alert.alert("Missing Information", "Please fill in all required fields: Event Title, Date, Location, and Group Size.");
      return;
    }
    if (isNaN(parseInt(groupSize)) || parseInt(groupSize) <= 0) {
      Alert.alert("Invalid Group Size", "Group Size must be a positive number.");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Authentication Required", "You must be logged in to create an event.");
        return;
      }
      const newDocRef = doc(collection(db, "live"));
      const eventId = newDocRef.id;

      const finalPhotoUrls = [];
      for (let photoUri of photos) {
        if (photoUri.startsWith('file://') || photoUri.startsWith('content://')) {
          try {
            const uploadedUrl = await uploadImageToFirebase(photoUri, `liveEventPics/${eventId}`);
            finalPhotoUrls.push(uploadedUrl);
          } catch (uploadError) {
            console.error('Error uploading image during submission:', uploadError);
            Alert.alert("Upload Failed", `Failed to upload image. Error: ${uploadError.message}`);
            return;
          }
        } else {
          finalPhotoUrls.push(photoUri);
        }
      }

      const now = new Date();

      await setDoc(newDocRef, {
        Sponsor: "",
        active: true,
        // Removed attendeesCount: 1, This will now be managed by the HubScreen upon first acceptance
        createdAt: now,
        updatedAt: now,
        date: selectedDate,
        description: description.trim(),
        full: false,
        groupSize: parseInt(groupSize),
        host: user.uid,
        location: location.trim(),
        photos: finalPhotoUrls,
        sponsored: isSponsoredTemplate,
        tags,
        title: title.trim(),
        uid: user.uid,
      });

      // --- REMOVED: Host is no longer added to 'attendees' here ---
      // This is crucial. The host will be added to the 'attendees' subcollection
      // (and thus trigger the chat creation/update) only when the first guest is accepted in HubScreen.
      // const hostAttendeeRef = doc(db, 'live', eventId, 'attendees', user.uid);
      // await setDoc(hostAttendeeRef, {
      //   userId: user.uid,
      //   joinedAt: now,
      //   role: "host",
      // });
      // console.log(`Host ${user.uid} added to attendees for event ${eventId}`);
      // --- END REMOVED ---

      Alert.alert("Success!", "Your event has been created successfully!");
      onClose(); // Close the modal
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert("Error", `Failed to create event: ${error.message || 'Please try again.'}`);
    }
  }, [title, location, groupSize, selectedDate, description, photos, tags, auth, uploadImageToFirebase, isSponsoredTemplate, onClose]);

  const handleOpenLocation = useCallback(() => {
    if (location) {
      const url = Platform.select({
        ios: `maps:0,0?q=${encodeURIComponent(location)}`,
        android: `geo:0,0?q=${encodeURIComponent(location)}`,
      });
      if (url) {
        Linking.openURL(url).catch(() => {
          Alert.alert('Error', 'Could not open map app. Please ensure you have a map application installed.');
        });
      } else {
        Alert.alert('Error', 'Unable to generate map URL for this platform.');
      }
    } else {
      Alert.alert('No Location', 'Please enter a location first.');
    }
  }, [location]);

  const handlePreview = useCallback(() => {
    if (photos.length < 3) {
      Alert.alert("Missing Photos", "Please upload at least 3 photos to preview your event.");
      return;
    }
    setIsPreviewModalVisible(true);
  }, [photos.length]);

  // If the component is not visible, return null immediately to prevent rendering
  if (!isVisible) {
    return null;
  }

  // Calculate modal content width, ensuring consistency with EventDetailsModal
  const modalActualWidth = screenWidth - 40; // This means 20 units of margin on each side

  return (
    <View style={styles.modalOverlayFull}>
      <LinearGradient colors={["#D9043D", "#730220"]} style={[styles.modalContentContainer, { width: modalActualWidth }]}>
        {/* The close button is MOVED from here to GallerySection */}
        {/* <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close-circle" size={40} color="white" />
        </TouchableOpacity> */}

        {/* ScrollView wraps all content to ensure it fits within the defined maxHeight */}
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <GallerySection
            photos={photos}
            setPhotos={setPhotos}
            currentImageIndex={currentImageIndex}
            setCurrentImageIndex={setCurrentImageIndex}
            handlePickImage={handlePickImage}
            setIsPixabayModalVisible={setIsPixabayModalVisible}
            screenWidth={modalActualWidth}
            onCloseGallery={onClose}
          />

          <FieldsSection
            title={title}
            selectedDate={selectedDate}
            groupSize={groupSize}
            location={location}
            description={description}
            tags={tags}
            openEditModal={openEditModal}
            formatDateForDisplay={formatDateForDisplay}
            formatTimeForDisplay={formatTimeForDisplay}
            handleOpenLocation={handleOpenLocation}
            onOpenTagsModal={() => setIsTagsModalVisible(true)}
          />

          <HostInfo
            hostFirstName={hostFirstName}
            hostLastName={hostLastName}
            hostProfileImage={hostProfileImage}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.previewButton]}
              onPress={handlePreview}
            >
              <Text style={styles.buttonText}>Preview</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {isModalOpen && (
          <GenericEditModal
            visible={isModalOpen}
            onClose={handleCancelModal}
            modalTitle={modalTitle}
            editingField={editingField}
            tempModalValue={tempModalValue}
            setTempModalValue={setTempModalValue}
            tempSelectedDate={tempSelectedDate}
            handleDateOrTimeChange={handleDateOrTimeChange}
            handleConfirmModal={handleConfirmModal}
            handleCancelModal={handleCancelModal}
          />
        )}

        <PixabayModal
          visible={isPixabayModalVisible}
          onClose={() => setIsPixabayModalVisible(false)}
          onSelect={handleSelectPixabayImage}
        />

        <PreviewModal
          isVisible={isPreviewModalVisible}
          onClose={() => setIsPreviewModalVisible(false)}
          eventDetails={{
            title,
            selectedDate,
            groupSize,
            location,
            description,
            photos,
            tags,
            currentImageIndex
          }}
          hostInfo={{
            hostFirstName,
            hostLastName,
            hostProfileImage
          }}
        />

        <TagSelectionModal
          isVisible={isTagsModalVisible}
          onClose={() => setIsTagsModalVisible(false)}
          selectedTags={tags}
          onSaveTags={handleSaveTags}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlayFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentContainer: {
    maxHeight: screenHeight * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
    paddingTop: 10,
    paddingBottom: 20,
    marginHorizontal: 20,
  },
  scrollViewContent: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 30,
    marginTop: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 30,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  previewButton: {
    backgroundColor: "#F2BB47",
  },
  createButton: {
    backgroundColor: "#0367A6",
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
});

export default CreateMeetupScreen;