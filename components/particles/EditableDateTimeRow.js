import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // Using FontAwesome
import DateTimePicker from '@react-native-community/datetimepicker';

const EditableDateTimeRow = ({ date, setDate, isEditing }) => {
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(date || new Date());

  // Handle date change
  const handleDateChange = (event, selectedDate) => {
    setSelectedDate(selectedDate || selectedDate);
    setDate(selectedDate || date); // Update the date in parent component
    hideDatePicker();
  };

  // Handle time change
  const handleTimeChange = (event, selectedDate) => {
    setSelectedDate(selectedDate || selectedDate);
    setDate(selectedDate || date); // Update the date with the new time
    hideTimePicker();
  };

  // Show date picker
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  // Hide date picker
  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  // Show time picker
  const showTimePicker = () => {
    setTimePickerVisible(true);
  };

  // Hide time picker
  const hideTimePicker = () => {
    setTimePickerVisible(false);
  };

  // Format the date
  const formattedDate = selectedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Format the time
  const formattedTime = selectedDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.rowContainer}>
      <View style={styles.item}>
        <FontAwesome name="calendar" size={18} color="white" />
        {isEditing ? (
          <TouchableOpacity onPress={showDatePicker}>
            <Text style={styles.text}>{formattedDate}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.text}>{formattedDate}</Text>
        )}
      </View>

      {/* Date picker modal */}
      {isDatePickerVisible && (
        <DateTimePicker
          value={selectedDate || new Date()}  // Ensure the default date is set if date is null
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <View style={styles.item}>
        <FontAwesome name="clock-o" size={18} color="white" />
        {isEditing ? (
          <TouchableOpacity onPress={showTimePicker}>
            <Text style={styles.text}>{formattedTime}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.text}>{formattedTime}</Text>
        )}
      </View>

      {/* Time picker modal */}
      {isTimePickerVisible && (
        <DateTimePicker
          value={selectedDate || new Date()}  // Ensure the default date is set if date is null
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    color: 'white',
    fontSize: 16,
    paddingLeft: 6,
  },
});

export default EditableDateTimeRow;
