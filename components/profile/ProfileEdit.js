import React, { useState, useEffect } from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import EditableField from '../particles/EditableField'; // We will update this next
import GenderSelector from './edit/GenderSelector';
import InterestsSelector from './edit/InterestSelector';
import SpotifySection from './edit/SpotifySelection';
import { Ionicons } from '@expo/vector-icons';
import UniversitySelector from './edit/UniversitySelector';
import LanguagesSelector from './edit/LanguageSelector';
import { auth, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import ProfileImageGrid from './ProfileImageGrid';

const ProfileEdit = ({ profileData, onSaveProfile, userId }) => {
    const [updatedData, setUpdatedData] = useState(() => ({
        ...profileData,
        education: profileData.education || { university: "" },
        languages: profileData.languages || [],
        profileImages: Array.isArray(profileData.profileImages) ? [...profileData.profileImages] : [],
    }));

    const [editModes, setEditModes] = useState({
        name: false, age: false, bio: false, gender: false, interests: false,
        education: false, languages: false, spotify: false, profileImages: false,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    useEffect(() => {
        setUpdatedData(prev => ({
            ...profileData,
            education: profileData.education || { university: "" },
            languages: profileData.languages || [],
            profileImages: Array.isArray(profileData.profileImages) ? [...profileData.profileImages] : [],
        }));
    }, [profileData]);

    const handleProfileImagesChange = (newImages) => {
        setUpdatedData(prev => ({
            ...prev,
            profileImages: newImages
        }));
    };

    const uploadImageToFirebase = async (uri, index) => {
        if (!userId) {
            console.error("User ID is missing for image upload in ProfileEdit.");
            throw new Error("User ID is required for image upload.");
        }
        const filename = `profilePics/${userId}/${userId}_${index}.webp`;
        const storageRef = ref(storage, filename);

        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            console.log(`ProfileEdit: Image uploaded for slot ${index}: ${downloadURL}`);
            return downloadURL;
        } catch (error) {
            console.error(`ProfileEdit: Firebase upload error for index ${index}:`, error);
            throw new Error(`Failed to upload image for slot ${index}: ${error.message}`);
        }
    };


    const handleSave = async () => {
        if (isSaving || isUploadingImages) {
            return;
        }

        setIsSaving(true);
        setIsUploadingImages(true);

        try {
            const imagesToProcess = [...updatedData.profileImages];
            const uploadPromises = [];
            const finalImageUrls = [];

            for (let i = 0; i < imagesToProcess.length; i++) {
                const imageItem = imagesToProcess[i];

                if (imageItem === null) {
                    finalImageUrls[i] = null;
                } else if (imageItem.startsWith('file://')) {
                    uploadPromises.push(
                        uploadImageToFirebase(imageItem, i)
                            .then(downloadURL => {
                                finalImageUrls[i] = downloadURL;
                            })
                            .catch(error => {
                                console.error(`ProfileEdit: Error during image upload promise at index ${i}:`, error);
                                finalImageUrls[i] = null;
                                throw error;
                            })
                    );
                } else {
                    finalImageUrls[i] = imageItem;
                }
            }

            await Promise.all(uploadPromises);

            setIsUploadingImages(false);

            const imagesForFirestore = finalImageUrls.filter(Boolean);

            const dataToSave = {
                ...updatedData,
                profileImages: imagesForFirestore,
            };

            await onSaveProfile(dataToSave);

        } catch (error) {
            console.error("ProfileEdit: Error saving profile (upload phase or passing to parent):", error);
            Alert.alert("Error", "Failed to process and save profile images. " + error.message);
        } finally {
            setIsSaving(false);
            setIsUploadingImages(false);
        }
    };


    const handleLanguageSelect = (language) => { setUpdatedData(prev => ({ ...prev, languages: updatedData.languages.includes(language) ? updatedData.languages.filter(l => l !== language) : [...updatedData.languages, language] })); };
    const handleUniversitySelect = (university) => { setUpdatedData(prev => ({ ...prev, education: { ...prev.education, university: university.name } })); };
    const toggleEditMode = (field) => { setEditModes(prev => ({ ...prev, [field]: !prev[field] })); };
    const handleFieldChange = (field, value) => {
        if (field === 'displayName') {
            const nameParts = value.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            setUpdatedData(prev => ({
                ...prev,
                displayFirstName: firstName,
                displayLastName: lastName,
            }));
        } else {
            setUpdatedData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };
    const handleInterestSelect = (interest) => { setUpdatedData(prev => ({ ...prev, interests: updatedData.interests.includes(interest) ? updatedData.interests.filter(i => i !== interest) : [...updatedData.interests, interest] })); };


    return (
        <GestureHandlerRootView style={styles.rootView}>
            <ScrollView contentContainerStyle={styles.container}>
                <ProfileImageGrid
                    profileImages={updatedData.profileImages}
                    onImagesChange={handleProfileImagesChange}
                    isEditMode={editModes.profileImages}
                    onToggleEditMode={() => toggleEditMode('profileImages')}
                    userId={userId}
                />

                {/* Using a consistent EditableField component */}
                <EditableField
                    title="Name"
                    value={`${updatedData.displayFirstName || ''} ${updatedData.displayLastName || ''}`}
                    isEditing={editModes.name}
                    onEdit={() => toggleEditMode('name')}
                    onChangeText={(text) => handleFieldChange('displayName', text)}
                    placeholder="Enter your full name" // Added placeholder
                />
                <EditableField
                    title="Age"
                    value={updatedData.age?.toString() || ''}
                    isEditing={editModes.age}
                    onEdit={() => toggleEditMode('age')}
                    onChangeText={(text) => handleFieldChange('age', text)}
                    keyboardType="numeric"
                    placeholder="Your age" // Added placeholder
                />
                <EditableField
                    title="Bio"
                    value={updatedData.bio || ''}
                    isEditing={editModes.bio}
                    onEdit={() => toggleEditMode('bio')}
                    onChangeText={(text) => handleFieldChange('bio', text)}
                    isMultiline={true}
                    placeholder="Tell us about yourself..." // Added placeholder
                />

                {/* Gender Selector Section */}
                <View style={styles.section}>
                    <View style={styles.header}>
                        <Text style={styles.sectionTitleText}>Gender</Text>
                        <TouchableOpacity
                            onPress={() => toggleEditMode('gender')}
                            style={[styles.editButton, editModes.gender && styles.editButtonActive]}
                        >
                            <Ionicons name="pencil" size={18} color="white" />
                            <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                    {editModes.gender ? (
                        <GenderSelector
                            selectedGender={updatedData.gender}
                            onGenderSelect={(gender) => handleFieldChange('gender', gender)}
                        />
                    ) : (
                        <Text style={styles.valueText}>{updatedData.gender || 'Not specified'}</Text>
                    )}
                </View>

                {/* Interests Section */}
                <View style={styles.section}>
                    <View style={styles.header}>
                        <Text style={styles.sectionTitleText}>Interests</Text>
                        <TouchableOpacity
                            onPress={() => toggleEditMode('interests')}
                            style={[styles.editButton, editModes.interests && styles.editButtonActive]}
                        >
                            <Ionicons name="pencil" size={18} color="white" />
                            <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                    {editModes.interests ? (
                        <InterestsSelector
                            selectedInterests={updatedData.interests}
                            onInterestSelect={handleInterestSelect}
                        />
                    ) : (
                        <Text style={styles.valueText}>
                            {updatedData.interests.length > 0
                                ? updatedData.interests.join(', ')
                                : 'No interests selected'}
                        </Text>
                    )}
                </View>

                {/* Languages Section */}
                <View style={styles.section}>
                    <View style={styles.header}>
                        <Text style={styles.sectionTitleText}>Languages</Text>
                        <TouchableOpacity
                            onPress={() => toggleEditMode('languages')}
                            style={[styles.editButton, editModes.languages && styles.editButtonActive]}
                        >
                            <Ionicons name="pencil" size={18} color="white" />
                            <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                    {editModes.languages ? (
                        <LanguagesSelector
                            selectedLanguages={updatedData.languages}
                            onLanguageSelect={handleLanguageSelect}
                        />
                    ) : (
                        <Text style={styles.valueText}>
                            {updatedData.languages.length > 0
                                ? updatedData.languages.join(', ')
                                : 'No languages selected'}
                        </Text>
                    )}
                </View>

                {/* Education Section */}
                <View style={styles.section}>
                    <View style={styles.header}>
                        <Text style={styles.sectionTitleText}>Education</Text>
                        <TouchableOpacity
                            onPress={() => toggleEditMode('education')}
                            style={[styles.editButton, editModes.education && styles.editButtonActive]}
                        >
                            <Ionicons name="pencil" size={18} color="white" />
                            <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                    {editModes.education ? (
                        <>
                            <UniversitySelector
                                initialValue={updatedData.education.university}
                                onSelectUniversity={handleUniversitySelect}
                            />
                        </>
                    ) : (
                        <View>
                            <Text style={styles.valueText}>
                                {updatedData.education.university || "Not specified"}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Spotify Section */}
                <View style={styles.section}>
                    <View style={styles.header}>
                        <Text style={styles.sectionTitleText}>Spotify</Text>
                        <TouchableOpacity
                            onPress={() => toggleEditMode('spotify')}
                            style={[styles.editButton, editModes.spotify && styles.editButtonActive]}
                        >
                            <Ionicons name="musical-notes-outline" size={18} color="white" />
                            <Text style={styles.editButtonText}>Connect</Text>
                        </TouchableOpacity>
                    </View>
                    <SpotifySection
                        spotifyAuthToken={null}
                        spotifySongs={[]}
                        onAuthRequest={() => { Alert.alert("Spotify Connect", "Connecting to Spotify...") }}
                        onSongSelect={() => { Alert.alert("Spotify Song Select", "Selecting song...") }}
                    />
                </View>

                <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isSaving || isUploadingImages}>
                    {isSaving || isUploadingImages ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Profile</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    rootView: {
        flex: 1,
    },
    container: {
        padding: 20,
        paddingBottom: 80,
    },
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
        flexDirection: 'row', // Align icon and text
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
    valueText: {
        color: '#E0E0E0',
        fontSize: 16,
        marginTop: 5,
        paddingHorizontal: 5,
    },
    saveButton: {
        backgroundColor: '#D9043D',
        paddingVertical: 18,
        borderRadius: 15, // Slightly more rounded
        marginTop: 30,
        marginHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 12,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default ProfileEdit;