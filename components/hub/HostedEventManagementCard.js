// In your HostedEventManagementCard.js file

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons'; // Ensure you have expo/vector-icons installed
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs'; // Ensure dayjs is installed: npm install dayjs

const { width } = Dimensions.get('window');

// Helper component to render each user in the horizontal list
const UserCardItem = ({ user, onPress, showActions, onAccept, onDecline, status }) => (
  <View style={userCardStyles.container}>
    <TouchableOpacity onPress={() => onPress(user.profileInfo)} style={userCardStyles.profileTouchArea}>
      <Image
        source={{ uri: user.profileInfo?.profileImage || 'https://placehold.co/50x50/34394C/FFFFFF?text=User' }}
        style={userCardStyles.profileImage}
        contentFit="cover"
        onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
      />
      <Text style={userCardStyles.displayName} numberOfLines={1} ellipsizeMode="tail">
        {user.profileInfo?.displayName || `User ${user.id.substring(0, 4)}`}
      </Text>
    </TouchableOpacity>
    {showActions && status === 'pending' && (
      <View style={userCardStyles.actionButtons}>
        <TouchableOpacity style={[userCardStyles.button, userCardStyles.acceptButton]} onPress={() => onAccept(user.id)}>
          <Ionicons name="checkmark" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[userCardStyles.button, userCardStyles.declineButton]} onPress={() => onDecline(user.id)}>
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    )}
  </View>
);

const userCardStyles = StyleSheet.create({
  container: {
    width: 90,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: 'rgba(52, 57, 76, 0.4)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  profileTouchArea: {
    alignItems: 'center',
    width: '100%',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 5,
    borderWidth: 1.5,
    borderColor: '#D9B779',
  },
  displayName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 5,
    justifyContent: 'center',
  },
  button: {
    padding: 4,
    borderRadius: 15,
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#00C853',
  },
  declineButton: {
    backgroundColor: '#D9043D',
  },
});


