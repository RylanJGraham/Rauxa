import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { auth, db, storage } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { LinearGradient } from "expo-linear-gradient";
import ProfileImageGallery from "../components/profile/ProfileImageGallery";
import ProfileButtons from "../components/profile/ProfileButtons";
import ProfileEdit from "../components/profile/ProfileEdit";
import SettingsModal from "../components/profile/SettingsModal";
import { signOut } from "firebase/auth";

const ProfileScreen = () => {
    const [profileData, setProfileData] = useState(null);
    const [viewMode, setViewMode] = useState("profile");
    const [activeIndex, setActiveIndex] = useState(0);
    const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(user => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
                console.log("No user logged in.");
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUserId) {
                setProfileData(null);
                return;
            }

            try {
                const userRef = doc(db, "users", currentUserId, "ProfileInfo", "userinfo");
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    const initialData = {
                        displayFirstName: '',
                        displayLastName: '',
                        age: '',
                        bio: '',
                        gender: '',
                        interests: [],
                        education: { university: "" },
                        languages: [],
                        profileImages: [],
                        ...data,
                    };

                    const images = Array.isArray(initialData.profileImages) ? initialData.profileImages : [];
                    const paddedImages = [...images, ...Array(Math.max(0, 9 - images.length)).fill(null)];

                    setProfileData({ ...initialData, profileImages: paddedImages });
                    console.log("ProfileScreen: Fetched profile data and padded images:", { ...initialData, profileImages: paddedImages });
                } else {
                    console.log("ProfileScreen: No such user document! Initializing default profile.");
                    setProfileData({
                        displayFirstName: '', displayLastName: '', age: '', bio: '', gender: '',
                        interests: [], education: { university: "" }, languages: [],
                        profileImages: Array(9).fill(null),
                    });
                }
            } catch (error) {
                console.error("ProfileScreen: Error fetching profile:", error);
                Alert.alert("Error", "Failed to load profile data.");
                setProfileData(null);
            }
        };

        fetchProfile();
    }, [currentUserId]);

    const handleSaveProfile = async (updatedProfile) => {
        if (!currentUserId) {
            Alert.alert("Error", "User not authenticated. Cannot save profile.");
            return;
        }

        const userRef = doc(db, "users", currentUserId, "ProfileInfo", "userinfo");

        try {
            const newFinalImages = updatedProfile.profileImages.filter(Boolean);

            const originalImages = Array.isArray(profileData?.profileImages) ? profileData.profileImages.filter(Boolean) : [];
            const imagesToDelete = originalImages.filter(
                (url) => url && !newFinalImages.includes(url) && url.startsWith('http')
            );

            console.log("ProfileScreen: Images identified for deletion:", imagesToDelete);

            const deletePromises = imagesToDelete.map(async (url) => {
                try {
                    const urlPath = new URL(url).pathname;
                    const filenameInStorage = decodeURIComponent(urlPath.substring(urlPath.indexOf('/o/') + 3));

                    console.log(`ProfileScreen: Attempting to delete URL: ${url}`);
                    console.log(`ProfileScreen: Derived storage path: ${filenameInStorage}`);

                    if (filenameInStorage && filenameInStorage.startsWith('profilePics/')) {
                        const imageRef = ref(storage, filenameInStorage);
                        await deleteObject(imageRef);
                        console.log(`ProfileScreen: Successfully deleted image from storage: ${filenameInStorage}`);
                    } else {
                        console.warn(`ProfileScreen: Derived filename '${filenameInStorage}' is invalid or not in 'profilePics/' for deletion from URL: ${url}`);
                    }
                } catch (deleteError) {
                    console.error(`ProfileScreen: Failed to delete image from storage: ${url}`, deleteError);
                    console.error("ProfileScreen: Firebase Storage Error Object:", deleteError);
                }
            });

            await Promise.all(deletePromises);

            const completeProfile = {
                ...updatedProfile,
                education: updatedProfile.education || { university: "", graduationYear: "" },
                languages: updatedProfile.languages || [],
                topSongs: updatedProfile.topSongs || [],
                profileImages: newFinalImages,
            };

            console.log("ProfileScreen: Attempting to save profile data to Firestore:", completeProfile);
            await updateDoc(userRef, completeProfile);
            console.log("ProfileScreen: Profile data saved successfully to Firestore!");

            setProfileData(prev => ({
                ...completeProfile,
                profileImages: [...completeProfile.profileImages, ...Array(Math.max(0, 9 - completeProfile.profileImages.length)).fill(null)]
            }));

            setViewMode("profile");
            Alert.alert("Success", "Profile updated successfully!"); // <-- This is the only success alert now

        } catch (error) {
            console.error("ProfileScreen: Error saving profile:", error);
            Alert.alert("Save Error", "Failed to save profile changes. " + error.message); // <-- This is the only main error alert
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log("User signed out successfully.");
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const handleOpenSettingsModal = () => {
        setIsSettingsModalVisible(true);
    };

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
                    handleOpenSettingsModal={handleOpenSettingsModal}
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
                    <ProfileEdit
                        profileData={profileData}
                        onSaveProfile={handleSaveProfile}
                        userId={currentUserId}
                    />
                </ScrollView>
            )}

            <SettingsModal
                isVisible={isSettingsModalVisible}
                onClose={handleCloseSettingsModal}
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