import { View, Text, Button } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/core';
import { useAuth } from '../hooks/useAuth';  // Import useAuth
import { auth } from '../firebase';  // Import Firebase auth
import { signOut } from 'firebase/auth';  // Import signOut function

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth(); // Get current user

  const handleSignOut = async () => {
    try {
      await signOut(auth); // Sign out from Firebase
    } catch (error) {
      console.error("Sign out failed:", error.message);
    }
  };

  return (
    <View>
      <Text>I am the HomeScreen</Text>
      <Button 
        title="Go to Chat Screen" 
        onPress={() => navigation.navigate("Chat")} 
      />
      <Button 
        title="Sign Out" 
        onPress={handleSignOut} 
        color="red" // Optional: Make the sign-out button stand out
      />
    </View>
  );
};

export default HomeScreen;
