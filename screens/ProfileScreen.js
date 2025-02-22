import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet,
    Dimensions,
    FlatList
} from "react-native";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const ProfileScreen = () => {
    const [profileData, setProfileData] = useState(null);

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

    if (!profileData) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading Profile...</Text>
            </View>
        );
    }

    return (
        <LinearGradient colors={['#0367A6', '#D9043D']} style={styles.container}>
            {/* Profile Images Gallery */}
            <FlatList
                horizontal
                data={profileData.profileImages.filter(img => img)} // Only show non-null images
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <Image source={{ uri: item }} style={styles.profileImage} />
                )}
                showsHorizontalScrollIndicator={false}
            />

            {/* User Info */}
            <View style={styles.infoContainer}>
                <Text style={styles.nameText}>{profileData.displayFirstName} {profileData.displayLastName}</Text>
                <Text style={styles.ageText}>{profileData.age} years old</Text>

                {/* Bio Section */}
                <Text style={styles.sectionTitle}>About Me</Text>
                <Text style={styles.bioText}>{profileData.bio || "No bio provided."}</Text>

                {/* Bio Section */}
                <Text style={styles.sectionTitle}>Gender</Text>
                <Text style={styles.bioText}>{profileData.gender || "No bio provided."}</Text>

                {/* Interests Section */}
                <Text style={styles.sectionTitle}>Interests</Text>
                <View style={styles.interestsContainer}>
                    {profileData.interests.length > 0 ? (
                        profileData.interests.map((interest, index) => (
                            <LinearGradient
                                key={index}
                                colors={["#F2BB47", "#D9043D"]}
                                style={styles.interestBadge}
                            >
                                <Text style={styles.interestText}>{interest}</Text>
                            </LinearGradient>
                        ))
                    ) : (
                        <Text style={styles.noInterestsText}>No interests added.</Text>
                    )}
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000", // Dark background for a modern look
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
    profileImage: {
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: 20,
        marginHorizontal: 10,
        marginTop: 20,
        borderWidth: 2,
        borderColor: "#F2BB47",
    },
    infoContainer: {
        padding: 20,
        alignItems: "center",
    },
    nameText: {
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
    },
    ageText: {
        fontSize: 18,
        color: "#F2BB47",
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#D9043D",
        marginTop: 20,
        alignSelf: "flex-start",
    },
    bioText: {
        fontSize: 16,
        color: "white",
        textAlign: "center",
        marginTop: 5,
    },
    interestsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginTop: 10,
    },
    interestBadge: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        margin: 5,
    },
    interestText: {
        fontSize: 14,
        color: "white",
        fontWeight: "bold",
    },
    noInterestsText: {
        fontSize: 16,
        color: "white",
        marginTop: 5,
    },
});

export default ProfileScreen;
