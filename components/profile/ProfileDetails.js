import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ProfileDetails = ({ label, value, onEdit }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}:</Text>
    <Text style={styles.rowValue}>{value || 'Not provided'}</Text>
    <TouchableOpacity onPress={onEdit} style={styles.editButton}>
      <Text style={styles.editButtonText}>Edit</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  rowValue: {
    fontSize: 16,
    color: 'white',
    flex: 1,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: '#D9043D',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  editButtonText: {
    color: 'black',
    fontSize: 16,
  },
});

export default ProfileDetails;
