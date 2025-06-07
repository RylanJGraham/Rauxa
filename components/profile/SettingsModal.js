import React, { useState } from 'react'; // Added useState for the toggle
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Linking, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application'; // For app version
import { auth, db, storage } from "../../firebase"; // Ensure firebase.js exports storage
import { doc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
import { ref, deleteObject, listAll } from "firebase/storage";
import { reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth";

const SettingsModal = ({ isVisible, onClose, navigation }) => { // Added navigation prop if needed
    const appVersion = Application.nativeApplicationVersion || "N/A"; // Or use Constants.manifest.version in Expo Go
    const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true); // Theoretical toggle state

    // Function to handle opening app settings (for permissions)
    const openAppSettings = () => {
        Linking.openSettings();
    };

    // --- Start: handleDeleteAccount function (from previous response) ---
    const handleDeleteAccount = async () => {
        const user = auth.currentUser;

        if (!user) {
            Alert.alert("Error", "No user is currently signed in.");
            return;
        }

        Alert.alert(
            "Confirm Account Deletion",
            "This action is irreversible and will delete all your data. Are you absolutely sure you want to proceed?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete Account",
                    onPress: async () => {
                        // In a real app, you MUST re-authenticate if auth.currentUser.metadata.lastSignInTime is too old.
                        // Example: Prompt user for password then call reauthenticateWithCredential(user, credential);
                        // For simplicity in this theoretical example, we're skipping explicit reauth prompt,
                        // but it's crucial for production.

                        try {
                            // 1. Delete user's Firestore data: `users/{uid}/ProfileInfo/userinfo`
                            const userProfileRef = doc(db, "users", user.uid, "ProfileInfo", "userinfo");
                            await deleteDoc(userProfileRef);
                            console.log("Firestore profile data deleted.");

                            // 2. Delete user's Firebase Storage images: `profilePics/{userid}/`
                            const profilePicsRef = ref(storage, `profilePics/${user.uid}`);
                            const fileList = await listAll(profilePicsRef);

                            // Delete each file in the folder
                            const deletePromises = fileList.items.map(itemRef => deleteObject(itemRef));
                            await Promise.all(deletePromises);
                            console.log("Storage profile pictures deleted.");

                            // 3. Delete the Firebase Authentication user account
                            await deleteUser(user);
                            console.log("Firebase Auth user deleted.");

                            Alert.alert("Account Deleted", "Your account and all associated data have been permanently deleted.");
                            onClose(); // Close the modal
                            // Navigate user to signup/login screen after successful deletion
                            // If using React Navigation, you might do:
                            // navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
                            // Ensure 'navigation' prop is passed to SettingsModal if you use it.

                        } catch (error) {
                            console.error("Error deleting account:", error);
                            if (error.code === 'auth/requires-recent-login') {
                                Alert.alert("Action Required", "For security, please sign in again to delete your account. (Restart app, then try again)");
                            } else {
                                Alert.alert("Deletion Failed", `Failed to delete account: ${error.message}`);
                            }
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };
    // --- End: handleDeleteAccount function ---

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close-circle" size={30} color="#666" />
                    </TouchableOpacity>

                    <Text style={styles.modalTitle}>Settings</Text>

                    <ScrollView style={styles.settingsScroll}>
                        {/* Account Section */}
                        <Text style={styles.sectionTitle}>Account</Text>
                        <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert("Change Password", "Feature to change password will be here.")}>
                            <Text style={styles.settingText}>Change Password</Text>
                            <Ionicons name="chevron-forward" size={20} color="#555" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
                            <Text style={[styles.settingText, styles.deleteText]}>Delete Account</Text>
                            <Ionicons name="trash-outline" size={20} color="#D9043D" />
                        </TouchableOpacity>

                        {/* Notifications Section */}
                        <Text style={styles.sectionTitle}>Notifications</Text>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingText}>Push Notifications</Text>
                            {/* Visual toggle only */}
                            <TouchableOpacity onPress={() => setPushNotificationsEnabled(!pushNotificationsEnabled)}>
                                <Ionicons
                                    name={pushNotificationsEnabled ? "toggle-sharp" : "toggle-outline"}
                                    size={35}
                                    color={pushNotificationsEnabled ? "#0367A6" : "#CCC"}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Privacy & Permissions Section */}
                        <Text style={styles.sectionTitle}>Privacy & Permissions</Text>
                        <TouchableOpacity style={styles.settingItem} onPress={openAppSettings}>
                            <Text style={styles.settingText}>Location Permissions</Text>
                            <Ionicons name="open-outline" size={20} color="#555" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem} onPress={openAppSettings}>
                            <Text style={styles.settingText}>Image/Camera Permissions</Text>
                            <Ionicons name="open-outline" size={20} color="#555" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem} onPress={() => Linking.openURL('https://rauxa-landing.vercel.app/privacy-policy.html')}> {/* Assuming a privacy policy page */}
                            <Text style={styles.settingText}>Privacy Policy</Text>
                            <Ionicons name="document-text-outline" size={20} color="#555" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem} onPress={() => Linking.openURL('https://rauxa-landing.vercel.app/terms-of-service.html')}> {/* Assuming a TOS page */}
                            <Text style={styles.settingText}>Terms of Service</Text>
                            <Ionicons name="document-text-outline" size={20} color="#555" />
                        </TouchableOpacity>


                        {/* Support & Information Section */}
                        <Text style={styles.sectionTitle}>Support & Information</Text>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingText}>App Version</Text>
                            <Text style={styles.settingValue}>{appVersion}</Text>
                        </View>
                        <TouchableOpacity style={styles.settingItem} onPress={() => Linking.openURL('https://rauxa-landing.vercel.app/')}>
                            <Text style={styles.settingText}>Visit our Website</Text>
                            <Ionicons name="globe-outline" size={20} color="#555" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem} onPress={() => Linking.openURL('https://mail.google.com/mail/u/6/')}>
                            <Text style={styles.settingText}>Email Support</Text>
                            <Ionicons name="mail-outline" size={20} color="#555" />
                        </TouchableOpacity>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingText}>Licenses & Attributions</Text>
                            <Text style={styles.settingValue}>Firebase, React Native, Expo</Text>
                        </View>
                        {/* More support items like FAQ etc. */}

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0,0,0,0.6)', // Semi-transparent overlay
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 25,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
        maxHeight: '80%',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    settingsScroll: {
        width: '100%',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0367A6', // Blue section title
        marginTop: 15,
        marginBottom: 10,
        alignSelf: 'flex-start', // Align title to left within scrollview
        paddingLeft: 5, // Small padding for alignment
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 5,
        borderBottomWidth: StyleSheet.hairlineWidth, // Use hairline width for subtle line
        borderBottomColor: '#eee',
    },
    settingText: {
        fontSize: 16,
        color: '#333',
        flex: 1, // Allows text to take available space
    },
    settingValue: {
        fontSize: 16,
        color: '#666',
        textAlign: 'right',
    },
    deleteText: {
        color: '#D9043D', // Red text for delete action
        fontWeight: 'bold',
    },
});

export default SettingsModal;