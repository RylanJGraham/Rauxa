import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithCredential,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Alert, Text } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const manifest = Constants.manifest2?.extra?.expoClient?.extra || Constants.manifest?.extra;

    if (!manifest) {
        console.error("Expo manifest (app.json) 'extra' section not found or loaded. Cannot initialize AuthProvider.");
        return (
            <AuthContext.Provider value={{ user: null, isInitializing: true }}>
                <Text style={{ color: 'red', textAlign: 'center', marginTop: 50 }}>
                    Error: App configuration not loaded. Please ensure app.json is valid and restart.
                </Text>
            </AuthContext.Provider>
        );
    }

    // --- DEFINE ALL NECESSARY VARIABLES FIRST ---
    const webClientId = manifest.webClientId;
    const androidClientId = manifest.androidClientId;
    const iosClientId = manifest.iosClientId;
    const githubClientId = manifest.githubClientId;
    const githubClientSecret = manifest.githubClientSecret;

    const expoScheme = Constants.manifest2?.extra?.expoClient?.scheme || Constants.manifest?.scheme;

    // *** IMPORTANT CHANGE HERE ***
    // We are specifying the scheme and NOT using the proxy for native builds.
    const redirectUri = makeRedirectUri({
        scheme: expoScheme, // This will correctly resolve to 'rauxa' from your app.json
        // NO useProxy: true here, as we are targeting standalone native builds
    });
    // ***************************

    const [user, setUser] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);

    const [requestGoogle, responseGoogle, promptAsyncGoogle] = Google.useAuthRequest({
        androidClientId: androidClientId,
        iosClientId: iosClientId,
        webClientId: webClientId,
        scopes: ['profile', 'email'],
        redirectUri: redirectUri, // Now correctly uses 'rauxa://oauth' or similar
    });

    const [requestGithub, responseGithub, promptAsyncGithub] = Google.useAuthRequest(
        {
            clientId: githubClientId,
            scopes: ['user', 'user:email'],
            redirectUri: redirectUri, // Use the same redirectUri for GitHub
        },
        {
            authorizationEndpoint: 'https://github.com/login/oauth/authorize',
            tokenEndpoint: 'https://github.com/login/oauth/access_token',
        }
    );

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            setIsInitializing(false);

            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (!userDocSnap.exists()) {
                    // Removed the entire block for generating unique usernames
                    // and creating the 'usernames' collection document.

                    // If you still want to set an initial username in the user's document,
                    // but without the uniqueness check or separate collection, you can do it here.
                    let username = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : `user-${firebaseUser.uid.substring(0, 8)}`);
                    if (username.length > 20) {
                        username = username.substring(0, 20);
                    }

                    await setDoc(userDocRef, {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || null,
                        username: username, // Assign the (potentially non-unique) username directly
                        onboarded: false,
                        profileCreatedAt: new Date(),
                    });
                    // await setDoc(doc(db, 'usernames', finalUsername), { uid: firebaseUser.uid }); // This line is removed
                }
            }
        });
        return unsubscribe;
    }, []);

    const signUpWithEmail = async (email, password) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Sign up failed:', error.message);
            throw error;
        }
    };

    const signInWithEmail = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Sign in failed:', error.message);
            throw error;
        }
    };

    const signOutUser = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Sign out failed:', error.message);
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        try {
            const result = await promptAsyncGoogle();
            if (result.type === 'success') {
                const { authentication } = result;
                if (authentication?.idToken) {
                    const credential = GoogleAuthProvider.credential(authentication.idToken);
                    await signInWithCredential(auth, credential);
                } else {
                    Alert.alert('Google Sign-In Failed', 'Could not retrieve ID token from Google.');
                }
            } else if (result.type === 'cancel') {
                Alert.alert('Google Sign-In Cancelled', 'You cancelled the Google sign-in process.');
            } else if (result.type === 'error') {
                Alert.alert('Google Sign-In Error', `Authentication failed: ${result.error?.message || 'Unknown error'}`);
                console.error('Google sign-in error:', result.error);
            }
        } catch (error) {
            console.error('Google sign-in initiation failed:', error);
            Alert.alert('Google Sign-In Error', 'Failed to initiate Google sign-in. Please try again.');
        }
    };

    const signInWithGithub = async () => {
        try {
            const result = await promptAsyncGithub();
            if (result.type === 'success') {
                const { authentication } = result;
                if (authentication?.accessToken) {
                    const credential = GithubAuthProvider.credential(authentication.accessToken);
                    await signInWithCredential(auth, credential);

                } else {
                    Alert.alert('GitHub Sign-In Failed', 'Could not get GitHub access token or code.');
                }
            } else if (result.type === 'cancel') {
                Alert.alert('GitHub Sign-In Cancelled', 'You cancelled the GitHub sign-in process.');
            } else if (result.type === 'error') {
                Alert.alert('GitHub Sign-In Error', `Authentication failed: ${result.error?.message || 'Unknown error'}`);
                console.error('GitHub sign-in error:', result.error);
            }
        } catch (error) {
            console.error('GitHub sign-in initiation failed:', error);
            Alert.alert('GitHub Sign-In Error', 'Failed to initiate GitHub sign-in. Please try again.');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isInitializing,
                signInWithEmail,
                signUpWithEmail,
                signOutUser,
                signInWithGoogle,
                signInWithGithub,
            }}
        >
            {!isInitializing && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);