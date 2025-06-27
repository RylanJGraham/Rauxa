import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Alert,
  StatusBar,
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
  setDoc,
  arrayRemove,
  deleteDoc,
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
  const [eventHostId, setEventHostId] = useState(null); // <--- NEW STATE: To store the event host's UID
  const flatListRef = useRef(null);

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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        console.log("ChatDetailScreen: User authenticated:", user.uid);
      } else {
        setCurrentUserId(null);
        setMessages([]);
        console.log("ChatDetailScreen: User not authenticated.");
        navigation.goBack();
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, [navigation]);

  useEffect(() => {
    if (chatId && currentUserId) {
      const userSeenStatusRef = doc(db, "chats", chatId, "new", currentUserId);
      getDoc(userSeenStatusRef).then(async (docSnap) => {
        if (docSnap.exists() && docSnap.data().seen === false) {
          console.log(`ChatDetailScreen: Marking chat ${chatId} as seen for user ${currentUserId}.`);
          try {
            await updateDoc(userSeenStatusRef, {
              seen: true,
            });
            console.log("Successfully updated seen status to true.");
          } catch (error) {
            console.error("Error updating seen status for chat:", chatId, "user:", currentUserId, error);
          }
        } else if (!docSnap.exists()) {
          console.log(`ChatDetailScreen: No 'new' status found for chat ${chatId} for user ${currentUserId}. Defensively creating with seen: true.`);
          try {
            await setDoc(userSeenStatusRef, {
              seen: true,
              joinedAt: serverTimestamp(),
            }, { merge: true });
            console.log("Defensively set seen status to true for missing entry.");
          } catch (error) {
            console.error("Error defensively setting seen status:", error);
          }
        }
      }).catch(error => {
        console.error("Error fetching user seen status for check:", error);
      });
    }
  }, [chatId, currentUserId]);

  // MODIFIED: Fetch Chat Details, Participant Info, Event Header Image/Name, and Event Host ID
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

          fetchedInfo["system"] = {
            id: "system",
            displayName: "Rauxa Admin",
            firstName: "Rauxa",
            lastName: "Admin",
            profileImage: require('../assets/onboarding/Onboarding1.png'),
          };

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

          const eventIdFromChat = chatData.eventId;
          const currentEventId = eventIdFromChat || initialEventId;
          setChatEventId(currentEventId);

          if (currentEventId) {
            const eventRef = doc(db, "live", currentEventId);
            const eventSnap = await getDoc(eventRef);
            if (eventSnap.exists()) {
              const eventData = eventSnap.data();
              setFetchedEventData(eventData);
              setHeaderEventName(eventData.title || `Event ${currentEventId.substring(0, 4)}...`);
              if (eventData.photos && eventData.photos.length > 0) {
                setEventHeaderImageUrl(eventData.photos[0]);
              }
              setEventHostId(eventData.host); // <--- NEW: Set the event host ID
              console.log(`ChatDetailScreen: Event host ID for ${currentEventId}: ${eventData.host}`);
            } else {
              console.warn(`Event ${currentEventId} not found for chat ${chatId}.`);
              setHeaderEventName("Event Not Found");
              setFetchedEventData(null);
              setEventHostId(null); // <--- NEW: Clear host ID if event not found
            }
          } else {
            setHeaderEventName(chatData.name || "Direct Chat");
            setFetchedEventData(null);
            setEventHostId(null); // <--- NEW: Clear host ID for direct chats
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

  const handleLeaveGroupChat = useCallback(() => {
    Alert.alert(
      "Leave Chat",
      "Are you sure you want to leave this chat? You will be removed from the conversation and, if this is an event-related chat, un-RSVP'd from the event.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Leave",
          onPress: async () => {
            if (!currentUserId) {
              Alert.alert("Error", "You must be logged in to leave a chat.");
              return;
            }
            if (!chatId) {
                Alert.alert("Error", "Chat information is missing.");
                return;
            }

            try {
              // 1. Remove user from chat's participants array
              const chatDocRef = doc(db, 'chats', chatId);
              await updateDoc(chatDocRef, {
                participants: arrayRemove(currentUserId),
              });
              console.log(`User ${currentUserId} removed from chat ${chatId} participants.`);

              // 2. Remove user's 'new' status for this chat (cleanup)
              const userSeenStatusRef = doc(db, "chats", chatId, "new", currentUserId);
              const userSeenStatusSnap = await getDoc(userSeenStatusRef);
              if (userSeenStatusSnap.exists()) {
                await deleteDoc(userSeenStatusRef);
                console.log(`User ${currentUserId} 'new' status removed for chat ${chatId}.`);
              }

              // 3. Delete attendee document if eventId exists (from chatEventId state)
              if (chatEventId) { // Use chatEventId which is derived from chatDoc.eventId
                const attendeeDocRef = doc(db, 'live', chatEventId, 'attendees', currentUserId);
                const attendeeSnap = await getDoc(attendeeDocRef);
                if (attendeeSnap.exists()) {
                  await deleteDoc(attendeeDocRef);
                  console.log(`User ${currentUserId} attendee doc deleted for event ${chatEventId}.`);
                } else {
                  console.log(`No attendee doc found for ${currentUserId} in event ${chatEventId}.`);
                }
              }

              Alert.alert("Success", "You have left the chat.");
              navigation.goBack();
            } catch (error) {
              console.error("Error leaving chat:", error);
              Alert.alert("Error", `Failed to leave chat: ${error.message || 'An unknown error occurred'}. Please try again.`);
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  }, [chatId, currentUserId, chatEventId, navigation]);

  // Determine if the current user is the host
  const isCurrentUserHost = currentUserId && eventHostId && currentUserId === eventHostId;
  const showLeaveButton = !isCurrentUserHost; // Only show if not the host

  if (loading || !chatId) {
    return (
      <LinearGradient colors={["#0367A6", "#003f6b"]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
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
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 15 }]}>
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
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.headerTitle}>{headerEventName}</Text>

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
        {/* MODIFIED: Conditionally render the Leave Chat Button */}
        {showLeaveButton && (
          <TouchableOpacity
            onPress={handleLeaveGroupChat}
            style={styles.leaveChatButton}
          >
            <Ionicons name="exit" size={24} color="#D9043D" />
          </TouchableOpacity>
        )}
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
      <MessageInput
        value={newMessageText}
        onChangeText={setNewMessageText}
        onSendMessage={handleSendMessage}
      />

      {/* Participants Dropdown as a View, positioned absolutely */}
      {isParticipantsDropdownVisible && (
        <View style={[styles.dropdownPosition, { top: insets.top + (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 70 }]}>
          <ParticipantsDropdown
            onClose={() => setIsParticipantsDropdownVisible(false)}
            participants={Object.values(participantsInfo)}
          />
        </View>
      )}

      {/* Event Details Overlay (conditionally rendered) */}
      {isEventDetailsOverlayVisible && chatEventId && (
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0367A6',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  headerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#ddd',
  },
  backButton: {
    paddingRight: 10,
  },
  infoButton: {
    paddingHorizontal: 5,
  },
  participantsButton: {
    paddingHorizontal: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'left',
    marginRight: 10,
  },
  leaveChatButton: {
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  messagesList: {
    flex: 1,
  },
  messagesContentContainer: {
    paddingHorizontal: 16,
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
    right: 16,
    zIndex: 1000,
  },
});

export default ChatDetailScreen;