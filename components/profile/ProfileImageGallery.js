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
            // First photo: Name, Age, Gender
            overlayContent = (
              <View style={styles.overlay}>
                <Text style={styles.overlayTextLarge}>
                  {profileData.displayFirstName} {profileData.displayLastName}
                </Text>
                <Text style={styles.overlayTextMedium}>{profileData.age}, {profileData.gender || 'Not provided'}</Text>
              </View>
            );
          } else if (index === 1) {
            // Second photo: Bio and Languages
            overlayContent = (
              <View style={styles.overlay}>
                <Text style={styles.overlayTextSmall}>{profileData.bio || 'No bio provided.'}</Text>
              </View>
            );
          } else if (index === 2) {
            // Third photo: Interests
            overlayContent = (
              <View style={styles.overlay}>
                <View style={styles.tagsContainer}>
                  {profileData.interests && profileData.interests.length > 0 ? (
                    <View style={styles.tagsRow}>
                      {profileData.interests.map((interest, idx) => (
                        <Text key={idx} style={styles.tagText}>{interest}</Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noContentText}>No interests added.</Text>
                  )}
                </View>
              </View>
            );
          } else if (index === 3) {
            // Fourth photo: Education and Top Songs
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
                        <Text key={idx} style={styles.tagText}>{language}</Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          } else if (index === 4) {
            // Fourth photo: Education and Top Songs
            overlayContent = (
              <View style={styles.overlay}>
                {profileData.topSongs && profileData.topSongs.length > 0 && (
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Top Songs:</Text>
                    {profileData.topSongs.slice(0, 3).map((song, idx) => (
                      <Text key={idx} style={styles.infoText}>
                        {song.name} • {song.artist}
                      </Text>
                    ))}
                  </View>
                )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
    borderRadius: 15,
  },
  overlayText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  overlayTextLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  overlayTextMedium: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  overlayTextSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F2BB47',
    marginBottom: 5,
  },
  tagsContainer: {
    marginTop: 5,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagText: {
    fontSize: 14,
    color: 'white',
    backgroundColor: '#D9043D80',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    margin: 3,
    fontWeight: "bold",
  },
  infoSection: {
    marginBottom: 0,
  },
  infoText: {
    fontSize: 18,
    fontWeight: "Bold",
    color: 'white',
    marginBottom: 0,
  },
  noContentText: {
    fontSize: 14,
    color: 'white',
    fontStyle: 'italic',
  },
});

export default ProfileImageGallery;