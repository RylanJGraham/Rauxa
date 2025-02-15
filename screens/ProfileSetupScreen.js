import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    Image,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebase";
import { doc, collection, setDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { ProgressBar } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons"; // For back button
import NextButton from "../components/onboarding-components/NextButton";

const { width, height } = Dimensions.get("window");

const ProfileSetupScreen = () => {
    const navigation = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const [profileData, setProfileData] = useState({
        displayFirstName: "",
        displayLastName: "",
        age: "",
        gender: "", // Store selected gender
        interestedIn: "",
        bio: "",
        profileImage: null,
    });

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current.scrollToIndex({ index: currentIndex + 1, animated: true });
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            flatListRef.current.scrollToIndex({ index: currentIndex - 1, animated: true });
            setCurrentIndex(currentIndex - 1);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setProfileData({ ...profileData, profileImage: result.assets[0].uri });
        }
    };

    const completeProfileSetup = async () => {
        if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            const profileRef = doc(collection(userRef, "ProfileInfo"), "userinfo");

            // Save profile data to Firestore
            await setDoc(profileRef, {
                displayFirstName: profileData.displayFirstName,
                displayLastName: profileData.displayLastName,
                age: profileData.age,
                gender: profileData.gender,
                interestedIn: profileData.interestedIn,
                bio: profileData.bio,
                profileImage: profileData.profileImage,
                createdAt: new Date(),
            });

            // Set onboarded to true in Firestore
            await setDoc(userRef, { onboarded: true }, { merge: true });
        }

        // Navigate to Main screen
        navigation.replace("Main");
    };

    // List of gender options
    const genderOptions = [
        "Male",
        "Female",
        "Non-Binary",
        "Transgender",
        "Genderqueer",
        "Genderfluid",
        "Agender",
        "Bigender",
        "Two-Spirit",
        "Other",
    ];

    const handleGenderSelect = (gender) => {
        setProfileData({ ...profileData, gender }); // Update selected gender in state
    };

    const slides = [
        {
            id: "1",
            gradientColors: ['#0367A6', '#D9043D'],
            component: (
                <View style={styles.slide}>
                    <Text style={styles.title}>Let's get the Party Started</Text>
                    <Text style={styles.subtitle}>Let us get to know you, your interests, and set up your public profile.</Text>
                    <Image 
                        source={require("../assets/profilesetup/setup1.png")} 
                        style={styles.image} 
                        resizeMode="contain" 
                    />
                    <NextButton
                        onPress={handleNext}
                        label={"Get Started"}
                    />
                </View>
            ),
        },
        {
            id: "2",
            gradientColors: ['#0367A6', '#D9043D'],
            component: (
                <View style={styles.slide}>
                    <Text style={styles.prompt}>My First Name is</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your name"
                        value={profileData.displayFirstName}
                        onChangeText={(text) => setProfileData({ ...profileData, displayFirstName: text })}
                    />
                    <Text style={styles.subtitle}>This is how it will appear in Rauxa</Text>
                    <NextButton
                        onPress={handleNext}
                        label={"Continue"}
                    />
                </View>
            ),
        },
        {
            id: "3",
            gradientColors: ['#0367A6', '#D9043D'],
            component: (
                <View style={styles.slide}>
                    <Text style={styles.prompt}>My Last Name is</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your name"
                        value={profileData.displayLastName}
                        onChangeText={(text) => setProfileData({ ...profileData, displayLastName: text })}
                    />
                    <Text style={styles.subtitle}>This is how it will appear in Rauxa</Text>
                    <NextButton
                        onPress={handleNext}
                        label={"Continue"}
                    />
                </View>
            ),
        },
        {
            id: "4",
            gradientColors: ['#0367A6', '#D9043D'],
            component: (
                <View style={styles.slide}>
                    <Text style={styles.prompt}>How Old Are You?</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your age"
                        keyboardType="numeric"
                        value={profileData.age}
                        onChangeText={(text) => setProfileData({ ...profileData, age: text })}
                    />
                    <Text style={styles.subtitle}>Your age will be public</Text>
                    <NextButton
                        onPress={handleNext}
                        label={"Continue"}
                    />
                </View>
            ),
        },
        {
            id: "5",
            gradientColors: ['#0367A6', '#D9043D'],
            component: (
                <View style={styles.slide}>
                    <Text style={styles.prompt}>What is Your Gender?</Text>
                    <View style={styles.genderContainer}>
                        {genderOptions.map((gender, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.genderButton,
                                    profileData.gender === gender && styles.selectedGenderButton, // Highlight selected gender
                                ]}
                                onPress={() => handleGenderSelect(gender)}
                            >
                                <Text style={styles.genderButtonText}>{gender}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <NextButton
                        onPress={handleNext}
                        label={"Continue"}
                    />
                </View>
            ),
        },
        {
            id: "6",
            gradientColors: ['#0367A6', '#D9043D'],
            component: (
                <View style={styles.slide}>
                    <Text style={styles.title}>Upload a Profile Picture</Text>
                    {profileData.profileImage && (
                        <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
                    )}
                    <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                        <Text style={styles.uploadText}>Choose Image</Text>
                    </TouchableOpacity>
                    <NextButton
                        onPress={completeProfileSetup}
                        label={"Finish"}
                    />
                </View>
            ),
        },
    ];

    return (
        <LinearGradient
            colors={['#0367A6', '#D9043D']}
            style={styles.slide}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <View style={styles.container}>
                <ProgressBar progress={(currentIndex + 1) / slides.length} color="#ff3e6c" style={styles.progressBar} />

                {currentIndex > 0 && (
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <AntDesign name="arrowleft" size={24} color="white" />
                    </TouchableOpacity>
                )}

                <FlatList
                    ref={flatListRef}
                    data={slides}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    scrollEnabled={false}
                    renderItem={({ item }) => item.component}
                />
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    progressBar: {
        width: "100%",
        height: 2,
        borderRadius: 5,
    },
    backButton: {
        position: "absolute",
        top: 50,
        left: 20,
        zIndex: 10,
    },
    slide: {
        flex: 1,
        width,
        justifyContent: "center",
        alignItems: "center",
        padding: 0,
        height: height,
    },
    title: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
        paddingHorizontal: 30,
        marginTop: 5,
    },
    prompt: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        paddingHorizontal: 30,
        marginTop: 5,
        textAlign: "left",
    },
    subtitle: {
        fontSize: 14,
        color: "#F2F2F2",
        textAlign: "center",
        marginTop: 10,
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    input: {
        width: "80%",
        padding: 15,
        borderWidth: 2,
        borderColor: "#F2BB47",
        borderRadius: 10,
        backgroundColor: "#00000040",
        color: "white",
        textAlign: "left",
        fontSize: 18,
        marginBottom: 20,
    },
    genderContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: 20,
    },
    genderButton: {
        padding: 15,
        margin: 5,
        borderRadius: 10,
        backgroundColor: "#00000040",
        borderWidth: 2,
        borderColor: "#F2BB47",
    },
    selectedGenderButton: {
        backgroundColor: "#F2BB47", // Highlight selected gender
    },
    genderButtonText: {
        fontSize: 22,
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
    uploadButton: {
        backgroundColor: "#ff3e6c",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        marginBottom: 10,
    },
    uploadText: {
        color: "white",
        fontWeight: "bold",
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: "#ff3e6c",
    },
    image: {
        width: width,
        height: height * 0.4,
    },
});

export default ProfileSetupScreen;