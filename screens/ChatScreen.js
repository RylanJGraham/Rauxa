import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Dimensions, StatusBar } from "react-native"; // Import Dimensions, StatusBar
import { LinearGradient } from "expo-linear-gradient";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import MessageItem from "../components/chat/messages/MessageItem";
import EventMatchCard from "../components/chat/matches/EventMatchCard";

// Define consistent spacing and colors for reusability if needed, like in HubScreen
const colors = {
    background: '#1a1a1a', // Example, adjust to your LinearGradient start color
    cardBackground: '#333333',
    primary: '#0367A6', // Your main blue
    secondary: '#FFD700', // Your main yellow
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
};
const spacing = {
    tiny: 4,
    small: 8,
    medium: 16,
    large: 24,
    xl: 32,
};

const { width, height: screenHeight } = Dimensions.get('window'); // Get screen dimensions

const ChatScreen = ({ navigation }) => {
  const [chatList, setChatList] = useState([]);
  const [newMatchEvents, setNewMatchEvents] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true); // Initialize to true

  const chatSeenStatusListenersRef = useRef(new Map());
  const currentChatSeenStatuses = useRef(new Map());
  const mainChatsUnsubscribeRef = useRef(null);

  const profilesCache = useRef(new Map());
  const eventsCache = useRef(new Map());

  const processAndCategorizeChats = useCallback(async (chatDocsFromMainSnapshot) => {
    if (!currentUserId) {
        setChatList([]);
        setNewMatchEvents([]);
        setLoading(false);
        return;
    }

    const tempChatList = [];
    const tempNewMatchEvents = [];

    const chatDetailPromises = chatDocsFromMainSnapshot.map(async (chatDoc) => {
      const chatData = chatDoc.data();
      const chatId = chatDoc.id;
      const eventId = chatData.eventId;
      const participants = chatData.participants;
      const participantCount = Array.isArray(participants) ? participants.length : 0;

      let chatTitle = "Unnamed Event";
      let chatImageUrl = null;
      let lastMessageText = chatData.lastMessage?.text || "No messages yet.";
      let lastMessageSenderId = chatData.lastMessage?.senderId;
      let lastMessageTimestamp = chatData.lastMessage?.timestamp;

      const isSeenForCurrentUser = currentChatSeenStatuses.current.get(chatId) === true;
      const isNewMatchForCurrentUser = !isSeenForCurrentUser;

      if (eventId) {
        if (!eventsCache.current.has(eventId)) {
          const eventRef = doc(db, "live", eventId);
          const eventSnap = await getDoc(eventRef);
          if (eventSnap.exists()) {
            eventsCache.current.set(eventId, eventSnap.data());
          } else {
            console.warn(`Event ${eventId} not found for chat ${chatId}.`);
            eventsCache.current.set(eventId, null);
          }
        }
        const eventData = eventsCache.current.get(eventId);
        if (eventData) {
          chatTitle = eventData.title || `Event ${eventId.substring(0, 4)}...`;
          if (eventData.photos && eventData.photos.length > 0) {
            chatImageUrl = eventData.photos[0];
          }
        }
      } else {
        chatTitle = chatData.name || "Direct Chat";
      }

      let lastMessageSenderDisplayName = "System";
      if (lastMessageSenderId && lastMessageSenderId !== "system") {
        if (!profilesCache.current.has(lastMessageSenderId)) {
          const profileRef = doc(db, "users", lastMessageSenderId, "ProfileInfo", "userinfo");
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            const displayName = profileData.displayFirstName || profileData.name || `User ${lastMessageSenderId.substring(0, 4)}`;
            profilesCache.current.set(lastMessageSenderId, displayName);
          } else {
            profilesCache.current.set(lastMessageSenderId, `User ${lastMessageSenderId.substring(0, 4)}`);
          }
        }
        lastMessageSenderDisplayName = profilesCache.current.get(lastMessageSenderId);
      } else if (lastMessageSenderId === "system") {
        lastMessageSenderDisplayName = "Rauxa";
      }

      return {
        chatId,
        chatTitle,
        chatImageUrl,
        isNewMatchForCurrentUser,
        participantCount,
        lastMessageText,
        lastMessageSenderDisplayName,
        lastMessageTimestamp,
        eventId,
      };
    });

    const processedChats = (await Promise.all(chatDetailPromises)).filter(Boolean);

    processedChats.forEach(processedChat => {
      const {
        chatId, chatTitle, chatImageUrl, isNewMatchForCurrentUser, participantCount,
        lastMessageText, lastMessageSenderDisplayName, lastMessageTimestamp, eventId
      } = processedChat;

      if (isNewMatchForCurrentUser && participantCount === 2) {
        tempNewMatchEvents.push({
          id: chatId,
          title: chatTitle,
          image: chatImageUrl,
          eventId: eventId,
          isNewMatch: true,
        });
      }
      else if (participantCount >= 2) {
        tempChatList.push({
          id: chatId,
          title: chatTitle,
          sender: lastMessageSenderDisplayName,
          message: lastMessageText,
          timestamp: lastMessageTimestamp,
          image: chatImageUrl,
          eventId: eventId,
          hasUnread: false,
          isNewMatch: false,
        });
      }
    });

    tempChatList.sort((a, b) => {
      const tsA = a.timestamp ? a.timestamp.toMillis() : 0;
      const tsB = b.timestamp ? b.timestamp.toMillis() : 0;
      return tsB - tsA;
    });

    setNewMatchEvents(tempNewMatchEvents);
    setChatList(tempChatList);
    setLoading(false);
    console.log("ChatScreen: States updated - New Matches:", tempNewMatchEvents.length, "Chats:", tempChatList.length);
  }, [currentUserId]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        if (mainChatsUnsubscribeRef.current) {
          mainChatsUnsubscribeRef.current();
          mainChatsUnsubscribeRef.current = null;
        }
        chatSeenStatusListenersRef.current.forEach(unsub => unsub());
        chatSeenStatusListenersRef.current.clear();
        currentChatSeenStatuses.current.clear();
        setChatList([]);
        setNewMatchEvents([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (mainChatsUnsubscribeRef.current) {
        mainChatsUnsubscribeRef.current();
        mainChatsUnsubscribeRef.current = null;
      }
      chatSeenStatusListenersRef.current.forEach(unsub => unsub());
      chatSeenStatusListenersRef.current.clear();
      currentChatSeenStatuses.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    if (mainChatsUnsubscribeRef.current) {
      mainChatsUnsubscribeRef.current();
      mainChatsUnsubscribeRef.current = null;
    }
    chatSeenStatusListenersRef.current.forEach(unsub => unsub());
    chatSeenStatusListenersRef.current.clear();
    currentChatSeenStatuses.current.clear();

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUserId),
    );

    console.log("ChatScreen: Setting up main chat snapshot listener for:", currentUserId);

    mainChatsUnsubscribeRef.current = onSnapshot(chatsQuery, async (snapshot) => {
      const chatDocsFromMainSnapshot = snapshot.docs;
      const chatIdsInCurrentSnapshot = new Set(chatDocsFromMainSnapshot.map(doc => doc.id));

      chatSeenStatusListenersRef.current.forEach((unsub, chatId) => {
        if (!chatIdsInCurrentSnapshot.has(chatId)) {
          unsub();
          chatSeenStatusListenersRef.current.delete(chatId);
          currentChatSeenStatuses.current.delete(chatId);
          console.log(`ChatScreen: Cleaned up seen status listener for chat: ${chatId}`);
        }
      });

      const initialSeenStatusPromises = chatDocsFromMainSnapshot.map(chatDoc => {
        const chatId = chatDoc.id;

        if (!chatSeenStatusListenersRef.current.has(chatId)) {
          const userSeenStatusRef = doc(db, "chats", chatId, "new", currentUserId);
          const unsub = onSnapshot(userSeenStatusRef, (userSeenStatusSnap) => {
            const isSeen = userSeenStatusSnap.exists() ? userSeenStatusSnap.data().seen === true : false;
            console.log(`ChatScreen: Live seen status update for chat ${chatId}: ${isSeen}`);

            currentChatSeenStatuses.current.set(chatId, isSeen);

            processAndCategorizeChats(chatDocsFromMainSnapshot);
          }, (error) => {
            console.error(`Error listening to user seen status for chat ${chatId}:`, error);
          });
          chatSeenStatusListenersRef.current.set(chatId, unsub);
        }

        return new Promise(async (resolve) => {
            const seenStatusFromRef = currentChatSeenStatuses.current.get(chatId);
            if (seenStatusFromRef !== undefined) {
                resolve();
            } else {
                const userSeenStatusRef = doc(db, "chats", chatId, "new", currentUserId);
                try {
                    const initialSnap = await getDoc(userSeenStatusRef);
                    const initialIsSeen = initialSnap.exists() ? initialSnap.data().seen === true : false;
                    currentChatSeenStatuses.current.set(chatId, initialIsSeen);
                    console.log(`ChatScreen: Initial getDoc seen status for chat ${chatId}: ${initialIsSeen}`);
                } catch (error) {
                    console.error("Error getting initial seen status:", error);
                    currentChatSeenStatuses.current.set(chatId, false);
                } finally {
                    resolve();
                }
            }
        });
      });

      await Promise.all(initialSeenStatusPromises);
      console.log("ChatScreen: All initial seen statuses collected. Starting full categorization.");
      processAndCategorizeChats(chatDocsFromMainSnapshot);

    }, (error) => {
      console.error("ChatScreen: Error listening to main chats query:", error);
      setLoading(false);
    });

    return () => {
      if (mainChatsUnsubscribeRef.current) {
        mainChatsUnsubscribeRef.current();
        mainChatsUnsubscribeRef.current = null;
      }
      chatSeenStatusListenersRef.current.forEach(unsub => unsub());
      chatSeenStatusListenersRef.current.clear();
      currentChatSeenStatuses.current.clear();
      console.log("ChatScreen: All Firebase listeners cleaned up for useEffect return.");
    };
  }, [currentUserId, processAndCategorizeChats]);

  const handleChatPress = (chatId, chatTitle, eventId) => {
    navigation.navigate('ChatDetail', { chatId, chatTitle, eventId });
  };

  if (loading) {
    return (
      <LinearGradient colors={["#0367A6", "#003f6b"]} style={styles.fullScreenContainer}>
        <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0367A6", "#003f6b"]} style={styles.fullScreenContainer}>
      <ScrollView contentContainerStyle={styles.scrollViewContentContainer}>
        <View style={styles.contentWrapper}>

          {/* NEW EVENT MATCHES SECTION */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleText}>New Event Matches</Text>
            <Text style={styles.sectionCount}>({newMatchEvents.length} Matches)</Text>
          </View>
          {newMatchEvents.length > 0 ? (
            <FlatList
              horizontal
              data={newMatchEvents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <EventMatchCard
                  event={item}
                  onPress={handleChatPress}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.matchesListContent}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyListContent}> {/* Wrap in View for consistent spacing */}
                <Text style={styles.emptyText}>No new event matches yet.</Text>
            </View>
          )}

          {/* MEETUP GROUPCHATS SECTION */}
          <View style={[styles.sectionHeader, styles.meetupGroupchatsSectionHeader]}>
            <Text style={styles.sectionTitleText}>Meetup Groupchats</Text>
            <Text style={styles.sectionCount}>({chatList.length} Chats)</Text>
          </View>

          {/* MAIN MESSAGES LIST */}
          <FlatList
            data={chatList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageItem
                item={item}
                onPress={() => handleChatPress(item.id, item.title, item.eventId)}
                hasUnread={false}
              />
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyHostedEventsContainer}> {/* Re-using HubScreen's style for consistency */}
                  <Text style={styles.emptyText}>No active chats yet.</Text>
              </View>
            )}
            contentContainerStyle={styles.messagesListContent}
            scrollEnabled={false}
          />
        </View>
        <View style={styles.bottomPadding} /> {/* Apply the bottom padding */}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
    },
    loadingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: colors.secondary,
        marginTop: spacing.small,
        fontSize: 16,
    },
    scrollViewContentContainer: {
        flexGrow: 1,
        // No explicit padding here, contentWrapper handles it
    },
    contentWrapper: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + spacing.medium : spacing.large * 2.4,
        paddingHorizontal: spacing.medium,
    },
    // Styles from HubScreen:
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: spacing.small, // Consistent spacing below header
        marginTop: spacing.medium, // Default spacing above the first header (New Event Matches)
    },
    sectionTitleText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginRight: spacing.small,
    },
    sectionCount: {
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    // New Match Events List Styling
    matchesListContent: {
        minHeight: screenHeight * 0.15, // A minimum height for the horizontal list, similar to rsvpListContent
        justifyContent: 'center', // Center content vertically if it doesn't fill minHeight
        marginBottom: spacing.medium, // Space below the matches list before next section header
        paddingBottom: spacing.tiny, // Small internal padding to ensure cards aren't flush with bottom margin
    },
    emptyListContent: {
        // This is for "No new event matches yet."
        width: width - (spacing.medium * 2), // Match paddingHorizontal of contentWrapper
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.large, // Give it some vertical height
        marginBottom: spacing.medium, // Space below the empty message
    },
    emptyText: {
        color: colors.textSecondary,
        fontSize: 16,
        textAlign: 'center',
    },
    // Meetup Groupchats Section Header Styling
    meetupGroupchatsSectionHeader: {
        marginTop: spacing.medium, // Ensure consistent spacing from the content above it
    },
    // Main Messages List Styling
    messagesListContent: {
        // No top margin, sectionHeader above it handles spacing
        paddingBottom: spacing.medium, // Ensure bottom padding for the chat items
    },
    // Re-use HubScreen's empty container for main chat list
    emptyHostedEventsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.large,
    },
    bottomPadding: {
        height: Platform.OS === 'ios' ? 110 : 120, // Consistent with HubScreen
    },
});

export default ChatScreen;