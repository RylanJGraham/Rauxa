// NextButton.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const NextButton = ({ onPress, label }) => {
    return (
        <TouchableOpacity style={styles.nextButton} onPress={onPress}>
            <Text style={styles.nextText}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    nextButton: {
        backgroundColor: "#D9043D",
        paddingVertical: 12,
        paddingHorizontal: 64,
        borderRadius: 24,
        marginTop: 60,
    },
    nextText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "800",
    },
});

export default React.memo(NextButton);