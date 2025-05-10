import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';  // This will show during the app loading
import AppNavigator from './AppNavigator';  // The main app screen

const Stack = createNativeStackNavigator();

const RootNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="App" component={AppNavigator} />
  </Stack.Navigator>
);

export default RootNavigator;
