import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import ProfileImageGallery from "../components/profile/ProfileImageGallery";
import ProfileButtons from "../components/profile/ProfileButtons";
import ProfileEdit from "../components/profile/ProfileEdit";

const ProfileScreen = () => {
    const [profileData, setProfileData] = useState(null);
    const [viewMode, setViewMode] = useState("profile"); // "profile" or "edit"
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const fetchProfile = async () => {
            if (auth.currentUser) {
                const userRef = doc(db, "users", auth.currentUser.uid, "ProfileInfo", "userinfo");
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    setProfileData(userSnap.data());
                }
            }
        };
        fetchProfile();
    }, []);

    const handleSaveProfile = async (updatedProfile) => {
        if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid, "ProfileInfo", "userinfo");
    
            // Add topSongs if it doesn't exist
            if (!updatedProfile.topSongs) {
                updatedProfile.topSongs = [];
            }
    
            await updateDoc(userRef, updatedProfile);
            setProfileData((prevData) => ({
                ...prevData,
                ...updatedProfile,
            }));
        }
    };

    if (!profileData) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading Profile...</Text>
            </View>
        );
    }

    return (
        <LinearGradient colors={["#0367A6", "#012840"]} style={styles.container}>
            {/* Top Row: Settings | Profile Buttons | Stats */}
            <View style={styles.topRow}>
                <ProfileButtons setViewMode={setViewMode} viewMode={viewMode} />
            </View>

            {/* Profile Image Gallery (Only in View Mode) */}
            {viewMode === "profile" && (
                <ProfileImageGallery
                    profileData={profileData}
                    activeIndex={activeIndex}
                    setActiveIndex={setActiveIndex}
                />
            )}

            {/* Scrollable Content for Profile Editing */}
            {viewMode === "edit" && (
                <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                    <ProfileEdit profileData={profileData} onSaveProfile={handleSaveProfile} />
                </ScrollView>
            )}
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
    },
    scrollContainer: {
        flexGrow: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
});

export default ProfileScreen;
