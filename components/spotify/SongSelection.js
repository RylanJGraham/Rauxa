import React, { useState } from 'react';
import { View, Text, Button, Image, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

const SpotifySongSelector = ({ accessToken, onSongSelect }) => {
  const [songs, setSongs] = useState([]);

  const fetchTopSongs = async () => {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setSongs(response.data.items);  // Store songs in the state
    } catch (error) {
      console.error('Error fetching top songs:', error);
    }
  };

  const renderSongItem = ({ item }) => (
    <View style={styles.songItem}>
      <Image source={{ uri: item.album.images[0].url }} style={styles.albumImage} />
      <View style={styles.songDetails}>
        <Text style={styles.songName}>{item.name}</Text>
        <Text style={styles.artistName}>{item.artists[0].name}</Text>
        <Button
          title="Select"
          onPress={() => onSongSelect(item)}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Button title="Fetch Top Songs" onPress={fetchTopSongs} />
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={renderSongItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#000',
  },
  songItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  albumImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  songDetails: {
    marginLeft: 10,
  },
  songName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  artistName: {
    color: 'white',
    fontSize: 14,
  },
});

export default SpotifySongSelector;
