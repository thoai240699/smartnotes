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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { createNoteAsync } from '../redux/noteSlice';
import CameraPicker from '../components/CameraPicker';
import MapPicker from '../components/MapPicker';
import NotificationScheduler from '../components/NotificationScheduler';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';

const AddNoteScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);

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
      alert('Vui lòng nhập tiêu đề');
      return;
    }

    const noteData = {
      userId: currentUser.id,
      title: title.trim(),
      content: content.trim(),
      category,
      image,
      latitude: location?.latitude || null,
      longitude: location?.longitude || null,
      dueDate: notificationEnabled ? dueDate : null,
    };

    try {
      await dispatch(createNoteAsync(noteData)).unwrap();
      navigation.goBack();
    } catch (error) {
      alert('Lỗi khi tạo ghi chú: ' + error);
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
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                category === cat && styles.categoryButtonActive,
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  category === cat && styles.categoryButtonTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Image Picker */}
        <Text style={styles.label}>Hình ảnh</Text>
        <CameraPicker onImageSelect={setImage} />

        {/* Location Picker */}
        <Text style={styles.label}>Vị trí</Text>
        <MapPicker onLocationSelect={setLocation} />

        {/* Notification Scheduler */}
        <NotificationScheduler
          onDateSelect={setDueDate}
          enabled={notificationEnabled}
          onEnabledChange={setNotificationEnabled}
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
    gap: Spacing.sm,
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
