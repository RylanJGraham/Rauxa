import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import LoadingScreen from '../screens/LoadingScreen';
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

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
        <Stack.Screen name="MainApp" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;