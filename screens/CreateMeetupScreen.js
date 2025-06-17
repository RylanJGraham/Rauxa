import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, ScrollView, TouchableOpacity, Text, StyleSheet, Dimensions, Platform, Linking, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase';
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from 'expo-image-manipulator';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';

// Import your custom components
import GallerySection from '../components/create/GallerySection';
import FieldsSection from '../components/create/FieldsSection';
import HostInfo from '../components/create/HostInfo';
import PixabayModal from '../components/create/PixabayModal';
import PreviewModal from '../components/create/PreviewModal';
import TagSelectionModal from '../components/create/TagSelectionModal';
import ImagePickerOptionsModal from '../components/create/ImagePickerOptionsModal';
import ImageReorderModal from '../components/create/ImageReorderModal';
import GenericEditModal from '../components/create/GenericEditModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

const CreateMeetupScreen = ({ isVisible, onClose, eventData, mode }) => {
  // State variables for event details
  const [title, setTitle] = useState(eventData?.title || '');
  const [selectedDate, setSelectedDate] = useState(null); // Full Date object for date and time
  const [groupSize, setGroupSize] = useState(eventData?.groupSize?.toString() || '');
  const [location, setLocation] = useState(eventData?.location || '');
  const [tags, setTags] = useState(eventData?.tags || []);
  const [photos, setPhotos] = useState(eventData?.photos || []); // Array of image URIs
  const [description, setDescription] = useState(eventData?.description || '');

  const [isSponsoredTemplate, setIsSponsoredTemplate] = useState(false);

  // State for generic edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [tempModalValue, setTempModalValue] = useState(''); // For text inputs
  const [tempSelectedDate, setTempSelectedDate] = useState(new Date()); // For date/time picker

  // State for host information (fetched from Firebase)
  const [hostFirstName, setHostFirstName] = useState('');
  const [hostLastName, setHostLastName] = useState('');
  const [hostProfileImage, setHostProfileImage] = useState(null);

  // States for new image management modals
  const [isImagePickerOptionsVisible, setIsImagePickerOptionsVisible] = useState(false);
  const [isPixabayModalVisible, setIsPixabayModalVisible] = useState(false);
  const [isImageReorderModalVisible, setIsImageReorderModalVisible] = useState(false);

  // State for current image index in the gallery view
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // States for other modals
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [isTagsModalVisible, setIsTagsModalVisible] = useState(false);

  // State to manage uploading/processing status (for UI feedback)
  const [isUploadingImage, setIsUploadingImage] = useState(false); // Keep this state

  // Firebase hooks
  const auth = getAuth();
  const storage = getStorage();

  /**
   * Uploads an image URI to Firebase Storage. Handles both local file URIs and existing web URLs.
   * @param {string} uri - The local file URI or web URL of the image.
   * @param {string} folderPath - The path in Firebase Storage to upload to (e.g., 'liveEventPics/eventId').
   * @returns {Promise<string>} - The download URL of the uploaded image.
   */
  const uploadImageToFirebase = useCallback(async (uri, folderPath) => {
    try {
      // If it's already a web URL, return it directly
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return uri;
      }

      // Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate a unique filename
      const filename = `${folderPath}/${Date.now()}.${Math.random().toString(36).substring(7)}.webp`;

      // Create a storage reference
      const photoRef = ref(storage, filename);
      const metadata = { contentType: 'image/webp' }; // Set content type for WEBP

      // Upload the blob
      await uploadBytes(photoRef, blob, metadata);

      // Get the download URL
      const downloadURL = await getDownloadURL(photoRef);
      return downloadURL;
    } catch (error) {
      console.error('Image upload to Firebase failed:', error);
      throw error; // Rethrow to be caught by the caller
    }
  }, [storage]);

  const handlePickImage = useCallback(async () => {
    if (photos.length >= 3) {
      Alert.alert("Photo Limit", "You can only select a maximum of 3 photos per event.");
      setIsImagePickerOptionsVisible(false); // Close the modal even if limit is reached
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photos to select images.");
      setIsImagePickerOptionsVisible(false); // Close the modal if permission is denied
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
      } finally {
        setIsImagePickerOptionsVisible(false); // Close the modal
      }
    } else {
      // If the user cancels the image picker, also close the options modal
      setIsImagePickerOptionsVisible(false);
    }
  }, [photos]);

  /**
   * Handles selecting an image from Pixabay.
   * This is called directly by the PixabayModal's onSelect prop.
   * @param {string} imageUrl - The URL of the image selected from Pixabay.
   */
  const handleSelectPixabayImage = useCallback((imageUrl) => {
    setIsPixabayModalVisible(false); // Close Pixabay modal
    if (photos.length >= 3) {
      Alert.alert("Photo Limit", "You can only select a maximum of 3 photos per event.");
      return;
    }
    setPhotos(prev => [...prev, imageUrl]); // Add Pixabay image URL to photos state
  }, [photos]);

  // Effect to initialize state when modal becomes visible or eventData changes
  useEffect(() => {
    if (isVisible) {
      setTitle(eventData?.title || '');
      let initialDate = new Date();
      if (eventData?.date) {
        // Handle Firebase Timestamp or Date objects
        if (eventData.date.seconds) {
          initialDate = new Date(eventData.date.seconds * 1000);
        } else if (eventData.date instanceof Date) {
          initialDate = eventData.date;
        }
      }
      setSelectedDate(initialDate);
      setTempSelectedDate(initialDate); // Also update temp state for date picker
      setGroupSize(eventData?.groupSize?.toString() || '');
      setLocation(eventData?.location || '');
      setTags(eventData?.tags || []);
      setPhotos(eventData?.photos || []);
      setDescription(eventData?.description || '');
      setIsSponsoredTemplate(mode === 'sponsored_template');
    }
  }, [isVisible, eventData, mode]);

  // Effect to fetch host information from Firebase
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
            setHostProfileImage(data.profileImages[0]); // Assuming first image is profile pic
          }
        }
      } catch (error) {
        console.error('Error fetching user profile info:', error);
      }
    };

    fetchUserInfo();
  }, [auth]); // Dependency on auth object

  /**
   * Handles changes from the date/time picker modal.
   */
  const handleDateOrTimeChange = useCallback((event, newPickedDate) => {
    if (event.type === 'set' && newPickedDate) {
      setTempSelectedDate(newPickedDate); // Update temporary date for modal
    } else if (event.type === 'dismissed') {
      setIsModalOpen(false); // Close modal on dismiss
      setEditingField(null);
      setModalTitle('');
    }
  }, []);

  /**
   * Confirms and applies changes from the generic edit modal to the main state.
   */
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
          setGroupSize(''); // Reset if invalid
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
        setSelectedDate(tempSelectedDate); // Apply selected date from temp state
        break;
      default:
        break;
    }
    setIsModalOpen(false); // Close modal
    setEditingField(null);
    setModalTitle('');
    setTempModalValue('');
    setTempSelectedDate(selectedDate || new Date()); // Reset temp date to current or new
  }, [editingField, tempModalValue, tempSelectedDate, selectedDate]);

  /**
   * Cancels changes from the generic edit modal.
   */
  const handleCancelModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingField(null);
    setModalTitle('');
    setTempModalValue('');
    setTempSelectedDate(selectedDate || new Date()); // Reset temp date to current or new
  }, [selectedDate]);

  /**
   * Formats a Date object into a displayable date string.
   * @param {Date} dateObj
   * @returns {string}
   */
  const formatDateForDisplay = (dateObj) => {
    if (!dateObj) return '';
    return dayjs(dateObj).format('MMMM D,YYYY');
  };

  /**
   * Formats a Date object into a displayable time string.
   * @param {Date} dateObj
   * @returns {string}
   */
  const formatTimeForDisplay = (dateObj) => {
    if (!dateObj) return '';
    return dayjs(dateObj).format('h:mm A');
  };

  /**
   * Opens the generic edit modal for a specific field.
   * @param {string} fieldKey - The key of the field to be edited (e.g., 'title', 'date').
   * @param {any} currentFieldValue - The current value of the field.
   * @param {string} title - The title for the modal.
   */
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

  /**
   * Handles saving tags selected in the TagSelectionModal.
   * @param {string[]} newTags - The array of selected tags.
   */
  const handleSaveTags = useCallback((newTags) => {
    setTags(newTags);
  }, []);

  /**
   * Handles the submission of the new event to Firebase.
   */
  const handleSubmit = useCallback(async () => {
    // Validation checks
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

      // Create a new Firestore document reference
      const newDocRef = doc(collection(db, "live"));
      const eventId = newDocRef.id;

      // Upload/process photos and get final URLs
      const finalPhotoUrls = [];
      for (let photoUri of photos) {
        if (photoUri.startsWith('file://') || photoUri.startsWith('content://')) {
          // It's a local URI, upload to Firebase Storage
          try {
            const uploadedUrl = await uploadImageToFirebase(photoUri, `liveEventPics/${eventId}`);
            finalPhotoUrls.push(uploadedUrl);
          } catch (uploadError) {
            console.error('Error uploading image during submission:', uploadError);
            Alert.alert("Upload Failed", `Failed to upload image. Error: ${uploadError.message}`);
            return; // Stop submission if upload fails
          }
        } else {
          // It's already a web URL (e.g., from Pixabay), use directly
          finalPhotoUrls.push(photoUri);
        }
      }

      const now = new Date(); // Timestamp for creation/update

      // Set event data in Firestore
      await setDoc(newDocRef, {
        Sponsor: "", // Default empty
        active: true,
        createdAt: now,
        updatedAt: now,
        date: selectedDate,
        description: description.trim(),
        full: false, // Default not full
        groupSize: parseInt(groupSize),
        host: user.uid,
        location: location.trim(),
        photos: finalPhotoUrls,
        sponsored: isSponsoredTemplate, // From state
        tags,
        title: title.trim(),
        uid: user.uid, // Host's UID
      });

      Alert.alert("Success!", "Your event has been created successfully!");
      onClose(); // Close the modal after successful creation
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert("Error", `Failed to create event: ${error.message || 'Please try again.'}`);
    }
  }, [title, location, groupSize, selectedDate, description, photos, tags, auth, uploadImageToFirebase, isSponsoredTemplate, onClose]);

  /**
   * Handles opening the location in a map app.
   */
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

  /**
   * Shows the event preview modal.
   */
  const handlePreview = useCallback(() => {
    if (photos.length < 3) {
      Alert.alert("Missing Photos", "Please upload at least 3 photos to preview your event.");
      return;
    }
    setIsPreviewModalVisible(true);
  }, [photos.length]);

  // Effect to manage Android status bar and navigation bar colors
  useEffect(() => {
    if (Platform.OS === 'android') {
      const modalNavColor = "#730220"; // Dark red for consistency
      const defaultNavColor = "rgba(0,0,0,0)"; // Transparent or your app's default

      if (isVisible) {
        // When modal is visible, make status bar darker to blend
        StatusBar.setBackgroundColor('rgba(0, 0, 0, 0.6)', false); // false means not animated
        StatusBar.setBarStyle('light-content'); // Light text on dark background

        // Set navigation bar color for Android
        if (StatusBar.setNavigationBarColor) {
          StatusBar.setNavigationBarColor(modalNavColor, false);
        }
      } else {
        // When modal is hidden, revert status bar
        StatusBar.setBackgroundColor('rgba(0,0,0,0)', false);
        StatusBar.setBarStyle('light-content'); // Or 'dark-content' depending on your app's main screen

        // Revert navigation bar color for Android
        if (StatusBar.setNavigationBarColor) {
          StatusBar.setNavigationBarColor(defaultNavColor, false);
        }
      }
    }
  }, [isVisible]);

  // Don't render anything if the modal is not visible
  if (!isVisible) {
    return null;
  }

  // Define the consistent horizontal padding for content within the modal
  const contentHorizontalPadding = 20;

  // Calculate the actual width for content inside the modal (screenWidth - 2 * marginHorizontal from modalContentContainer)
  // This `modalInnerContentWidth` is the *inner width* of the modal, before applying any internal padding.
  const modalInnerContentWidth = screenWidth - (styles.modalContentContainer.marginHorizontal * 2);

  return (
    <View style={styles.modalOverlayFull}>
      <LinearGradient colors={["#D9043D", "#730220"]} style={[styles.modalContentContainer, { width: modalInnerContentWidth + (contentHorizontalPadding * 2) }]}>
        {/* Close button for the main modal */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close-circle" size={40} color="white" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={[styles.scrollViewContent, { paddingHorizontal: contentHorizontalPadding }]}>
          <Text style={styles.headerTitle}>Create New Meetup</Text>

          {/* Gallery Section for Image Management */}
          <GallerySection
            photos={photos}
            setPhotos={setPhotos}
            currentImageIndex={currentImageIndex}
            setCurrentImageIndex={setCurrentImageIndex}
            screenWidth={modalInnerContentWidth} // Pass the inner content width, not including padding
            onOpenImagePickerOptions={() => setIsImagePickerOptionsVisible(true)} // Open ImagePickerOptionsModal
            onOpenImageReorderModal={() => setIsImageReorderModalVisible(true)}   // Open ImageReorderModal
          />

          {/* Fields Section for Event Details */}
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

          {/* Host Information Section */}
          <HostInfo
            hostFirstName={hostFirstName}
            hostLastName={hostLastName}
            hostProfileImage={hostProfileImage}
          />

          {/* Action Buttons: Preview and Create Event */}
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

        {/* Generic Edit Modal (for Title, Group Size, Location, Description, Date/Time) */}
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

        {/* Pixabay Search Modal */}
        <PixabayModal
          visible={isPixabayModalVisible}
          onClose={() => setIsPixabayModalVisible(false)}
          onSelect={handleSelectPixabayImage}
        />

        {/* Event Preview Modal */}
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

        {/* Tag Selection Modal */}
        <TagSelectionModal
          isVisible={isTagsModalVisible}
          onClose={() => setIsTagsModalVisible(false)}
          selectedTags={tags}
          onSaveTags={handleSaveTags}
        />

        {/* NEW: Image Picker Options Modal (Upload from Library / Search Pixabay) */}
        <ImagePickerOptionsModal
          isVisible={isImagePickerOptionsVisible}
          onClose={() => setIsImagePickerOptionsVisible(false)}
          onChooseLibrary={handlePickImage} // This triggers the local image picker
          onChoosePixabay={() => {
            setIsImagePickerOptionsVisible(false); // Close options modal first
            setIsPixabayModalVisible(true);       // Then open Pixabay modal
          }}
        />

        {/* NEW: Image Reorder Modal (for reordering and managing photos) */}
        <ImageReorderModal
          isVisible={isImageReorderModalVisible}
          onClose={() => setIsImageReorderModalVisible(false)}
          photos={photos}
          setPhotos={setPhotos} // ImageReorderModal will directly update the photos state
        />

        {/* Optional: Loading overlay when an image is being processed/uploaded */}
        {isUploadingImage && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#F2BB47" />
            <Text style={styles.loadingText}>Processing image...</Text>
          </View>
        )}

      </LinearGradient>
    </View>
  );
};

