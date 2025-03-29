import React from 'react';
import { View, FlatList, Text, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const ProfileImageGallery = ({ profileData, activeIndex, setActiveIndex }) => {
  const filteredImages = profileData.profileImages ? profileData.profileImages.filter(img => img) : [];

  return (
    <View style={styles.galleryContainer}>
      <FlatList
        data={filteredImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / (width * 0.8));
          setActiveIndex(index);
        }}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => {
          let overlayContent = null;

          // Overlay content based on image index
          if (index === 0) {
            overlayContent = (
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>
                  {profileData.displayFirstName} {profileData.displayLastName}, {profileData.age}
                </Text>
                <Text style={styles.overlayText}>{profileData.gender || 'Not provided'}</Text>
              </View>
            );
          } else if (index === 1) {
            overlayContent = (
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>{profileData.bio || 'No bio provided.'}</Text>
              </View>
            );
          } else if (index === 2) {
            overlayContent = (
              <View style={styles.overlay}>
                <View style={styles.interestsContainer}>
                  {profileData.interests && profileData.interests.length > 0 ? (
                    profileData.interests.map((interest, idx) => (
                      <Text key={idx} style={styles.interestText}>{interest}</Text>
                    ))
                  ) : (
                    <Text style={styles.noInterestsText}>No interests added.</Text>
                  )}
                </View>
              </View>
            );
          }

          return (
            <View style={styles.imageContainer}>
              <Image source={{ uri: item }} style={styles.profileImage} />
              {overlayContent}
            </View>
          );
        }}
      />
      <View style={styles.indicatorContainer}>
        {filteredImages.map((_, index) => (
          <View
            key={index}
            style={{
              ...styles.indicator,
              width: `${60 / filteredImages.length}%`, 
              backgroundColor: index === activeIndex ? '#D9043D' : '#730220',
            }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  galleryContainer: {
    width: '90%',
    alignSelf: 'center',
    overflow: 'hidden',
    marginTop: 0,
    borderRadius: 40,
  },
  profileImage: {
    width: width * 0.9,
    height: width * 1.6,
    resizeMode: 'cover',
  },
  indicatorContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    height: 4,
    margin: 6,
    borderRadius: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    padding: 15,
  },
  overlayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    margin: 4,
  },
  noInterestsText: {
    fontSize: 16,
    color: 'white',
  },
});

export default ProfileImageGallery;
