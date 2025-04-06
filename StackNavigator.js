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
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from "react-native";

// Tab image imports
import ChatActiveIcon from "./assets/tabs/Message-Active.png";
import ChatInactiveIcon from "./assets/tabs/Message.png";
import AddActiveIcon from "./assets/tabs/Add-Active.png";
import AddInactiveIcon from "./assets/tabs/Add.png";
import ProfileActiveIcon from "./assets/tabs/Profile-Active.png";
import ProfileInactiveIcon from "./assets/tabs/Profile.png";
import MainActiveIcon from "./assets/tabs/Home-Active.png";
import MainInactiveIcon from "./assets/tabs/Home.png";



import MatchScreen from "./screens/EventSwipeScreen";
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
      screenOptions={{
        tabBarBackground: () => (
          <LinearGradient
            colors={['#D9043D', '#0367A6']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              flex: 1,
            }}
          />
        ),
        tabBarStyle: {
          height: 80,
          borderTopWidth: 0,
          elevation: 1,
          paddingHorizontal: 20,
          backgroundColor: 'transparent',
        },
        tabBarItemStyle: {
          height: "100%",
          marginTop: 16,
        },
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#ffffff90",
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Main"
        component={MatchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
            source={focused ? MainActiveIcon : MainInactiveIcon}
            style={{ width: 30, height: 30 }}
            resizeMode="contain"
          />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Image
            source={focused ? ChatActiveIcon : ChatInactiveIcon}
            style={{ width: 35, height: 35 }}
            resizeMode="contain"
          />
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Image
            source={focused ? AddActiveIcon : AddInactiveIcon}
            style={{ width: 30, height: 30 }}
            resizeMode="contain"
          />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Image
            source={focused ? ProfileActiveIcon : ProfileInactiveIcon}
            style={{ width: 30, height: 30 }}
            resizeMode="contain"
          />
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