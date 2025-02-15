import { View, Text, Button, StyleSheet } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/core";
import { useAuth } from "../hooks/useAuth";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error.message);
    }
  };

  return (
    <LinearGradient colors={['#0367A6', '#D9043D']} style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.displayName || "User"}!</Text>
      <View style={styles.buttonContainer}>
        <Button title="Go to Chat Screen" onPress={() => navigation.navigate("Chat")} />
        <View style={styles.spacer} />
        <Button title="Sign Out" onPress={handleSignOut} color="red" />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensure the gradient takes up the full height
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 70, // Add padding to account for the tab bar height
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  spacer: {
    height: 10,
  },
});

export default ProfileScreen;