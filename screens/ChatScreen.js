import React, { useState, useEffect } from "react"; // Already there
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native"; // Already there
import { LinearGradient } from "expo-linear-gradient"; // Already there
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  setDoc // Removed: No longer needed for read receipts
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import ChatHeader from "../components/chat/ChatHeader";
import MessageItem from "../components/chat/messages/MessageItem";
import EventMatchCard from "../components/chat/matches/EventMatchCard";

const ChatScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [chatList, setChatList] = useState([]);
  const [newMatchEvents, setNewMatchEvents] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Listen for Auth State Changes (No changes here)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        console.log("ChatScreen: User authenticated:", user.uid);
      } else {
        setCurrentUserId(null);
        setChatList([]);
        setNewMatchEvents([]);
        console.log("ChatScreen: User not authenticated.");
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Fetch Chat Data and categorize them (MODIFIED)
  useEffect(() => {
  if (!currentUserId) {
    setChatList([]);
    setNewMatchEvents([]);
    setLoading(false); // Ensure loading is false if no user
    return;
  }

  setLoading(true); // Set loading to true when starting to fetch data

  const chatsQuery = query(
    collection(db, "chats"),
    where("participants", "array-contains", currentUserId),
  );


    console.log("ChatScreen: Setting up chat snapshot listener for:", currentUserId);

    const unsubscribeChats = onSnapshot(chatsQuery, async (snapshot) => {
    const tempChatList = [];
    const tempNewMatchEvents = [];
    const profilesCache = new Map(); // Cache for profiles

    // Step 1: Collect all necessary data fetches concurrently
    const chatProcessingPromises = snapshot.docs.map(async (chatDoc) => {
      try {
        const chatData = chatDoc.data();
        const chatId = chatDoc.id;
        const eventId = chatData.eventId;
        const isNewMatch = chatData.isNewMatch || false;
        const participants = chatData.participants;
        const participantCount = Array.isArray(participants) ? participants.length : 0;

        let chatTitle = "Unnamed Event";
        let chatImageUrl = null;
        let lastMessageText = chatData.lastMessage?.text || "No messages yet.";
        let lastMessageSenderId = chatData.lastMessage?.senderId;
        let lastMessageTimestamp = chatData.lastMessage?.timestamp;

        // Fetch event details concurrently if eventId exists
        if (eventId) {
          const eventRef = doc(db, "live", eventId);
          const eventSnap = await getDoc(eventRef); // Await this specific event fetch
          if (eventSnap.exists()) {
            const eventData = eventSnap.data();
            chatTitle = eventData.title || `Event ${eventId.substring(0, 4)}...`;
            if (eventData.photos && eventData.photos.length > 0) {
              chatImageUrl = eventData.photos[0];
            }
          } else {
            console.warn(`Event ${eventId} not found for chat ${chatId}.`);
          }
        } else {
          chatTitle = chatData.name || "Direct Chat";
        }

        // Fetch last message sender's profile concurrently if needed
        let lastMessageSenderDisplayName = "System";
        if (lastMessageSenderId && lastMessageSenderId !== "system") {
          if (!profilesCache.has(lastMessageSenderId)) {
            const profileRef = doc(db, "users", lastMessageSenderId, "ProfileInfo", "userinfo");
            const profileSnap = await getDoc(profileRef); // Await this specific profile fetch
            if (profileSnap.exists()) {
              const profileData = profileSnap.data();
              const displayName = profileData.displayFirstName || profileData.name || `User ${lastMessageSenderId.substring(0, 4)}`;
              profilesCache.set(lastMessageSenderId, displayName);
            } else {
              profilesCache.set(lastMessageSenderId, `User ${lastMessageSenderId.substring(0, 4)}`);
            }
          }
          lastMessageSenderDisplayName = profilesCache.get(lastMessageSenderId);
        } else if (lastMessageSenderId === "system") {
          lastMessageSenderDisplayName = "Rauxa";
        }

        return {
          chatId,
          chatTitle,
          chatImageUrl,
          isNewMatch,
          participantCount,
          lastMessageText,
          lastMessageSenderDisplayName,
          lastMessageTimestamp,
          eventId,
        };
      } catch (innerError) {
        console.error(`ChatScreen: Error processing chat document ${chatDoc.id}:`, innerError);
        return null; // Return null for failed processing
      }
    });

    // Resolve all promises concurrently
    const processedChats = await Promise.all(chatProcessingPromises);

    // Step 2: Filter out failed ones and categorize
    processedChats.forEach(processedChat => {
      if (!processedChat) return; // Skip if processing failed

      const {
        chatId, chatTitle, chatImageUrl, isNewMatch, participantCount,
        lastMessageText, lastMessageSenderDisplayName, lastMessageTimestamp, eventId
      } = processedChat;

      if (isNewMatch && participantCount === 2) {
        tempNewMatchEvents.push({
          id: chatId,
          title: chatTitle,
          image: chatImageUrl,
          eventId: eventId,
        });
      } else if (participantCount >= 2) {
        tempChatList.push({
          id: chatId,
          title: chatTitle,
          sender: lastMessageSenderDisplayName,
          message: lastMessageText,
          timestamp: lastMessageTimestamp,
          image: chatImageUrl,
          eventId: eventId,
          hasUnread: false,
        });
      }
    });

    // Sort regular chats by timestamp
    tempChatList.sort((a, b) => {
      const tsA = a.timestamp ? a.timestamp.toMillis() : 0;
      const tsB = b.timestamp ? b.timestamp.toMillis() : 0;
      return tsB - tsA;
    });

    setNewMatchEvents(tempNewMatchEvents);
    setChatList(tempChatList);
    setLoading(false); // Set loading to false only after all data is processed
  }, (error) => {
    console.error("ChatScreen: Error listening to chats (outer snapshot error):", error);
    setLoading(false); // Also set loading to false on error
  });

  return () => unsubscribeChats();
}, [currentUserId]);

  const handleChatPress = (chatId, chatTitle, eventId) => {
    navigation.navigate('ChatDetail', { chatId, chatTitle, eventId });
  };

  if (loading) {
    return (
      <LinearGradient colors={["#0367A6", "#003f6b"]} style={styles.container}>
        <Text style={styles.loadingText}>Loading chats...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0367A6", "#003f6b"]} style={styles.container}>
      {/* HEADER */}
      <ChatHeader title="Messages" /> {/* Changed header title as it's no longer just "New Event Matches" */}

      {/* NEW EVENT MATCHES SECTION */}
      <Text style={styles.sectionTitle}>New Event Matches</Text>
      {newMatchEvents.length > 0 ? (
        <FlatList
          data={newMatchEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventMatchCard
              event={item}
              onPress={handleChatPress}
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.matchesListContent}
          style={styles.matchesList}
        />
      ) : (
        <Text style={styles.emptyText}>No new event matches yet.</Text>
      )}

      {/* MEETUP GROUPCHATS SECTION */}
      <Text style={styles.sectionTitle}>Meetup Groupchats</Text>

      {/* MAIN MESSAGES LIST */}
      <FlatList
        data={chatList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageItem
            item={item}
            onPress={() => handleChatPress(item.id, item.title, item.eventId)}
            // hasUnread prop is now always false as read receipt logic is removed
            hasUnread={false}
          />
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No active chats yet.</Text>
        )}
        style={styles.messagesList}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#a0aec0',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  matchesList: {
    height: 140,
    marginBottom: 10,
  },
  matchesListContent: {
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  messagesList: {
    flex: 1,
  },
});

export default ChatScreen;