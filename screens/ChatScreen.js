import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { chatStyles } from "../styles/chat/chatStyles";
import ChatHeader from "../components/chat/ChatHeader";
import MatchesSection from "../components/chat/matches/MatchesSection";
import MessageTabs from "../components/chat/messages/MessageTabs";
import MessageItem from "../components/chat/messages/MessageItem";

const messages = [
  {
    id: "1",
    title: "Bunkers Hangout",
    sender: "Sarah",
    message: "What time did we decide on?",
    unreadCount: 3,
    image: require("../assets/onboarding/Onboarding1.png"),
  },
  {
    id: "2",
    title: "Montjuïc Castle Tour",
    sender: "Paul",
    message: "Everyone here?",
    unreadCount: 1,
    image: require("../assets/onboarding/Onboarding1.png"),
  },
  {
    id: "3",
    title: "Sarah",
    sender: "Sarah",
    message: "Ready to meet everyone?",
    unreadCount: 1,
    image: require("../assets/onboarding/Onboarding1.png"),
  },
];

const matches = [
  { image: require("../assets/onboarding/Onboarding1.png") },
  { image: require("../assets/onboarding/Onboarding1.png") },
  { image: require("../assets/onboarding/Onboarding1.png") },
  { image: require("../assets/onboarding/Onboarding1.png") },
];

const ChatScreen = () => {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <LinearGradient colors={["#0367A6", "#003f6b"]} style={chatStyles.container}>
      {/* HEADER */}
      <ChatHeader title="New Event Matches" />

      {/* MATCHES SECTION */}
      <MatchesSection matches={matches} />

      {/* MESSAGES SECTION */}
      <Text style={chatStyles.sectionTitle}>Messages</Text>
      <MessageTabs activeTab={activeTab} onTabPress={setActiveTab} />

      {/* MESSAGES LIST */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageItem item={item} />}
      />
    </LinearGradient>
  );
};

export default ChatScreen;