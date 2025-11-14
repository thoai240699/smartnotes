// NotificationScreen.js - Màn hình quản lý thông báo
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { Colors, Spacing, FontSizes } from '../styles/globalStyles';
import { useTheme } from '../contexts/ThemeContext';
import {
  getAllScheduledNotifications,
  cancelNotification,
  requestNotificationPermissions,
  cancelAllNotifications,
} from '../utils/notificationHelper';
import { formatDateTime } from '../utils/dateHelper';

const NotificationScreen = ({ navigation }) => {
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const notes = useSelector((state) => state.note.notes);
  const { isDarkMode } = useTheme();

  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  // Load scheduled notifications when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
      checkPermissionStatus();
    }, [])
  );

  const checkPermissionStatus = async () => {
    try {
      const hasPermission = await requestNotificationPermissions();
      setPermissionStatus(hasPermission);
    } catch (error) {
      console.log('Error checking permission:', error);
      setPermissionStatus(false);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notifications = await getAllScheduledNotifications();

      // Enrich notifications with note data
      const enrichedNotifications = notifications.map((notification) => {
        const noteId = notification.content?.data?.noteId;
        const relatedNote = notes.find((note) => note.id === noteId);

        return {
          ...notification,
          relatedNote,
          triggerDate:
            notification.trigger?.date || notification.trigger?.dateComponents,
        };
      });

      // Sort by trigger date
      enrichedNotifications.sort((a, b) => {
        const dateA = new Date(a.triggerDate);
        const dateB = new Date(b.triggerDate);
        return dateA - dateB;
      });

      setScheduledNotifications(enrichedNotifications);
    } catch (error) {
      console.log('Error loading notifications:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelNotification = async (
    notificationId,
    notificationTitle
  ) => {
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc muốn hủy thông báo "${notificationTitle}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelNotification(notificationId);
              await loadNotifications();
              Alert.alert('Thành công', 'Đã hủy thông báo');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể hủy thông báo');
            }
          },
        },
      ]
    );
  };

  const handleClearAllNotifications = () => {
    if (scheduledNotifications.length === 0) {
      Alert.alert('Thông báo', 'Không có thông báo nào để xóa');
      return;
    }

    Alert.alert(
      'Xác nhận',
      `Bạn có chắc muốn xóa tất cả ${scheduledNotifications.length} thông báo?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAllNotifications();
              await loadNotifications();
              Alert.alert('Thành công', 'Đã xóa tất cả thông báo');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa thông báo');
            }
          },
        },
      ]
    );
  };

  const handleNavigateToNote = (noteId) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      navigation.navigate('NoteDetail', { note });
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy ghi chú liên quan');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const renderNotificationItem = ({ item }) => {
    const triggerDate = new Date(item.triggerDate);
    const now = new Date();
    const isExpired = triggerDate < now;

    return (
      <View
        style={[
          styles.notificationItem,
          { backgroundColor: themeColors.card },
          isExpired && styles.expiredItem,
        ]}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Ionicons
              name={isExpired ? 'time-outline' : 'notifications-outline'}
              size={24}
              color={isExpired ? themeColors.textSecondary : Colors.primary}
            />
          </View>
          <View style={styles.notificationContent}>
            <Text
              style={[styles.notificationTitle, { color: themeColors.text }]}
              numberOfLines={1}
            >
              {item.content.title}
            </Text>
            <Text
              style={[
                styles.notificationBody,
                { color: themeColors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {item.content.body}
            </Text>
            <Text
              style={[
                styles.notificationDate,
                { color: themeColors.textSecondary },
              ]}
            >
              {isExpired ? '⏰ Đã qua: ' : '📅 '}
              {formatDateTime(triggerDate)}
            </Text>
          </View>
        </View>

        <View style={styles.notificationActions}>
          {item.relatedNote ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleNavigateToNote(item.relatedNote.id)}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={[styles.actionText, { color: Colors.primary }]}>
                Xem ghi chú
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.disabledButton]}
              disabled={true}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#94A3B8"
              />
              <Text style={[styles.actionText, styles.disabledText]}>
                Ghi chú không tồn tại
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() =>
              handleCancelNotification(item.identifier, item.content.title)
            }
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={[styles.actionText, styles.cancelText]}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name="notifications-off-outline"
          size={64}
          color={themeColors.textSecondary}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
        Chưa có thông báo nào
      </Text>
      <Text
        style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}
      >
        Tạo ghi chú với ngày hạn để nhận thông báo nhắc nhở
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: Colors.primary }]}
        onPress={() => navigation.navigate('AddNote')}
      >
        <Text style={styles.emptyButtonText}>Tạo ghi chú mới</Text>
      </TouchableOpacity>
    </View>
  );

  const PermissionDenied = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="notifications-off" size={64} color="#EF4444" />
      </View>
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
        Chưa cấp quyền thông báo
      </Text>
      <Text
        style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}
      >
        Vui lòng cấp quyền thông báo để sử dụng tính năng nhắc nhở
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: Colors.primary }]}
        onPress={checkPermissionStatus}
      >
        <Text style={styles.emptyButtonText}>Cấp quyền</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: themeColors.background },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.text }]}>
          Đang tải thông báo...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { 
        backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />

      <View
        style={[
          styles.header,
          {
            backgroundColor: themeColors.card,
            borderBottomColor: themeColors.border,
          },
        ]}
      >
        {scheduledNotifications.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAllNotifications}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={[styles.clearAllText, { color: Colors.error }]}>
              Xóa tất cả
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {permissionStatus === false ? (
        <PermissionDenied />
      ) : (
        <>
          {scheduledNotifications.length > 0 && (
            <View
              style={[
                styles.statsContainer,
                {
                  backgroundColor: themeColors.card,
                  borderBottomColor: themeColors.border,
                },
              ]}
            >
              <Text style={[styles.statsText, { color: themeColors.text }]}>
                {scheduledNotifications.length} thông báo đã lên lịch
              </Text>
            </View>
          )}

          <FlatList
            data={scheduledNotifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.identifier}
            contentContainerStyle={[
              styles.listContainer,
              scheduledNotifications.length === 0 && styles.listEmpty,
            ]}
            ListEmptyComponent={<EmptyState />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.error,
    marginLeft: 4,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listEmpty: {
    flexGrow: 1,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expiredItem: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E7EB',
    opacity: 0.8,
  },
  notificationHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  notificationIcon: {
    marginRight: 12,
    paddingTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    gap: 4,
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  cancelText: {
    color: Colors.light.error,
  },
  disabledButton: {
    backgroundColor: '#F8F9FA',
    opacity: 0.6,
  },
  disabledText: {
    color: '#94A3B8',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default NotificationScreen;
