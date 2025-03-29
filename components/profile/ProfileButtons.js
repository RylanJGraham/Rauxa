import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const ProfileButtons = ({ setViewMode, viewMode }) => (
  <View style={styles.buttonRow}>
    
    {/* Settings Button (Left) */}
    <TouchableOpacity style={styles.iconButton}>
      <FontAwesome name="cogs" size={24} color="white" />
    </TouchableOpacity>

    {/* Centered Profile Toggle Buttons */}
    <View style={styles.profileToggleWrapper}>
      <TouchableOpacity
        onPress={() => setViewMode('profile')}
        style={[styles.toggleButton, viewMode === 'profile' && styles.activeButton]}>
        <FontAwesome name="eye" size={18} color="white" />
        <Text style={styles.buttonText}>View</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setViewMode('edit')}
        style={[styles.toggleButton, viewMode === 'edit' && styles.activeButton]}>
        <FontAwesome name="edit" size={18} color="white" />
        <Text style={styles.buttonText}>Edit</Text>
      </TouchableOpacity>
    </View>

    {/* Stats Button (Right) */}
    <TouchableOpacity style={styles.iconButton}>
      <FontAwesome name="bar-chart" size={24} color="white" />
    </TouchableOpacity>

  </View>
);

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  iconButton: {
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  profileToggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#012840',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  activeButton: {
    backgroundColor: "#D9043D",
  },
  buttonText: {
    color: "white",
    marginLeft: 5,
  },
});

export default ProfileButtons;
