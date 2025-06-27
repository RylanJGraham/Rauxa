const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Helper function to recursively delete a Firestore collection or query batch.
 * @param {FirebaseFirestore.Query} collectionRef - Collection reference
 * @param {string} collectionPathDebug - Path for logging
 * @param {number} batchSize - Number of documents per batch
 * @return {Promise<void>} Promise that resolves when complete
 */
async function deleteCollectionRecursively(
    collectionRef,
    collectionPathDebug,
    batchSize = 100,
) {
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, collectionPathDebug, resolve, reject);
  });
}

/**
 * Deletes documents in a query batch.
 * @param {FirebaseFirestore.Query} query - Query to delete
 * @param {string} collectionPathDebug - Path for logging
 * @param {Function} resolve - Resolve function
 * @param {Function} reject - Reject function
 * @return {Promise<void>} Promise for batch deletion
 */
async function deleteQueryBatch(query, collectionPathDebug, resolve, reject) {
  try {
    console.log(`[CF] Fetching batch for: ${collectionPathDebug}`);
    const snapshot = await query.get();

    if (snapshot.size === 0) {
      console.log(`[CF] No more documents found for: ${collectionPathDebug}`);
      resolve();
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    console.log(
        `[CF] Committing batch of ${snapshot.size} documents for: ` +
        `${collectionPathDebug}`,
    );
    await batch.commit();
    console.log(`[CF] Successfully committed for: ${collectionPathDebug}`);

    process.nextTick(() => {
      deleteQueryBatch(query, collectionPathDebug, resolve, reject);
    });
  } catch (error) {
    console.error(
        `[CF] Error during batch deletion for ${collectionPathDebug}:`,
        error,
    );
    reject(error);
  }
}

/**
 * Cloud Function triggered when a live event document is deleted.
 */
exports.onLiveEventDelete = functions.firestore
    .document("live/{eventId}")
    .onDelete(async (snap, context) => {
      const eventId = context.params.eventId;
      console.log(
          `[CF] Live event ${eventId} deleted. ` +
          "Initiating cascading delete of associated data.",
      );

      const deletePromises = [];

      // Delete Event Subcollections
      ["pending", "attendees", "declined"].forEach((subcollectionName) => {
        const collectionRef = db.collection("live")
            .doc(eventId)
            .collection(subcollectionName);
        const debugPath = `live/${eventId}/${subcollectionName}`;
        deletePromises.push(
            deleteCollectionRecursively(collectionRef, debugPath)
                .then(() => {
                  console.log(
                      `[CF] Successfully deleted subcollection '${debugPath}'.`,
                  );
                })
                .catch((error) => {
                  console.error(
                      `[CF] Error deleting subcollection '${debugPath}':`,
                      error,
                  );
                }),
        );
      });

      // Delete associated Chat Document
      const chatDocRef = db.collection("chats").doc(eventId);

      // Delete messages subcollection
      const chatMessagesCollectionRef = chatDocRef.collection("messages");
      const chatMessagesDebugPath = `chats/${eventId}/messages`;
      deletePromises.push(
          deleteCollectionRecursively(
              chatMessagesCollectionRef,
              chatMessagesDebugPath,
          )
              .then(() => {
                console.log(
                    `[CF] Successfully deleted messages subcollection ` +
                    `for chat '${eventId}'.`,
                );
              })
              .catch((error) => {
                console.error(
                    `[CF] Error deleting messages subcollection ` +
                    `for chat '${eventId}':`,
                    error,
                );
              }),
      );

      // Delete new subcollection
      const chatNewCollectionRef = chatDocRef.collection("new");
      const chatNewDebugPath = `chats/${eventId}/new`;
      deletePromises.push(
          deleteCollectionRecursively(chatNewCollectionRef, chatNewDebugPath)
              .then(() => {
                console.log(
                    `[CF] Successfully deleted 'new' subcollection ` +
                    `for chat '${eventId}'.`,
                );
              })
              .catch((error) => {
                console.error(
                    `[CF] Error deleting 'new' subcollection ` +
                    `for chat '${eventId}':`,
                    error,
                );
              }),
      );

      // Delete chat document
      deletePromises.push(
          chatDocRef.delete()
              .then(() => {
                console.log(
                    `[CF] Successfully deleted chat document ` +
                    `for event '${eventId}'.`,
                );
              })
              .catch((error) => {
                if (error.code === "not-found") {
                  console.warn(
                      `[CF] Chat document for event ` +
                      `'${eventId}' not found, skipping delete.`,
                  );
                } else {
                  console.error(
                      `[CF] Error deleting chat document ` +
                      `for event '${eventId}':`,
                      error,
                  );
                }
              }),
      );

      // Delete user RSVPs
      const rsvpedUsersCollectionRef = db.collection("live")
          .doc(eventId)
          .collection("rsvpedUsers");
      console.log(
          `[CF] Fetching RSVP'd users from: live/${eventId}/rsvpedUsers`,
      );

      try {
        const rsvpedUsersSnapshot = await rsvpedUsersCollectionRef.get();
        if (rsvpedUsersSnapshot.empty) {
          console.log(
              `[CF] No users found in 'live/${eventId}/rsvpedUsers'. ` +
              "No RSVPs to delete.",
          );
        } else {
          const userRsvpDeletePromises = [];
          rsvpedUsersSnapshot.forEach((userDoc) => {
            const userIdToClean = userDoc.id;
            const userRsvpDocRef = db.collection("users")
                .doc(userIdToClean)
                .collection("rsvp")
                .doc(eventId);
            console.log(
                `[CF] Adding promise to delete user RSVP: ` +
                `${userRsvpDocRef.path}`,
            );
            userRsvpDeletePromises.push(
                userRsvpDocRef.delete()
                    .then(() => {
                      console.log(
                          `[CF] Successfully deleted RSVP for user ` +
                          `'${userIdToClean}' for event '${eventId}'.`,
                      );
                    })
                    .catch((error) => {
                      if (error.code === "not-found") {
                        console.warn(
                            `[CF] RSVP document for user ` +
                            `'${userIdToClean}' for event ` +
                            `'${eventId}' not found, skipping delete.`,
                        );
                      } else {
                        console.error(
                            `[CF] Error deleting RSVP for user ` +
                            `'${userIdToClean}' for event ` +
                            `'${eventId}':`,
                            error,
                        );
                      }
                    }),
            );
          });
          deletePromises.push(Promise.all(userRsvpDeletePromises));
          console.log(
              `[CF] All individual user RSVP deletion promises ` +
              `added for event '${eventId}'.`,
          );
        }

        // Delete rsvpedUsers subcollection
        const rsvpedUsersDebugPath = `live/${eventId}/rsvpedUsers`;
        deletePromises.push(
            deleteCollectionRecursively(
                rsvpedUsersCollectionRef,
                rsvpedUsersDebugPath,
            )
                .then(() => {
                  console.log(
                      `[CF] Successfully deleted 'rsvpedUsers' ` +
                      `subcollection for event '${eventId}'.`,
                  );
                })
                .catch((error) => {
                  console.error(
                      `[CF] Error deleting 'rsvpedUsers' ` +
                      `subcollection for event '${eventId}':`,
                      error,
                  );
                }),
        );
      } catch (error) {
        console.error(
            `[CF] Error fetching 'rsvpedUsers' for event ${eventId}:`,
            error,
        );
      }

      // Wait for all delete operations to complete
      try {
        await Promise.all(deletePromises);
        console.log(
            `[CF] Cascading delete for event ` +
            `${eventId} completed successfully.`,
        );
      } catch (finalError) {
        console.error(
            `[CF] One or more cascading delete operations ` +
            `failed for event ${eventId}:`,
            finalError,
        );
        throw new functions.https.HttpsError(
            "internal",
            "Cascading delete failed for some operations.",
        );
      }
    });
