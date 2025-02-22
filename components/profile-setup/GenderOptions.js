import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

const GenderOptions = ({ selectedGender, onSelectGender }) => {
    const genderOptions = [
        "Male", "Female", "Non-Binary", "Transgender",
        "Genderqueer", "Genderfluid", "Agender", "Bigender",
        "Two-Spirit", "Other"
    ];

    return (
        <View style={styles.genderContainer}>
            {genderOptions.map((gender, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.genderButton,
                        selectedGender === gender && styles.selectedGenderButton,
                    ]}
                    onPress={() => onSelectGender(gender)}
                >
                    <Text style={styles.genderButtonText}>{gender}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
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
        backgroundColor: "#F2BB47",
    },
    genderButtonText: {
        fontSize: 18,
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
});

export default GenderOptions;
