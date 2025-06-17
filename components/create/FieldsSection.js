import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FieldsSection = ({
  title,
  selectedDate,
  groupSize,
  location,
  description,
  tags,
  openEditModal,
  formatDateForDisplay,
  formatTimeForDisplay,
  handleOpenLocation,
  onOpenTagsModal,
}) => {
  const EDIT_ICON_NAME = "ellipsis-horizontal-circle-outline";

  const renderField = (label, value, fieldKey, iconName, isLocation = false, action = null) => (
    <TouchableOpacity
      style={styles.clickableFieldWrapper}
      onPress={() => action ? action() : openEditModal(fieldKey, value, `Edit ${label}`)}
    >
      <Ionicons name={iconName} size={24} color="#F2BB47" style={styles.fieldIcon} />
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value || `Set ${label}`}</Text>
      </View>
      {isLocation && value ? (
        <TouchableOpacity style={styles.mapButton} onPress={handleOpenLocation}>
          <Ionicons name="map" size={22} color="#F2BB47" />
        </TouchableOpacity>
      ) : (
        <View style={styles.editIconContainer}>
          <Ionicons name={EDIT_ICON_NAME} size={24} color="#F2BB47" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Edit Event Details</Text>

      {renderField('Title', title, 'title', 'bookmark-outline')}
      {renderField('Date', formatDateForDisplay(selectedDate), 'date', 'calendar-outline')}
      {renderField('Time', formatTimeForDisplay(selectedDate), 'time', 'time-outline')}
      {renderField('Group Size', groupSize, 'groupSize', 'people-outline')}
      {renderField('Location', location, 'location', 'location-outline', true)}

      <TouchableOpacity
        style={styles.clickableFieldWrapper}
        onPress={onOpenTagsModal}
      >
        <Ionicons name="pricetag-outline" size={24} color="#F2BB47" style={styles.fieldIcon} />
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>Tags</Text>
          <Text style={styles.fieldValue}>
            {tags.length > 0 ? tags.join(', ') : 'Add Tags'}
          </Text>
        </View>
        <View style={styles.editIconContainer}>
          <Ionicons name={EDIT_ICON_NAME} size={24} color="#F2BB47" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.clickableFieldWrapper, styles.descriptionWrapper]}
        onPress={() => openEditModal('description', description, 'Edit Description')}
      >
        <Ionicons name="document-text-outline" size={24} color="#F2BB47" style={styles.fieldIcon} />
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>Description</Text>
          <Text style={styles.descriptionValue}>{description || 'Add a description...'}</Text>
        </View>
        <View style={styles.editIconContainer}>
          <Ionicons name={EDIT_ICON_NAME} size={24} color="#F2BB47" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    backgroundColor: '#000', // Solid black background for the entire section
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 15, // Added horizontal padding here
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  clickableFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34394C', // The specified dark blue/grey color
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  fieldIcon: {
    marginRight: 10,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 2,
  },
  fieldValueContainer: {
    // Not directly used as TouchableOpacity is the wrapper
  },
  fieldValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  descriptionWrapper: {
    alignItems: 'flex-start',
    minHeight: 100,
    paddingVertical: 12,
  },
  descriptionValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    lineHeight: 22,
    marginTop: 3,
  },
  editIconContainer: {
    padding: 6,
    marginLeft: 10,
  },
  mapButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 25,
    padding: 8,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#F2BB47',
  },
});

export default FieldsSection;