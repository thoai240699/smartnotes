// VerifyCodeScreen.js - Màn hình nhập mã xác thực
// Hiện tại đồ án chỉ đang giả lập OTP để để mô phỏng tính linh hoạt của OTP (mã xác thực)
// Sau này có thể dùng Cloud Functions + Email Service để gửi OTP đến email thật

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/globalStyles';


const VerifyCodeScreen = ({ navigation, route }) => {
  // Nhận tham số từ ForgotEmailScreen.js
  const { email, userId, verificationCode } = route.params; 
  
  const [code, setCode] = useState('');

  const handleVerifyCode = () => {
    if (code.length !== 6) {
      Alert.alert('Lỗi', 'Mã xác thực phải gồm 6 ký tự.');
      return;
    }

    // 2. Kiểm tra mã xác thực (Mô phỏng)
    if (code === verificationCode) {
      navigation.navigate('ResetPassword', {
        userId: userId, 
      });
    } else {
      Alert.alert('Lỗi', 'Mã xác thực không hợp lệ. Vui lòng kiểm tra lại.');
    }
  };

  const handleResendCode = () => {
    // Gửi lại mã xác thực (Mô phỏng)
      Alert.alert('Gửi lại mã', `Mã xác thực (MOCK CODE: ${verificationCode}) đã được gửi lại đến ${email}.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Xác Thực Email</Text>
        <Text style={styles.subtitle}>
          Vui lòng nhập mã xác thực 6 ký tự đã được gửi đến email: 
          <Text style={styles.emailText}> {email}</Text>
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Mã xác thực"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          textAlign={'center'}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleVerifyCode}
        >
          <Text style={styles.buttonText}>Tiếp Tục</Text>
        </TouchableOpacity>
        
        
        <TouchableOpacity
          onPress={handleResendCode}
          style={styles.resendButton}
        >
            <Text style={styles.resendText}>Không nhận được mã? Gửi lại</Text>
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
  emailText: {
    fontWeight: '600',
    color: Colors.primary,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    letterSpacing: 10, 
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
  resendButton: {
    marginTop: Spacing.xl,
    padding: Spacing.sm,
  },
  resendText: {
    textAlign: 'center',
    color: Colors.light.textSecondary,
    fontSize: FontSizes.sm,
  },
});

export default VerifyCodeScreen;