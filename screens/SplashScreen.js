// screens/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, Dimensions, Image } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
  const navigation = useNavigation();
  const textOpacity = useRef(new Animated.Value(0)).current;

  const handleFinish = () => {
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        navigation.replace('App');
      }, 800);
    });
  };

  return (
    <LinearGradient
                colors={['#0367A6', '#D9043D']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
        <View style={styles.container}>
        <LottieView
            source={require('../assets/entry/entryLottie.json')}
            autoPlay
            loop={false}
            onAnimationFinish={handleFinish}
            style={styles.lottie}
        />
        <Animated.View style={[styles.imageWrapper, { opacity: textOpacity }]}>
  <Image
    source={require('../assets/tabs/Home-Active.png')}
    style={styles.image}
    resizeMode="contain"
  />
</Animated.View>
        </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center'},
  lottie: { width: width * 0.8, height: width * 0.8 },
  textWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { fontSize: 64, fontWeight: 'bold', color: '#D9B779', textAlign: 'center' },
  gradient: {
    flex: 1,
},
imageWrapper: { position: 'absolute', bottom: 100 },
image: { width: 200, height: 200 },
});

export default SplashScreen;
