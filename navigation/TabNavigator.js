import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import TabBarIcon from './TabBarIcon';
import { styles } from '../styles/styles';

// Import screens
import MatchScreen from '../screens/EventSwipeScreen';
import ChatScreen from '../screens/ChatScreen';
import AddScreen from '../screens/AddScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Import icons
import ChatActiveIcon from '../assets/tabs/Message-Active.png';
import ChatInactiveIcon from '../assets/tabs/Message.png';
import AddActiveIcon from '../assets/tabs/Add-Active.png';
import AddInactiveIcon from '../assets/tabs/Add.png';
import ProfileActiveIcon from '../assets/tabs/Profile-Active.png';
import ProfileInactiveIcon from '../assets/tabs/Profile.png';
import MainActiveIcon from '../assets/tabs/Home-Active.png';
import MainInactiveIcon from '../assets/tabs/Home.png';

const Tab = createBottomTabNavigator();

const TabNavigator = () => (
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
      ...styles.tabBarOptions,
    })}
  >
    <Tab.Screen 
      name="Main" 
      component={MatchScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabBarIcon 
            focused={focused}
            activeIcon={MainActiveIcon}
            inactiveIcon={MainInactiveIcon}
          />
        )
      }}
    />
    <Tab.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabBarIcon 
            focused={focused}
            activeIcon={ChatActiveIcon}
            inactiveIcon={ChatInactiveIcon}
            size={35}
          />
        )
      }}
    />
    <Tab.Screen 
      name="Add" 
      component={AddScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabBarIcon 
            focused={focused}
            activeIcon={AddActiveIcon}
            inactiveIcon={AddInactiveIcon}
          />
        )
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabBarIcon 
            focused={focused}
            activeIcon={ProfileActiveIcon}
            inactiveIcon={ProfileInactiveIcon}
          />
        )
      }}
    />
  </Tab.Navigator>
);

export default TabNavigator;