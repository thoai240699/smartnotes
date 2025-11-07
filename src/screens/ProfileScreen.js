// ProfileScreen.js - Màn hình thông tin người dùng
// TODO: Person C - Display user profile and logout

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, isLoggedIn } = useSelector((state) => state.user);
  //console.log("ProfileScreen: IsLoggedIn=", isLoggedIn, "User:", user);

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

  // Guest Mode - Not logged in
  if (!isLoggedIn || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.name}>Chế độ khách</Text>
          <Text style={styles.email}>Đăng nhập để đồng bộ dữ liệu</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuItem, styles.loginButton]}
            onPress={handleLogin}
          >
            <Text style={[styles.menuText, styles.loginText]}>
              🔐 Đăng nhập / Đăng ký
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>🌙 Chế độ tối</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>📊 Thống kê</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>ℹ️ Về ứng dụng</Text>
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
      </SafeAreaView>
    );
  }

  // Logged In Mode
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileCard}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.fullname?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}

        <Text style={styles.name}>{user?.fullname || 'User'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.menuText}>📝 Chỉnh sửa hồ sơ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} >
          <Text style={styles.menuText}>🔔 Thông báo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>🌙 Chế độ tối</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>📊 Thống kê</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <Text style={[styles.menuText, styles.logoutText]}>🚪 Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
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
    color: Colors.light.textSecondary,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.sm,
  },
  menuItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
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
});

export default ProfileScreen;
