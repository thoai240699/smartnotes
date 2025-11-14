// ResetPasswordScreen.js - Màn hình tạo mật khẩu mới

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/globalStyles';
import { resetPasswordAsync } from '../redux/userSlice'; 

// --- MÀN HÌNH ---
const ResetPasswordScreen = ({ navigation, route }) => {
  const { userId } = route.params; 
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.user.loading);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleResetPassword = async () => {
    // 1. Validation
    if (!newPassword || !confirmNewPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mật khẩu mới.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      await dispatch(resetPasswordAsync({ userId, newPassword })).unwrap();
      Alert.alert(
        'Thành công', 
        'Mật khẩu mới đã được cập nhật!', 
        [
          { 
            text: 'Quay lại Đăng nhập', 
            onPress: () => {
              navigation.replace('Login'); 
            } 
          },
        ]
      );

    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Tạo mật khẩu thất bại.';
      Alert.alert('Lỗi', errorMessage);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Tạo Mật Khẩu Mới</Text>
        <Text style={styles.subtitle}>Nhập mật khẩu mới cho tài khoản {userId}.</Text>

        <TextInput
          style={styles.input}
          placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Xác nhận mật khẩu mới"
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Hoàn thành</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  container: {
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
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
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;