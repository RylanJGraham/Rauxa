import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const EditableFieldEvent = ({ 
  title, 
  value, 
  isEditing, 
  onEdit, 
  onChangeText, 
  isMultiline, 
  keyboardType 
}) => {
  // Determine what to display in the header: original title or updated value
  const displayedTitle = !isEditing && value ? value : title;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{displayedTitle}</Text>
        <TouchableOpacity 
          onPress={onEdit} 
          style={[styles.editButton, isEditing && styles.editButtonActive]}
        >
          <FontAwesome name="pencil" size={18} color="white" />
        </TouchableOpacity>
      </View>
      {isEditing ? (
        isMultiline ? (
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={value}
            onChangeText={onChangeText}
            multiline
            placeholder={`Enter ${title}`}
            placeholderTextColor="#A9A9A9"
          />
        ) : (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholder={`Enter ${title}`}
            placeholderTextColor="#A9A9A9"
          />
        )
      ) : (
        <Text style={styles.valueText}>{value}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    paddingHorizontal: 15, // Increased padding for a spacious feel
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9', // Light grey border
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    color: '#333', // Dark grey color for better contrast
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    paddingRight: 10, // Prevent title from clashing with button
  },
  editButton: {
    backgroundColor: '#007BFF', // Blue color for edit button
    borderRadius: 25,
    padding: 10,
  },
  editButtonActive: {
    backgroundColor: '#28a745', // Green when active (for confirmation of edits)
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#007BFF', // Blue border for input
    borderRadius: 10,
    backgroundColor: '#F8F9FA', // Light grey background for input field
    color: '#333', // Dark text for readability
    textAlign: 'left',
    fontSize: 16,
    padding: 12,
    marginBottom: 15,
    marginTop: 8,
  },
  bioInput: {
    height: 100, // Increased height for multiline bio input
    textAlignVertical: 'top',
  },
  valueText: {
    color: '#333', // Dark text for value display
    fontSize: 16,
    marginTop: 0,
    marginBottom: 0,
    padding: 12,
  },
});

export default EditableFieldEvent;
