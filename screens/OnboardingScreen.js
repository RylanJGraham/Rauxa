import React, { useState, useRef } from "react";
import { View, Text, Image, Dimensions, StyleSheet, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebase";
import { doc, updateDoc, Timestamp } from "firebase/firestore"; // Import Timestamp
import { LinearGradient } from "expo-linear-gradient";
import { slides } from "../data/onboarding/slides"; // Make sure to update this file with the new slide data
import NextButton from "../components/onboarding-components/NextButton";
import PaginationDots from "../components/onboarding-components/PaginationDots"; // Corrected path

const { width, height } = Dimensions.get("window");

const OnboardingScreen = () => {
    const navigation = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);

    const updateOnboardingStatus = async () => {
        if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            try {
                await updateDoc(userRef, {
                    onboarded: true, // Set onboarded to true after accepting TOS
                    tosSigned: Timestamp.now() // Add tosSigned field with current Firestore Timestamp
                });
                console.log("User onboarding status and TOS acceptance time updated successfully.");
            } catch (error) {
                console.error("Error updating onboarding status and TOS acceptance time:", error);
            }
        }
        navigation.navigate("ProfileSetup"); // Navigate to ProfileSetup
    };

    const handleNext = () => {
        // If it's the second-to-last slide, scroll to the TOS slide
        if (currentIndex < slides.length - 1) {
            flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        }
        // The "I Accept" button on the TOS slide will handle the final navigation
    };

    const handleDotPress = (index) => {
        setCurrentIndex(index);
        flatListRef.current.scrollToIndex({ index });
    };

    const renderSlide = ({ item }) => {
        const isTOSSlide = item.id === "TOS"; // Assuming "TOS" is the ID for your TOS slide

        return (
            <LinearGradient
                key={item.id}
                colors={item.gradientColors}
                style={styles.slide} // This style now uses flex: 1
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                {isTOSSlide ? (
                    <View style={styles.tosContainer}>
                        <Text style={styles.tosTitle}>Welcome to Rauxa!</Text>
                        <ScrollView style={styles.tosContentScroll}>
                            <Text style={styles.tosText}>
                                Before you start using our app, please read and accept these Terms of Service (TOS). By tapping “I Accept,” you agree to the following:
                                {"\n\n"}
                                <Text style={styles.tosSectionTitle}>Location and Data Consent</Text>
                                {"\n"}You grant Rauxa permission to access and use your device’s location, image gallery, and data related to your usage of the app.
                                {"\n"}We use this information to connect you with events and improve your experience.
                                {"\n\n"}
                                <Text style={styles.tosSectionTitle}>User-Created Events</Text>
                                {"\n"}Rauxa is a platform that allows users to create and join events.
                                {"\n"}You understand and agree that you participate in these events at your own risk.
                                {"\n"}Rauxa does not organize, control, or oversee any events.
                                {"\n"}Rauxa is not responsible for any activities, actions, or incidents that may occur during an event.
                                {"\n\n"}
                                <Text style={styles.tosSectionTitle}>User Responsibility</Text>
                                {"\n"}You are solely responsible for your actions and interactions with others while using Rauxa.
                                {"\n"}You agree to comply with local laws and regulations while using the app.
                                {"\n\n"}
                                <Text style={styles.tosSectionTitle}>Privacy and Security</Text>
                                {"\n"}We respect your privacy and handle your data as described in our Privacy Policy.
                                {"\n"}We take steps to protect your data, but you acknowledge that no service is completely secure.
                                {"\n\n"}
                                <Text style={styles.tosSectionTitle}>Updates and Changes</Text>
                                {"\n"}We may update these terms from time to time. If we do, we’ll notify you. Continued use of Rauxa means you accept the updated terms.
                            </Text>
                        </ScrollView>
                        <TouchableOpacity style={styles.acceptButton} onPress={updateOnboardingStatus}>
                            <Text style={styles.acceptButtonText}>I Accept</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <Image
                            source={item.image}
                            style={item.id === "1" ? styles.imageHalf : styles.image}
                            resizeMode="contain"
                        />

                        <Text style={styles.title}>
                            {item.title.map((word, index) => {
                                let highlightStyle = styles.defaultText;
                                if (item.highlightWords.includes(word)) {
                                    highlightStyle = item.id === "3" ? styles.highlightRed : styles.highlightYellow;
                                }
                                return (
                                    <Text key={index} style={highlightStyle}>
                                        {word}
                                    </Text>
                                );
                            })}
                        </Text>

                        <Text style={styles.subtitle}>{item.subtitle}</Text>

                        <NextButton
                            onPress={handleNext}
                            label="Next" // Always "Next" for regular slides
                        />
                        <PaginationDots
                            slides={slides}
                            currentIndex={currentIndex}
                            onDotPress={handleDotPress}
                        />
                    </>
                )}
            </LinearGradient>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={slides}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                renderItem={renderSlide}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, // Make the container fill the whole screen
        alignItems: "center",
        justifyContent: "center",
    },
    slide: {
        flex: 1, // Make the LinearGradient fill its parent (the FlatList item)
        width, // Maintain width based on screen width
        justifyContent: "center",
        alignItems: "center",
        padding: 0,
    },
    image: {
        width: width,
        height: height * 0.5,
    },
    imageHalf: {
        width: width * 0.5, // 50% of screen width
        height: height * 0.5, // 50% of screen height
    },
    title: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
        paddingHorizontal: 30,
        marginTop: 5,
    },
    subtitle: {
        fontSize: 14,
        color: "#F2F2F2",
        textAlign: "center",
        marginTop: 10,
        paddingHorizontal: 20,
    },
    defaultText: {
        color: "#fff", // Default white text
    },
    highlightYellow: {
        color: "#FFD700", // Yellow for slides 1, 2, 4, 5
        fontWeight: "bold",
    },
    highlightRed: {
        color: "#D9043D", // Red for slide 3
        fontWeight: "bold",
    },
    // --- New TOS Styles ---
    tosContainer: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 25,
        paddingTop: height * 0.1, // Adjust top padding
        paddingBottom: height * 0.05, // Adjust bottom padding for button
        alignItems: 'center',
    },
    tosTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
    },
    tosContentScroll: {
        flex: 1, // Allows content to scroll within the container
        width: '100%',
        marginBottom: 20,
    },
    tosText: {
        fontSize: 15,
        color: '#F2F2F2',
        lineHeight: 22,
        textAlign: 'left',
    },
    tosSectionTitle: {
        fontWeight: 'bold',
        color: '#fff', // Or a slightly different color if you prefer
        fontSize: 16,
    },
    acceptButton: {
        backgroundColor: '#D9043D', // Your brand color for the accept button
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '80%', // Make it a good width
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 20, // Space from bottom
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default OnboardingScreen;