// components/hub/ProfileImageGallery.js
import React from 'react';
import { View, FlatList, Text, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Consistent font sizes - MOVED HERE, OUTSIDE THE COMPONENT FUNCTION
const FONT_SIZE_LARGE = 28; // For Name
const FONT_SIZE_MEDIUM = 18; // For Age, Gender, Education, Song Info
const FONT_SIZE_SMALL = 16; // For Bio, Tags, Section Titles

const ProfileImageGallery = ({ profileData, activeIndex, setActiveIndex }) => {
  // Ensure profileImages is an array and filter out any null/undefined entries
  const filteredImages = Array.isArray(profileData?.profileImages)
    ? profileData.profileImages.filter(img => img)
    : [];

  return (
    <View style={styles.galleryWrapper}>
      <FlatList
        data={filteredImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const contentOffsetX = event.nativeEvent.contentOffset.x;
          const index = Math.round(contentOffsetX / (width * 0.9));
          setActiveIndex(index);
        }}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => {
          let overlayContent = null;

          if (index === 0) {
            overlayContent = (
              <View style={styles.overlay}>
                <Text style={styles.overlayTextName}>
                  {profileData.displayFirstName} {profileData.displayLastName}
                </Text>
                <Text style={styles.overlayTextDetails}>
                  {profileData.age}, {profileData.gender || 'Not provided'}
                </Text>
              </View>
            );
          } else if (index === 1) {
            overlayContent = (
              <View style={styles.overlay}>
                {profileData.bio ? (
                  <Text style={styles.overlayTextBio}>{profileData.bio}</Text>
                ) : (
                  <Text style={styles.noContentText}>No bio provided.</Text>
                )}
              </View>
            );
          } else if (index === 2) {
            overlayContent = (
              <View style={styles.overlay}>
                {profileData.education?.university && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoText}>{profileData.education.university}</Text>
                  </View>
                )}
                {profileData.languages && profileData.languages.length > 0 && (
                  <View style={styles.tagsContainer}>
                    <View style={styles.tagsRow}>
                      {profileData.languages.map((language, idx) => (
                        <Text key={idx} style={styles.tag}>{language}</Text>
                      ))}
                    </View>
                  </View>
                )}
                {!profileData.education?.university && (!profileData.languages || profileData.languages.length === 0) && (
                    <Text style={styles.noContentText}>No education or languages added.</Text>
                )}
              </View>
            );
          } else if (index === 3) {
            overlayContent = (
              <View style={styles.overlay}>
                <View style={styles.tagsContainer}>
                  {profileData.interests && profileData.interests.length > 0 ? (
                    <View style={styles.tagsRow}>
                      {profileData.interests.map((interest, idx) => (
                        <Text key={idx} style={styles.tag}>{interest}</Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noContentText}>No interests added.</Text>
                  )}
                </View>
              </View>
            );
          } else if (index === 4) {
            overlayContent = (
              <View style={styles.overlay}>
                {profileData.topSongs && profileData.topSongs.length > 0 ? (
                  <View style={styles.infoSection}>
                    {profileData.topSongs.slice(0, 3).map((song, idx) => (
                      <Text key={idx} style={styles.infoText}>
                        {song.name} • {song.artist}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noContentText}>No top songs added.</Text>
                )}
              </View>
            );
          }

          return (
            <View style={styles.imageContainer}>
              {item ? (
                <Image source={{ uri: item }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImagePlaceholderText}>No Image</Text>
                </View>
              )}
              {overlayContent}
            </View>
          );
        }}
      />
      <View style={styles.indicatorContainer}>
        {filteredImages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                width: (width * 0.9 / filteredImages.length) - (styles.indicator.marginHorizontal * 2),
                backgroundColor: index === activeIndex ? '#D9043D' : '#730220',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  galleryWrapper: {
    width: width * 0.9,
    aspectRatio: 0.9 / 1.6,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  imageContainer: {
    width: width * 0.9,
    height: '100%',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    color: '#ccc',
    fontSize: 18,
  },
  indicatorContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  indicator: {
    height: 4,
    borderRadius: 3,
    flex: 1,
    marginHorizontal: 2,
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 15,
  },
  overlayTextName: {
    fontSize: FONT_SIZE_LARGE, // Now correctly referenced
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  overlayTextDetails: {
    fontSize: FONT_SIZE_MEDIUM, // Now correctly referenced
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 0,
  },
  overlayTextBio: {
    fontSize: FONT_SIZE_SMALL, // Now correctly referenced
    color: 'white',
    lineHeight: 22,
  },
  infoSection: {
    marginBottom: 10,
  },
  infoText: {
    fontSize: FONT_SIZE_MEDIUM, // Now correctly referenced
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  noContentText: {
    fontSize: FONT_SIZE_SMALL, // Now correctly referenced
    color: 'white',
    fontStyle: 'italic',
    paddingVertical: 5,
  },
  tagsContainer: {
    marginTop: 0,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  tag: {
    fontSize: 14,
    color: 'white',
    backgroundColor: '#0367A6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    margin: 4,
    fontWeight: "bold",
    overflow: 'hidden',
  },
});

export default ProfileImageGallery;