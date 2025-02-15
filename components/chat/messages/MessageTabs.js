// src/components/MessageTabs.js
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

const MessageTabs = ({ activeTab, onTabPress }) => (
  <View style={styles.tabsContainer}>
    <TouchableOpacity
      style={[styles.tab, activeTab === "all" && styles.activeTab]}
      onPress={() => onTabPress("all")}
    >
      <Text style={styles.tabText}>All</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.tab, activeTab === "groups" && styles.activeTab]}
      onPress={() => onTabPress("groups")}
    >
      <Text style={styles.tabText}>Groups</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.tab, activeTab === "people" && styles.activeTab]}
      onPress={() => onTabPress("people")}
    >
      <Text style={styles.tabText}>People</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#444",
  },
  activeTab: {
    backgroundColor: "#D9043D",
  },
  tabText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default MessageTabs;