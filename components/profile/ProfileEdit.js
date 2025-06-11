import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, Text, View, TextInput } from 'react-native';
import EditableField from '../particles/EditableField';
import GenderSelector from './edit/GenderSelector';
import InterestsSelector from './edit/InterestSelector';
import SpotifySection from './edit/SpotifySelection';
import { FontAwesome } from '@expo/vector-icons';
import UniversitySelector from './edit/UniversitySelector'; // Our new component
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
        languages: false
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

  const [education, setEducation] = useState({
    university: null,
  });

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
    setUpdatedData(prev => ({
      ...prev,
      [field]: value
    }));
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
      <EditableField
        title="Name"
        value={`${updatedData.displayFirstName} ${updatedData.displayLastName}`}
        isEditing={editModes.name}
        onEdit={() => toggleEditMode('name')}
        onChangeText={(text) => handleFieldChange('displayName', text)}
      />
      <EditableField
        title="Age"
        value={updatedData.age.toString()}
        isEditing={editModes.age}
        onEdit={() => toggleEditMode('age')}
        onChangeText={(text) => handleFieldChange('age', text)}
        keyboardType="numeric"
      />
      <EditableField
        title="Bio"
        value={updatedData.bio}
        isEditing={editModes.bio}
        onEdit={() => toggleEditMode('bio')}
        onChangeText={(text) => handleFieldChange('bio', text)}
        isMultiline={true}
      />
      
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.title}>Gender</Text>
          <TouchableOpacity 
            onPress={() => toggleEditMode('gender')} 
            style={[styles.editButton, editModes.gender && styles.editButtonActive]}
          >
            <FontAwesome name="pencil" size={18} color="white" />
          </TouchableOpacity>
        </View>
        {editModes.gender ? (
          <GenderSelector
            selectedGender={updatedData.gender}
            onGenderSelect={(gender) => handleFieldChange('gender', gender)}
          />
        ) : (
          <Text style={styles.valueText}>{updatedData.gender}</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.title}>Interests</Text>
          <TouchableOpacity 
            onPress={() => toggleEditMode('interests')} 
            style={[styles.editButton, editModes.interests && styles.editButtonActive]}
          >
            <FontAwesome name="pencil" size={18} color="white" />
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
            <Text style={styles.title}>Languages</Text>
            <TouchableOpacity 
            onPress={() => toggleEditMode('languages')} 
            style={[styles.editButton, editModes.languages && styles.editButtonActive]}
            >
            <FontAwesome name="pencil" size={18} color="white" />
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
                    <Text style={styles.title}>Education</Text>
                    <TouchableOpacity 
                        onPress={() => toggleEditMode('education')} 
                        style={[styles.editButton, editModes.education && styles.editButtonActive]}
                    >
                        <FontAwesome name="pencil" size={18} color="white" />
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

      <SpotifySection
        spotifyAuthToken={null}
        spotifySongs={[]}
        onAuthRequest={() => {}}
        onSongSelect={() => {}}
      />
      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  section: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 15,
    padding: 8,
  },
  editButtonActive: {
    backgroundColor: '#D9043D',
  },
  valueText: {
    color: 'white',
    fontSize: 16,
    marginTop: 0,
    marginBottom: 10,
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#D9043D',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    marginHorizontal: 20,
    alignItems: 'center',
    marginBottom: 80,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileEdit;