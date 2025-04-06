// screens/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
  const navigation = useNavigation();
  const textOpacity = useRef(new Animated.Value(0)).current;

  const handleFinish = () => {
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      // After fade-in completes, go to Main app flow
      navigation.replace('AppEntry'); // We'll define this route below
    });
  };

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/entry/entryLottie.json')}
        autoPlay
        loop={false}
        onAnimationFinish={handleFinish}
        style={styles.lottie}
      />
      <Animated.View style={[styles.textWrapper, { opacity: textOpacity }]}>
        <Text style={styles.text}>Welcome to the App</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  lottie: { width: width * 0.8, height: width * 0.8 },
  textWrapper: { position: 'absolute', top: '50%', transform: [{ translateY: -10 }] },
  text: { fontSize: 24, fontWeight: '600', color: '#333', textAlign: 'center' },
});

export default SplashScreen;
