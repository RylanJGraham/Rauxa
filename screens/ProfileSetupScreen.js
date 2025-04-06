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
    Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CommonActions } from "@react-navigation/native";
import { auth, db, storage } from "../firebase";
import { doc, collection, setDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { ProgressBar } from "react-native-paper";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons"; // For back button
import NextButton from "../components/onboarding-components/NextButton";
import InterestsSelection from "../components/profile-setup/InterestsSelection";
import GenderOptions from "../components/profile-setup/GenderOptions";
import { deleteObject } from "firebase/storage";



const { width, height } = Dimensions.get("window");

const ProfileSetupScreen = () => {
    const navigation = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const [profileData, setProfileData] = useState({
        displayFirstName: "",
        displayLastName: "",
        age: "",
        gender: "",
        interests: [],
        bio: "",
        profileImages: Array(9).fill(null),
    });
    const [isUploading, setIsUploading] = useState(false);

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

    // Function to handle interest selection
    const handleSelectInterest = (interest) => {
        setProfileData((prevData) => ({
            ...prevData,
            interests: prevData.interests.includes(interest)
                ? prevData.interests.filter((i) => i !== interest) // Remove if already selected
                : [...prevData.interests, interest], // Add if not selected
        }));
    };

    const pickImage = async (index) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.75,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            const imageUri = result.assets[0].uri;
            setProfileData((prevData) => {
                const newProfileImages = [...prevData.profileImages];
                newProfileImages[index] = imageUri;
                return { ...prevData, profileImages: newProfileImages };
            });

            uploadImageToFirebase(imageUri, index);
        }
    };

    const uploadImageToFirebase = async (imageUri, index) => {
        setIsUploading(true);
    
        // Use userId and index as part of the image name
        const imageName = `${auth.currentUser?.uid}_${index}.jpg`;
        const userFolderPath = `profilePics/${auth.currentUser?.uid}`;
        const imageRef = ref(storage, `${userFolderPath}/${imageName}`);
    
        try {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            await uploadBytes(imageRef, blob);
            const imageUrl = await getDownloadURL(imageRef);
    
            setProfileData((prevData) => {
                const newProfileImages = [...prevData.profileImages];
                newProfileImages[index] = imageUrl;
                return { ...prevData, profileImages: newProfileImages };
            });
        } catch (error) {
            console.error("Error uploading image: ", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleBioChange = (text) => {
        console.log("Bio updated:", text);
        if (text.length <= 500) {
            setProfileData({ ...profileData, bio: text });
        }
    };
    
    const completeProfileSetup = async () => {
        if (auth.currentUser) {
            try {
                const userRef = doc(db, "users", auth.currentUser.uid);
                const profileRef = doc(collection(userRef, "ProfileInfo"), "userinfo");
    
                await setDoc(profileRef, {
                    displayFirstName: profileData.displayFirstName,
                    displayLastName: profileData.displayLastName,
                    age: profileData.age,
                    gender: profileData.gender,
                    interests: profileData.interests,
                    bio: profileData.bio,
                    profileImages: profileData.profileImages,
                    createdAt: new Date(),
                });
    
                await setDoc(userRef, { onboarded: true }, { merge: true });
    
                console.log("Profile setup complete. Navigating to Main...");
                navigation.replace("App");
            } catch (error) {
                console.error("Error completing profile setup:", error);
            }
        }
    };

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
                    <Text style={styles.prompt}>Select Your Gender</Text>
                    <GenderOptions selectedGender={profileData.gender} onSelectGender={handleGenderSelect} />
                    <Text style={styles.subtitle}>Your gender will be public</Text>
                    <NextButton onPress={handleNext} label={"Continue"} />
                </View>
            ),
        },
        {
            id: "6",
            gradientColors: ['#0367A6', '#D9043D'],
            component: (
                <View style={styles.slide}>
                    <Text style={styles.prompt}>What are you interested in?</Text>
                    <InterestsSelection selectedInterests={profileData.interests} onSelectInterest={handleSelectInterest} />
                    <NextButton onPress={handleNext} label={"Continue"} />
                </View>
            ),
        },
            {
                id: "7",
                gradientColors: ['#0367A6', '#D9043D'],
                component: (
                    <View style={styles.slide}>
                        <Text style={styles.prompt}>Upload Profile Pictures</Text>
                        <View style={styles.grid}>
                        {profileData.profileImages.map((image, index) => {
                            const rotateAnim = useRef(new Animated.Value(0)).current;

                            const startRotation = () => {
                                Animated.timing(rotateAnim, {
                                    toValue: 1,
                                    duration: 500,
                                    useNativeDriver: true,
                                }).start(() => rotateAnim.setValue(0));
                            };
                        
                            const handleImageUpload = async () => {
                                await pickImage(index);
                                startRotation();
                            };

                            const handleDeletePress = async (index) => {
                                const imageUrl = profileData.profileImages[index];
                            
                                // Check if there's an image to delete
                                if (imageUrl) {
                                    try {
                                        // Extract the image name from the URL to get the reference in Firebase Storage
                                        const imageName = `${auth.currentUser?.uid}_${index}.jpg`; // Name the image based on userId_index
                                        const userFolderPath = `profilePics/${auth.currentUser?.uid}`;
                                        const imageRef = ref(storage, `${userFolderPath}/${imageName}`);
                            
                                        // Delete the image from Firebase Storage
                                        await deleteObject(imageRef);
                            
                                        // Update the state by removing the image URL
                                        setProfileData((prevData) => {
                                            const newProfileImages = [...prevData.profileImages];
                                            newProfileImages[index] = null;
                                            return { ...prevData, profileImages: newProfileImages };
                                        });
                            
                                        console.log("Image deleted successfully from Firebase");
                                    } catch (error) {
                                        console.error("Error deleting image from Firebase: ", error);
                                    }
                                }
                            };
                        
                            const rotationInterpolate = rotateAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0deg", "360deg"],
                            });
                        
                            return (
                                <View key={index} style={styles.uploadContainer}>
                                    <TouchableOpacity style={styles.rectangle} onPress={() => pickImage(index)}>
                                    {image ? (
                                        <Image source={{ uri: image }} style={styles.profileImage} />
                                    ) : (
                                        <View style={styles.placeholder} />
                                    )}
                                </TouchableOpacity>
                        
                                    <Animated.View style={[styles.addIconContainer, { transform: [{ rotate: rotationInterpolate }] }]}>
                                    <LinearGradient colors={["#F2BB47", "#D9043D"]} style={styles.addIconButton}>
                                        <TouchableOpacity onPress={() => image ? handleDeletePress(index) : handleImageUpload()}>
                                            <AntDesign name={image ? "close" : "plus"} size={24} color="#fff" />
                                        </TouchableOpacity>
                                    </LinearGradient>
                                    </Animated.View>
                                </View>
                            );
                        })}
                        </View>
                        <NextButton onPress={handleNext} label={"Continue"} />
                    </View>
                ),
            },
            {
                id: "8",
                gradientColors: ['#0367A6', '#D9043D'],
                component: (
                    <View style={styles.slide}>
                        <Text style={styles.prompt}>What's Your Bio?</Text>
                        <View style={styles.bioContainer}>
                            <TextInput
                                style={styles.inputbio}
                                placeholder="Information you want others to know about you"
                                multiline
                                value={profileData.bio}
                                onChangeText={handleBioChange}
                            />
                            <LinearGradient colors={["#F2BB47", "#D9043D"]} style={styles.charCountContainer}>
                                    <Text style={styles.charCountText}>
                                        {profileData.bio.length}/500
                                    </Text>
                            </LinearGradient>
                        </View>
                        <Text style={styles.subtitle}>Your bio will be public</Text>
                        <NextButton onPress={completeProfileSetup} label={"Continue"} />
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
                {/* Progress Bar Container */}
                <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                        <LinearGradient
                            colors={['#F2BB47', '#D9043D']}
                            style={[styles.progressBarFill, { width: `${(currentIndex + 1) / slides.length * 80}%` }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />
                    </View>
                </View>

                {currentIndex > 0 && (
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <AntDesign name="arrowleft" size={32} color="white" />
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
    },
    progressBarContainer: {
        position: 'absolute',
        top: 30,
        width: "60%",
        alignItems: "center",
        zIndex: 10,
    },
    progressBarBackground: {
        width: "100%",
        height: 10,
        backgroundColor: "#00000040", // Background color for the progress bar
        borderRadius: 5,
        overflow: "hidden", // Clip the gradient to the progress width
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 5,
    },
    backButton: {
        position: "absolute",
        top: 20,
        left: 20,
        zIndex: 20, // Ensure the back button is above the progress bar
    },
    slide: {
        flex: 1,
        width,
        alignItems: "center",
        paddingTop: 60, // Add padding to avoid overlap with progress bar and back button
    },
    flatListContent: {
        flexGrow: 1, // Ensure the FlatList content takes up the available space
    },
    title: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "left",
        paddingHorizontal: 30,
        marginTop: 5,
    },
    prompt: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        paddingHorizontal: 40,
        marginTop: 5,
        marginBottom: 10,
        textAlign: "left",
        alignSelf: 'start',
    },
    subtitle: {
        fontSize: 14,
        color: "#F2F2F2",
        textAlign: "center",
        marginBottom: 0,
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
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-evenly",
        width: "100%",
        marginBottom: -10,
    },
    rectangle: {
        width: width / 3 - 30,
        height: width / 2.5,
        backgroundColor: "",
        margin: 10,
        position: "relative",
        borderRadius: 10,
    },
    profileImage: {
        width: "100%",
        height: "100%",
        borderRadius: 10,
        borderColor: "#F2BB47",
        borderWidth: 2,
    },
    placeholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#00000050",
        borderRadius: 10,
    },
    uploadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
    },
    uploadingText: {
        color: "#fff",
        fontWeight: "bold",
    },
    image: {
        width: width,
        height: height * 0.4,
    },
    uploadContainer: {
        position: "relative",
    },
    rectangle: {
        width: width / 3 - 30,
        height: width / 2.5,
        margin: 10,
        borderRadius: 10,
        overflow: "hidden",
    },
    profileImage: {
        width: "100%",
        height: "100%",
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#F2BB47",
        resizeMode: "cover",
    },
    placeholder: {
        flex: 1,
        backgroundColor: "#00000040",
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#F2BB47",
    },
    addIconContainer: {
        position: "absolute",
        bottom: -5,
        right: -5,
    },
    addIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    bioContainer: {
        width: "80%",
        position: "relative", // This will allow positioning of the char count inside this container
        marginBottom: 20,
    },
    inputbio: {
        width: "100%",
        height: 120, // Increased height to fit more text
        padding: 15,
        borderWidth: 2,
        borderColor: "#F2BB47",
        borderRadius: 10,
        backgroundColor: "#00000040",
        color: "white",
        textAlign: "left",
        fontSize: 18,
    },
    charCountContainer: {
        position: "absolute",
        bottom: -10,
        right: -10,
        backgroundColor: "#F2BB47",
        borderRadius: 10,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    charCountText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});

export default ProfileSetupScreen;