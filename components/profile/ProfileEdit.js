import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, Text, View, TextInput } from 'react-native';
import EditableField from '../particles/EditableField'; // Assuming this component handles its own styling
import GenderSelector from './edit/GenderSelector';
import InterestsSelector from './edit/InterestSelector';
import SpotifySection from './edit/SpotifySelection';
import { Ionicons } from '@expo/vector-icons'; // Changed from FontAwesome to Ionicons
import UniversitySelector from './edit/UniversitySelector';
import LanguagesSelector from './edit/LanguageSelector';


const ProfileEdit = ({ profileData, onSaveProfile }) => {
    // Update the state initialization
    const [updatedData, setUpdatedData] = useState({
      ...profileData,
      education: profileData.education || {
        university: "",
      },
      languages: profileData.languages || []
    });


    const [editModes, setEditModes] = useState({
      name: false,
      age: false,
      bio: false,
      gender: false,
      interests: false,
      education: false,
      languages: false,
      spotify: false, // Added spotify edit mode if applicable
    });

    // Add this handler function
    const handleLanguageSelect = (language) => {
      const updatedLanguages = updatedData.languages.includes(language)
        ? updatedData.languages.filter(l => l !== language)
        : [...updatedData.languages, language];
      setUpdatedData(prev => ({
        ...prev,
        languages: updatedLanguages
      }));
    };

    // Assuming education state is managed by updatedData.education
    // const [education, setEducation] = useState({
    //   university: null,
    // });

    const handleUniversitySelect = (university) => {
      setUpdatedData(prev => ({
        ...prev,
        education: {
          ...prev.education,
          university: university.name
        }
      }));
    };

    const toggleEditMode = (field) => {
      setEditModes(prev => ({
        ...prev,
        [field]: !prev[field]
      }));
    };

    const handleFieldChange = (field, value) => {
      // Special handling for name to split into displayFirstName and displayLastName
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

    const handleInterestSelect = (interest) => {
      const updatedInterests = updatedData.interests.includes(interest)
        ? updatedData.interests.filter(i => i !== interest)
        : [...updatedData.interests, interest];
      setUpdatedData(prev => ({
        ...prev,
        interests: updatedInterests
      }));
    };

    const handleSave = () => {
      onSaveProfile(updatedData);
    };

    return (
      <ScrollView contentContainerStyle={styles.container}>
        {/* EditableField components - assuming they will be styled externally or internally
            to match the new card-like sections below for a consistent look. */}
        <EditableField
          title="Name"
          value={`${updatedData.displayFirstName || ''} ${updatedData.displayLastName || ''}`}
          isEditing={editModes.name}
          onEdit={() => toggleEditMode('name')}
          onChangeText={(text) => handleFieldChange('displayName', text)}
          // You might want to pass a style prop to EditableField if it supports it,
          // to make it look like the sections below. E.g., containerStyle={styles.section}
        />
        <EditableField
          title="Age"
          value={updatedData.age?.toString() || ''} // Handle potential null/undefined age
          isEditing={editModes.age}
          onEdit={() => toggleEditMode('age')}
          onChangeText={(text) => handleFieldChange('age', text)}
          keyboardType="numeric"
          // containerStyle={styles.section}
        />
        <EditableField
          title="Bio"
          value={updatedData.bio || ''}
          isEditing={editModes.bio}
          onEdit={() => toggleEditMode('bio')}
          onChangeText={(text) => handleFieldChange('bio', text)}
          isMultiline={true}
          // containerStyle={styles.section}
        />

        {/* Gender Section */}
        <View style={styles.section}>
          <View style={styles.header}>
            <Text style={styles.sectionTitleText}>Gender</Text>
            <TouchableOpacity
              onPress={() => toggleEditMode('gender')}
              style={[styles.editButton, editModes.gender && styles.editButtonActive]}
            >
              <Ionicons name="pencil" size={18} color="white" />
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
            {/* You might want a different icon or a direct "Connect" button for Spotify */}
            <TouchableOpacity
              onPress={() => toggleEditMode('spotify')} // Assuming a Spotify edit mode exists or can be simulated
              style={[styles.editButton, editModes.spotify && styles.editButtonActive]}
            >
              <Ionicons name="musical-notes-outline" size={18} color="white" />
            </TouchableOpacity>
          </View>
          <SpotifySection
            spotifyAuthToken={null} // Replace with actual token
            spotifySongs={[]} // Replace with actual songs
            onAuthRequest={() => {Alert.alert("Spotify Connect", "Connecting to Spotify...")}}
            onSongSelect={() => {Alert.alert("Spotify Song Select", "Selecting song...")}}
          />
        </View>


        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 80, // Add more padding at the bottom for the save button
    backgroundColor: '#34394C', // A base background for the scroll view area
  },
  section: {
    backgroundColor: '#1A1A1A', // Dark grey background for each section card
    borderRadius: 15,
    padding: 15,
    marginBottom: 15, // Space between sections
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
    marginBottom: 10, // Space below the header in each section
  },
  sectionTitleText: { // Renamed from 'title' to avoid conflict and be more specific
    color: '#F2BB47', // Accent yellow for section titles
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#F2BB47', // Nice yellow background
    borderRadius: 12, // Rounded corners
    padding: 10, // Padding around the icon
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editButtonActive: {
    backgroundColor: '#E0A800', // A slightly darker yellow when in active edit mode
  },
  valueText: {
    color: '#E0E0E0', // Lighter white/grey for value text
    fontSize: 16,
    marginTop: 5, // Small space below label if there was one, or just general top margin
    paddingHorizontal: 5, // Small horizontal padding for text within the section card
  },
  // Removed old styles that were superseded by 'section'
  // and 'sectionTitleText', 'editButton', 'valueText'
  saveButton: {
    backgroundColor: '#D9043D', // Your primary red
    paddingVertical: 18, // Larger vertical padding
    borderRadius: 12, // Consistent rounded corners
    marginTop: 30, // More space above save button
    marginHorizontal: 10, // Ensure horizontal margin to frame it
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40, // Increased bottom margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 20, // Larger font size
    fontWeight: 'bold',
  },
});

export default ProfileEdit;