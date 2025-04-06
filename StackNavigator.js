import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "./hooks/useAuth";
import { db } from "./firebase";
import { View, ActivityIndicator, StyleSheet, Image } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';

// Import your screens
import SplashScreen from './screens/SplashScreen';
import MatchScreen from "./screens/EventSwipeScreen";
import ChatScreen from "./screens/ChatScreen";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AddScreen from "./screens/AddScreen";
import ProfileSetupScreen from "./screens/ProfileSetupScreen";

// Import your tab icons
import ChatActiveIcon from "./assets/tabs/Message-Active.png";
import ChatInactiveIcon from "./assets/tabs/Message.png";
import AddActiveIcon from "./assets/tabs/Add-Active.png";
import AddInactiveIcon from "./assets/tabs/Add.png";
import ProfileActiveIcon from "./assets/tabs/Profile-Active.png";
import ProfileInactiveIcon from "./assets/tabs/Profile.png";
import MainActiveIcon from "./assets/tabs/Home-Active.png";
import MainInactiveIcon from "./assets/tabs/Home.png";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarBackground: () => (
        <LinearGradient
          colors={['#D9043D', '#0367A6']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradientBackground}
        />
      ),
      tabBarStyle: styles.tabBar,
      tabBarItemStyle: styles.tabBarItem,
      tabBarActiveTintColor: "#ffffff",
      tabBarInactiveTintColor: "#ffffff90",
      tabBarShowLabel: false,
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="Main" 
      component={MatchScreen}
      options={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Image 
            source={focused ? MainActiveIcon : MainInactiveIcon} 
            style={styles.tabIcon} 
            resizeMode="contain" 
          />
        )
      })}
    />
    <Tab.Screen 
      name="Chat" 
      component={ChatScreen}
      options={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Image 
            source={focused ? ChatActiveIcon : ChatInactiveIcon} 
            style={[styles.tabIcon, { width: 35, height: 35 }]} 
            resizeMode="contain" 
          />
        )
      })}
    />
    <Tab.Screen 
      name="Add" 
      component={AddScreen}
      options={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Image 
            source={focused ? AddActiveIcon : AddInactiveIcon} 
            style={styles.tabIcon} 
            resizeMode="contain" 
          />
        )
      })}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Image 
            source={focused ? ProfileActiveIcon : ProfileInactiveIcon} 
            style={styles.tabIcon} 
            resizeMode="contain" 
          />
        )
      })}
    />
  </Tab.Navigator>
);


const OnboardingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
  </Stack.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
  </Stack.Navigator>
);

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#6200ea" />
  </View>
);

const AppNavigator = () => {
  const { user } = useAuth();
  const [onboarded, setOnboarded] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          setOnboarded(userSnap.exists() ? userSnap.data().onboarded : false);
        } else {
          setOnboarded(false);
        }
      } catch (error) {
        console.error("Error checking user status:", error);
        setOnboarded(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : !onboarded ? (
        <Stack.Screen name="OnboardingFlow" component={OnboardingStack} />
      ) : (
        <Stack.Screen name="MainApp" component={HomeTabs} />
      )}
    </Stack.Navigator>
  );
};

const RootNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="App" component={AppNavigator} />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0, // Ensure it stays behind icons
  },
  gradientBackground: {
    flex: 1,
  },
  tabBar: {
    height: 80,
    borderTopWidth: 0,
    elevation: 1,
    paddingHorizontal: 10, // Reduced padding
    backgroundColor: 'transparent',
    position: 'relative',
  },
  tabBarItem: {
    height: "100%",
    marginTop: 16,
    zIndex: 1, // Bring items to front
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    width: 30,
    height: 30,
    tintColor: '#fff', // Fallback color
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default RootNavigator;