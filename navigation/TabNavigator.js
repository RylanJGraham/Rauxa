import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import TabBarIcon from './TabBarIcon';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, TouchableOpacity } from 'react-native';

// Import screens
import MatchScreen from '../screens/EventSwipeScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatDetailsScreen from '../screens/ChatDetailsScreen'; // <-- NEW: Import ChatDetailScreen
import AddScreen from '../screens/AddScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HubScreen from '../screens/HubScreen';

// Import the modal-like components
import EventDetailsModal from '../screens/EventDetailsModal';
import CreateMeetupScreen from '../screens/CreateMeetupScreen';

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
const ChatStack = createNativeStackNavigator(); // <-- NEW: Create a stack navigator for the Chat tab

// NEW: Define the Chat Stack Navigator component
const ChatStackScreen = () => {
  return (
    <ChatStack.Navigator
      initialRouteName="ChatList"
      screenOptions={{
        headerShown: false, // Hide header for screens in this stack
      }}
    >
      <ChatStack.Screen name="ChatList" component={ChatScreen} />
      <ChatStack.Screen name="ChatDetail" component={ChatDetailsScreen} />
    </ChatStack.Navigator>
  );
};


const TabNavigator = () => {
  const [isEventDetailsModalVisible, setIsEventDetailsModalVisible] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedSourceCollection, setSelectedSourceCollection] = useState(null);

  const [isCreateMeetupModalVisible, setIsCreateMeetupModalVisible] = useState(false);
  const [createMeetupMode, setCreateMeetupMode] = useState(null);
  const [createMeetupEventData, setCreateMeetupEventData] = useState(null);

  const handleOpenEventDetailsModal = (eventId, sourceCollection) => {
    setSelectedEventId(eventId);
    setSelectedSourceCollection(sourceCollection);
    setIsEventDetailsModalVisible(true);
  };

  const handleOpenCreateMeetupModal = (mode, eventData) => {
    setCreateMeetupMode(mode);
    setCreateMeetupEventData(eventData);
    setIsCreateMeetupModalVisible(true);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route, focused }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#FFD07B',
          tabBarInactiveTintColor: '#F2F2F2',
          tabBarLabelStyle: {
            fontSize: 12,
            marginBottom: Platform.OS === 'ios' ? 0 : -5,
            fontWeight: focused ? 'bold' : 'normal',
          },
          tabBarStyle: {
            position: 'absolute',
            borderTopWidth: 0,
            backgroundColor: 'transparent',

            marginHorizontal: 30,
            marginBottom: Platform.OS === 'ios' ? 20 : 50,
            borderRadius: 100,

            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
            elevation: 8,

            height: Platform.OS === 'ios' ? 60 : 60,
            paddingBottom: 0,
          },
          tabBarBackground: () => (
            <LinearGradient
              colors={['#D9043D', '#0367A6']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}
            />
          ),
          tabBarShowLabel: false,
          tabBarButton: (props) => {
            if (props.accessibilityLabel === 'Host') {
              return (
                <TouchableOpacity
                  {...props}
                  onPress={() => handleOpenCreateMeetupModal('create', {})}
                  style={props.style}
                />
              );
            }
            return <TouchableOpacity {...props} />;
          },
        })}
      >
        <Tab.Screen
          name="Main"
          component={MatchScreen}
          options={{
            tabBarLabel: 'Match',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                focused={focused}
                activeIcon={MainActiveIcon}
                inactiveIcon={MainInactiveIcon}
              />
            ),
          }}
        />

        {/* Updated: Chat tab now renders the ChatStackScreen */}
        <Tab.Screen
          name="Chat"
          component={ChatStackScreen} // <-- NEW: Use the ChatStackScreen here
          options={{
            tabBarLabel: 'Chat',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                focused={focused}
                activeIcon={ChatActiveIcon}
                inactiveIcon={ChatInactiveIcon}
                size={35}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Add"
          options={{
            tabBarLabel: 'Host',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                focused={focused}
                activeIcon={AddActiveIcon}
                inactiveIcon={AddInactiveIcon}
              />
            ),
          }}
        >
          {(props) => (
            <AddScreen
              {...props}
              onOpenEventDetailsModal={handleOpenEventDetailsModal}
              onOpenCreateMeetupModal={handleOpenCreateMeetupModal}
            />
          )}
        </Tab.Screen>

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
            tabBarLabel: 'Profile',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                focused={focused}
                activeIcon={ProfileActiveIcon}
                inactiveIcon={ProfileInactiveIcon}
              />
            ),
          }}
        />
      </Tab.Navigator>

      {/* Render EventDetailsModal and CreateMeetupScreen outside the Tab.Navigator. */}
      {isEventDetailsModalVisible && (
        <EventDetailsModal
          isVisible={isEventDetailsModalVisible}
          eventId={selectedEventId}
          sourceCollection={selectedSourceCollection}
          onClose={() => setIsEventDetailsModalVisible(false)}
          onOpenCreateMeetupModal={handleOpenCreateMeetupModal}
        />
      )}

      {isCreateMeetupModalVisible && (
        <CreateMeetupScreen
          isVisible={isCreateMeetupModalVisible}
          onClose={() => setIsCreateMeetupModalVisible(false)}
          mode={createMeetupMode}
          eventData={createMeetupEventData}
        />
      )}
    </>
  );
};

export default TabNavigator;