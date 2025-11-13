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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { createNoteAsync } from '../redux/noteSlice';
import CameraPicker from '../components/CameraPicker';
import MapPicker from '../components/MapPicker';
import NotificationScheduler from '../components/NotificationScheduler';
import { scheduleNoteNotification } from '../utils/notificationHelper';
import { useTheme } from '../contexts/ThemeContext';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';

const AddNoteScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('other');
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const categories = ['work', 'personal', 'shopping', 'health', 'other'];

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề');
      return;
    }

    // Validate notification date
    if (notificationEnabled && dueDate) {
      const selectedDate = new Date(dueDate);
      const now = new Date();
      if (selectedDate <= now) {
        Alert.alert('Lỗi', 'Thời gian nhắc nhở phải ở tương lai');
        return;
      }
    }

    const noteData = {
      userId: currentUser?.id || 'default',
      title: title.trim(),
      content: content.trim(),
      category,
      image,
      latitude: location?.latitude || null,
      longitude: location?.longitude || null,
      dueDate: notificationEnabled ? dueDate : null,
    };

    try {
      // Create note first
      const result = await dispatch(createNoteAsync(noteData)).unwrap();

      // Schedule notification if enabled
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
      Alert.alert('Lỗi', 'Không thể tạo ghi chú: ' + error.message);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.content}>
        <TextInput
          style={[
            styles.titleInput,
            {
              backgroundColor: themeColors.card,
              color: themeColors.text,
              borderColor: themeColors.border,
            },
          ]}
          placeholder="Tiêu đề"
          placeholderTextColor={themeColors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[
            styles.contentInput,
            {
              backgroundColor: themeColors.card,
              color: themeColors.text,
              borderColor: themeColors.border,
            },
          ]}
          placeholder="Nội dung ghi chú..."
          placeholderTextColor={themeColors.textSecondary}
          value={content}
          onChangeText={setContent}
          multiline
        />

        {/* Category Selection */}
        <Text style={[styles.label, { color: themeColors.text }]}>
          Danh mục
        </Text>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                {
                  backgroundColor:
                    category === cat ? Colors.primary : themeColors.card,
                  borderColor:
                    category === cat ? Colors.primary : themeColors.border,
                },
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  {
                    color: category === cat ? '#FFFFFF' : themeColors.text,
                    fontWeight: category === cat ? '600' : 'normal',
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Image Picker */}
        <Text style={[styles.label, { color: themeColors.text }]}>
          Hình ảnh
        </Text>
        <CameraPicker
          onImageSelect={setImage}
          theme={isDarkMode ? 'dark' : 'light'}
        />

        {/* Location Picker */}
        <Text style={[styles.label, { color: themeColors.text }]}>Vị trí</Text>
        <MapPicker
          onLocationSelect={setLocation}
          theme={isDarkMode ? 'dark' : 'light'}
        />

        {/* Notification Scheduler */}
        <NotificationScheduler
          onDateSelect={setDueDate}
          enabled={notificationEnabled}
          onEnabledChange={setNotificationEnabled}
          theme={isDarkMode ? 'dark' : 'light'}
        />

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Lưu ghi chú</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  titleInput: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  contentInput: {
    fontSize: FontSizes.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
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
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: FontSizes.sm,
    textTransform: 'capitalize',
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
