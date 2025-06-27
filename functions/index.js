const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

const eventTriggers = require("./eventTriggers");

exports.onLiveEventDelete = eventTriggers.onLiveEventDelete;

/**
 * Marks a user's new chat status in the 'new' subcollection.
 * @param {admin.firestore.DocumentReference} chatRef
 * @param {string} userId - ID of the user to mark as new
 * @param {admin.firestore.Transaction} transaction - Firestore transaction
 * @return {Promise<void>} - Promise that resolves
 */
async function markUserAsNewInChat(chatRef, userId, transaction) {
  const newSubcollectionRef = chatRef.collection("new").doc(userId);
  transaction.set(newSubcollectionRef, {
    seen: false,
    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`Marked user ${userId} as new in chat ${chatRef.id}`);
}

/**
 * Triggered when a new RSVP is accepted, creates/updates chat accordingly.
 * Also adds the user to the event's 'rsvpedUsers' subcollection.
 * @type {functions.CloudFunction<admin.firestore.DocumentSnapshot>}
 */
exports.onRsvpAccepted = functions.firestore
    .document("live/{eventId}/attendees/{requestId}")
    .onCreate(async (snap, context) => {
      const {eventId} = context.params;
      const acceptedRequestData = snap.data();
      const rsvpUserId = acceptedRequestData.userId;

      console.log(
          `RSVP Accepted: Event ID: ${eventId}, User ID: ${rsvpUserId}`,
      );

      try {
        const eventRef = db.collection("live").doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
          console.warn(`Event ${eventId} not found for accepted RSVP.`);
          return null;
        }

        const eventData = eventDoc.data();
        const hostId = eventData.host;
        const eventName = eventData.title || `Event ${eventId}`;

        if (!hostId) {
          console.error(`Host ID not found for event ${eventId}`);
          return null;
        }

        const chatRef = db.collection("chats").doc(eventId);
        const rsvpedUserRef = db.collection("live")
            .doc(eventId)
            .collection("rsvpedUsers")
            .doc(rsvpUserId);

        await db.runTransaction(async (transaction) => {
          const chatDoc = await transaction.get(chatRef);

          if (chatDoc.exists) {
            const currentParticipants = chatDoc.data().participants || [];
            if (!currentParticipants.includes(rsvpUserId)) {
              console.log(`Adding ${rsvpUserId} to chat ${eventId}`);
              transaction.update(chatRef, {
                participants: admin.firestore.FieldValue.arrayUnion(rsvpUserId),
              });

              await markUserAsNewInChat(chatRef, rsvpUserId, transaction);

              const messagesCollectionRef = chatRef.collection("messages");
              transaction.set(messagesCollectionRef.doc(), {
                senderId: "system",
                text: `${acceptedRequestData.displayFirstName || "A user"} ` +
                    "joined the chat.",
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                type: "system",
              });
            } else {
              console.log(
                  `${rsvpUserId} already in chat ${eventId}. No action needed.`,
              );
            }
          } else {
            console.log(`Creating new chat ${eventId} for ${eventName}`);
            transaction.set(chatRef, {
              eventId: eventId,
              name: eventName,
              hostId: hostId,
              type: "event_group",
              participants: [hostId, rsvpUserId],
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              lastMessage: {
                text: `Welcome to the ${eventName} chat!`,
                senderId: "system",
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
              },
              lastMessageTimestamp:
                  admin.firestore.FieldValue.serverTimestamp(),
            });

            await markUserAsNewInChat(chatRef, hostId, transaction);
            await markUserAsNewInChat(chatRef, rsvpUserId, transaction);

            const messagesCollectionRef = chatRef.collection("messages");
            transaction.set(messagesCollectionRef.doc(), {
              senderId: "system",
              text: `Welcome to ${eventName} chat! Only accepted ` +
                  "attendees and host can see this chat.",
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              type: "system",
            });
          }

          transaction.set(rsvpedUserRef, {
            addedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(
              `Added user ${rsvpUserId} to live/${eventId}/rsvpedUsers/`,
          );
        });

        console.log(
            `Chat and rsvpedUsers update/creation for ${eventId} successful.`,
        );
        return null;
      } catch (error) {
        console.error("Error in RSVP acceptance:", error);
        return null;
      }
    });
