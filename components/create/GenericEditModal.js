import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for close button

const GenericEditModal = ({
  visible,
  onClose,
  modalTitle,
  editingField,
  tempModalValue,
  setTempModalValue,
  tempSelectedDate,
  handleDateOrTimeChange,
  handleConfirmModal,
  handleCancelModal
}) => {
  const datePickerValue = tempSelectedDate instanceof Date ? tempSelectedDate : new Date();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCancelModal}>
            <Ionicons name="close-circle-outline" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.modalHeading}>{modalTitle}</Text>
          {editingField === 'date' || editingField === 'time' ? (
            <DateTimePicker
              testID="modalPicker"
              value={datePickerValue}
              mode={editingField === 'date' ? 'date' : 'time'}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateOrTimeChange}
              minimumDate={editingField === 'date' ? new Date() : undefined}
              textColor={Platform.OS === 'ios' ? 'white' : undefined} // For iOS spinner text color
              style={Platform.OS === 'ios' ? styles.datePickerIOS : null} // Apply specific style for iOS
            />
          ) : (
            <TextInput
              style={styles.modalInput}
              value={tempModalValue}
              onChangeText={setTempModalValue}
              keyboardType={editingField === 'groupSize' ? 'numeric' : 'default'}
              multiline={editingField === 'description'}
              numberOfLines={editingField === 'description' ? 4 : 1}
              placeholder={`Enter ${modalTitle.toLowerCase().replace(/edit |set /g, '')}`}
              placeholderTextColor="#888" // Darker placeholder
              autoFocus={true}
              blurOnSubmit={true}
              selectionColor="#F2BB47" // Gold cursor
            />
          )}
          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={[styles.modalButton, styles.buttonCancel]}
              onPress={handleCancelModal}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.buttonConfirm]}
              onPress={handleConfirmModal}
            >
              <Text style={styles.buttonTextBlack}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)', // Darker overlay
  },
  modalView: {
    backgroundColor: '#1A1A2E', // Main dark background
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4, // Stronger shadow
    shadowRadius: 8, // Larger shadow radius
    elevation: 10,
    width: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 25,
  },
  modalInput: {
    width: '100%',
    padding: 15, // Increased padding
    borderWidth: 1,
    borderColor: '#4A4A6A', // Darker border
    borderRadius: 10, // More rounded
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 25,
    backgroundColor: '#2C2C47', // Darker input background
  },
  datePickerIOS: {
    width: '100%', // Ensure it takes full width on iOS
  },
  modalButtonRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginHorizontal: 10,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000', // Add shadow to buttons
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonCancel: {
    backgroundColor: '#888',
  },
  buttonConfirm: {
    backgroundColor: '#F2BB47',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
  buttonTextBlack: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1A1A2E', // Dark blue text for gold button
  },
});

export default GenericEditModal;