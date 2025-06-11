import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// FieldButton sub-component (defined within FieldsSection to keep it cohesive)
const FieldButton = ({ label, value, onPress, iconName, isLocationField = false, handleOpenLocation, customStyles }) => (
  <TouchableOpacity style={[styles.fieldButton, customStyles]} onPress={onPress}>
    <View style={styles.fieldButtonContent}>
      <Ionicons name={iconName} size={24} color="#fff" style={styles.fieldIcon} />
      <View style={styles.fieldLabelValue}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>
          {value || `Tap to enter ${label.toLowerCase()}`}
        </Text>
      </View>
      {isLocationField && value ? (
        <TouchableOpacity onPress={handleOpenLocation} style={styles.mapIcon}>
          <Ionicons name="map-outline" size={24} color="#F2BB47" />
        </TouchableOpacity>
      ) : null}
    </View>
    <View style={styles.fieldDivider} />
  </TouchableOpacity>
);

// New component for Date and Time in a row
const DateTimeFieldRow = ({ selectedDate, openEditModal, formatDateForDisplay, formatTimeForDisplay }) => (
  <View style={styles.dateTimeRow}>
    <FieldButton
      label="Date"
      value={formatDateForDisplay(selectedDate)}
      onPress={() => openEditModal('date', selectedDate, 'Select Date')}
      iconName="calendar-outline"
      customStyles={styles.dateTimeFieldButton} // Apply specific style for width
    />
    <FieldButton
      label="Time"
      value={formatTimeForDisplay(selectedDate)}
      onPress={() => openEditModal('time', selectedDate, 'Select Time')}
      iconName="time-outline"
      customStyles={styles.dateTimeFieldButton} // Apply specific style for width
    />
  </View>
);

const FieldsSection = ({
  title,
  selectedDate,
  groupSize,
  location,
  description,
  tags, // <--- NEW: Pass tags here
  openEditModal,
  formatDateForDisplay,
  formatTimeForDisplay,
  handleOpenLocation,
  onOpenTagsModal // <--- NEW: Callback for opening tags modal
}) => {
  return (
    <View style={styles.fieldsContainer}>
      <FieldButton
        label="Event Title"
        value={title}
        onPress={() => openEditModal('title', title, 'Edit Event Title')}
        iconName="chatbubble-ellipses-outline"
      />

      {/* New Date and Time Row Component */}
      <DateTimeFieldRow
        selectedDate={selectedDate}
        openEditModal={openEditModal}
        formatDateForDisplay={formatDateForDisplay}
        formatTimeForDisplay={formatTimeForDisplay}
      />

      <FieldButton
        label="Group Size"
        value={groupSize}
        onPress={() => openEditModal('groupSize', groupSize, 'Set Group Size')}
        iconName="people-outline"
      />
      <FieldButton
        label="Location"
        value={location}
        onPress={() => openEditModal('location', location, 'Set Location')}
        iconName="location-outline"
        isLocationField={true}
        handleOpenLocation={handleOpenLocation}
      />
      {/* <--- NEW: Tags Field Button */}
      <FieldButton
        label="Tags"
        value={tags && tags.length > 0 ? tags.join(', ') : 'Select event tags'}
        onPress={onOpenTagsModal} // Open tags modal
        iconName="pricetag-outline"
      />
      <FieldButton
        label="Description"
        value={description}
        onPress={() => openEditModal('description', description, 'Edit Description')}
        iconName="information-circle-outline"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fieldsContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  fieldButton: {
    paddingVertical: 10,
  },
  fieldButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  fieldIcon: {
    marginRight: 10,
  },
  fieldLabelValue: {
    flex: 1,
  },
  fieldLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
  },
  fieldValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: '#fff',
    opacity: 0.3,
    marginTop: 5,
    marginBottom: 10,
  },
  mapIcon: {
    marginLeft: 10,
    padding: 5,
  },
  // Styles for the new date/time row
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
    marginTop: 10,
  },
  dateTimeFieldButton: {
    width: '48%',
    paddingHorizontal: 0,
  },
});

export default FieldsSection;