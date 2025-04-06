import React from 'react';
import { TouchableOpacity, Image, StyleSheet, View } from 'react-native';

const YesNoButtons = ({ noPressed, setNoPressed, yesPressed, setYesPressed, onSwipeLeft, onSwipeRight }) => (
  <View style={styles.buttonsRow}>
    <TouchableOpacity 
      onPress={() => { setNoPressed(true); onSwipeLeft(); }} 
      style={[styles.buttonContainer, noPressed && styles.noPressed]}
    >
      <Image source={require('../../../assets/matching/No.png')} style={styles.buttonIcon} />
    </TouchableOpacity>
    <TouchableOpacity 
      onPress={() => { setYesPressed(true); onSwipeRight(); }} 
      style={[styles.buttonContainer, yesPressed && styles.yesPressed]}
    >
      <Image source={require('../../../assets/matching/Yes.png')} style={styles.buttonIcon} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
    zIndex: 3,
    paddingHorizontal: 100,
  },
  buttonContainer: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 15,
    marginHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  buttonIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  noPressed: {
    backgroundColor: '#FF4C4C',
  },
  yesPressed: {
    backgroundColor: '#FFD700',
  },
});

export default YesNoButtons;
