import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Text, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadImageToCloudinary } from '../utils/imageUpload';
import ImagePreviewModal from './ImagePreviewModal';

const ImageUpload = ({ onImagesUploaded, existingImages = [], maxImages = 5 }) => {
  const [images, setImages] = useState(existingImages.map(url => ({ url })));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const compressImage = async (uri, quality = 0.7) => {
    try {
      // Create thumbnail version with better quality
      const thumbnailResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 500 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Create full-size version with maximum quality
      const fullSizeResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 2048 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      return {
        thumbnail: thumbnailResult.uri,
        fullSize: fullSizeResult.uri
      };
    } catch (error) {
      console.error('Error compressing image:', error);
      return { thumbnail: uri, fullSize: uri }; // Return original if compression fails
    }
  };

  const requestPermissions = async (type) => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
        return false;
      }
    }
    return true;
  };

  const handleImageUpload = async (result) => {
    if (!result.canceled && result.assets && result.assets[0]) {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Starting image compression...');
        const { thumbnail, fullSize } = await compressImage(result.assets[0].uri);
        console.log('Image compressed successfully');
        
        // Upload both versions to Cloudinary
        console.log('Starting Cloudinary upload...');
        const thumbnailResult = await uploadImageToCloudinary(thumbnail);
        console.log('Thumbnail upload result:', thumbnailResult);
        
        if (!thumbnailResult.success) {
          throw new Error(thumbnailResult.error || 'Failed to upload thumbnail');
        }
        
        const fullSizeResult = await uploadImageToCloudinary(fullSize);
        console.log('Full size upload result:', fullSizeResult);
        
        if (!fullSizeResult.success) {
          throw new Error(fullSizeResult.error || 'Failed to upload full size image');
        }
        
        if (thumbnailResult.success && fullSizeResult.success) {
          const newImage = {
            url: thumbnailResult.url,
            fullSizeUrl: fullSizeResult.url,
            publicId: fullSizeResult.publicId
          };
          
          const updatedImages = [...images, newImage];
          setImages(updatedImages);
          onImagesUploaded && onImagesUploaded(updatedImages);
          setError(null);
        } else {
          throw new Error('Failed to upload one or both image versions');
        }
      } catch (error) {
        console.error('Detailed error in handleImageUpload:', error);
        setError(error.message || 'Failed to upload image. Please try again.');
        Alert.alert(
          'Upload Error',
          'Failed to upload image. Please try again later.',
          [{ text: 'OK' }]
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const removeImage = (index) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedImages = images.filter((_, i) => i !== index);
            setImages(updatedImages);
            onImagesUploaded && onImagesUploaded(updatedImages);
          }
        }
      ]
    );
  };

  const handleImagePress = (image) => {
    setSelectedImage(image.fullSizeUrl || image.url);
    setPreviewVisible(true);
  };

  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Maximum Images', `You can only upload up to ${maxImages} images`);
      return;
    }

    try {
      if (!(await requestPermissions('library'))) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: maxImages - images.length,
      });

      if (!result.canceled && result.assets) {
        setLoading(true);
        setError(null);
        
        const uploadPromises = result.assets.map(async (asset) => {
          try {
            const { thumbnail, fullSize } = await compressImage(asset.uri);
            
            const thumbnailResult = await uploadImageToCloudinary(thumbnail);
            if (!thumbnailResult.success) {
              throw new Error(thumbnailResult.error || 'Failed to upload thumbnail');
            }
            
            const fullSizeResult = await uploadImageToCloudinary(fullSize);
            if (!fullSizeResult.success) {
              throw new Error(fullSizeResult.error || 'Failed to upload full size image');
            }
            
            return {
              url: thumbnailResult.url,
              fullSizeUrl: fullSizeResult.url,
              publicId: fullSizeResult.publicId
            };
          } catch (error) {
            console.error('Error processing image:', error);
            throw error;
          }
        });

        try {
          const newImages = await Promise.all(uploadPromises);
          const updatedImages = [...images, ...newImages];
          setImages(updatedImages);
          onImagesUploaded && onImagesUploaded(updatedImages);
          setError(null);
        } catch (error) {
          console.error('Error uploading images:', error);
          setError('Failed to upload one or more images. Please try again.');
          Alert.alert(
            'Upload Error',
            'Failed to upload images. Please try again later.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error picking images:', error);
      setError('Error selecting images');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Maximum Images', `You can only upload up to ${maxImages} images`);
      return;
    }

    try {
      if (!(await requestPermissions('camera'))) return;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      await handleImageUpload(result);
    } catch (error) {
      console.error('Error taking photo:', error);
      setError('Error capturing image');
      setLoading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.imagesContainer}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <TouchableOpacity onPress={() => handleImagePress(image)}>
                <Image source={{ uri: image.url }} style={styles.image} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <MaterialIcons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ))}
          
          {images.length < maxImages && (
            <TouchableOpacity 
              onPress={showImageOptions} 
              style={[styles.addButton, loading && styles.addButtonDisabled]}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.loadingText}>Uploading...</Text>
                </View>
              ) : (
                <View style={styles.placeholder}>
                  <MaterialIcons name="add-a-photo" size={40} color="#666" />
                  <Text style={styles.placeholderText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <Text style={styles.imageCount}>
        {images.length} / {maxImages} images
      </Text>

      <ImagePreviewModal
        visible={previewVisible}
        imageUrl={selectedImage}
        onClose={() => setPreviewVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scrollView: {
    flexGrow: 0,
    marginBottom: 10,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  imageContainer: {
    marginHorizontal: 5,
    position: 'relative',
  },
  addButton: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    color: 'red',
    marginTop: 5,
    textAlign: 'center',
  },
  imageCount: {
    textAlign: 'center',
    color: '#666',
    marginTop: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#4CAF50',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
});

export default ImageUpload; 