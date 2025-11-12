// CameraPicker.js - Component chọn/chụp ảnh
import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';

const IMAGE_COMPRESSION_QUALITY = 0.7;
const IMAGE_MAX_WIDTH = 1200;

const CameraPicker = ({ initialImage, onImageSelect, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const [selectedImageUri, setSelectedImageUri] = useState(initialImage);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setSelectedImageUri(initialImage);
  }, [initialImage]);

  /**
   * Optimize image - resize and compress
   * @param {string} uri - Original image URI
   * @returns {promise<string>} Optimized image URI
   */
  const optimizeImage = async (uri) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: IMAGE_MAX_WIDTH } }],
        { compress: IMAGE_COMPRESSION_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log('✅ Image optimized:', manipResult.uri);
      return manipResult.uri;
    } catch (error) {
      console.error('❌ Error optimizing image:', error);
      return null;
    }
  };

  const handleImagePickAndOptimize = async (pickerFunction) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Lỗi', 'Cần cấp quyền truy cập camera và thư viện');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await pickerFunction();

      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        const originalUri = result.assets[0].uri;
        const optimizedUri = await optimizeImage(originalUri);

        if (optimizedUri) {
          setSelectedImageUri(optimizedUri);
          onImageSelect(optimizedUri); // Gửi URI đã tối ưu
        } else {
          Alert.alert('Lỗi', 'Xử lý ảnh không thành công.');
          setSelectedImageUri(null);
          onImageSelect(null);
        }
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể hoàn thành thao tác: ' + error.message);
      setSelectedImageUri(null);
      onImageSelect(null);
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

  const pickImageFromLibrary = () => {
    return ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
      allowsEditing: false,
      quality: 1,
    });
  };

  const takePhoto = () => {
    return ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });
  };

  const showImageOptions = () => {

    if (isProcessing) return;

    if (selectedImageUri) {
      Alert.alert('Quản lý ảnh', 'Bạn muốn thay đổi hay xóa ảnh?', [
        { text: 'Chụp ảnh mới', onPress: () => handleImagePickAndOptimize(takePhoto) },
        { text: 'Chọn từ Thư viện', onPress: () => handleImagePickAndOptimize(pickImageFromLibrary) },
        { text: 'Xóa ảnh', style: 'destructive', onPress: removeImage },
        { text: 'Hủy', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Thêm Ảnh', 'Bạn muốn chọn ảnh từ đâu?', [
        { text: 'Chụp ảnh', onPress: () => handleImagePickAndOptimize(takePhoto) },
        { text: 'Thư viện', onPress: () => handleImagePickAndOptimize(pickImageFromLibrary) },
        { text: 'Hủy', style: 'cancel' },
      ]);
    }
  };

  const removeImage = () => {
    setSelectedImageUri(null);
    onImageSelect(null);
  };

  return (
    <View style={styles.container}>
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Đang xử lý ảnh...</Text>
        </View>
      )}
      {selectedImageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImageUri }} style={styles.image} resizeMode="cover" />
          {/* Nút overlay để hiển thị lại options (Đổi/Xóa) */}
          <TouchableOpacity
            style={styles.imageEditOverlay}
            onPress={showImageOptions}
            disabled={isProcessing}
          >
            <Ionicons name="create-outline" size={30} color="#FFFFFF" />
            <Text style={styles.overlayText}>Chỉnh sửa</Text>
          </TouchableOpacity>
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
          disabled={isProcessing}
        >
          <Ionicons name="camera-outline" size={40} color={themeColors.textSecondary} />
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
  container: { width: '100%', marginBottom: Spacing.md, },
  imageContainer: { width: '100%', position: 'relative' },
  image: { width: '100%', height: 200, borderRadius: BorderRadius.lg, },
  imageEditOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginTop: Spacing.xs,
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
    marginTop: Spacing.sm,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
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