const HostedEventManagementCard = ({
  event,
  pendingUsers,
  acceptedUsers,
  rejectedUsers,
  onAcceptRequest,
  onDeclineRequest,
  onViewAttendeeProfile,
  onViewEventDetails,
  onRemoveMeetup, // <--- NEW PROP: Receive the delete function
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return { date: "TBD", time: "TBD" };
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return {
      date: dayjs(date).format('MMM D,YYYY'),
      time: dayjs(date).format('h:mm A')
    };
  };

  const { date: formattedDate, time: formattedTime } = formatDateTime(event.date);

  const getActiveData = () => {
    switch (activeTab) {
      case 'pending':
        return pendingUsers;
      case 'accepted':
        return acceptedUsers;
      case 'rejected':
        return rejectedUsers;
      default:
        return [];
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'pending':
        return 'No pending requests.';
      case 'accepted':
        return 'No accepted attendees yet.';
      case 'rejected':
        return 'No rejected users.';
      default:
        return 'No data.';
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Static LinearGradient for background */}
      <LinearGradient
        colors={['#D9043D', '#0367A6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBackground}
      >
        {/* Event Overview Section (Always visible) */}
        <TouchableOpacity style={styles.eventOverviewWrapper} onPress={toggleExpansion} activeOpacity={0.8}>
          <Image
            source={{ uri: event.photos?.[0] || 'https://placehold.co/100x100/34394C/FFFFFF?text=Event' }}
            style={styles.eventImage}
            contentFit="cover"
          />
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle} numberOfLines={1} ellipsizeMode="tail">{event.title}</Text>
            <Text style={styles.eventDateTime}>{formattedDate} at {formattedTime}</Text>
            <Text style={styles.eventLocation} numberOfLines={1} ellipsizeMode="tail">
              <Ionicons name="location-outline" size={14} color="#ccc" /> {event.location}
            </Text>

            {/* Counts Container - Only visible when COLLAPSED */}
            {!isExpanded && (
              <View style={styles.countsContainer}>
                <View style={styles.countItem}>
                  <Ionicons name="people-outline" size={16} color="#00C853" />
                  <Text style={styles.countValue}>{acceptedUsers.length}</Text>
                  <Text style={styles.countLabel}>Accepted</Text>
                </View>
                <View style={styles.countItem}>
                  <Ionicons name="hourglass-outline" size={16} color="#FFD600" />
                  <Text style={styles.countValue}>{pendingUsers.length}</Text>
                  <Text style={styles.countLabel}>Pending</Text>
                </View>
                 <View style={styles.countItem}>
                  <Ionicons name="close-circle-outline" size={16} color="#D9043D" />
                  <Text style={styles.countValue}>{rejectedUsers.length}</Text>
                  <Text style={styles.countLabel}>Rejected</Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity onPress={() => onViewEventDetails(event)} style={styles.infoButton}>
            <Ionicons name="information-circle" size={28} color="#FFD700" />
          </TouchableOpacity>

          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="#fff"
            style={styles.toggleIcon}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.detailsContainer}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                onPress={() => setActiveTab('pending')}
              >
                <Text style={styles.tabText}>Pending ({pendingUsers.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'accepted' && styles.activeTab]}
                onPress={() => setActiveTab('accepted')}
              >
                <Text style={styles.tabText}>Accepted ({acceptedUsers.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'rejected' && styles.activeTab]}
                onPress={() => setActiveTab('rejected')}
              >
                <Text style={styles.tabText}>Rejected ({rejectedUsers.length})</Text>
              </TouchableOpacity>
            </View>

            <FlatList
                horizontal
                data={getActiveData()}
                keyExtractor={(user) => user.id}
                renderItem={({ item: user }) => (
                    <UserCardItem
                        user={user}
                        onPress={onViewAttendeeProfile}
                        showActions={activeTab === 'pending'}
                        onAccept={() => onAcceptRequest(event.id, user.id)}
                        onDecline={() => onDeclineRequest(event.id, user.id)}
                        status={activeTab} // Pass the activeTab as status to UserCardItem
                    />
                )}
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyUsersContainer}>
                        <Text style={styles.emptyUsersText}>{getEmptyMessage()}</Text>
                    </View>
                }
                contentContainerStyle={styles.usersListContainer}
            />

            {/* NEW: Delete Meetup Button */}
            {onRemoveMeetup && ( // Only render if the prop is provided
              <TouchableOpacity
                style={styles.deleteMeetupButton}
                onPress={() => onRemoveMeetup(event.id)} // Call the function passed from HubScreen
              >
                <Ionicons name="trash-outline" size={20} color="white" />
                <Text style={styles.deleteMeetupButtonText}>Delete Meetup</Text>
              </TouchableOpacity>
            )}
            {/* END NEW: Delete Meetup Button */}

          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    width: width - (15 * 2), // Card takes full width with padding
    marginHorizontal: 0, // No margin here, padding comes from parent
  },
  gradientBackground: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  eventOverviewWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingRight: 80, // Space for the info button and expand icon
  },
  eventImage: {
    width: 75,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  eventInfo: {
    flex: 1, // Take up remaining space
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  eventDateTime: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 4,
  },
  countsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0, // No extra margin here
    flexWrap: 'nowrap', // Prevent wrapping
    gap: 10, // Space between count items
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2, // Space between icon and text
  },
  countValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: 'bold',
  },
  countLabel: {
    fontSize: 11,
    color: '#ccc',
  },
  infoButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5, // Make touch target larger
    zIndex: 1, // Ensure it's above other elements
  },
  toggleIcon: {
    position: 'absolute',
    right: 15,
    top: 50, // Adjusted position to be below info button
    padding: 5,
    zIndex: 1,
  },
  detailsContainer: {
    padding: 15,
    paddingTop: 0, // Remove top padding as it's handled by padding of parent
    borderTopWidth: StyleSheet.hairlineWidth, // Thin separator
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.2)', // Slightly transparent black for tabs
    borderRadius: 10,
    marginBottom: 15, // Space below tabs
    padding: 5,
  },
  tab: {
    flex: 1, // Distribute tabs evenly
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#0367A6', // Accent color for active tab
  },
  tabText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyUsersContainer: {
    flex: 1,
    width: width - (15 * 2) - 30, // Adjust width to match card padding
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyUsersText: {
    color: '#ccc',
    fontSize: 14,
  },
  usersListContainer: {
    paddingVertical: 5, // Padding around the horizontal user list
    minHeight: 100, // Ensure FlatList has some height even if empty
    alignItems: 'center', // Center content vertically if few items
  },
  // NEW STYLES FOR DELETE BUTTON
  deleteMeetupButton: {
    backgroundColor: '#D9043D', // Red color for delete action
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20, // Space above the button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    gap: 8, // Space between icon and text
  },
  deleteMeetupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HostedEventManagementCard;