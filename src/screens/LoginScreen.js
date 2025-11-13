// LoginScreen.js - Màn hình đăng nhập
// TODO: Person A - Implement login UI and logic

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginAsync } from '../redux/userSlice';
import { useTheme } from '../contexts/ThemeContext';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.user);
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      // Gọi action để đăng nhập
      await dispatch(loginAsync({ email, password })).unwrap();
      // Đăng nhập thành công, quay lại màn hình trước đó
      navigation.replace('Main');
    } catch (err) {
      const errorMessage =
        typeof err === 'string' ? err : 'Đăng nhập thất bại. Vui lòng thử lại.';
      Alert.alert('Lỗi đăng nhập', errorMessage);
    }
  };

  const handleForgotPassword = () => {
      navigation.navigate('ForgotEmail');
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <Text style={styles.title}>SmartNotes+</Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        Đăng nhập để tiếp tục
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: themeColors.card,
            color: themeColors.text,
            borderColor: themeColors.border,
          },
        ]}
        placeholder="Email"
        placeholderTextColor={themeColors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: themeColors.card,
            color: themeColors.text,
            borderColor: themeColors.border,
          },
        ]}
        placeholder="Mật khẩu"
        placeholderTextColor={themeColors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={handleForgotPassword}
        style={styles.forgotPasswordButton}
      >
        <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Đăng nhập</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={[styles.linkText, { color: themeColors.textSecondary }]}>
          Chưa có tài khoản? <Text style={styles.linkTextBold}>Đăng ký</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.skipButton, { borderColor: Colors.primary }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.skipText}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
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
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
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
  linkText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: FontSizes.md,
  },
  linkTextBold: {
    color: Colors.primary,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  skipText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end', // Đẩy nút sang phải
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  forgotPasswordText: {
    color: Colors.light.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
});

export default LoginScreen;
