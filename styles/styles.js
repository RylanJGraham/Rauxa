import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  tabBarOptions: {
    tabBarStyle: {
      height: 80,
      borderTopWidth: 0,
      elevation: 1,
      paddingHorizontal: 10,
      backgroundColor: 'transparent',
      position: 'relative',
    },
    tabBarItemStyle: {
      height: "100%",
      marginTop: 16,
      zIndex: 1,
    },
    tabBarActiveTintColor: "#ffffff",
    tabBarInactiveTintColor: "#ffffff90",
    tabBarShowLabel: false,
    headerShown: false,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});