import React, { useState, useEffect } from 'react';
import { Button, Text, View, StyleSheet } from 'react-native';
import { useAuthRequest } from 'expo-auth-session';

const CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';  // Replace with your Spotify Client ID
const REDIRECT_URI = 'YOUR_REDIRECT_URI';  // Replace with your Redirect URI
const SCOPES = ['user-library-read', 'playlist-read-private'];

const SpotifyAuth = ({ onSuccess }) => {
  const [authRequest, result, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: SCOPES,
    },
    { authorizationEndpoint: 'https://accounts.spotify.com/authorize' }
  );

  useEffect(() => {
    if (result?.type === 'success') {
      // Retrieve the token once the user is authenticated
      const { code } = result.params;
      fetchSpotifyAccessToken(code);
    }
  }, [result]);

  const fetchSpotifyAccessToken = async (code) => {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        `grant_type=authorization_code&code=${code}&redirect_uri=${REDIRECT_URI}`,
        {
          headers: {
            'Authorization': `Basic ${btoa(`${CLIENT_ID}:YOUR_SPOTIFY_SECRET`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );

      const { access_token } = response.data;
      onSuccess(access_token);  // Pass the access token to the parent component
    } catch (error) {
      console.error('Error fetching access token:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in with Spotify</Text>
      <Button
        title="Sign In with Spotify"
        onPress={() => promptAsync()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SpotifyAuth;
