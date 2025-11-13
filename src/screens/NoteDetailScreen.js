// NoteDetailScreen.js - Màn hình chi tiết ghi chú
// TODO: Person B - Display full note details

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { deleteNoteAsync, updateNoteAsync } from '../redux/noteSlice';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';
import { formatDateTime } from '../utils/dateHelper';

const NoteDetailScreen = ({ navigation }) => {
  const route = useRoute();
  const dispatch = useDispatch();
  const { noteId } = route.params;
  const note = useSelector(state =>
    state.note.notes.find(n => n.id === noteId)
  );

  const loading = useSelector(state => state.note.loading);

  useFocusEffect(
    useCallback(() => {
      if (!note) {
        navigation.goBack();
      }
    }, [note, navigation])
  );



  const handleDelete = () => {
    Alert.alert('Xóa ghi chú', 'Bạn có chắc chắn muốn xóa ghi chú này? Nó sẽ bị xóa cả trên Cloud nếu đã đồng bộ.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(deleteNoteAsync(note.id)).unwrap();
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Main'); 
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa ghi chú: ' + (typeof error === 'string' ? error : 'Lỗi hệ thống.'));
          }
        },
      },
    ]);
  };

  const toggleComplete = async () => {
    try {
      const payload = { ...note, isCompleted: !note.isCompleted };
      await dispatch(updateNoteAsync(payload)).unwrap();

      const statusText = payload.isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành';
      Alert.alert('Thành công', `Trạng thái đã được cập nhật thành ${statusText}.`);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditNote', { noteId: note.id });
  };

  React.useLayoutEffect(() => { // Cấu hình nút Edit trên Header
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleEdit} disabled={loading}>
          <Ionicons name="create-outline" size={24} color="#FFFFFF" style={{ marginRight: Spacing.md }} />
        </TouchableOpacity>
      ),
      headerTitle: note?.title?.length > 20 ? 'Chi tiết ghi chú' : note?.title
    });
  }, [navigation, note, loading]);

  // Thông tin vị trí cho MapView


  if (!note) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.errorText}>Đang tải hoặc ghi chú đã bị xóa.</Text>
      </View>
    );
  }

  const hasLocation = note.latitude && note.longitude;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>

        {/* Title & Status */}
        <Text style={[styles.title, note.isCompleted && styles.completedTitle]}>
          {note.title}
        </Text>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{(note.category || 'other').toString()}</Text>
        </View>

        {note.content && <Text style={styles.contentText}>{note.content}</Text>}

        {/* Image */}
        {note.image && (
          <Image source={{ uri: note.image }} style={styles.image} resizeMode="cover" />
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

        {/* Info Rows */}
        {note.dueDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nhắc nhở:</Text>
            <Text style={styles.infoValue}>{formatDateTime(note.dueDate) || 'N/A'}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tạo lúc:</Text>
          <Text style={styles.infoValue}>{formatDateTime(note.createdAt) || 'N/A'}</Text>
        </View>

        {/* Sync Status */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Đồng bộ:</Text>
          <Text style={[styles.infoValue, note.syncStatus === 'pending' && styles.pendingSyncText]}>
            {note.syncStatus === 'pending' ? 'Pending Sync ☁️' : 'Đã đồng bộ ✅'}
          </Text>
        </View>


        {/* Action Buttons */}
        <View style={[styles.buttonRow, { marginTop: Spacing.xl }]}>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: note.isCompleted
                  ? Colors.warning // Màu khác khi đã hoàn thành (nhấn để hoàn tác)
                  : Colors.success,
              },
            ]}
            onPress={toggleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {note.isCompleted ? '↻ CHƯA HOÀN THÀNH' : '✓ HOÀN THÀNH'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.buttonRow, { marginBottom: Spacing.xxl }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.error }]}
            onPress={handleDelete}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🗑 XÓA GHI CHÚ</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.lg
  },
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
    color: Colors.light.text,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: Colors.light.textSecondary
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
    fontSize: FontSizes.sm
  },
  contentText: {
    fontSize: FontSizes.md,
    lineHeight: 24,
    marginBottom: Spacing.md,
    color: Colors.light.text
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
    color: Colors.light.text
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
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginRight: Spacing.sm,
    color: Colors.light.text
  },
  infoValue: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
  },
  pendingSyncText: {
    color: Colors.warning,
    fontWeight: '600'
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
  actionButton: {
    paddingVertical: Spacing.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});

export default NoteDetailScreen;
