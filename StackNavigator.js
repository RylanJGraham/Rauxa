import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "./hooks/useAuth";
import { useNavigation } from "@react-navigation/native";
import { db } from "./firebase";
import { View, ActivityIndicator, Text, Platform } from "react-native";
import { Ionicons } from "react-native-vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from "./screens/HomeScreen";
import ChatScreen from "./screens/ChatScreen";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AddScreen from "./screens/AddScreen";
import ProfileSetupScreen from "./screens/ProfileSetupScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeTabs = () => {

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          position: "absolute",
          bottom: 20,
          borderRadius: 50,
          backgroundColor: "#0367A6",
          height: 60,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 5,
          paddingHorizontal: 10,
          marginHorizontal: 60,
          overflow: "hidden",
        },
        tabBarItemStyle: {
          padding: 15,
          margin: 0,
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarActiveTintColor: "#ffffff",
        tabBarShowLabel: false,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Main"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: "#F2BB47",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              )}
              <Ionicons name="home" size={30} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: "#F2BB47",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              )}
              <Ionicons name="chatbubble" size={30} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: "#F2BB47",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              )}
              <Ionicons name="add-circle" size={30} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: "#F2BB47",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              )}
              <Ionicons name="person" size={30} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <ActivityIndicator size="large" color="#6200ea" />
    <Text style={{ marginTop: 10 }}>Loading...</Text>
  </View>
);

const StackNavigator = () => {
  const { user } = useAuth();
  const [onboarded, setOnboarded] = useState(null); // Use a single onboarded boolean

  useEffect(() => {
    const checkUserStatus = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setOnboarded(userSnap.data().onboarded); // Set onboarded based on Firestore
          } else {
            setOnboarded(false); // Default to false if user doc doesn't exist
          }
        } catch (error) {
          console.error("Error checking user status:", error);
          setOnboarded(true); // Fallback to true in case of error
        }
      } else {
        setOnboarded(false); // Default to false if no user is logged in
      }
    };

    checkUserStatus();
  }, [user]);

  if (onboarded === null) {
    return <LoadingScreen />; // Show loading screen while checking user status
  }

  return (
    <Stack.Navigator>
      <>
        {user ? (
            !onboarded ? (
                <>
                    <Stack.Screen
                        name="Onboarding"
                        component={OnboardingScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="ProfileSetup"
                        component={ProfileSetupScreen}
                        options={{ headerShown: false }}
                    />
                </>
            ) : (
                <Stack.Screen
                    name="Home"
                    component={HomeTabs}
                    options={{ headerShown: false }}
                />
            )
        ) : (
            <>
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="SignUp"
                    component={SignUpScreen}
                    options={{ headerShown: false }}
                />
            </>
        
        )}
      </>
    </Stack.Navigator>
  );
};

export default StackNavigator;