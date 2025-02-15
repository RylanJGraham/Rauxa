import React, { useState, useRef } from "react";
import { View, Text, Image, Dimensions, StyleSheet, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { slides } from "../data/onboarding/slides";
import NextButton from "../components/onboarding-components/NextButton";
import PaginationDots from "../components/onboarding-components/PaginationDots";

const { width, height } = Dimensions.get("window");

const OnboardingScreen = () => {
    const navigation = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);

    const updateOnboardingStatus = async () => {
        if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, { onboarded: false }); // Set onboarded to false initially
        }
        navigation.navigate("ProfileSetup"); // Navigate to ProfileSetup
    };

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            updateOnboardingStatus();
        }
    };

    const handleDotPress = (index) => {
        setCurrentIndex(index);
        flatListRef.current.scrollToIndex({ index });
    };

    const renderSlide = ({ item }) => {
        return (
            <LinearGradient
                key={item.id}
                colors={item.gradientColors}
                style={styles.slide}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
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
                    label={currentIndex === slides.length - 1 ? "Get Started" : "Next"}
                />
                <PaginationDots
                    slides={slides}
                    currentIndex={currentIndex}
                    onDotPress={handleDotPress}
                />
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
                renderItem={renderSlide}>

                </FlatList>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    slide: {
        flex: 1,
        width,
        justifyContent: "center",
        alignItems: "center",
        padding: 0,
        height: height,
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
});

export default OnboardingScreen;