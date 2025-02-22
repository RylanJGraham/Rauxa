import React, { useState } from "react";
import { View, Image, TouchableOpacity, StyleSheet, Text, Dimensions } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { AntDesign } from "@expo/vector-icons";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";

const { width } = Dimensions.get("window");

const ProfilePictureUpload = ({ index, profileImages, setProfileImages, userId, username }) => {
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const imageUri = result.assets[0].uri;

      setProfileImages((prevData) => {
        const newProfileImages = [...prevData];
        newProfileImages[index] = imageUri;
        return newProfileImages;
      });

      uploadImageToFirebase(imageUri, index);
    }
  };

  const uploadImageToFirebase = async (imageUri, index) => {
    setIsUploading(true);

    const imageName = `${username}_${index}_${new Date().getTime()}.jpg`;
    const userFolderPath = `profilePics/${userId}`;
    const imageRef = ref(storage, `${userFolderPath}/${imageName}`);

    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      console.log('Blob created:', blob);

      await uploadBytes(imageRef, blob);
      console.log('Image uploaded to Firebase');

      const imageUrl = await getDownloadURL(imageRef);
      console.log('Download URL:', imageUrl);

      setProfileImages((prevData) => {
        const newProfileImages = [...prevData];
        newProfileImages[index] = imageUrl;
        return newProfileImages;
      });
    } catch (error) {
      console.error("Error uploading image: ", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <TouchableOpacity style={styles.rectangle} onPress={pickImage}>
      {profileImages[index] ? (
        <Image source={{ uri: profileImages[index] }} style={styles.profileImage} />
      ) : (
        <View style={styles.placeholder}>
          <AntDesign name="camera" size={32} color="#fff" />
        </View>
      )}
      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  rectangle: {
    width: width / 3 - 30,
    height: width / 3 - 30,
    backgroundColor: "#f0f0f0",
    margin: 10,
    position: "relative",
    borderRadius: 10,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000050",
    borderRadius: 10,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  uploadingText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ProfilePictureUpload;