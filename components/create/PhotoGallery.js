import React from 'react';
import { View, FlatList, Image, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const PhotoGallery = ({ photos, setPhotos, openPixabay }) => {
  const pickImage = async () => {
    if (photos.length >= 3) return alert('Max 3 photos allowed.');
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <View>
      {photos.length > 0 ? (
        <FlatList
          horizontal pagingEnabled
          data={photos}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={{ position: 'relative' }}>
              <Image source={{ uri: item }} style={{ width, height: width, resizeMode: 'cover' }} />
              <TouchableOpacity style={{ position: 'absolute', bottom: 10, right: 10 }} onPress={() => removeImage(index)}>
                <Ionicons name="close-circle" size={30} color="red" />
              </TouchableOpacity>
            </View>
          )}
        />
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 10 }}>
        <TouchableOpacity onPress={pickImage}>
          <Ionicons name="cloud-upload" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={openPixabay}>
          <Ionicons name="image" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PhotoGallery;
