// AddNoteScreen.js - Màn hình thêm ghi chú mới
// TODO: Person B - Implement add note functionality

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { createNoteAsync } from '../redux/noteSlice';
import CameraPicker from '../components/CameraPicker';
import MapPicker from '../components/MapPicker';
import NotificationScheduler from '../components/NotificationScheduler';
import { scheduleNoteNotification } from '../utils/notificationHelper';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';
import {
  CATEGORY_VALUES,
  getCategoryLabel
} from '../utils/categoryHelper';

const AddNoteScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.note);
  //const { currentUser } = useSelector((state) => state.user);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(CATEGORY_VALUES[1]);

  const [image, setImage] = useState(null); // URI của ảnh
  const [location, setLocation] = useState(null); // { latitude, longitude }

  const [dueDate, setDueDate] = useState(null); // Date object/string cho Reminder
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const [showCameraPicker, setShowCameraPicker] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const toggleFeature = (feature) => {
    if (feature === 'camera') {
        setShowCameraPicker(prev => !prev);
    } else if (feature === 'map') {
        setShowMapPicker(prev => !prev);
    };
  }

  const handleSave = async () => {
    // Validation tiêu đề
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề');
      return;
    }

    // Validate ngày nhắc nhở
    if (notificationEnabled && dueDate) {
      const selectedDate = new Date(dueDate);
      const now = new Date();
      if (selectedDate <= now) {
        Alert.alert('Lỗi', 'Thời gian nhắc nhở phải ở tương lai');
        return;
      }
    }

    const noteData = {
      title: title.trim(),
      content: content.trim(),
      category,
      image,
      latitude: location?.latitude || null,
      longitude: location?.longitude || null,
      dueDate: notificationEnabled ? dueDate : null,
      isCompleted: false,
    };

    try {
      // Create note first
      const result = await dispatch(createNoteAsync(noteData)).unwrap();

      // Schedule notification nếu được bật
      if (notificationEnabled && dueDate && result) {
        const notificationId = await scheduleNoteNotification({
          ...result,
          dueDate,
        });

        if (notificationId) {
          Alert.alert(
            'Thành công',
            'Ghi chú đã được tạo và thông báo đã được lên lịch',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Thành công',
            'Ghi chú đã được tạo nhưng không thể lên lịch thông báo',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert('Thành công', 'Ghi chú đã được tạo', [{ text: 'OK' }]);
      }

      navigation.goBack();
    } catch (error) {
      console.log('Error creating note:', error);
      const errorMessage = typeof error === 'string' ? error : 'Lỗi hệ thống khi lưu ghi chú.';
      Alert.alert('Lỗi', 'Không thể tạo ghi chú: ' + errorMessage);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
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
          <Text style={styles.featureText}>Thêm Ảnh/Media</Text>
          {image && <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={styles.checkIcon} />}
        </TouchableOpacity>
        {showCameraPicker && (
          <CameraPicker
            onImageSelect={setImage}
            initialImage={image}
          />
        )}

        {/* Location Picker */}
        <TouchableOpacity
          style={[styles.featureItem, styles.featureRow, showMapPicker && styles.featureActive]}
          onPress={() => toggleFeature('map')}
        >
          <Ionicons name="location" size={24} color={Colors.primary} />
          <Text style={styles.featureText}>Chọn Vị trí</Text>
          {location?.latitude && <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={styles.checkIcon} />}
        </TouchableOpacity>
        {showMapPicker && (
          <MapPicker
            onLocationSelect={setLocation}
            initialLocation={location}
          />
        )}

        {/* Notification Scheduler */}
        <NotificationScheduler
          onDateSelect={setDueDate}
          enabled={notificationEnabled}
          onEnabledChange={setNotificationEnabled}
        />

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Lưu ghi chú</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.md,
  },
  titleInput: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  contentInput: {
    fontSize: FontSizes.md,
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
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
  },
  checkIcon: {
    marginLeft: Spacing.xs,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
});

export default AddNoteScreen;