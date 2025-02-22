import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

const InterestsSelection = ({ selectedInterests, onSelectInterest }) => {
    const interests = [
        "Music", "Sports", "Karaoke", "Clubs", "Beach", "Dating",
        "Study", "Language Exchange", "Games", "Hiking", "Cooking",
        "Art", "Theater", "Movies", "Volunteer", "Meetups", "Video Games", "Tourism"
    ];

    return (
        <View style={styles.interestContainer}>
            {interests.map((interest, index) => {
                const isSelected = selectedInterests.includes(interest);

                return (
                    <TouchableOpacity
                        key={index}
                        onPress={() => onSelectInterest(interest)}
                        style={[
                            styles.bubbleContainer,
                            isSelected && styles.selectedBubble,
                        ]}
                    >
                        <Text style={styles.bubbleText}>{interest}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    interestContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginTop: 10,
        marginBottom: 10,
    },
    bubbleContainer: {
        padding: 15,
        margin: 5,
        borderRadius: 10,
        backgroundColor: "#00000040",
        borderWidth: 2,
        borderColor: "#F2BB47",
    },
    selectedBubble: {
        backgroundColor: "#F2BB47",
    },
    bubbleText: {
        fontSize: 18,
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
});

export default InterestsSelection;
