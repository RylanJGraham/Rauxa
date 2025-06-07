import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import ProfileImageGallery from "../components/profile/ProfileImageGallery";
import ProfileButtons from "../components/profile/ProfileButtons";
import ProfileEdit from "../components/profile/ProfileEdit";
import SettingsModal from "../components/profile/SettingsModal"; // Import the SettingsModal
import { signOut } from "firebase/auth";
// Removed Ionicons import as it will now be in ProfileButtons.js

const ProfileScreen = () => {
    const [profileData, setProfileData] = useState(null);
    const [viewMode, setViewMode] = useState("profile");
    const [activeIndex, setActiveIndex] = useState(0);
    const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false); // New state for modal visibility

    useEffect(() => {
        const fetchProfile = async () => {
            if (auth.currentUser) {
                const userRef = doc(db, "users", auth.currentUser.uid, "ProfileInfo", "userinfo");
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    // Initialize education field if it doesn't exist
                    if (!data.education) {
                        data.education = {
                            university: "",
                        };
                    }
                    if (!data.languages) {
                        data.languages = [];
                    }
                    setProfileData(data);
                }
            }
        };
        fetchProfile();
    }, []);

    const handleSaveProfile = async (updatedProfile) => {
        if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid, "ProfileInfo", "userinfo");

            const completeProfile = {
                ...updatedProfile,
                education: updatedProfile.education || {
                    university: "",
                    graduationYear: ""
                },
                languages: updatedProfile.languages || [],
                topSongs: updatedProfile.topSongs || []
            };

            await updateDoc(userRef, completeProfile);
            setProfileData(completeProfile);
            setViewMode("profile");
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log("User signed out successfully.");
            // Assuming you have navigation to a login screen after logout
            // navigation.replace('Login'); // Uncomment if you have navigation setup
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    // New function to open the settings modal
    const handleOpenSettingsModal = () => {
        setIsSettingsModalVisible(true);
    };

    // Function to close the settings modal
    const handleCloseSettingsModal = () => {
        setIsSettingsModalVisible(false);
    };

    if (!profileData) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading Profile...</Text>
            </View>
        );
    }

    return (
        <LinearGradient colors={["#D9B779", "#736140"]} style={styles.container}>
            <View style={styles.topRow}>
                <ProfileButtons
                    setViewMode={setViewMode}
                    viewMode={viewMode}
                    handleLogout={handleLogout}
                    handleOpenSettingsModal={handleOpenSettingsModal} // Pass the new function down
                />
            </View>

            {viewMode === "profile" && (
                <ProfileImageGallery
                    profileData={profileData}
                    activeIndex={activeIndex}
                    setActiveIndex={setActiveIndex}
                />
            )}

            {viewMode === "edit" && (
                <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                    <ProfileEdit profileData={profileData} onSaveProfile={handleSaveProfile} />
                </ScrollView>
            )}

            {/* Render the SettingsModal */}
            <SettingsModal
                isVisible={isSettingsModalVisible}
                onClose={handleCloseSettingsModal}
                // If you use navigation inside the modal (e.g., after delete account)
                // pass it down: navigation={navigation}
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: '#736140',
    },
    loadingText: {
        color: "white",
        fontSize: 18,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        width: '100%',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
});

export default ProfileScreen;