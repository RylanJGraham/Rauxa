import React from 'react';
import { View, FlatList, Text, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const ProfileImageGallery = ({ profileData, activeIndex, setActiveIndex }) => {
  const filteredImages = profileData.profileImages ? profileData.profileImages.filter(img => img) : [];

  // Consistent font sizes
  const FONT_SIZE_LARGE = 28; // For Name
  const FONT_SIZE_MEDIUM = 18; // For Age, Gender, Education, Song Info
  const FONT_SIZE_SMALL = 16; // For Bio, Tags, Section Titles (though titles are removed, used for consistency)

  return (
    <View style={styles.galleryContainer}>
      <FlatList
        data={filteredImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / (width * 0.9));
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
                <Text style={styles.overlayTextName}>
                  {profileData.displayFirstName} {profileData.displayLastName}
                </Text>
                <Text style={styles.overlayTextDetails}>
                  {profileData.age}, {profileData.gender || 'Not provided'}
                </Text>
              </View>
            );
          } else if (index === 1) {
            // Second photo: Bio only
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
            // Third photo: Education then Languages
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
            // Fourth photo: Interests (tags only)
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
            // Fifth photo: Top Songs (music)
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
              width: (width * 0.9 / filteredImages.length) - (styles.indicator.marginHorizontal * 2),
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
    width: width * 0.9,
    alignSelf: 'center',
    overflow: 'hidden',
    marginTop: 0,
    borderRadius: 40,
    aspectRatio: 0.9 / 1.6,
  },
  profileImage: {
    width: width * 0.9,
    height: width * 1.6,
    resizeMode: 'cover',
    borderRadius: 40,
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
  },
  indicator: {
    height: 4,
    borderRadius: 3,
    flex: 1,
    marginHorizontal: 2,
  },
  imageContainer: {
    position: 'relative',
    width: width * 0.9,
    height: width * 1.6,
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
    borderRadius: 15,
  },
  // Consistent Text Styles
  overlayTextName: {
    fontSize: 28, // Large for name
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  overlayTextDetails: {
    fontSize: 18, // Medium for age, gender
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 0,
  },
  overlayTextBio: {
    fontSize: 16, // Small for bio
    color: 'white',
    lineHeight: 22,
    // No specific margin bottom here as it's the only content on its slide
  },
  // sectionTitle style is kept but not actively used in the current render logic for content pages
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F2BB47',
    marginBottom: 10,
  },
  infoSection: {
    marginBottom: 10, // Space between education and languages/music sections if they are stacked
  },
  infoText: {
    fontSize: 18, // Medium for education, song details
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5, // Small margin between lines of info
  },
  noContentText: {
    fontSize: 16, // Small for "no content" messages
    color: 'white',
    fontStyle: 'italic',
    paddingVertical: 5,
  },

  // Tags Styling
  tagsContainer: {
    marginTop: 0, // No top margin if no title
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  tag: {
    fontSize: 14, // Consistent small size for tags
    color: 'white',
    backgroundColor: '#0367A6', // Solid blue background
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15, // More rounded corners for pill shape
    margin: 4, // Consistent margin around tags
    fontWeight: "bold",
    overflow: 'hidden',
  },
});

export default ProfileImageGallery;