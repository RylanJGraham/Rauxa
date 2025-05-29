import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import TabBarIcon from './TabBarIcon';
import { styles } from '../styles/styles';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import MatchScreen from '../screens/EventSwipeScreen';
import ChatScreen from '../screens/ChatScreen';
import AddScreen from '../screens/AddScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreateMeetupScreen from '../screens/CreateMeetupScreen'; // Create Meetup Screen
import EventDetailsScreen from '../screens/EventDetailsScreen';
import HubScreen from '../screens/HubScreen';

// Import icons
import ChatActiveIcon from '../assets/tabs/Message-Active.png';
import ChatInactiveIcon from '../assets/tabs/Message.png';
import AddActiveIcon from '../assets/tabs/Add-Active.png';
import AddInactiveIcon from '../assets/tabs/Add.png';
import ProfileActiveIcon from '../assets/tabs/Profile-Active.png';
import ProfileInactiveIcon from '../assets/tabs/Profile.png';
import MainActiveIcon from '../assets/tabs/Home-Active.png';
import MainInactiveIcon from '../assets/tabs/Home.png';
import HubActiveIcon from '../assets/tabs/Hub-Active.png';
import HubInactiveIcon from '../assets/tabs/Hub.png';


const Tab = createBottomTabNavigator();
const AddStack = createNativeStackNavigator(); // Stack Navigator for Add Tab

// AddStack Navigator for "Add" tab
const AddStackNavigator = () => (
  <AddStack.Navigator>
    <AddStack.Screen name="Add" component={AddScreen} options={{ headerShown: false, title: 'Create Rauxa' }} />
    <AddStack.Screen name="CreateMeetup" component={CreateMeetupScreen} options={{ headerShown: false, title: 'Create a Rauxa' }} />
    <AddStack.Screen name="EventDetails" component={EventDetailsScreen} options={{ headerShown: false, title: "Event Details" }} />
  </AddStack.Navigator>
);

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
      component={AddStackNavigator}
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
      name="Hub"
      component={HubScreen}
      options={{
        tabBarLabel: 'Hub',
        tabBarIcon: ({ focused }) => (
          <TabBarIcon
            focused={focused}
            activeIcon={HubActiveIcon}
            inactiveIcon={HubInactiveIcon}
          />
        ),
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