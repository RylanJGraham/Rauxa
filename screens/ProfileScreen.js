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
    const [viewMode, setViewMode] = useState("profile");
    const [activeIndex, setActiveIndex] = useState(0);

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
            
            // Ensure all fields exist
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
            <View style={styles.topRow}>
                <ProfileButtons setViewMode={setViewMode} viewMode={viewMode} />
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