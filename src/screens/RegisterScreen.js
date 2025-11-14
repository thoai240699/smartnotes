// RegisterScreen.js - Màn hình đăng ký
// TODO: Person A - Implement registration UI and logic

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
//import { Colors, Spacing, FontSizes } from '../styles/globalStyles';
import { useDispatch, useSelector } from 'react-redux';
import { registerAsync } from '../redux/userSlice';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const RegisterScreen = ({ navigation }) => {
  // TODO: Implement registration form
  // - Full name input
  // - Email input
  // - Password input
  // - Confirm password input
  // - Avatar picker (optional)
  // - Register button
  // - Navigate to Login after success

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.user);
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);

  const pickImage = async () => {
    // Yêu cầu quyền truy cập thư viện ảnh
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập bị từ chối', 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn avatar.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
      allowsEditing: true, // Cho phép chỉnh sửa (crop)
      aspect: [1, 1], // Tỷ lệ vuông (avatar)
      quality: 0.7, // Giảm chất lượng ảnh để tối ưu performance (70%)
    });

    if (!result.canceled) {
      // Lưu URI của ảnh đã chọn
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!fullname || !email || !password || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Lỗi', 'Định dạng email không hợp lệ.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      const userData = {
        fullname,
        email,
        password,
        avatar: avatarUri || 'https://i.pravatar.cc/150?img=50',
      };
      await dispatch(registerAsync(userData)).unwrap();
      Alert.alert('Thành công', 'Đăng ký thành công.');
      navigation.goBack();
    }
    catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Đăng ký thất bại. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    }
  };

  return (
    <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Tạo Tài Khoản</Text>
        <Text style={styles.subtitle}>Bắt đầu đồng bộ ghi chú đám mây.</Text>

        {/* Input: Họ và Tên */}
        <TextInput
          style={styles.input}
          placeholder="Họ và Tên"
          value={fullname}
          onChangeText={setFullname}
        />

        {/* Input: Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Input: Mật khẩu */}
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu (ít nhất 6 ký tự)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Input: Xác nhận Mật khẩu */}
        <TextInput
          style={styles.input}
          placeholder="Xác nhận Mật khẩu"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        
        {/* Nút Đăng ký */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Đăng ký</Text>
          )}
        </TouchableOpacity>

        {/* Quay lại Đăng nhập */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>
            Đã có tài khoản? <Text style={styles.linkTextBold}>Đăng nhập</Text>
          </Text>
        </TouchableOpacity>
        
        {/* Quay lại Guest Mode */}
        <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.goBack()}
        >
            <Text style={styles.skipText}>
                <MaterialCommunityIcons name="arrow-left" size={FontSizes.md} color={Colors.primary} />
                {' Quay lại (Guest Mode)'}
            </Text>
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
    linkText: {
        textAlign: 'center',
        marginTop: Spacing.lg,
        color: Colors.light.textSecondary,
        fontSize: FontSizes.md,
    },
    linkTextBold: {
        color: Colors.primary,
        fontWeight: '600',
    },
    skipButton: {
        marginTop: Spacing.xl,
        padding: Spacing.md,
        alignItems: 'center',
    },
    skipText: {
        color: Colors.primary,
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
});

export default RegisterScreen;
