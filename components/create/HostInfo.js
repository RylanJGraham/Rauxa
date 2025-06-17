import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const HostInfo = ({ hostFirstName, hostLastName, hostProfileImage }) => {
  const displayHostName = `${hostFirstName || ''} ${hostLastName || ''}`.trim();

  return (
    <View style={styles.hostRow}>
      {hostProfileImage ? (
        <Image source={{ uri: hostProfileImage }} style={styles.hostImage} />
      ) : (
        <View style={[styles.hostImage, styles.hostImagePlaceholder]} />
      )}
      <View style={styles.hostInfo}>
        <Text style={styles.hostLabel}>Hosted by</Text>
        <Text style={styles.hostName}>{displayHostName || 'Unknown Host'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    backgroundColor: '#000', // Changed to black background
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  hostImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#555',
    borderWidth: 2,
    borderColor: '#F2BB47',
  },
  hostImagePlaceholder: {
    backgroundColor: '#333',
  },
  hostInfo: {
    marginLeft: 18,
  },
  hostLabel: {
    color: '#ccc',
    fontWeight: 'normal',
    fontSize: 13,
    marginBottom: 2,
  },
  hostName: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
  },
});

export default HostInfo;