// EditableField.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EditableField = ({ title, value, isEditing, onEdit, onChangeText, keyboardType, isMultiline = false, placeholder = '' }) => {
    const [localValue, setLocalValue] = useState(value);

    // Update localValue if prop value changes (e.g., after parent save)
    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleDone = () => {
        onChangeText(localValue);
        onEdit(); // Toggle editing mode off
    };

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <Text style={styles.sectionTitleText}>{title}</Text>
                <TouchableOpacity
                    onPress={isEditing ? handleDone : onEdit}
                    style={[styles.editButton, isEditing && styles.editButtonActive]}
                >
                    <Ionicons name={isEditing ? "checkmark-done-outline" : "pencil"} size={18} color="white" />
                    <Text style={styles.editButtonText}>{isEditing ? "Done" : "Edit"}</Text>
                </TouchableOpacity>
            </View>
            {isEditing ? (
                <TextInput
                    style={[styles.inputField, isMultiline && styles.multilineInput]}
                    onChangeText={setLocalValue}
                    value={localValue}
                    keyboardType={keyboardType}
                    multiline={isMultiline}
                    placeholder={placeholder}
                    placeholderTextColor="#888" // So placeholder is visible
                    returnKeyType={isMultiline ? "default" : "done"}
                    onSubmitEditing={isMultiline ? undefined : handleDone} // Save on "done" for single line
                    autoCapitalize="words" // Good for names
                />
            ) : (
                <Text style={styles.valueText}>{value || `No ${title.toLowerCase()} entered`}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        backgroundColor: '#1A1A1A',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitleText: {
        color: '#F2BB47',
        fontSize: 20,
        fontWeight: 'bold',
    },
    editButton: {
        backgroundColor: '#F2BB47',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    editButtonText: {
        color: 'white',
        fontSize: 14,
        marginLeft: 5,
        fontWeight: '500',
    },
    editButtonActive: {
        backgroundColor: '#E0A800',
    },
    valueText: {
        color: '#E0E0E0',
        fontSize: 16,
        marginTop: 5,
        paddingHorizontal: 5,
    },
    inputField: {
        backgroundColor: '#2A2A2A', // Darker input field background
        color: '#E0E0E0', // Light text color
        borderRadius: 8, // Rounded input corners
        paddingVertical: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#4A4A4A', // Subtle border
    },
    multilineInput: {
        minHeight: 80, // Larger height for bio
        textAlignVertical: 'top', // Text starts at the top
    },
});

export default EditableField;