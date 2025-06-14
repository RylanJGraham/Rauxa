import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';

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

          {/* Info Icon (always visible, top right) */}
          <TouchableOpacity onPress={() => onViewEventDetails(event)} style={styles.infoButton}>
            <Ionicons name="information-circle" size={28} color="#FFD700" />
          </TouchableOpacity>

          {/* Toggle Icon (below info icon) */}
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="#fff"
            style={styles.toggleIcon}
          />
        </TouchableOpacity>

        {/* Collapsible Details Section */}
        {isExpanded && (
          <View style={styles.detailsContainer}>
            {/* Tabs for filtering users */}
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

            {/* User List based on active tab - NOW HORIZONTAL */}
            <FlatList
              data={getActiveData()}
              renderItem={({ item }) => (
                <UserCardItem
                  user={item}
                  onPress={onViewAttendeeProfile}
                  showActions={activeTab === 'pending'}
                  onAccept={onAcceptRequest}
                  onDecline={onDeclineRequest}
                  status={activeTab}
                />
              )}
              keyExtractor={(item) => item.id}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              scrollEnabled={true}
              ListEmptyComponent={<Text style={styles.emptyListText}>{getEmptyMessage()}</Text>}
              contentContainerStyle={styles.userHorizontalListContent}
            />
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
    // Set width relative to screen to fill the HubScreen's padded area
    width: width - (15 * 2), // Full screen width minus HubScreen's paddingHorizontal (15 on left + 15 on right)
    marginHorizontal: 0, // No internal horizontal margin, rely on HubScreen padding
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
    paddingRight: 80,
  },
  eventImage: {
    width: 75,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  eventInfo: {
    flex: 1,
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
    marginTop: 0, // Increased margin for better spacing
    flexWrap: 'nowrap',
    gap: 10, // Increased gap for better spacing between count items
  },
  countItem: {
    flexDirection: 'row', // Arrange icon, value, and label in a row
    alignItems: 'center', // Vertically align items
    gap: 2, // Space between icon, value, and label
  },
  countText: { // This style is no longer used directly on the top-level Text elements
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  countValue: { // New style for the numerical count
    fontSize: 13, // Slightly larger font size for the number
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
    padding: 5,
    zIndex: 1,
  },
  toggleIcon: {
    position: 'absolute',
    right: 15,
    top: 50,
    padding: 5,
    zIndex: 1,
  },
  detailsContainer: {
    padding: 15,
    paddingTop: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    marginBottom: 15,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#0367A6',
  },
  tabText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  userHorizontalListContent: {
    paddingHorizontal: 5,
    minHeight: 100,
    alignItems: 'flex-start',
  },
  emptyListText: {
    color: '#ccc',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
    width: '100%',
  },
});

export default HostedEventManagementCard;