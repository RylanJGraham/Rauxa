import React from 'react';
import { Image } from 'react-native';

const TabBarIcon = ({ focused, activeIcon, inactiveIcon, size = 30 }) => (
  <Image 
    source={focused ? activeIcon : inactiveIcon} 
    style={{ width: size, height: size }} 
    resizeMode="contain" 
  />
);

export default TabBarIcon;