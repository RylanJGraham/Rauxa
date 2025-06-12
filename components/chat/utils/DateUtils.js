export const isSameDay = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

/**
 * Formats a Firestore Timestamp into a human-readable string like "Today", "Yesterday",
 * "X days ago", or a full date if older than a week.
 * @param {import('@firebase/firestore').Timestamp} timestamp - The Firestore Timestamp object.
 * @returns {string} The formatted date string.
 */
export const formatChatDate = (timestamp) => {
  if (!timestamp) return '';

  // Convert Firestore Timestamp to JavaScript Date object
  const date = timestamp.toDate();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1); // Set to yesterday's date

  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  } else {
    // Calculate difference in days
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

    if (diffDays <= 7) {
      return `${diffDays} days ago`; // e.g., "2 days ago"
    } else {
      // For dates older than a week, display the full date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }); // e.g., "June 12, 2025"
    }
  }
};
