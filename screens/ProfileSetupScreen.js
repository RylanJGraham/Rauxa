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
import * as ImageManipulator from 'expo-image-manipulator';
import NextButton from "../components/onboarding-components/NextButton";
import InterestsSelection from "../components/profile-setup/InterestsSelection";
import GenderOptions from "../components/profile-setup/GenderOptions";
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get("window");

const ProfileSetupScreen = () => {
    const navigation = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
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

    const [localImageUris, setLocalImageUris] = useState(Array(9).fill(null));

    const rotateAnimRefs = useRef(
        Array(9).fill(null).map(() => new Animated.Value(0))
    ).current;

    useEffect(() => {
        console.log("Current profileData.profileImages:", profileData.profileImages);
        console.log("Is profileData.profileImages an array?", Array.isArray(profileData.profileImages));
        console.log("Length of profileData.profileImages:", profileData.profileImages?.length);
        console.log("Type of first element:", typeof profileData.profileImages?.[0]);

        console.log("Current profileData.interests:", profileData.interests);
        console.log("Is profileData.interests an array?", Array.isArray(profileData.interests));
        console.log("Length of profileData.interests:", profileData.interests?.length);
    }, [profileData.profileImages, profileData.interests]);

    const validateCurrentStep = useCallback(() => {
        switch (currentIndex) {
            case 1:
                if (!profileData.displayFirstName.trim()) {
                    Alert.alert("Required", "Please enter your first name");
                    return false;
                }
                break;
            case 2:
                if (!profileData.displayLastName.trim()) {
                    Alert.alert("Required", "Please enter your last name");
                    return false;
                }
                break;
            case 3:
                if (!profileData.age || isNaN(profileData.age) || parseInt(profileData.age) < 18) {
                    Alert.alert("Invalid Age", "Please enter a valid age (18+)");
                    return false;
                }
                break;
            case 4:
                if (!profileData.gender) {
                    Alert.alert("Required", "Please select your gender");
                    return false;
                }
                break;
            case 5:
                if (!Array.isArray(profileData.interests) || profileData.interests.length < 3) {
                    Alert.alert("Required", "Please select at least 3 interests");
                    return false;
                }
                break;
            case 6:
                if (!Array.isArray(profileData.profileImages) || profileData.profileImages.filter(Boolean).length < 1) {
                    Alert.alert("Required", "Please upload at least 1 profile picture");
                    return false;
                }
                break;
        }
        return true;
    }, [currentIndex, profileData]);


    const handleNext = useCallback(() => {
        if (!validateCurrentStep()) return;

        // Ensure slides is available before accessing its length
        if (Array.isArray(slides) && currentIndex < slides.length - 1) {
            flatListRef.current.scrollToIndex({ index: currentIndex + 1, animated: true });
            setCurrentIndex(currentIndex + 1);
        }
    }, [currentIndex, validateCurrentStep]); // slides is now a stable dependency due to its placement

    const handleBack = useCallback(() => {
        if (currentIndex > 0) {
            flatListRef.current.scrollToIndex({ index: currentIndex - 1, animated: true });
            setCurrentIndex(currentIndex - 1);
        }
    }, [currentIndex]);

    const startRotation = useCallback((index) => {
        if (rotateAnimRefs[index]) {
            Animated.timing(rotateAnimRefs[index], {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start(() => rotateAnimRefs[index].setValue(0));
        }
    }, [rotateAnimRefs]);

    const handleSelectInterest = useCallback((interest) => {
        setProfileData((prevData) => {
            const currentInterests = Array.isArray(prevData.interests) ? prevData.interests : [];
            return {
                ...prevData,
                interests: currentInterests.includes(interest)
                    ? currentInterests.filter((i) => i !== interest)
                    : [...currentInterests, interest],
            };
        });
    }, []);

    const pickImage = useCallback(async (index) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Need camera roll permissions to upload images');
                return;
            }

            setIsUploading(true);

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
            });

            if (!result.canceled && result.assets?.[0]) {
                const manipulatedImage = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 800 } }],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );

                setLocalImageUris(prev => {
                    const newUris = [...prev];
                    newUris[index] = manipulatedImage.uri;
                    return newUris;
                });
                setProfileData(prev => {
                    const newImages = [...prev.profileImages];
                    newImages[index] = manipulatedImage.uri;
                    return { ...prev, profileImages: newImages };
                });
                startRotation(index);
            }
        } catch (error) {
            console.error("Image picking error:", error);
            Alert.alert("Error", "Failed to pick image");
        } finally {
            setIsUploading(false);
        }
    }, [startRotation]);

    const uploadSingleImageToFirebase = useCallback(async (uri, index) => {
        if (!auth.currentUser) {
            throw new Error('User not authenticated');
        }

        const filename = `profile_${auth.currentUser.uid}_${index}.jpg`;
        const storageRef = ref(storage, `profilePics/${auth.currentUser.uid}/${filename}`);

        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            await uploadBytes(storageRef, blob);
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error(`Error uploading image ${index}:`, error);
            throw error;
        }
    }, []);

    const handleDeletePress = useCallback(async (index) => {
        const imageUrl = profileData.profileImages[index];
        if (!imageUrl) return;

        if (!imageUrl.startsWith('http')) {
            setProfileData((prevData) => {
                const newProfileImages = [...prevData.profileImages];
                newProfileImages[index] = null;
                return { ...prevData, profileImages: newProfileImages };
            });
            setLocalImageUris((prevUris) => {
                const newUris = [...prevUris];
                newUris[index] = null;
                return newUris;
            });
            return;
        }

        try {
            if (!auth.currentUser?.uid) {
                Alert.alert("Error", "User not logged in or UID missing.");
                return;
            }
            const filename = `profile_${auth.currentUser.uid}_${index}.jpg`;
            const imageRef = ref(storage, `profilePics/${auth.currentUser.uid}/${filename}`);

            await deleteObject(imageRef);

            setProfileData((prevData) => {
                const newProfileImages = [...prevData.profileImages];
                newProfileImages[index] = null;
                return { ...prevData, profileImages: newProfileImages };
            });
            setLocalImageUris((prevUris) => {
                const newUris = [...prevUris];
                newUris[index] = null;
                return newUris;
            });
            Alert.alert("Success", "Image deleted successfully!");
        } catch (error) {
            console.error("Delete error:", error);
            Alert.alert("Error", `Failed to delete image: ${error.message}`);
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
        console.error("completeProfileSetup: No user logged in.");
        return;
    }
    // Add these logs
    console.log("Current User UID:", auth.currentUser.uid);
    console.log("Is user authenticated:", auth.currentUser !== null);


    setIsUploading(true);

    try {
        const uploadedImageUrls = [];
        const imagesToProcess = Array.isArray(profileData.profileImages) ? profileData.profileImages : [];

        const processImagesPromises = imagesToProcess.map(async (imageUri, index) => {
            if (imageUri) {
                if (imageUri.startsWith('file://') || imageUri.startsWith('assets-library://') || imageUri.startsWith('blob:')) {
                    console.log(`Attempting to upload new image at index ${index}: ${imageUri}`);
                    const downloadUrl = await uploadSingleImageToFirebase(imageUri, index);
                    uploadedImageUrls[index] = downloadUrl;
                    return downloadUrl;
                } else if (imageUri.startsWith('http')) {
                    console.log(`Keeping existing Firebase URL at index ${index}: ${imageUri}`);
                    uploadedImageUrls[index] = imageUri;
                    return imageUri;
                }
            }
            uploadedImageUrls[index] = null;
            return null;
        });

        await Promise.all(processImagesPromises);

            const userRef = doc(db, "users", auth.currentUser.uid);
            const profileRef = doc(collection(userRef, "ProfileInfo"), "userinfo");

            await Promise.all([
                setDoc(profileRef, {
                    displayFirstName: profileData.displayFirstName,
                    displayLastName: profileData.displayLastName,
                    age: profileData.age,
                    gender: profileData.gender,
                    interests: Array.isArray(profileData.interests) ? profileData.interests : [],
                    bio: profileData.bio,
                    profileImages: uploadedImageUrls.filter(Boolean),
                    createdAt: new Date(),
                }, { merge: true }),
                setDoc(userRef, { onboarded: true }, { merge: true }),
            ]);

            Alert.alert("Success", "Profile setup complete!");
            navigation.replace("App");
        } catch (error) {
            console.error("Profile setup error:", error);
            Alert.alert("Error", "Failed to complete profile setup");
        } finally {
            setIsUploading(false);
        }
    }, [profileData, navigation, uploadSingleImageToFirebase]);


    // --- DEFINE renderImageItem HERE, BEFORE slides ---
    const renderImageItem = useCallback(({ item: imageFirebaseUrl, index }) => {
        console.log(`renderImageItem called for index ${index}`);
        console.log(`  item (imageFirebaseUrl): ${imageFirebaseUrl} (type: ${typeof imageFirebaseUrl})`);
        console.log(`  localImageUris[${index}]: ${localImageUris[index]} (type: ${typeof localImageUris[index]})`);

        if (imageFirebaseUrl === undefined) {
             console.warn(`renderImageItem received undefined item at index ${index}. Skipping render.`);
             return null;
        }

        const displayImageUri = localImageUris[index] || imageFirebaseUrl;
        const rotationInterpolate = rotateAnimRefs[index]?.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
        });

        return (
            <View key={index} style={styles.uploadContainer}>
                <TouchableOpacity
                    style={styles.rectangle}
                    onPress={() => displayImageUri ? null : pickImage(index)}
                    disabled={isUploading}
                >
                    {displayImageUri ? (
                        <Image source={{ uri: displayImageUri }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.placeholder} />
                    )}
                    {isUploading && (
                        <View style={styles.uploadingOverlay}>
                            <ActivityIndicator size="large" color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>

                <Animated.View style={[
                    styles.addIconContainer,
                    displayImageUri && rotationInterpolate ? { transform: [{ rotate: rotationInterpolate }] } : {},
                ]}>
                    <LinearGradient colors={["#F2BB47", "#D9043D"]} style={styles.addIconButton}>
                        <TouchableOpacity
                            onPress={() => displayImageUri ? handleDeletePress(index) : pickImage(index)}
                            disabled={isUploading}
                        >
                            <AntDesign name={displayImageUri ? "close" : "plus"} size={24} color="#fff" />
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            </View>
        );
    }, [pickImage, handleDeletePress, isUploading, localImageUris, rotateAnimRefs]);


    // --- THEN DEFINE slides, as it references renderImageItem ---
    const slides = [
        {
            id: "1",
            component: (
                <View style={styles.slide}>
                    <Text style={styles.titleRight}>Let's get it Started!</Text>
                    <Text style={styles.subtitleRight}>Let us get to know you, your interests, and set up your public profile.</Text>
                    <Image
                        source={require("../assets/profilesetup/setupImage.png")}
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
                        {Array.isArray(profileData.profileImages) && profileData.profileImages.map((image, index) =>
                            renderImageItem({ item: image, index })
                        )}
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
                    <NextButton onPress={completeProfileSetup} label={"Complete Profile"} />
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
                                width: `${(currentIndex + 1) / (Array.isArray(slides) ? slides.length : 1) * 80}%`
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
        textAlign: "left", // This was the original, for reference
        paddingHorizontal: 30,
        marginTop: 5,
    },
    // New style for right-aligned title
    titleRight: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "Left", // Changed to right
        paddingHorizontal: 30,
        marginTop: 5,
        width: "100%", // Ensure it takes full width to align text within
    },
    prompt: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        paddingHorizontal: 40,
        marginTop: 5,
        marginBottom: 10,
        textAlign: "left",
        alignSelf: 'flex-start',
    },
    subtitle: {
        fontSize: 14,
        color: "#F2F2F2",
        textAlign: "center", // This was the original, for reference
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    // New style for right-aligned subtitle
    subtitleRight: {
        fontSize: 14,
        color: "#F2F2F2",
        textAlign: "Left", // Changed to right
        marginBottom: 10,
        paddingHorizontal: 30, // Adjust padding as needed for alignment
        width: "100%", // Ensure it takes full width to align text within
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
        marginTop: 10,
    },
});

export default ProfileSetupScreen;