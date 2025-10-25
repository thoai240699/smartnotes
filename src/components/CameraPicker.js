// CameraPicker.js - Component chọn/chụp ảnh
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';

const CameraPicker = ({ initialImage, onImageSelect, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const [selectedImage, setSelectedImage] = useState(initialImage);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Optimize image - resize and compress
   * @param {string} uri - Original image URI
   * @returns {string} Optimized image URI
   */
  const optimizeImage = async (uri) => {
    try {
      setIsProcessing(true);
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }], // Max width 1200px (good balance)
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log('✅ Image optimized:', manipResult.uri);
      return manipResult.uri;
    } catch (error) {
      console.error('❌ Error optimizing image:', error);
      return uri; // Return original if optimization fails
    } finally {
      setIsProcessing(false);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    return cameraStatus === 'granted' && libraryStatus === 'granted';
  };

  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const optimizedUri = await optimizeImage(result.assets[0].uri);
        setSelectedImage(optimizedUri);
        onImageSelect && onImageSelect(optimizedUri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Lỗi', 'Cần cấp quyền truy cập camera');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const optimizedUri = await optimizeImage(result.assets[0].uri);
        setSelectedImage(optimizedUri);
        onImageSelect && onImageSelect(optimizedUri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  const showImageOptions = () => {
    Alert.alert('Chọn ảnh', 'Bạn muốn chọn ảnh từ đâu?', [
      { text: 'Thư viện', onPress: pickImageFromLibrary },
      { text: 'Chụp ảnh', onPress: takePhoto },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const removeImage = () => {
    setSelectedImage(null);
    onImageSelect && onImageSelect(null);
  };

  return (
    <View style={styles.container}>
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang xử lý ảnh...</Text>
        </View>
      )}
      {selectedImage ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.image} />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.primary }]}
              onPress={showImageOptions}
            >
              <Text style={styles.buttonText}>Đổi ảnh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.error }]}
              onPress={removeImage}
            >
              <Text style={styles.buttonText}>Xóa ảnh</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.placeholder,
            {
              backgroundColor: themeColors.backgroundSecondary,
              borderColor: themeColors.border,
            },
          ]}
          onPress={showImageOptions}
        >
          <Text
            style={[
              styles.placeholderText,
              { color: themeColors.textSecondary },
            ]}
          >
            📷 Chạm để thêm ảnh
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  placeholder: {
    width: '100%',
    height: 150,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FontSizes.md,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: BorderRadius.lg,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
});

export default CameraPicker;
