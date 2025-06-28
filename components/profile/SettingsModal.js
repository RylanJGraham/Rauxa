import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Linking, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { auth, db, storage } from "../../firebase";
import { doc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
import { ref, deleteObject, listAll } from "firebase/storage";
import { reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth";

const SettingsModal = ({ isVisible, onClose, navigation }) => {
    const appVersion = Application.nativeApplicationVersion || "N/A";
    const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);

    const openAppSettings = () => {
        Linking.openSettings();
    };

    // Modified handleDeleteAccount to show "soon" message for now
    const handleDeleteAccount = async () => {
        // This will now just show an alert indicating the feature is coming soon
        Alert.alert(
            "Account Deletion",
            "The account deletion feature will be implemented soon.",
            [{ text: "OK" }]
        );

        // Keep the original detailed logic commented out below if you want to re-enable it later
        /*
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
                        try {
                            const userProfileRef = doc(db, "users", user.uid, "ProfileInfo", "userinfo");
                            await deleteDoc(userProfileRef);
                            console.log("Firestore profile data deleted.");

                            const profilePicsRef = ref(storage, `profilePics/${user.uid}`);
                            const fileList = await listAll(profilePicsRef);
                            const deletePromises = fileList.items.map(itemRef => deleteObject(itemRef));
                            await Promise.all(deletePromises);
                            console.log("Storage profile pictures deleted.");

                            await deleteUser(user);
                            console.log("Firebase Auth user deleted.");

                            Alert.alert("Account Deleted", "Your account and all associated data have been permanently deleted.");
                            onClose();
                            // navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
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
        */
    };

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
                        <Ionicons name="close-circle" size={30} color="#999" />
                    </TouchableOpacity>

                    <Text style={styles.modalTitle}>Settings</Text>

                    <ScrollView style={styles.settingsScroll} showsVerticalScrollIndicator={false}>
                        {/* Account Section */}
                        <Text style={styles.sectionTitle}>Account</Text>
                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={() => Alert.alert("Change Password", "The change password feature will be implemented soon.")} // Changed alert message
                        >
                            <Text style={styles.settingText}>Change Password</Text>
                            <Ionicons name="chevron-forward" size={20} color="#BBB" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
                            <Text style={[styles.settingText, styles.deleteText]}>Delete Account</Text>
                            <Ionicons name="trash-outline" size={20} color="#D9043D" />
                        </TouchableOpacity>

                        {/* Notifications Section */}
                        <Text style={styles.sectionTitle}>Notifications</Text>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingText}>Push Notifications</Text>
                            {/* Visual toggle only, onPress shows "soon" message */}
                            <TouchableOpacity
                                onPress={() => {
                                    setPushNotificationsEnabled(!pushNotificationsEnabled);
                                    Alert.alert("Push Notifications", "The push notification settings will be implemented soon.");
                                }}
                            >
                                <Ionicons
                                    name={pushNotificationsEnabled ? "toggle-sharp" : "toggle-outline"}
                                    size={35}
                                    color={pushNotificationsEnabled ? "#0367A6" : "#777"} // Adjusted color for contrast
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Privacy & Permissions Section */}
                        <Text style={styles.sectionTitle}>Privacy & Permissions</Text>
                        <TouchableOpacity style={styles.settingItem} onPress={openAppSettings}>
                            <Text style={styles.settingText}>Location Permissions</Text>
                            <Ionicons name="open-outline" size={20} color="#BBB" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem} onPress={openAppSettings}>
                            <Text style={styles.settingText}>Image/Camera Permissions</Text>
                            <Ionicons name="open-outline" size={20} color="#BBB" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem} onPress={() => Linking.openURL('https://rauxa-landing.vercel.app/privacy-policy.html')}>
                            <Text style={styles.settingText}>Privacy Policy</Text>
                            <Ionicons name="document-text-outline" size={20} color="#BBB" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem} onPress={() => Linking.openURL('https://rauxa-landing.vercel.app/terms-of-service.html')}>
                            <Text style={styles.settingText}>Terms of Service</Text>
                            <Ionicons name="document-text-outline" size={20} color="#BBB" />
                        </TouchableOpacity>

                        {/* Support & Information Section */}
                        <Text style={styles.sectionTitle}>Support & Information</Text>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingText}>App Version</Text>
                            <Text style={styles.settingValue}>{appVersion}</Text>
                        </View>
                        <TouchableOpacity style={styles.settingItem} onPress={() => Linking.openURL('https://rauxa-landing.vercel.app/')}>
                            <Text style={styles.settingText}>Visit our Website</Text>
                            <Ionicons name="globe-outline" size={20} color="#BBB" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem} onPress={() => Linking.openURL('https://mail.google.com/mail/u/6/')}>
                            <Text style={styles.settingText}>Email Support</Text>
                            <Ionicons name="mail-outline" size={20} color="#BBB" />
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
        backgroundColor: 'rgba(0,0,0,0.6)', // Semi-transparent overlay for the modal background
    },
    modalView: {
        margin: 20,
        backgroundColor: "black", // Changed to black
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
        color: 'white', // Changed to white
    },
    settingsScroll: {
        width: '100%',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#82C0FF', // Lighter blue for better contrast on black
        marginTop: 15,
        marginBottom: 10,
        alignSelf: 'flex-start',
        paddingLeft: 5,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 5,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#444', // Darker border for black background
    },
    settingText: {
        fontSize: 16,
        color: 'white', // Changed to white
        flex: 1,
    },
    settingValue: {
        fontSize: 16,
        color: '#CCC', // Lighter grey for values
        textAlign: 'right',
    },
    deleteText: {
        color: '#D9043D', // Red text for delete action, remains the same
        fontWeight: 'bold',
    },
});

export default SettingsModal;