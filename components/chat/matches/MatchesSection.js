// src/components/MatchesSection.js
import React from "react";
import { View, Image, StyleSheet, Text } from "react-native";

const MatchesSection = ({ matches }) => {
  if (!matches || matches.length === 0) {
    return (
      <View style={styles.matchesContainer}>
        <Text style={styles.noMatchesText}>No matches found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.matchesContainer}>
      {matches.map((match, index) => (
        <Image key={index} source={match.image} style={styles.matchImage} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  matchesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  matchImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#fff",
  },
  noMatchesText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});

export default MatchesSection;