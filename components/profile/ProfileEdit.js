import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, Text } from 'react-native';
import EditableField from '../particles/EditableField';
import GenderSelector from './edit/GenderSelector';
import InterestsSelector from './edit/InterestsSelector';
import SpotifySection from './edit/SpotifySelection';

const ProfileEdit = ({ profileData, onSaveProfile }) => {
  const [updatedData, setUpdatedData] = useState({ ...profileData });

  const handleSave = () => {
    onSaveProfile(updatedData);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <EditableField
        title="Name"
        value={`${updatedData.displayFirstName} ${updatedData.displayLastName}`}
        onEdit={() => {}}  // Handle name editing logic
      />
      <EditableField
        title="Age"
        value={updatedData.age.toString()}
        onEdit={() => {}}  // Handle age editing logic
        keyboardType="numeric"
      />
      <EditableField
        title="Bio"
        value={updatedData.bio}
        onEdit={() => {}}  // Handle bio editing logic
        isMultiline={true}
      />
      <GenderSelector
        selectedGender={updatedData.gender}
        onGenderSelect={(gender) => setUpdatedData({ ...updatedData, gender })}
      />
      <InterestsSelector
        selectedInterests={updatedData.interests}
        onInterestSelect={(interest) => {}}  // Handle interest selection
      />
      <SpotifySection
        spotifyAuthToken={null}  // Pass actual Spotify auth token here
        spotifySongs={[]}  // Pass actual songs here
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
  saveButton: {
    backgroundColor: '#D9043D',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileEdit;
