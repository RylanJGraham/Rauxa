const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Changed the document path from 'approved' to 'attendees'
exports.onRsvpAccepted = functions.firestore
  .document('live/{eventId}/attendees/{requestId}')
  .onCreate(async (snap, context) => {
    const { eventId } = context.params;
    const acceptedRequestData = snap.data();
    const rsvpUserId = acceptedRequestData.userId; // The user who RSVP'd

    console.log(`RSVP Accepted: Event ID: ${eventId}, User ID: ${rsvpUserId}`);

    try {
      // 1. Get event details (especially host ID and event name)
      const eventRef = db.collection('live').doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        console.warn(`Event ${eventId} not found for accepted RSVP.`);
        return null;
      }

      const eventData = eventDoc.data();
      const hostId = eventData.host;
      const eventName = eventData.name || `Event ${eventId}`;

      if (!hostId) {
        console.error(`Host ID not found for event ${eventId}`);
        return null;
      }

      // 2. Reference to the chat document for this event
      const chatRef = db.collection('chats').doc(eventId); // Using eventId as chat ID

      // Use a transaction for atomic updates to the chat document
      await db.runTransaction(async (transaction) => {
        const chatDoc = await transaction.get(chatRef);

        if (chatDoc.exists) {
          // Chat already exists for this event, add new participant
          const currentParticipants = chatDoc.data().participants || [];
          if (!currentParticipants.includes(rsvpUserId)) {
            console.log(`Adding ${rsvpUserId} to existing chat ${eventId}`);
            transaction.update(chatRef, {
              participants: admin.firestore.FieldValue.arrayUnion(rsvpUserId),
            });

            // Add a "system" message to the messages subcollection
            const messagesCollectionRef = chatRef.collection('messages');
            transaction.set(messagesCollectionRef.doc(), {
              senderId: 'system',
              text: `${rsvpUserId} has been accepted and joined the chat.`,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              type: 'system',
            });

            // TODO: Send FCM notification to existing participants about the new member
          } else {
            console.log(`${rsvpUserId} is already in chat ${eventId}. No action needed.`);
          }
        } else {
          // Chat does not exist, create a new one
          console.log(`Creating new chat ${eventId} for event ${eventName}`);
          transaction.set(chatRef, {
            eventId: eventId,
            name: eventName,
            hostId: hostId,
            type: 'event_group',
            participants: [hostId, rsvpUserId], // Initial participants
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastMessage: {
              text: `Welcome to the ${eventName} chat!`,
              senderId: 'system',
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            },
            lastMessageTimestamp: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Add a welcome message to the messages subcollection
          const messagesCollectionRef = chatRef.collection('messages');
          transaction.set(messagesCollectionRef.doc(), {
            senderId: 'system',
            text: `Welcome to the ${eventName} chat! Only accepted attendees and the host can see this chat.`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            type: 'system',
          });

          // TODO: Send FCM notification to both host and rsvpUserId that the chat is created.
        }
      });

      console.log(`Chat update/creation for event ${eventId} successful.`);
      return null;

    } catch (error) {
      console.error('Error creating/updating chat on RSVP acceptance:', error);
      return null;
    }
  });