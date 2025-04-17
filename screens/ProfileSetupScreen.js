import React, { useState, useRef, useEffect, useCallback } from "react";
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
    ActivityIndicator,
    Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth, db, storage } from "../firebase";
import { doc, collection, setDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import NextButton from "../components/onboarding-components/NextButton";
import InterestsSelection from "../components/profile-setup/InterestsSelection";
import GenderOptions from "../components/profile-setup/GenderOptions";

const { width, height } = Dimensions.get("window");

const ProfileSetupScreen = () => {
    const navigation = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const [isUploading, setIsUploading] = useState(false);

    const [profileData, setProfileData] = useState({
        displayFirstName: "",
        displayLastName: "",
        age: "",
        gender: "",
        interests: [],
        bio: "",
        profileImages: Array(9).fill(null),
    });

    // Clean up animation on unmount
    useEffect(() => {
        return () => {
            rotateAnim.stopAnimation();
        };
    }, []);

    const validateCurrentStep = useCallback(() => {
        switch (currentIndex) {
            case 1: // First name
                if (!profileData.displayFirstName.trim()) {
                    Alert.alert("Required", "Please enter your first name");
                    return false;
                }
                break;
            case 2: // Last name
                if (!profileData.displayLastName.trim()) {
                    Alert.alert("Required", "Please enter your last name");
                    return false;
                }
                break;
            case 3: // Age
                if (!profileData.age || isNaN(profileData.age) || parseInt(profileData.age) < 18) {
                    Alert.alert("Invalid Age", "Please enter a valid age (18+)");
                    return false;
                }
                break;
            case 4: // Gender
                if (!profileData.gender) {
                    Alert.alert("Required", "Please select your gender");
                    return false;
                }
                break;
            case 5: // Interests
                if (profileData.interests.length < 3) {
                    Alert.alert("Required", "Please select at least 3 interests");
                    return false;
                }
                break;
            case 6: // Profile images
                if (profileData.profileImages.filter(Boolean).length < 1) {
                    Alert.alert("Required", "Please upload at least 1 profile picture");
                    return false;
                }
                break;
        }
        return true;
    }, [currentIndex, profileData]);

    const handleNext = useCallback(() => {
        if (!validateCurrentStep()) return;
        
        if (currentIndex < slides.length - 1) {
            flatListRef.current.scrollToIndex({ index: currentIndex + 1, animated: true });
            setCurrentIndex(currentIndex + 1);
        }
    }, [currentIndex, validateCurrentStep]);

    const handleBack = useCallback(() => {
        if (currentIndex > 0) {
            flatListRef.current.scrollToIndex({ index: currentIndex - 1, animated: true });
            setCurrentIndex(currentIndex - 1);
        }
    }, [currentIndex]);

    const startRotation = useCallback(() => {
        Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start(() => rotateAnim.setValue(0));
    }, [rotateAnim]);

    const handleSelectInterest = useCallback((interest) => {
        setProfileData((prevData) => ({
            ...prevData,
            interests: prevData.interests.includes(interest)
                ? prevData.interests.filter((i) => i !== interest)
                : [...prevData.interests, interest],
        }));
    }, []);

    const pickImage = useCallback(async (index) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.75,
            });

            if (!result.canceled && result.assets?.[0]) {
                const manipulatedImage = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 800 } }],
                    { compress: 0.6, format: ImageManipulator.SaveFormat.WEBP }
                );
                
                setProfileData((prevData) => {
                    const newProfileImages = [...prevData.profileImages];
                    newProfileImages[index] = manipulatedImage.uri;
                    return { ...prevData, profileImages: newProfileImages };
                });
                
                await uploadImageToFirebase(manipulatedImage.uri, index);
                startRotation();
            }
        } catch (error) {
            console.error("Image picker error:", error);
            Alert.alert("Error", "Failed to select image");
        }
    }, [startRotation]);

    const uploadImageToFirebase = useCallback(async (imageUri, index) => {
        if (!auth.currentUser?.uid) {
            Alert.alert("Error", "User not authenticated");
            return;
        }

        setIsUploading(true);
        const imageName = `${auth.currentUser.uid}_${index}.webp`;
        const userFolderPath = `profilePics/${auth.currentUser.uid}`;
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
            console.error("Upload error:", error);
            Alert.alert("Error", "Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    }, []);

    const handleDeletePress = useCallback(async (index) => {
        const imageUrl = profileData.profileImages[index];
        if (!imageUrl) return;

        try {
            const imageName = `${auth.currentUser?.uid}_${index}.webp`;
            const userFolderPath = `profilePics/${auth.currentUser?.uid}`;
            const imageRef = ref(storage, `${userFolderPath}/${imageName}`);
            
            await deleteObject(imageRef);
            
            setProfileData((prevData) => {
                const newProfileImages = [...prevData.profileImages];
                newProfileImages[index] = null;
                return { ...prevData, profileImages: newProfileImages };
            });
        } catch (error) {
            console.error("Delete error:", error);
            Alert.alert("Error", "Failed to delete image");
        }
    }, [profileData.profileImages]);

    const handleBioChange = useCallback((text) => {
        if (text.length <= 500) {
            setProfileData(prev => ({ ...prev, bio: text }));
        }
    }, []);

    const handleGenderSelect = useCallback((gender) => {
        setProfileData(prev => ({ ...prev, gender }));
    }, []);

    const completeProfileSetup = useCallback(async () => {
        if (!auth.currentUser) {
            Alert.alert("Error", "No user logged in");
            return;
        }

        try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            const profileRef = doc(collection(userRef, "ProfileInfo"), "userinfo");

            await Promise.all([
                setDoc(profileRef, {
                    displayFirstName: profileData.displayFirstName,
                    displayLastName: profileData.displayLastName,
                    age: profileData.age,
                    gender: profileData.gender,
                    interests: profileData.interests,
                    bio: profileData.bio,
                    profileImages: profileData.profileImages,
                    createdAt: new Date(),
                }),
                setDoc(userRef, { onboarded: true }, { merge: true })
            ]);

            navigation.replace("App");
        } catch (error) {
            console.error("Profile setup error:", error);
            Alert.alert("Error", "Failed to complete profile setup");
        }
    }, [profileData, navigation]);

    const renderImageItem = useCallback(({ item: image, index }) => {
        const rotationInterpolate = rotateAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
        });

        return (
            <View key={index} style={styles.uploadContainer}>
                <TouchableOpacity 
                    style={styles.rectangle} 
                    onPress={() => image ? null : pickImage(index)}
                    disabled={isUploading}
                >
                    {image ? (
                        <Image source={{ uri: image }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.placeholder} />
                    )}
                    {isUploading && (
                        <View style={styles.uploadingOverlay}>
                            <ActivityIndicator size="large" color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>

                <Animated.View style={[styles.addIconContainer, { transform: [{ rotate: rotationInterpolate }] }]}>
                    <LinearGradient colors={["#F2BB47", "#D9043D"]} style={styles.addIconButton}>
                        <TouchableOpacity 
                            onPress={() => image ? handleDeletePress(index) : pickImage(index)}
                            disabled={isUploading}
                            accessibilityLabel={image ? "Delete image" : "Add image"}
                        >
                            <AntDesign name={image ? "close" : "plus"} size={24} color="#fff" />
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            </View>
        );
    }, [rotateAnim, isUploading, pickImage, handleDeletePress]);

    const slides = [
        {
            id: "1",
            component: (
                <View style={styles.slide}>
                    <Text style={styles.title}>Let's get the Party Started</Text>
                    <Text style={styles.subtitle}>Let us get to know you, your interests, and set up your public profile.</Text>
                    <Image 
                        source={require("../assets/profilesetup/setup1.png")} 
                        style={styles.image} 
                        resizeMode="contain" 
                    />
                    <NextButton onPress={handleNext} label={"Get Started"} />
                </View>
            ),
        },
        {
            id: "2",
            component: (
                <View style={styles.slide}>
                    <Text style={styles.prompt}>My First Name is</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your name"
                        value={profileData.displayFirstName}
                        onChangeText={(text) => setProfileData(prev => ({ ...prev, displayFirstName: text }))}
                        accessibilityLabel="First name input"
                    />
                    <Text style={styles.subtitle}>This is how it will appear in Rauxa</Text>
                    <NextButton onPress={handleNext} label={"Continue"} />
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
                                        const imageName = `${auth.currentUser?.uid}_${index}.webp`; // Name the image based on userId_index
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
                <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                        <LinearGradient
                            colors={['#F2BB47', '#D9043D']}
                            style={[styles.progressBarFill, { 
                                width: `${(currentIndex + 1) / slides.length * 80}%` 
                            }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />
                    </View>
                </View>

                {currentIndex > 0 && (
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={handleBack}
                        accessibilityLabel="Go back"
                    >
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
                    contentContainerStyle={styles.flatListContent}
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
        backgroundColor: "#00000040",
        borderRadius: 5,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 5,
    },
    backButton: {
        position: "absolute",
        top: 20,
        left: 20,
        zIndex: 20,
    },
    slide: {
        flex: 1,
        width,
        alignItems: "center",
        paddingTop: 60,
    },
    flatListContent: {
        flexGrow: 1,
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
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
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
        position: "relative",
        marginBottom: 20,
    },
    inputbio: {
        width: "100%",
        height: 120,
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
    image: {
        width: width,
        height: height * 0.4,
    },
});

export default ProfileSetupScreen;