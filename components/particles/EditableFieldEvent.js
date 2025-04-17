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
          />
        ) : (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
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
    marginBottom: 10,
    paddingHorizontal: 12, // Add padding on the sides
    paddingBottom: 0,
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
    flex: 1,
    paddingRight: 10, // Prevent title from clashing with button
  },
  editButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 15,
    padding: 8,
  },
  editButtonActive: {
    backgroundColor: '#D9043D',
  },
  input: {
    borderWidth: 2,
    borderColor: '#F2BB47',
    borderRadius: 10,
    backgroundColor: '#00000040',
    color: 'white',
    textAlign: 'left',
    fontSize: 16,
    marginBottom: 10,
    marginTop: 5,
    padding: 8,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  valueText: {
    color: 'white',
    fontSize: 16,
    marginTop: 0,
    marginBottom: 0,
    padding: 8,
  },
});

export default EditableFieldEvent;