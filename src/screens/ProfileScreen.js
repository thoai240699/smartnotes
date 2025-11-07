// ProfileScreen.js - Màn hình thông tin người dùng với đầy đủ tính năng
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Switch,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import * as Notifications from 'expo-notifications';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, isLoggedIn } = useSelector((state) => state.user);
  const { notes } = useSelector((state) => state.note);
  const { isDarkMode, toggleTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statistics, setStatistics] = useState({
    totalNotes: 0,
    completedNotes: 0,
    pendingNotes: 0,
    notesByCategory: {},
  });

  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  // Calculate statistics
  useEffect(() => {
    calculateStatistics();
    checkNotificationPermission();
  }, [notes]);

  const calculateStatistics = () => {
    const total = notes.length;
    const completed = notes.filter((note) => note.isCompleted).length;
    const pending = total - completed;

    const categoryCount = notes.reduce((acc, note) => {
      const category = note.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    setStatistics({
      totalNotes: total,
      completedNotes: completed,
      pendingNotes: pending,
      notesByCategory: categoryCount,
    });
  };

  const checkNotificationPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  const handleNotificationToggle = async () => {
    try {
      if (!notificationsEnabled) {
        const { status } = await Notifications.requestPermissionsAsync();
        setNotificationsEnabled(status === 'granted');
        if (status !== 'granted') {
          Alert.alert(
            'Quyền thông báo',
            'Vui lòng bật quyền thông báo trong Settings để nhận nhắc nhở.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Tắt thông báo',
          'Để tắt thông báo, vui lòng vào Settings của thiết bị.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Lỗi', 'Không thể thay đổi cài đặt thông báo');
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
        },
      },
    ]);
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  // Render Statistics Modal
  const renderStatsModal = () => (
    <Modal
      visible={showStats}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowStats(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: themeColors.card }]}
        >
          <Text style={[styles.modalTitle, { color: themeColors.text }]}>
            📊 Thống kê sử dụng
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{statistics.totalNotes}</Text>
              <Text
                style={[styles.statLabel, { color: themeColors.textSecondary }]}
              >
                Tổng ghi chú
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.success }]}>
                {statistics.completedNotes}
              </Text>
              <Text
                style={[styles.statLabel, { color: themeColors.textSecondary }]}
              >
                Hoàn thành
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.warning }]}>
                {statistics.pendingNotes}
              </Text>
              <Text
                style={[styles.statLabel, { color: themeColors.textSecondary }]}
              >
                Đang chờ
              </Text>
            </View>
          </View>

          <View style={styles.categoriesContainer}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Theo danh mục
            </Text>
            {Object.entries(statistics.notesByCategory).map(
              ([category, count]) => (
                <View key={category} style={styles.categoryRow}>
                  <Text
                    style={[styles.categoryName, { color: themeColors.text }]}
                  >
                    {getCategoryEmoji(category)} {getCategoryName(category)}
                  </Text>
                  <Text
                    style={[
                      styles.categoryCount,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )
            )}
          </View>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: Colors.primary }]}
            onPress={() => setShowStats(false)}
          >
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Render About Modal
  const renderAboutModal = () => (
    <Modal
      visible={showAbout}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAbout(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: themeColors.card }]}
        >
          <Text style={[styles.modalTitle, { color: themeColors.text }]}>
            ℹ️ Về SmartNotes+
          </Text>

          <View style={styles.aboutContainer}>
            <Text style={[styles.appName, { color: themeColors.text }]}>
              SmartNotes+
            </Text>
            <Text
              style={[styles.version, { color: themeColors.textSecondary }]}
            >
              Version 1.1.0
            </Text>

            <Text style={[styles.description, { color: themeColors.text }]}>
              Ứng dụng ghi chú thông minh với tính năng nhắc nhở, hỗ trợ ảnh,
              bản đồ và đồng bộ cloud.
            </Text>

            <View style={styles.featuresList}>
              <Text style={[styles.featureItem, { color: themeColors.text }]}>
                ✅ CRUD Notes
              </Text>
              <Text style={[styles.featureItem, { color: themeColors.text }]}>
                📷 Camera & Photos
              </Text>
              <Text style={[styles.featureItem, { color: themeColors.text }]}>
                🗺️ Google Maps
              </Text>
              <Text style={[styles.featureItem, { color: themeColors.text }]}>
                ⏰ Smart Notifications
              </Text>
              <Text style={[styles.featureItem, { color: themeColors.text }]}>
                📴 Offline Support
              </Text>
              <Text style={[styles.featureItem, { color: themeColors.text }]}>
                ☁️ Cloud Sync
              </Text>
            </View>

            <Text style={[styles.footer, { color: themeColors.textSecondary }]}>
              Made with ❤️ by Team SmartNotes+
            </Text>
            <Text style={[styles.footer, { color: themeColors.textSecondary }]}>
              © 2025 UIT - Đồ án môn học
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: Colors.primary }]}
            onPress={() => setShowAbout(false)}
          >
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const getCategoryEmoji = (category) => {
    const emojis = {
      work: '💼',
      personal: '👤',
      shopping: '🛒',
      health: '❤️',
      other: '📝',
    };
    return emojis[category] || '📝';
  };

  const getCategoryName = (category) => {
    const names = {
      work: 'Công việc',
      personal: 'Cá nhân',
      shopping: 'Mua sắm',
      health: 'Sức khỏe',
      other: 'Khác',
    };
    return names[category] || category;
  };

  // Guest Mode - Not logged in
  if (!isLoggedIn || !user) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View
          style={[styles.profileCard, { backgroundColor: themeColors.card }]}
        >
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={[styles.name, { color: themeColors.text }]}>
            Chế độ khách
          </Text>
          <Text style={[styles.email, { color: themeColors.textSecondary }]}>
            Đăng nhập để đồng bộ dữ liệu
          </Text>
        </View>

        <View
          style={[styles.menuContainer, { backgroundColor: themeColors.card }]}
        >
          <TouchableOpacity
            style={[styles.menuItem, styles.loginButton]}
            onPress={handleLogin}
            testID="login-button"
          >
            <Text style={[styles.menuText, styles.loginText]}>
              🔐 Đăng nhập / Đăng ký
            </Text>
          </TouchableOpacity>

          <View style={[styles.menuItem, styles.settingRow]}>
            <Text style={[styles.menuText, { color: themeColors.text }]}>
              🌙 Chế độ tối
            </Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              testID="dark-mode-switch"
            />
          </View>

          <View style={[styles.menuItem, styles.settingRow]}>
            <Text style={[styles.menuText, { color: themeColors.text }]}>
              🔔 Thông báo
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              testID="notification-switch"
            />
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowStats(true)}
            testID="stats-button"
          >
            <Text style={[styles.menuText, { color: themeColors.text }]}>
              📊 Thống kê
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowAbout(true)}
            testID="about-button"
          >
            <Text style={[styles.menuText, { color: themeColors.text }]}>
              ℹ️ Về ứng dụng
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Bạn đang sử dụng chế độ khách. Dữ liệu chỉ lưu trên thiết bị này.
          </Text>
          <Text style={styles.infoText}>
            Đăng nhập để đồng bộ dữ liệu lên cloud.
          </Text>
        </View>

        {renderStatsModal()}
        {renderAboutModal()}
      </ScrollView>
    );
  }

  // Logged In Mode
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={[styles.profileCard, { backgroundColor: themeColors.card }]}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.fullname?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}

        <Text style={[styles.name, { color: themeColors.text }]}>
          {user?.fullname || 'User'}
        </Text>
        <Text style={[styles.email, { color: themeColors.textSecondary }]}>
          {user?.email || ''}
        </Text>
      </View>

      <View
        style={[styles.menuContainer, { backgroundColor: themeColors.card }]}
      >
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('EditProfile')}
          testID="edit-profile-button"
        >
          <Text style={[styles.menuText, { color: themeColors.text }]}>
            📝 Chỉnh sửa hồ sơ
          </Text>
        </TouchableOpacity>

        <View style={[styles.menuItem, styles.settingRow]}>
          <Text style={[styles.menuText, { color: themeColors.text }]}>
            🔔 Thông báo
          </Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            testID="notification-switch"
          />
        </View>

        <View style={[styles.menuItem, styles.settingRow]}>
          <Text style={[styles.menuText, { color: themeColors.text }]}>
            🌙 Chế độ tối
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            testID="dark-mode-switch"
          />
        </View>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowStats(true)}
          testID="stats-button"
        >
          <Text style={[styles.menuText, { color: themeColors.text }]}>
            📊 Thống kê
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowAbout(true)}
          testID="about-button"
        >
          <Text style={[styles.menuText, { color: themeColors.text }]}>
            ℹ️ Về ứng dụng
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutItem]}
          onPress={handleLogout}
          testID="logout-button"
        >
          <Text style={[styles.menuText, styles.logoutText]}>🚪 Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {renderStatsModal()}
      {renderAboutModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.md,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: FontSizes.xxl,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  name: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: FontSizes.md,
  },
  menuContainer: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  menuItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuText: {
    fontSize: FontSizes.md,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: Colors.error,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  loginText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: Spacing.md,
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  // Stats Modal
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  categoriesContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  categoryName: {
    fontSize: FontSizes.md,
  },
  categoryCount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  // About Modal
  aboutContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  version: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  featuresList: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  featureItem: {
    fontSize: FontSizes.md,
    paddingVertical: Spacing.xs,
  },
  footer: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  closeButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});

export default ProfileScreen;
