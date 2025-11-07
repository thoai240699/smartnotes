// ForgotEmailScreen.js - Màn hình nhập email để lấy lại mật khẩu

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
import { findUserByEmailAsync } from '../redux/userSlice'; 

// tạo mã OTP ngẫu nhiên từ 6 chữ số
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const ForgotEmailScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.user.loading);
  
  const [email, setEmail] = useState('');

  const handleFindEmail = async () => {
    
    if (!email) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email.');
      return;
    }
    
    // kiểm tra định dạng email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
        Alert.alert('Lỗi', 'Email không đúng định dạng.');
        return;
    }

    try {
      
      const foundUser = await dispatch(findUserByEmailAsync(email)).unwrap();
      const verificationCode = generateVerificationCode();
      
      // Mô phỏng thông báo
      Alert.alert(
          'Mã xác thực đã gửi', 
          `Mã xác thực (MOCK CODE: ${verificationCode}) đã được gửi đến email ${email}. Vui lòng nhập mã để tiếp tục.`,
          [
              { text: 'OK', onPress: () => {
                  navigation.navigate('VerifyCode', {
                      email: email,
                      userId: foundUser.id,
                      verificationCode: verificationCode, 
                  });
              }}
          ]
      );

    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Email không tồn tại hoặc lỗi hệ thống.';
      Alert.alert('Lỗi tìm kiếm', errorMessage);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Quên Mật Khẩu?</Text>
        <Text style={styles.subtitle}>
          Vui lòng nhập email đã đăng ký. Chúng tôi sẽ gửi mã xác thực.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nhập Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleFindEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Tiếp Tục</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
            <Text style={styles.backButtonText}>Quay lại Đăng nhập</Text>
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
  backButton: {
    marginTop: Spacing.xl,
    padding: Spacing.sm,
  },
  backButtonText: {
    textAlign: 'center',
    color: Colors.primary,
    fontSize: FontSizes.md,
  },
});

export default ForgotEmailScreen;