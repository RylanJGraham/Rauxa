import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalHeading}>{modalTitle}</Text>
          {editingField === 'date' || editingField === 'time' ? (
            <DateTimePicker
              testID="modalPicker"
              value={tempSelectedDate || new Date()}
              mode={editingField === 'date' ? 'date' : 'time'}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateOrTimeChange}
              minimumDate={editingField === 'date' ? new Date() : undefined}
              textColor={Platform.OS === 'ios' ? 'white' : undefined} // Apply textColor for iOS only, Android often handles this differently
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
              placeholderTextColor="#ccc"
              autoFocus={true}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: '#0367A6',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    marginTop: 15,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  buttonCancel: {
    backgroundColor: '#A6B1C4',
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
    color: '#000',
  },
});

export default GenericEditModal;