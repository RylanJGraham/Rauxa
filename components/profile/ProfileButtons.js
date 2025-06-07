import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Add handleOpenSettingsModal to the destructured props
const ProfileButtons = ({ setViewMode, viewMode, handleLogout, handleOpenSettingsModal }) => (
    <View style={styles.buttonRow}>

        {/* Settings Button (Left) - NOW CALLS handleOpenSettingsModal */}
        <TouchableOpacity style={styles.iconButton} onPress={handleOpenSettingsModal}>
            <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>

        {/* Centered Profile Toggle Buttons */}
        <View style={styles.profileToggleWrapper}>
            <TouchableOpacity
                onPress={() => setViewMode('profile')}
                style={[styles.toggleButton, viewMode === 'profile' && styles.activeButton]}>
                <Ionicons name="eye-outline" size={18} color="white" />
                <Text style={styles.buttonText}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => setViewMode('edit')}
                style={[styles.toggleButton, viewMode === 'edit' && styles.activeButton]}>
                <Ionicons name="pencil-outline" size={18} color="white" />
                <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
        </View>

        {/* Logout Button (Right) */}
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>

    </View>
);

const styles = StyleSheet.create({
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    iconButton: {
        backgroundColor: '#0367A6',
        padding: 10,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    profileToggleWrapper: {
        flexDirection: 'row',
        backgroundColor: '#012840',
        borderRadius: 30,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    toggleButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    activeButton: {
        backgroundColor: "#D9043D",
    },
    buttonText: {
        color: "white",
        marginLeft: 5,
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default ProfileButtons;