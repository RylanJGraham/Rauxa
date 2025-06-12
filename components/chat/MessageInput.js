// components/chat/MessageInput.js
import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MessageInput = ({ value, onChangeText, onSendMessage }) => {
  return (
    // KeyboardAvoidingView is typically placed around the content that needs to
    // move when the keyboard appears. In this case, the input container itself.
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? -10 : 100} // Adjust offset as needed
      style={styles.keyboardAvoidingContainer}
    >
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#EAEAEA80" // Darker placeholder for contrast
          value={value}
          onChangeText={onChangeText}
          multiline // Allow multi-line input
          // Max height to prevent excessive growth
          maxHeight={120}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={onSendMessage}
          disabled={value.trim() === ''} // Disable if input is empty
        >
          {/* NEW: Replaced Text with Ionicons */}
          <Ionicons name="send" size={24} color={styles.sendButtonIcon.color} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    // This style ensures the KeyboardAvoidingView takes necessary space
    // and doesn't interfere with the layout above it.
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16, // Matching your ChatDetailScreen's padding
    backgroundColor: 'transparent', // Let LinearGradient handle background
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)', // Subtle separator
    marginBottom: Platform.OS === 'android' ? 60 : 40,
  },
  textInput: {
    flex: 1, // Take up available space
    borderWidth: 1.5,
    borderColor: '#D9043D', // White border from SearchBar
    borderRadius: 15, // Rounded corners from SearchBar
    backgroundColor: '#333333', // Dark background from SearchBar
    color: '#EAEAEA', // Light text color
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10, // Space between input and button
    // Shadow properties from SearchBar
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sendButton: {
    backgroundColor: '#D9043D',
    borderRadius: 15, // Make it slightly rounded
    paddingVertical: 10, // Adjusted padding to make it more square/circular for icon
    paddingHorizontal: 12, // Adjusted padding for icon
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    aspectRatio: 1, // Make it square
  },
  sendButtonIcon: { // NEW: Style for the icon color
    color: '#FFF',
  },
});

export default MessageInput;