// StyleSheet for the component
const styles = StyleSheet.create({
  modalOverlayFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Semi-transparent black background for overlay
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Ensure modal is on top
  },
  modalContentContainer: {
    // Adjusted maxHeight using Platform.select for platform-specific heights
    maxHeight: Platform.select({
      ios: screenHeight * 0.9,  // Slightly smaller for iOS to account for gestures/status bar
      android: screenHeight * 0.9, // Larger for Android to fill available space better
      default: screenHeight * 0.9, // Fallback for other platforms
    }),
    borderRadius: 20,
    overflow: 'hidden', // Clip content that goes beyond border radius
    paddingBottom: 20, // Padding at the bottom of the scroll view content
    marginHorizontal: 20, // This applies the 20px margin to the entire modal content horizontally
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 11, // Ensure close button is above other content
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 2,
  },
  scrollViewContent: {
    flexGrow: 1, // Allows content to grow and be scrollable
    paddingTop: 20, // Adjusted: Reduced from 60 to 40 to move content up
    paddingBottom: 40, // General padding at the bottom of the scroll content
    // paddingHorizontal will be added dynamically
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    // marginHorizontal removed, now handled by ScrollView padding
    marginTop: 30,
    marginBottom: 0,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 30,
    flex: 1, // Distribute space evenly
    marginHorizontal: 5, // Space between buttons
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8, // Android shadow
  },
  previewButton: {
    backgroundColor: "#F2BB47", // Gold accent color
  },
  createButton: {
    backgroundColor: "#0367A6", // Blue accent color
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
  // Optional loading overlay styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001, // Higher than modal content
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  }
});

export default CreateMeetupScreen;