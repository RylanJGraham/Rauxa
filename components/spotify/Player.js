import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const SpotifyPlayer = ({ trackUri }) => {
  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{
          uri: `https://open.spotify.com/embed/track/${trackUri}`,
        }}
        style={styles.player}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    width: '100%',
  },
  player: {
    height: 80,
    width: '100%',
  },
});

export default SpotifyPlayer;
