import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons"; // Add icon support

const { width } = Dimensions.get("window");

const ProfileScreen = () => {
  const [profileData, setProfileData] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState("profile"); // "profile" or "edit"
  const [newBio, setNewBio] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid, "ProfileInfo", "userinfo");
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setProfileData(userSnap.data());
          setNewBio(userSnap.data().bio || ""); // Set initial bio
        }
      }
    };

    fetchProfile();
  }, []);

  const handleSaveBio = async () => {
    if (profileData) {
      const userRef = doc(db, "users", auth.currentUser.uid, "ProfileInfo", "userinfo");
      await updateDoc(userRef, { bio: newBio });
      setProfileData((prevData) => ({ ...prevData, bio: newBio }));
    }
  };

  if (!profileData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  const filteredImages = profileData.profileImages ? profileData.profileImages.filter(img => img) : [];

  return (
    <LinearGradient colors={['#0367A6', '#012840']} style={styles.container}>

        
      {/* Profile Image Gallery */}
      {viewMode === "profile" && filteredImages.length > 0 && (
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

              // Card 1: Name, Age, Gender
              if (index === 0) {
                overlayContent = (
                  <View style={styles.overlay}>
                    <Text style={styles.overlayText}>{profileData.displayFirstName} {profileData.displayLastName}, {profileData.age}</Text>
                    <Text style={styles.overlayText}>{profileData.gender || "Not provided"}</Text>
                  </View>
                );
              }
              // Card 2: Bio
              else if (index === 1) {
                overlayContent = (
                  <View style={styles.overlay}>
                    <Text style={styles.overlayText}>Bio: {profileData.bio || "No bio provided."}</Text>
                  </View>
                );
              }
              // Card 3: Interests
              else if (index === 2) {
                overlayContent = (
                  <View style={styles.overlay}>
                    <View style={styles.interestsContainer}>
                      {profileData.interests && profileData.interests.length > 0 ? (
                        profileData.interests.map((interest, idx) => (
                          <LinearGradient
                            key={idx}
                            colors={["#D9043D", "#730220"]}
                            style={styles.interestBadge}
                          >
                            <Text style={styles.interestText}>{interest}</Text>
                          </LinearGradient>
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
          {/* Indicator */}
          <View style={styles.indicatorContainer}>
            {filteredImages.map((_, index) => (
              <View
                key={index}
                style={{
                  ...styles.indicator,
                  width: `${60 / filteredImages.length}%`, // Auto adjust width based on number of images
                  backgroundColor: index === activeIndex ? "#D9043D" : "#730220",
                }}
              />
            ))}
          </View>
        </View>
      )}

      {/* Triangle Button Layout */}
      <View style={styles.buttonContainer}>
        <View style={styles.triangleButtonWrapper}>
          {/* Profile View Button */}
          <TouchableOpacity 
            onPress={() => setViewMode("profile")} 
            style={[styles.button, viewMode === "profile" && styles.activeButton]}>
            <FontAwesome name="eye" size={24} color="white" />
            <Text style={styles.buttonText}>Profile View</Text>
          </TouchableOpacity>

          {/* Edit Profile Button */}
          <TouchableOpacity 
            onPress={() => setViewMode("edit")} 
            style={[styles.button, viewMode === "edit" && styles.activeButton]}>
            <FontAwesome name="edit" size={24} color="white" />
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Button */}
        <TouchableOpacity style={styles.settingsButton}>
          <FontAwesome name="cogs" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Edit Profile Mode */}
      {viewMode === "edit" && (
        <View style={styles.editContainer}>
          <Text style={styles.sectionTitle}>Edit Bio</Text>
          <TextInput
            style={styles.textInput}
            value={newBio}
            onChangeText={setNewBio}
            multiline
            placeholder="Edit your bio..."
            placeholderTextColor="gray"
          />
          <TouchableOpacity onPress={handleSaveBio} style={styles.saveButton}>
            <Text style={styles.buttonText}>Save Bio</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
  },
  galleryContainer: {
    width: "90%", // Limit gallery width to 80% of the screen
    alignSelf: "center", // Center the gallery on the screen
    overflow: "hidden", // Hide images that are not currently visible
    marginTop: 40,
    borderRadius: 40,
  },
  profileImage: {
    width: width * 0.9, // Set image width to 80% of screen width
    height: width * 1.4, // Set image height to match the width for a square shape
    resizeMode: "cover",
  },
  indicatorContainer: {
    flexDirection: "row",
    position: "absolute",
    top: 2,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center", // Center indicators
  },
  indicator: {
    height: 4,
    margin: 6,
    borderRadius: 3,
  },
  imageContainer: {
    position: "relative",
  },
  overlay: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    padding: 15,
  },
  overlayText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "start",
  },
  interestBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    margin: 4,
  },
  interestText: {
    fontSize: 14,
    color: "white",
    fontWeight: "bold",
  },
  noInterestsText: {
    fontSize: 16,
    color: "white",
    marginTop: 5,
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  triangleButtonWrapper: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "90%",
    backgroundColor: "#012840",
    marginBottom: 2,
    padding: 10,
    borderRadius: 60,
  },
  button: {
    padding: 10,
    borderRadius: 10,
    width: 160,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center", // Align icon and text horizontally
  },
  activeButton: {
    backgroundColor: "#D9043D", // Add a darker background for active state
    borderRadius: 80,
    paddingLeft: 20,
    paddingRight: 20,
  },
  buttonText: {
    color: "white",
    marginLeft: 10, // Adjust text position next to the icon
  },
  settingsButton: {
    backgroundColor: "#012840",
    padding: 15,
    borderRadius: 30,  // Rounded background for icon
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  editContainer: {
    padding: 20,
    backgroundColor: "#222",
    marginTop: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: "#333",
    color: "white",
    padding: 10,
    borderRadius: 10,
    height: 100,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: "#D9043D",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
});

export default ProfileScreen;
