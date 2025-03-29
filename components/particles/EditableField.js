import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const EditableField = ({ title, value, onEdit, onChangeText, isMultiline, keyboardType }) => {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <FontAwesome name="pencil" size={18} color="white" />
        </TouchableOpacity>
      </View>
      {isMultiline ? (
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
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
});

export default EditableField;
