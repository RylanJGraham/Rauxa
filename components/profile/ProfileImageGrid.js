// ProfileImageGrid.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import DraggableFlatList from 'react-native-draggable-flatlist';

const ProfileImageGrid = ({ profileImages: initialProfileImages, onImagesChange, isEditMode, onToggleEditMode, userId }) => {
    const [images, setImages] = useState(() => {
        const paddedImages = initialProfileImages.concat(Array(Math.max(0, 9 - initialProfileImages.length)).fill(null));
        return paddedImages;
    });
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const lastInitialImagesRef = useRef([]);

    useEffect(() => {
        if (JSON.stringify(initialProfileImages) !== JSON.stringify(lastInitialImagesRef.current)) {
            const newPaddedImages = initialProfileImages.concat(Array(Math.max(0, 9 - initialProfileImages.length)).fill(null));
            console.log("ProfileImageGrid: useEffect - Updating images state from prop:", newPaddedImages);
            setImages(newPaddedImages);
            lastInitialImagesRef.current = initialProfileImages;
        } else {
            // console.log("ProfileImageGrid: useEffect - initialProfileImages did not change, skipping update.");
        }
    }, [initialProfileImages]);

    const pickImage = async (indexToReplace) => {
        console.log("pickImage called for index:", indexToReplace);

        if (!userId) {
            Alert.alert("Authentication Required", "Please log in to add images.");
            return;
        }
        if (typeof indexToReplace !== 'number' || indexToReplace < 0) {
            console.error("Invalid index provided for image slot:", indexToReplace);
            Alert.alert("Error", "Internal error: Invalid image slot selected.");
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Need camera roll permissions to add images.');
            return;
        }

        setIsProcessingImage(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.7,
            });

            if (!result.canceled && result.assets?.[0]) {
                const manipulatedImage = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 800 } }],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.WEBP }
                );

                const localImageUri = manipulatedImage.uri;
                console.log(`Image picked for index ${indexToReplace}, local URI: ${localImageUri}`);

                setImages(prevImages => {
                    const newImages = [...prevImages];
                    newImages[indexToReplace] = localImageUri;
                    onImagesChange(newImages);
                    return newImages;
                });
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert("Error", "Failed to pick image. " + error.message);
        } finally {
            setIsProcessingImage(false);
        }
    };

    const handleDeleteImage = async (indexToDelete) => {
        const itemToDelete = images[indexToDelete];
        console.log(`Attempting to delete image at index ${indexToDelete}:`, itemToDelete);

        if (!userId) {
            Alert.alert("Authentication Required", "Please log in to delete images.");
            return;
        }
        if (!itemToDelete) {
            console.log("No image at this slot to delete. It's already empty.");
            Alert.alert("Info", "No image exists at this slot to delete.");
            return;
        }
        if (typeof indexToDelete !== 'number' || indexToDelete < 0) {
            console.error("Invalid index provided for deletion:", indexToDelete);
            Alert.alert("Deletion Error", "Internal error: Image slot index is invalid for deletion.");
            return;
        }

        Alert.alert(
            "Remove Image",
            "Are you sure you want to remove this image slot? Changes will apply when you 'Save Profile'.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    onPress: () => {
                        setImages(prevImages => {
                            const newImages = [...prevImages];
                            newImages[indexToDelete] = null;
                            onImagesChange(newImages);
                            return newImages;
                        });
                        console.log(`Image at index ${indexToDelete} removed locally.`);
                    },
                    style: "destructive",
                },
            ],
            { cancelable: true }
        );
    };

    const handleReorderImages = ({ data }) => {
        console.log("handleReorderImages: New ordered data:", data);
        setImages(data);
        onImagesChange(data);
    };

    // This function renders a single image item, its content changes based on isEditMode
    // It accepts optional 'drag' and 'isActive' props for DraggableFlatList
    const renderImageItem = (imageUrl, index, drag = undefined, isActive = false) => {
        const isLocalUri = imageUrl && (imageUrl.startsWith('file://') || imageUrl.startsWith('data:'));

        return (
            <TouchableOpacity
                key={`image-item-${index}`} // Added key for clarity, though it might be handled by map/flatlist
                style={[
                    styles.imageGridItem,
                    isActive && styles.imageGridItemActive // Style for dragged item
                ]}
                onLongPress={isEditMode ? drag : undefined} // Only allow drag in edit mode
                onPress={() => {
                    // Allow picking/deleting only if in edit mode and not processing
                    if (isEditMode && !isProcessingImage) {
                        imageUrl ? handleDeleteImage(index) : pickImage(index);
                    }
                    // In view mode, clicking an image does nothing (could expand to full-screen viewer later)
                }}
                disabled={isProcessingImage || !isEditMode} // Disable interaction if processing or not in edit mode
            >
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.profileGridImage}
                    />
                ) : (
                    // Show "Add Photo" placeholder ONLY in edit mode for empty slots
                    isEditMode ? (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="add-circle-outline" size={40} color="#F2BB47" />
                            <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                        </View>
                    ) : (
                        // In view mode, if imageUrl is null, this item is filtered out by .filter(Boolean)
                        // So this else branch (for !isEditMode && !imageUrl) should ideally not be hit.
                        // Keeping for robustness, but visually it won't appear as it's not rendered.
                        <View style={styles.emptyImageSlot} />
                    )
                )}
                {isProcessingImage && isLocalUri && ( // Show processing overlay only for local URIs being uploaded
                    <View style={styles.imageUploadingOverlay}>
                        <ActivityIndicator size="large" color="#F2BB47" />
                        <Text style={styles.imageUploadingText}>Processing...</Text>
                    </View>
                )}
                {/* Show delete/add icons ONLY in edit mode */}
                {isEditMode && imageUrl && (
                    <TouchableOpacity
                        style={styles.deleteImageIcon}
                        onPress={() => handleDeleteImage(index)}
                    >
                        <Ionicons name="close-circle" size={28} color="#FF4D4D" />
                    </TouchableOpacity>
                )}
                {isEditMode && !imageUrl && (
                    <TouchableOpacity
                        style={styles.addImageOverlayIcon}
                        onPress={() => pickImage(index)}
                    >
                        <Ionicons name="add-circle" size={28} color="#F2BB47" />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <Text style={styles.sectionTitleText}>Profile Images</Text>
                <TouchableOpacity
                    onPress={onToggleEditMode}
                    style={[styles.editButton, isEditMode && styles.editButtonActive]}
                    disabled={isProcessingImage}
                >
                    <Ionicons name={isEditMode ? "checkmark-done-outline" : "images-outline"} size={18} color="white" />
                    <Text style={styles.editButtonText}>{isEditMode ? "Done" : "Edit Images"}</Text>
                </TouchableOpacity>
            </View>

            {isEditMode ? (
                // EDIT MODE: Use DraggableFlatList to show all 9 slots (filled or empty) for interaction
                <DraggableFlatList
                    data={images} // Pass the full array (including nulls)
                    renderItem={({ item, drag, isActive }) => renderImageItem(item, images.indexOf(item), drag, isActive)}
                    keyExtractor={(item, index) => `edit-image-${index}-${item || 'null'}`}
                    onDragEnd={handleReorderImages}
                    numColumns={3}
                    scrollEnabled={false} // Prevents vertical scrolling within the grid itself
                    contentContainerStyle={styles.imageGrid}
                />
            ) : (
                // VIEW MODE: Just a simple View to display existing images in the same grid style
                <View style={styles.imageGrid}>
                    {images.filter(Boolean).map((imageUrl, index) => (
                        // Only render non-null images, using the same item rendering logic
                        renderImageItem(imageUrl, images.indexOf(imageUrl)) // No drag/isActive for view mode
                    ))}
                    {/* Message if no images are uploaded in view mode */}
                    {images.filter(Boolean).length === 0 && (
                        <Text style={styles.noImagesText}>No profile images uploaded. Tap "Edit Images" to add some!</Text>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        backgroundColor: '#1A1A1A',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitleText: {
        color: '#F2BB47',
        fontSize: 20,
        fontWeight: 'bold',
    },
    editButton: {
        backgroundColor: '#F2BB47',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    editButtonText: {
        color: 'white',
        fontSize: 14,
        marginLeft: 5,
        fontWeight: '500',
    },
    editButtonActive: {
        backgroundColor: '#E0A800',
    },
    valueText: { // This style is generally for non-image values, can be removed if not used elsewhere in this component.
        color: '#E0E0E0',
        fontSize: 16,
        marginTop: 5,
        paddingHorizontal: 5,
    },
    imageGrid: { // Container for the 3-column image layout
        justifyContent: 'flex-start',
        paddingVertical: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    imageGridItem: { // Style for each individual image slot (used in both modes)
        width: '31%', // Adjusted for 3 columns with margins
        aspectRatio: 3 / 4,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 10,
        backgroundColor: '#333', // Default background for empty or loading slots
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#555',
        marginHorizontal: '1.15%', // Adjusted for consistent spacing between items
        position: 'relative',
    },
    imageGridItemActive: { // Style applied when dragging an item
        borderWidth: 2,
        borderColor: '#F2BB47',
        transform: [{ scale: 1.05 }],
        shadowColor: '#F2BB47',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    profileGridImage: { // Style for the actual image inside the slot
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholder: { // "Add Photo" style (only in edit mode, empty slot)
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
    },
    imagePlaceholderText: {
        color: '#F2BB47',
        fontSize: 12,
        marginTop: 5,
        textAlign: 'center',
    },
    emptyImageSlot: { // This style is conceptually here but won't be visible in the current view logic.
        height: '100%',
        width: '100%',
        backgroundColor: '#252525',
    },
    imageUploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    imageUploadingText: {
        color: 'white',
        fontSize: 14,
        marginTop: 5,
    },
    deleteImageIcon: {
        position: 'absolute',
        top: -8,
        right: -8,
        zIndex: 1,
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        padding: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 5,
    },
    addImageOverlayIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        zIndex: 1,
        backgroundColor: 'rgba(26,26,26,0.7)',
        borderRadius: 14,
        padding: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 5,
    },
    noImagesText: {
        color: '#E0E0E0',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 15,
        paddingBottom: 5,
        width: '100%', // Ensure it takes full width
    }
});

export default ProfileImageGrid;