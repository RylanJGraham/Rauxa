// src/components/MessageItem.js
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

const MessageItem = ({ item }) => (
  <View style={styles.messageContainer}>
    <Image source={item.image} style={styles.messageImage} />
    <View style={styles.messageTextContainer}>
      <Text style={styles.messageTitle}>{item.title}</Text>
      <Text style={styles.messagePreview}>
        {item.sender}: {item.message}
      </Text>
    </View>
    {item.unreadCount > 0 && (
      <View style={styles.unreadBadge}>
        <Text style={styles.unreadText}>{item.unreadCount}</Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10,
    borderRadius: 10,
  },
  messageImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  messageTextContainer: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  messagePreview: {
    color: "#ccc",
  },
  unreadBadge: {
    backgroundColor: "#D9043D",
    width: 25,
    height: 25,
    borderRadius: 12.5,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default MessageItem;