import React from "react";
import StackNavigator from "./StackNavigator";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./hooks/useAuth";
import { LogBox } from "react-native";
LogBox.ignoreAllLogs();

export default function App() {
  return (
    <NavigationContainer>
      {/* HOC- Higher Order Component */}
      <AuthProvider>
        {/* Injects Auth */}
        <StackNavigator/>
      </AuthProvider>
    </NavigationContainer>
  );
}
