// EditNoteScreen.js - Màn hình chỉnh sửa ghi chú
// TODO: Person B - Similar to AddNoteScreen but with existing data

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import { updateNoteAsync } from '../redux/noteSlice';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/globalStyles';
import { 
    CATEGORY_VALUES,
    getCategoryLabel
} from '../utils/categoryHelper';
import CameraPicker from '../components/CameraPicker';
import MapPicker from '../components/MapPicker';
import NotificationScheduler from '../components/NotificationScheduler';
import { scheduleNoteNotification } from '../utils/notificationHelper';
import { useTheme } from '../contexts/ThemeContext'; 

const EditNoteScreen = ({ navigation }) => {
  const route = useRoute();
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme(); 
  const { noteId } = route.params;

  const existingNote = useSelector(state =>
    state.note.notes.find(n => n.id === noteId)
  );

  const loading = useSelector((state) => state.note.loading);

  if (!existingNote) {
    Alert.alert('Lỗi', 'Không tìm thấy ghi chú để chỉnh sửa.');
    navigation.goBack();
    return null;
  }

  const [title, setTitle] = useState(existingNote.title || '');
  const [content, setContent] = useState(existingNote.content || '');
  const [category, setCategory] = useState(existingNote.category || CATEGORY_VALUES[1]);
  const [imageUri, setImageUri] = useState(existingNote.image || null);
  const [location, setLocation] = useState(
    existingNote.latitude && existingNote.longitude
      ? { latitude: existingNote.latitude, longitude: existingNote.longitude }
      : null
  );
  
  const [dueDate, setDueDate] = useState(existingNote.dueDate || null);
  const [notificationEnabled, setNotificationEnabled] = useState(!!existingNote.dueDate);
  const [showCameraPicker, setShowCameraPicker] = useState(!!existingNote.image);
  const [showMapPicker, setShowMapPicker] = useState(!!(existingNote.latitude && existingNote.longitude));

  const toggleFeature = (feature) => {
    if (feature === 'camera') {
        if (!showCameraPicker && imageUri) {
          setShowCameraPicker(true);
        } else {
          setShowCameraPicker(prev => !prev);
        }
    } else if (feature === 'map') {
        // Tương tự cho map
        if (!showMapPicker && location) {
          setShowMapPicker(true);
        } else {
          setShowMapPicker(prev => !prev);
        }
    };
  }

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Chỉnh sửa ghi chú',
    });
  }, [navigation]);

  const handleSaveNote = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Tiêu đề ghi chú không được để trống.');
      return;
    }

    if (notificationEnabled && dueDate) {
      const selectedDate = new Date(dueDate);
      const now = new Date();
      if (selectedDate <= now) {
        Alert.alert('Lỗi', 'Thời gian nhắc nhở phải ở tương lai');
        return;
      }
    }

    const updatedData = {
      ...existingNote,
      id: existingNote.id,
      title: title.trim(),
      content: content.trim(),
      category: category,
      image: imageUri,
      latitude: location?.latitude || null,
      longitude: location?.longitude || null,
      dueDate: notificationEnabled ? dueDate : null,
      // isCompleted giữ nguyên giá trị cũ
      isCompleted: existingNote.isCompleted, 
    };

    try {
      await dispatch(updateNoteAsync(updatedData)).unwrap();
      if (notificationEnabled && dueDate) {
        await scheduleNoteNotification({ ...updatedData, dueDate });
      } else {
        // (Nâng cao: Cần huỷ thông báo nếu người dùng tắt)
      }

      Alert.alert('Thành công', 'Ghi chú đã được cập nhật.');
      navigation.goBack();

    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Không thể cập nhật ghi chú.';
      Alert.alert('Lỗi Cập nhật', errorMessage);
    }
  };

  return (
    <View style={styles.fullScreenContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.titleInput}
          placeholder="Tiêu đề"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.contentInput}
          placeholder="Nội dung ghi chú..."
          value={content}
          onChangeText={setContent}
          multiline
        />

        {/* Category Selection */}
        <Text style={styles.label}>Danh mục</Text>
        <View style={styles.categoryContainer}>
          {CATEGORY_VALUES.filter(v => v !== 'all').map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.categoryButton,
                category === value && styles.categoryButtonActive,
                { marginRight: Spacing.sm, marginBottom: Spacing.sm }
              ]}
              onPress={() => setCategory(value)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  category === value && styles.categoryButtonTextActive,
                ]}
              >
                {getCategoryLabel(value)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Image Picker */}
        <TouchableOpacity
          style={[styles.featureItem, styles.featureRow, showCameraPicker && styles.featureActive]}
          onPress={() => toggleFeature('camera')}
        >
          <Ionicons name="camera" size={24} color={Colors.primary} />
          <Text style={styles.featureText}>Chỉnh sửa Ảnh</Text>
          {imageUri && <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={styles.checkIcon} />}
        </TouchableOpacity>
        {showCameraPicker && (
          <CameraPicker
            onImageSelect={setImageUri} // Cập nhật state imageUri
            initialImage={imageUri}   // Truyền ảnh hiện có
            theme={isDarkMode ? 'dark' : 'light'}
          />
        )}

        {/* Location Picker */}
        <TouchableOpacity
          style={[styles.featureItem, styles.featureRow, showMapPicker && styles.featureActive]}
          onPress={() => toggleFeature('map')}
        >
          <Ionicons name="location" size={24} color={Colors.primary} />
          <Text style={styles.featureText}>Chỉnh sửa Vị trí</Text>
          {location?.latitude && <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={styles.checkIcon} />}
        </TouchableOpacity>
        {showMapPicker && (
          <MapPicker
            onLocationSelect={setLocation} // Cập nhật state location
            initialLocation={location}  // Truyền vị trí hiện có
            theme={isDarkMode ? 'dark' : 'light'}
          />
        )}

        {/* Notification Scheduler */}
        <NotificationScheduler
          onDateSelect={setDueDate}
          enabled={notificationEnabled}
          onEnabledChange={setNotificationEnabled}
          initialDate={dueDate} // Truyền ngày hẹn hiện có
          theme={isDarkMode ? 'dark' : 'light'}
        />

      </ScrollView>

      {/* Nút Lưu */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSaveNote}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Lưu Thay Đổi</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 100, // Thêm padding dưới để không bị che bởi nút Save
  },
  titleInput: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  contentInput: {
    fontSize: FontSizes.md,
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  label: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    color: Colors.light.text,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  featureActive: {
      backgroundColor: Colors.light.secondary, 
      borderColor: Colors.primary,
      borderWidth: 1,
  },
  featureRow: { 
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: Colors.light.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
  },
  featureItem: {
    flex: 1, 
  },
  featureText: {
    marginLeft: Spacing.md,
    flex: 1, 
    color: Colors.primary,
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
  checkIcon: {
    marginLeft: Spacing.xs,
  },
  saveButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary, 
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
});

export default EditNoteScreen;