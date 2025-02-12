// PaginationDots.js
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";

const PaginationDots = ({ slides, currentIndex, onDotPress }) => {
    return (
        <View style={styles.pagination}>
            {slides.map((_, index) => (
                <TouchableOpacity key={index} onPress={() => onDotPress(index)}>
                    <View
                        style={[
                            styles.dot,
                            currentIndex === index && styles.activeDot,
                        ]}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    pagination: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 20,
    },
    dot: {
        width: 12,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#fff",
        marginHorizontal: 5,
    },
    activeDot: {
        backgroundColor: "#34394C",
        width: 30,
        height: 8,
    },
});

export default React.memo(PaginationDots);