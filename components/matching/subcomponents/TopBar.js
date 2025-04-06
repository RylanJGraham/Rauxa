import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

const TopBar = ({ event }) => (
  <View style={styles.topBar}>
    <Text style={styles.eventTitle}>{event.name}</Text>
    <View style={styles.dateTimeContainer}>
      <MaterialIcons name="date-range" size={40} color="white" />
      <View style={styles.dateTimeColumn}>
        <Text style={styles.dateText}>{event.date}</Text>
        <Text style={styles.timeText}>{event.time}</Text>
      </View>
      <FontAwesome name="users" size={30} color="white" style={styles.groupIcon} />
      <View style={styles.attendeesContainer}>
        {event.attendees.map((attendee, index) => (
          <Image
            key={index}
            source={{ uri: attendee.profilePicture }}
            style={[styles.attendeeProfilePicture, { zIndex: 10 - index }]}
          />
        ))}
        <Text style={styles.attendeesCount}>x {event.attendees.length}</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: '#0367A680',
    padding: 15,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    marginTop: 20,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dateTimeColumn: {
    marginLeft: 4,
    alignItems: 'flex-start',
  },
  dateText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 16,
    color: 'white',
  },
  groupIcon: {
    marginLeft: 20,
    marginRight: 6,
  },
  attendeesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginLeft: 10,
    position: 'relative',
  },
  attendeeProfilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: -12,
  },
  attendeesCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: 'white',
    marginLeft: 10,
  },
});

export default TopBar;
