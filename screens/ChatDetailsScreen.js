import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text, // Ensure Text is imported
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView, // Though safeArea styles are present, SafeAreaView itself isn't used as the main container
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
  updateDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import MessageBubble from "../components/chat/messages/MessageBubble";
import MessageInput from "../components/chat/MessageInput";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import ParticipantsDropdown from '../components/chat/ParticipantsDropdown';
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
  }, [chatId, currentUserId]);


  // Fetch Chat Details, Participant Info, and Event Header Image/Name
  useEffect(() => {
    if (!currentUserId || !chatId) return;

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
          fetchedInfo["system"] = {
            id: "system",
            displayName: "Rauxa Admin",
            firstName: "Rauxa",
            lastName: "Admin",
            profileImage: require('../assets/onboarding/Onboarding1.png'), // Corrected path
          };
          // --- END FIX ---

          // Fetch profile info for each participant
          for (const pId of participantIds) {
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
                fetchedInfo[pId] = {
                  id: pId,
                  displayName: `User ${pId.substring(0, 4)}...`,
                  firstName: `User`,
                  lastName: `${pId.substring(0, 4)}...`,
                  profileImage: null,
                };
              }
            }
          }
          setParticipantsInfo(fetchedInfo);
          console.log("ChatDetailScreen: Fetched participants info:", fetchedInfo);

          const eventId = chatData.eventId || initialEventId;
          setChatEventId(eventId);
          if (eventId) {
            const eventRef = doc(db, "live", eventId);
            const eventSnap = await getDoc(eventRef);
            if (eventSnap.exists()) {
              const eventData = eventSnap.data();
              setFetchedEventData(eventData);
              setHeaderEventName(eventData.title || `Event ${eventId.substring(0, 4)}...`);
              if (eventData.photos && eventData.photos.length > 0) {
                setEventHeaderImageUrl(eventData.photos[0]);
              }
            } else {
              console.warn(`Event ${eventId} not found for chat ${chatId}.`);
              setHeaderEventName("Event Not Found");
              setFetchedEventData(null);
            }
          } else {
            setHeaderEventName(chatData.name || "Direct Chat");
            setFetchedEventData(null);
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
      orderBy("timestamp", "asc"),
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

      setMessages(fetchedMessages);
    }, (error) => {
      console.error("ChatDetailScreen: Error listening to initial messages:", error);
    });

    return () => unsubscribe();
  }, [currentUserId, chatId]);

  const loadMoreMessages = async () => {
    if (loadingMore || allMessagesLoaded || !lastMessageSnapshot || !chatId) {
      return;
    }

    setLoadingMore(true);
    console.log("ChatDetailScreen: Loading more messages (older)...");

    const moreMessagesQuery = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc"),
      startAfter(lastMessageSnapshot),
      limit(MESSAGES_PER_LOAD),
    );

    try {
      const snapshot = await getDocs(moreMessagesQuery);
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (newMessages.length === 0) {
        setAllMessagesLoaded(true);
        console.log("ChatDetailScreen: All older messages loaded.");
      } else {
        setLastMessageSnapshot(snapshot.docs[snapshot.docs.length - 1]);
        setMessages((prevMessages) => [...newMessages, ...prevMessages]);
        console.log(`ChatDetailScreen: Loaded ${newMessages.length} more messages.`);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessageText.trim() === "" || !currentUserId || !chatId) {
      return;
    }

    try {
      const messagesCollectionRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesCollectionRef, {
        senderId: currentUserId,
        text: newMessageText,
        timestamp: serverTimestamp(),
        type: "user",
      });

      const chatDocRef = doc(db, "chats", chatId);
      await updateDoc(chatDocRef, {
        lastMessage: {
          text: newMessageText,
          senderId: currentUserId,
          timestamp: serverTimestamp(),
        },
        lastMessageTimestamp: serverTimestamp(),
      });

      setNewMessageText("");
      console.log("Message sent and chat updated.");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleOpenCreateMeetupModal = (type, eventData) => {
    console.log(`Attempting to open Create Meetup Modal for type: ${type}`);
    console.log("Event Data:", eventData);
    navigation.navigate('CreateMeetupScreen', { type, eventData });
  };

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
      style={[styles.container, { paddingBottom: insets.bottom + 10 }]}
    >
      {/* Chat Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        {eventHeaderImageUrl && (
          <Image
            source={{ uri: eventHeaderImageUrl }}
            style={styles.headerImage}
            contentFit="cover"
          />
        )}
        <Text style={styles.headerTitle}>{headerEventName}</Text> {/* This is correctly wrapped */}
        <TouchableOpacity
          onPress={() => setIsEventDetailsOverlayVisible(true)}
          style={styles.infoButton}
        >
          <Ionicons name="information-circle" size={28} color="#FFD700" />
        </TouchableOpacity>
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
          // IMPORTANT: MessageBubble must ensure all its internal text is wrapped in <Text>
          <MessageBubble
            message={item}
            currentUserId={currentUserId}
            participantsInfo={participantsInfo}
          />
        )}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContentContainer}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={allMessagesLoaded && messages.length > 0 && !loadingMore ?
          (<Text style={styles.allMessagesLoadedText}>
            Groupchat Started for {fetchedEventData?.title || 'this Event'}
          </Text>) : null
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#FFD700" style={{ marginVertical: 10 }} /> : null}
        showsVerticalScrollIndicator={false}
      />

      {/* Message Input Component */}
      {/* IMPORTANT: MessageInput component must ensure any text it displays (e.g., placeholder, button text) is wrapped in <Text> */}
      <MessageInput
        value={newMessageText}
        onChangeText={setNewMessageText}
        onSendMessage={handleSendMessage}
      />

      {/* Participants Dropdown as a View, positioned absolutely */}
      {isParticipantsDropdownVisible && (
        <View style={styles.dropdownPosition}>
          {/* IMPORTANT: ParticipantsDropdown must ensure all its internal text is wrapped in <Text> */}
          <ParticipantsDropdown
            onClose={() => setIsParticipantsDropdownVisible(false)}
            participants={Object.values(participantsInfo)}
          />
        </View>
      )}

      {/* Event Details Overlay (conditionally rendered) */}
      {isEventDetailsOverlayVisible && chatEventId && (
        // IMPORTANT: EventDetailsOverlay must ensure all its internal text is wrapped in <Text>
        <EventDetailsOverlay
          eventId={chatEventId}
          onClose={() => setIsEventDetailsOverlayVisible(false)}
          onOpenCreateMeetupModal={handleOpenCreateMeetupModal}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0367A6',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
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
    marginLeft: 'auto',
    marginRight: 5,
  },
  participantsButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'left',
  },
  messagesList: {
    flex: 1,
  },
  messagesContentContainer: {
    paddingBottom: 10,
    paddingTop: 10,
  },
  allMessagesLoadedText: {
    color: '#a0aec0',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 10,
  },
  dropdownPosition: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 90 : 110,
    right: 16,
    zIndex: 1000,
  },
});

export default ChatDetailScreen;