// components/chat/ChatDetailScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from 'expo-image';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc, // <-- Ensure updateDoc is imported
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import MessageBubble from "../components/chat/messages/MessageBubble";
import MessageInput from "../components/chat/MessageInput";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

// Import the ParticipantsDropdown component
import ParticipantsDropdown from '../components/chat/ParticipantsDropdown';
// Import EventDetailsOverlay
import EventDetailsOverlay from '../components/chat/EventDetailsOverlay';

const MESSAGES_PER_LOAD = 20;

const ChatDetailScreen = ({ route, navigation }) => {
  const { chatId, eventId: initialEventId } = route.params || {};
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
  const [lastMessageSnapshot, setLastMessageSnapshot] = useState(null);
  const [participantsInfo, setParticipantsInfo] = useState({});
  const [headerEventName, setHeaderEventName] = useState("Loading Chat...");
  const [eventHeaderImageUrl, setEventHeaderImageUrl] = useState(null);
  const [isParticipantsDropdownVisible, setIsParticipantsDropdownVisible] = useState(false);
  const [isEventDetailsOverlayVisible, setIsEventDetailsOverlayVisible] = useState(false);
  const [chatEventId, setChatEventId] = useState(null);
  const [fetchedEventData, setFetchedEventData] = useState(null);
  const flatListRef = useRef(null);

  // Early exit if chatId is truly undefined (defensive programming)
  useEffect(() => {
    if (!chatId) {
      console.error("ChatDetailScreen: chatId is undefined. Navigating back.");
      const timer = setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [chatId, navigation]);


  // Auth State Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        console.log("ChatDetailScreen: User authenticated:", user.uid);
      } else {
        setCurrentUserId(null);
        setMessages([]); // Clear messages if user logs out or session expires
        console.log("ChatDetailScreen: User not authenticated.");
        navigation.goBack(); // Go back to previous screen
      }
      setLoading(false); // Authentication state determined, stop loading indicator
    });
    return () => unsubscribeAuth(); // Cleanup subscription on unmount
  }, [navigation]);

  // Mark chat as 'seen' once loaded
  useEffect(() => {
    if (chatId && currentUserId) {
      const chatDocRef = doc(db, "chats", chatId);
      getDoc(chatDocRef).then(async (docSnap) => {
        if (docSnap.exists() && docSnap.data().isNewMatch === true) {
          console.log(`ChatDetailScreen: Marking chat ${chatId} as not new.`);
          try {
            await updateDoc(chatDocRef, {
              isNewMatch: false,
            });
          } catch (error) {
            console.error("Error updating isNewMatch for chat:", chatId, error);
          }
        }
      }).catch(error => {
        console.error("Error fetching chat for isNewMatch check:", error);
      });
    }
  }, [chatId, currentUserId]); // Depend on chatId and currentUserId


  // Fetch Chat Details, Participant Info, and Event Header Image/Name
  useEffect(() => {
    if (!currentUserId || !chatId) return; // Only fetch if user and chat ID are available

    const fetchData = async () => {
      try {
        const chatDocRef = doc(db, "chats", chatId);
        const chatDocSnap = await getDoc(chatDocRef);

        if (chatDocSnap.exists()) {
          const chatData = chatDocSnap.data();
          const participantIds = chatData.participants || [];
          const fetchedInfo = {};

          // --- START FIX ---
          // Manually add an entry for the "system" sender (Rauxa Admin)
          // This ensures that system messages have a defined profile picture and display name.
          fetchedInfo["system"] = {
            id: "system",
            displayName: "Rauxa Admin",
            firstName: "Rauxa",
            lastName: "Admin",
            // Ensure this path is correct relative to your ChatDetailScreen.js file
            profileImage: require('../assets/onboarding/Onboarding1.png'),
          };
          // --- END FIX ---

          // Fetch profile info for each participant
          for (const pId of participantIds) {
            // Only fetch if not already explicitly added (like "system" was)
            if (!fetchedInfo[pId]) {
              const profileRef = doc(db, "users", pId, "ProfileInfo", "userinfo");
              const profileSnap = await getDoc(profileRef);
              if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                fetchedInfo[pId] = {
                  id: pId,
                  displayName: profileData.displayFirstName ||
                               profileData.name ||
                               "Unknown User",
                  firstName: profileData.displayFirstName || "",
                  lastName: profileData.name?.split(' ').length > 1 ? profileData.name.split(' ')[1] : "",
                  profileImage: profileData.profileImages?.[0] || null,
                };
              } else {
                // Fallback for user profiles not found, if ever needed
                fetchedInfo[pId] = {
                  id: pId,
                  displayName: `User ${pId.substring(0, 4)}...`,
                  firstName: `User`,
                  lastName: `${pId.substring(0, 4)}...`,
                  profileImage: null, // Generic fallback if no specific image is desired
                };
              }
            }
          }
          setParticipantsInfo(fetchedInfo);
          console.log("ChatDetailScreen: Fetched participants info:", fetchedInfo);

          const eventId = chatData.eventId || initialEventId;
          setChatEventId(eventId); // Store eventId in state for potential use in overlay
          if (eventId) {
            const eventRef = doc(db, "live", eventId);
            const eventSnap = await getDoc(eventRef);
            if (eventSnap.exists()) {
              const eventData = eventSnap.data();
              setFetchedEventData(eventData); // Store eventData
              // Use eventData.title as requested for the header
              setHeaderEventName(eventData.title || `Event ${eventId.substring(0, 4)}...`);
              if (eventData.photos && eventData.photos.length > 0) {
                setEventHeaderImageUrl(eventData.photos[0]);
              }
            } else {
              console.warn(`Event ${eventId} not found for chat ${chatId}.`);
              setHeaderEventName("Event Not Found");
              setFetchedEventData(null); // Clear if not found
            }
          } else {
            // Fallback for direct chats or chats without an associated event
            setHeaderEventName(chatData.name || "Direct Chat");
            setFetchedEventData(null); // Clear if no event ID
          }

        } else {
          console.warn(`Chat ${chatId} not found. Navigating back.`);
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching chat data:", error);
      }
    };

    fetchData();
  }, [currentUserId, chatId, navigation, initialEventId]);

  // Real-time Messages Listener (Initial Load & New Messages)
  useEffect(() => {
    if (!currentUserId || !chatId) {
      setMessages([]);
      return;
    }

    console.log("ChatDetailScreen: Setting up initial messages snapshot listener.");

    const initialMessagesQuery = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc"), // Order by OLDEST first
      limit(MESSAGES_PER_LOAD),
    );

    const unsubscribe = onSnapshot(initialMessagesQuery, (snapshot) => {
      console.log("ChatDetailScreen: Initial messages snapshot received.");
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLastMessageSnapshot(snapshot.docs[snapshot.docs.length - 1]);
      setAllMessagesLoaded(snapshot.docs.length < MESSAGES_PER_LOAD);

      // Messages are now ordered ascending (oldest to newest) from Firestore.
      // With `inverted={true}` on FlatList, this means newer messages will be at the bottom (visually).
      setMessages(fetchedMessages);
    }, (error) => {
      console.error("ChatDetailScreen: Error listening to initial messages:", error);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [currentUserId, chatId]);

  // Function to load more (older) messages when scrolling up
  const loadMoreMessages = async () => {
    // Prevent loading more if already loading, all messages loaded, or no more older messages to fetch
    if (loadingMore || allMessagesLoaded || !lastMessageSnapshot || !chatId) {
      return;
    }

    setLoadingMore(true);
    console.log("ChatDetailScreen: Loading more messages (older)...");

    const moreMessagesQuery = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc"), // Order by OLDEST first
      startAfter(lastMessageSnapshot), // Start after the oldest message currently displayed
      limit(MESSAGES_PER_LOAD),
    );

    try {
      const snapshot = await getDocs(moreMessagesQuery);
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (newMessages.length === 0) {
        setAllMessagesLoaded(true); // No more older messages available
        console.log("ChatDetailScreen: All older messages loaded.");
      } else {
        setLastMessageSnapshot(snapshot.docs[snapshot.docs.length - 1]); // Update the last snapshot for next load
        // Prepend newly loaded OLDER messages to the existing list (which is oldest to newest)
        // This maintains the correct visual order for an inverted list when scrolling up.
        setMessages((prevMessages) => [...newMessages, ...prevMessages]);
        console.log(`ChatDetailScreen: Loaded ${newMessages.length} more messages.`);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // --- READ RECEIPT LOGIC REMOVED ---
  // The useEffect responsible for writing read receipts is removed.
  // This means `lastReadTimestamp` will no longer be updated.

  // Scroll to bottom when messages update (initial load or new messages sent)
  useEffect(() => {
    // This effect ensures the FlatList scrolls to the visual bottom (latest messages)
    // whenever the messages array updates and there are messages to display.
    if (flatListRef.current && messages.length > 0) {
      // Use a short timeout to ensure layout has updated before scrolling.
      // This is crucial for FlatList to correctly calculate its scroll position.
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 900);
    }
  }, [messages]); // Trigger when the messages array changes

  // Send Message Function
  const handleSendMessage = async () => {
    if (newMessageText.trim() === "" || !currentUserId || !chatId) {
      return; // Do not send empty messages or if user/chat info is missing
    }

    try {
      const messagesCollectionRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesCollectionRef, {
        senderId: currentUserId,
        text: newMessageText,
        timestamp: serverTimestamp(), // Use server timestamp for consistency
        type: "user", // Or other types like "system", "event", etc.
      });

      // Update the chat document with the last message info for chat list display
      const chatDocRef = doc(db, "chats", chatId);
      await updateDoc(chatDocRef, {
        lastMessage: {
          text: newMessageText,
          senderId: currentUserId,
          timestamp: serverTimestamp(),
        },
        lastMessageTimestamp: serverTimestamp(),
      });

      setNewMessageText(""); // Clear input field after sending
      console.log("Message sent and chat updated.");
      // The `useEffect` above will automatically handle scrolling to the end
      // as the `messages` state updates with the new message from the `onSnapshot` listener.
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Function to handle Quick Create / Modify Event (placeholder for actual navigation)
  const handleOpenCreateMeetupModal = (type, eventData) => {
    console.log(`Attempting to open Create Meetup Modal for type: ${type}`);
    console.log("Event Data:", eventData);
    // You would typically navigate to a specific screen here
    navigation.navigate('CreateMeetupScreen', { type, eventData });
  };


  // Show loading indicator if data is still being fetched or chat ID is missing
  if (loading || !chatId) {
    return (
      <LinearGradient colors={["#0367A6", "#003f6b"]} style={styles.container}>
        <Text style={styles.loadingText}>Loading chat...</Text>
      </LinearGradient>
    );
  }

  return (
      <LinearGradient
        colors={["#0367A6", "#003f6b"]}
        // Apply paddingBottom from insets to push content above device's system navigation/tab bar
        style={[styles.container, { paddingBottom: insets.bottom + 10 }]}
      >
        {/* Chat Header */}
        <View style={styles.header}>
          {/* Back button to navigate out of the chat */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFD700" />
          </TouchableOpacity>
          {/* Display event image if available */}
          {eventHeaderImageUrl && (
            <Image
              source={{ uri: eventHeaderImageUrl }}
              style={styles.headerImage}
              contentFit="cover"
            />
          )}
          {/* Display event name/chat title */}
          <Text style={styles.headerTitle}>{headerEventName}</Text>
          {/* Information Icon to open event details overlay */}
          <TouchableOpacity
            onPress={() => setIsEventDetailsOverlayVisible(true)}
            style={styles.infoButton}
          >
            <Ionicons name="information-circle" size={28} color="#FFD700" />
          </TouchableOpacity>
          {/* Participants Icon to toggle dropdown visibility */}
          <TouchableOpacity
            onPress={() => setIsParticipantsDropdownVisible(!isParticipantsDropdownVisible)}
            style={styles.participantsButton}
          >
            <Ionicons name="people" size={28} color="#FFD700" />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              currentUserId={currentUserId}
              participantsInfo={participantsInfo}
            />
          )}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContentContainer}
          onEndReached={loadMoreMessages} // Triggered when scrolling towards the (visual) top
          onEndReachedThreshold={0.5} // When 50% of the content from the end is reached
          // ListHeaderComponent for inverted list appears at the visual TOP (oldest messages)
          ListHeaderComponent={allMessagesLoaded && messages.length > 0 && !loadingMore ?
            (<Text style={styles.allMessagesLoadedText}>
              Groupchat Started for {fetchedEventData?.title || 'this Event'}
            </Text>) : null
          }
          // ListFooterComponent for inverted list appears at the visual BOTTOM (newest messages)
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#FFD700" style={{ marginVertical: 10 }} /> : null}
          // Essential for displaying latest messages at the bottom
          showsVerticalScrollIndicator={false} // Hides the scrollbar
        />

        {/* Message Input Component */}
        <MessageInput
          value={newMessageText}
          onChangeText={setNewMessageText}
          onSendMessage={handleSendMessage}
        />

        {/* Participants Dropdown as a View, positioned absolutely */}
        {isParticipantsDropdownVisible && (
          <View style={styles.dropdownPosition}>
            <ParticipantsDropdown
              onClose={() => setIsParticipantsDropdownVisible(false)}
              participants={Object.values(participantsInfo)}
            />
          </View>
        )}

        {/* Event Details Overlay (conditionally rendered) */}
      {isEventDetailsOverlayVisible && chatEventId && (
        <EventDetailsOverlay
          eventId={chatEventId} // Pass the eventId to fetch details
          onClose={() => setIsEventDetailsOverlayVisible(false)} // Function to close the overlay
          onOpenCreateMeetupModal={handleOpenCreateMeetupModal} // Callback for actions within the overlay
        />
      )}
      </LinearGradient>

  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0367A6', // Background color for the safe area
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    // Dynamic paddingTop to account for status bar and header (if not using react-navigation header)
    paddingTop: Platform.OS === 'android' ? 30 : 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  headerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#ddd',
  },
  backButton: {
    padding: 8,
  },
  infoButton: {
    padding: 8,
    marginLeft: 'auto', // Pushes this button and subsequent ones to the right
    marginRight: 5,
  },
  participantsButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1, // Allows title to take available space
    textAlign: 'left', // Aligns title to the left
  },
  messagesList: {
    flex: 1, // Allows FlatList to take remaining vertical space
  },
  messagesContentContainer: {
    paddingBottom: 10, // Padding at the visual bottom (newest messages)
    paddingTop: 10,     // Padding at the visual top (oldest messages)
  },
  allMessagesLoadedText: {
    color: '#a0aec0',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 10,
  },
  dropdownPosition: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 90 : 110, // Adjust position based on header height
    right: 16,
    zIndex: 1000, // Ensure dropdown appears on top
  },
});

export default ChatDetailScreen;