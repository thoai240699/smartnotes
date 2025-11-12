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

const EditNoteScreen = ({ navigation }) => {
  // TODO: Get note from route.params
  // TODO: Pre-fill form with existing note data
  // TODO: Call updateNoteAsync on save

  const route = useRoute();
  const dispatch = useDispatch();
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
  const [location, setLocation] = useState({
    latitude: existingNote.latitude,
    longitude: existingNote.longitude
  });
  const [dueDate, setDueDate] = useState(existingNote.dueDate || null);
  const [notificationEnabled, setNotificationEnabled] = useState(!!existingNote.dueDate);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Chỉnh sửa ghi chú',
      headerRight: () => null,
    });
  }, [navigation]);

  const handleSaveNote = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Tiêu đề ghi chú không được để trống.');
      return;
    }

    const updatedData = {
      ...existingNote,
      id: existingNote.id,
      title: title.trim(),
      content: content.trim(),
      category: category,
      image: imageUri,
      latitude: location?.latitude,
      longitude: location?.longitude,
      dueDate: notificationEnabled ? dueDate : null,
    };

    try {
      await dispatch(updateNoteAsync(updatedData)).unwrap();

      Alert.alert('Thành công', 'Ghi chú đã được cập nhật.');

      navigation.goBack();

    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Không thể cập nhật ghi chú.';
      Alert.alert('Lỗi Cập nhật', errorMessage);
    }
  };

  const openCameraPicker = () => Alert.alert('Tính năng', 'Mở CameraPicker...');
  const openMapPicker = () => Alert.alert('Tính năng', 'Mở MapPicker...');
  const openReminderPicker = () => Alert.alert('Tính năng', 'Mở Reminder Picker...');

  return (
    <View style={styles.fullScreenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* Input Tiêu đề */}
        <TextInput
          style={[styles.input, styles.titleInput]}
          placeholder="Tiêu đề ghi chú (Bắt buộc)"
          value={title}
          onChangeText={setTitle}
        />

        {/* Input Nội dung */}
        <TextInput
          style={[styles.input, styles.contentInput]}
          placeholder="Nội dung ghi chú"
          value={content}
          onChangeText={setContent}
          multiline
        />

        {/* Chọn Danh mục */}
        <Text style={styles.sectionTitle}>Phân loại</Text>
        <View style={styles.categoryContainer}>
          {CATEGORY_VALUES.filter(v => v !== 'all').map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.categoryButton,
                category === value && styles.categoryActive,
                { marginRight: Spacing.sm, marginBottom: Spacing.sm }
              ]}
              onPress={() => setCategory(value)}
            >
              <Text style={[styles.categoryText, category === value && styles.categoryTextActive]}>{getCategoryLabel(value)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Thêm Tính năng (Media/Location/Reminder) */}
        <Text style={styles.sectionTitle}>Tính năng bổ sung</Text>
        <View style={styles.featureContainer}>
          <TouchableOpacity style={styles.featureItem} onPress={openCameraPicker}>
            <Ionicons name="camera" size={24} color={Colors.primary} />
            <Text style={styles.featureText}>Ảnh/Media</Text>
            {imageUri && <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={styles.checkIcon} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureItem} onPress={openMapPicker}>
            <Ionicons name="location" size={24} color={Colors.primary} />
            <Text style={styles.featureText}>Vị trí</Text>
            {location?.latitude && <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={styles.checkIcon} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureItem} onPress={openReminderPicker}>
            <Ionicons name="alarm" size={24} color={Colors.primary} />
            <Text style={styles.featureText}>Nhắc nhở</Text>
            {dueDate && <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={styles.checkIcon} />}
          </TouchableOpacity>
        </View>

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
    scrollContainer: {
        padding: Spacing.md,
        paddingBottom: 100, 
    },
    input: {
        backgroundColor: '#FFFFFF',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        fontSize: FontSizes.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    titleInput: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        height: 60,
    },
    contentInput: {
        minHeight: 150,
        textAlignVertical: 'top',
    },
    sectionTitle: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.light.textSecondary,
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
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.light.secondary,
    },
    categoryActive: {
        backgroundColor: Colors.primary,
    },
    categoryText: {
        color: Colors.light.text,
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
    categoryTextActive: {
        color: '#FFFFFF',
    },
    featureContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    featureText: {
        marginLeft: Spacing.xs,
        marginRight: Spacing.xs,
        color: Colors.primary,
        fontWeight: '600',
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
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
    },
});

export default EditNoteScreen;