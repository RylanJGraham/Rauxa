// src/components/ChatHeader.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ChatHeader = ({ title }) => (
  <View>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FDC60A",
    marginBottom: 10,
  },
});

export default ChatHeader;