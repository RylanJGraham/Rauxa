import React, { createContext, useContext, useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';  // Correct import for expo-auth-session
import { GoogleAuthProvider, signInWithCredential, onAuthStateChanged, GithubAuthProvider } from 'firebase/auth';  // Import GithubAuthProvider
import { auth } from '../firebase';
import * as Google from 'expo-auth-session/providers/google';

// Ensure that the session is completed properly when returning to the app
WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({});

// Set up the redirect URI for each platform
const redirectUri = makeRedirectUri({
  scheme: 'rauxa',  // Custom scheme for both iOS and Android (ensure you add the scheme in app.json)
  useProxy: true,  // Expo uses a proxy for redirects in development, so set this to true
});

// GitHub OAuth credentials (replace with your actual credentials)
const CLIENT_ID = 'Ov23lig4fima7leyQG2B';
const CLIENT_SECRET = '26f5221deba94cacf2313e21b67cd6eb814e4b7b';

// GitHub Authorization endpoint (use scopes as required by your app)
const GITHUB_AUTH_URL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=read:user,user:email&redirect_uri=${redirectUri}`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Google OAuth setup
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    androidClientId: '312076107505-v1iqm4sklus6bv2ga0h2415i3dem2ioj.apps.googleusercontent.com',
    iosClientId: '312076107505-7laahrv1p1tgppqll6jr4hdb8097i348.apps.googleusercontent.com',
    webClientId: '312076107505-d1hljntsofa7bsb2nucue7rvqi9vnq18.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    redirectUri,  // Use the redirect URI that Expo handles
  });

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Handle Google sign-in success
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.authentication;
      const googleCredential = GoogleAuthProvider.credential(id_token);
      console.log('Google sign-in successful:', googleResponse);
      signInWithCredential(auth, googleCredential).catch(error => {
        console.error('Google authentication failed', error);
      });
    }
  }, [googleResponse]);

  // GitHub sign-in function
  const signInWithGithub = async () => {
    try {
      // Start GitHub OAuth flow using WebBrowser from expo
      const result = await WebBrowser.openAuthSessionAsync(GITHUB_AUTH_URL, redirectUri);

      if (result.type === 'success') {
        // Extract the code from the redirect URL
        const code = new URL(result.url).searchParams.get('code');

        if (code) {
          // Exchange the code for an access token
          const accessTokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: CLIENT_ID,
              client_secret: CLIENT_SECRET,
              code: code,
              redirect_uri: redirectUri,
            }),
          });

          const { access_token } = await accessTokenResponse.json();

          if (access_token) {
            // Authenticate with Firebase using GitHub credential
            const githubCredential = GithubAuthProvider.credential(access_token);
            await signInWithCredential(auth, githubCredential);
          }
        }
      }
    } catch (error) {
      console.error('GitHub authentication failed', error);
    }
  };

  // Trigger Google login flow
  const signInWithGoogle = async () => {
    console.log('Google sign-in triggered');  // Add logging here
    await promptGoogleAsync();
  };

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signInWithGithub }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
