import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileButtons = ({ setViewMode, viewMode, handleLogout, handleOpenSettingsModal }) => (
    <View style={styles.buttonRowContainer}> {/* New container to center the row */}
        <View style={styles.buttonRow}>

            {/* Settings Button (Left) */}
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: styles.profileToggleWrapper.backgroundColor }]} onPress={handleOpenSettingsModal}>
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
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: styles.profileToggleWrapper.backgroundColor }]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="white" />
            </TouchableOpacity>

        </View>
    </View> // Close the new container
);

const styles = StyleSheet.create({
    buttonRowContainer: {
        // This new container takes full width and centers its child (`buttonRow`)
        width: '100%',
        alignItems: 'center', // Centers the content horizontally
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '80%', // The row itself still takes 80% width
    },
    iconButton: {
        padding: 6,
        borderRadius: 10,
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