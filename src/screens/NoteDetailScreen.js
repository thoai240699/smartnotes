// NoteDetailScreen.js - Màn hình chi tiết ghi chú
// TODO: Person B - Display full note details

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { deleteNoteAsync, updateNoteAsync } from '../redux/noteSlice';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';
import { formatDateTime } from '../utils/dateHelper';

const NoteDetailScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { note } = route.params;

  const handleDelete = () => {
    Alert.alert('Xóa ghi chú', 'Bạn có chắc chắn muốn xóa ghi chú này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(deleteNoteAsync(note.id)).unwrap();
            navigation.goBack();
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa ghi chú');
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    navigation.navigate('EditNote', { note });
  };

  const toggleComplete = async () => {
    try {
      await dispatch(
        updateNoteAsync({
          id: note.id,
          noteData: { ...note, isCompleted: !note.isCompleted },
        })
      ).unwrap();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{note.title}</Text>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{note.category || 'other'}</Text>
        </View>

        {note.content && <Text style={styles.contentText}>{note.content}</Text>}

        {note.image && (
          <Image source={{ uri: note.image }} style={styles.image} />
        )}

        {note.latitude && note.longitude && (
          <View style={styles.locationContainer}>
            <Text style={styles.sectionTitle}>📍 Vị trí</Text>
            <View style={styles.locationBox}>
              <Text style={styles.locationText}>
                Vĩ độ: {note.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Kinh độ: {note.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}

        {note.dueDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nhắc nhở:</Text>
            <Text style={styles.infoValue}>{formatDateTime(note.dueDate)}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tạo lúc:</Text>
          <Text style={styles.infoValue}>{formatDateTime(note.createdAt)}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: note.isCompleted
                  ? Colors.warning
                  : Colors.success,
              },
            ]}
            onPress={toggleComplete}
          >
            <Text style={styles.buttonText}>
              {note.isCompleted ? '↻ Chưa hoàn thành' : '✓ Hoàn thành'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.primary }]}
            onPress={handleEdit}
          >
            <Text style={styles.buttonText}>✎ Chỉnh sửa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.error }]}
            onPress={handleDelete}
          >
            <Text style={styles.buttonText}>🗑 Xóa</Text>
          </TouchableOpacity>
        </View>
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
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  categoryText: {
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  contentText: {
    fontSize: FontSizes.md,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  locationContainer: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  locationBox: {
    backgroundColor: Colors.primary + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  locationText: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  infoValue: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  button: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});

export default NoteDetailScreen;
