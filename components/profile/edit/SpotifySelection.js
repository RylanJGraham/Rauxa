import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const SpotifySection = ({ spotifyAuthToken, spotifySongs, onAuthRequest, onSongSelect }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Spotify Top Songs</Text>
      {!spotifyAuthToken ? (
        <TouchableOpacity onPress={onAuthRequest} style={styles.editButton}>
          <FontAwesome name="spotify" size={18} color="white" />
        </TouchableOpacity>
      ) : (
        <View style={styles.songSelectionContainer}>
          {spotifySongs.map((song) => (
            <TouchableOpacity
              key={song.id}
              style={styles.songItem}
              onPress={() => onSongSelect(song)}
            >
              <Text style={styles.songText}>{`${song.name} by ${song.artists[0].name}`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  songSelectionContainer: {
    marginTop: 10,
  },
  songItem: {
    backgroundColor: '#00000040',
    padding: 10,
    margin: 5,
    borderRadius: 10,
  },
  songText: {
    color: 'white',
  },
});

export default SpotifySection;
