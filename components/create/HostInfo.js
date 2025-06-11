import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const HostInfo = ({ hostFirstName, hostLastName, hostProfileImage }) => {
  // Safely concatenate host name, ensuring null/undefined don't become "null" text
  const displayHostName = `${hostFirstName || ''} ${hostLastName || ''}`.trim();

  return (
    <View style={styles.hostRow}>
      {hostProfileImage ? (
        <Image source={{ uri: hostProfileImage }} style={styles.hostImage} />
      ) : (
        <View style={[styles.hostImage, styles.hostImagePlaceholder]} />
      )}
      <View style={styles.hostInfo}>
        <Text style={styles.hostLabel}>Host</Text>
        {/* Use the safely constructed displayHostName */}
        <Text style={styles.hostName}>{displayHostName || 'Unknown Host'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  hostImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ccc',
  },
  hostImagePlaceholder: {
    backgroundColor: '#555',
  },
  hostInfo: {
    marginLeft: 12,
  },
  hostLabel: {
    color: '#F2BB47',
    fontWeight: 'bold',
    fontSize: 14,
  },
  hostName: {
    color: '#fff',
    fontSize: 16,
  },
});

export default HostInfo;