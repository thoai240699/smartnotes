// EditProfileScreen.js - Màn hình chỉnh sửa hồ sơ
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfileAsync, updatePasswordAsync } from '../redux/userSlice'; // Sẽ tạo trong bước 4
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';

const EditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.user);

  // States cho thông tin hồ sơ
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [email, setEmail] = useState(user?.email || ''); // Thường không cho sửa email, nhưng để đây cho MockAPI
  const [avatarUri, setAvatarUri] = useState(user?.avatar || null);

  // States cho đổi mật khẩu
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPasswordChanging, setIsPasswordChanging] = useState(false); // Flag để hiện form đổi mật khẩu

  // --- LOGIC CHỌN AVATAR ---
  const pickImage = async () => {
    // Logic chọn ảnh tương tự RegisterScreen
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Quyền truy cập bị từ chối', 'Ứng dụng cần quyền truy cập thư viện ảnh.');
        return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.Images],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
    });
    if (!result.canceled) {
        setAvatarUri(result.assets[0].uri);
    }
  };

  // --- LOGIC CẬP NHẬT HỒ SƠ ---
  const handleUpdateProfile = async () => {
    if (!fullname || !email) {
      Alert.alert('Lỗi', 'Họ tên và Email không được để trống.');
      return;
    }
    
    // Tạo payload chỉ gồm các trường cần thay đổi
    const payload = {
      id: user.id,
      fullname,
      email,
      avatar: avatarUri,
    };

    try {
      await dispatch(updateProfileAsync(payload)).unwrap();
      Alert.alert('Thành công', 'Cập nhật hồ sơ thành công!');
      // navigation.goBack(); // Có thể quay lại hoặc giữ lại
    } catch (err) {
      Alert.alert('Lỗi Cập nhật', typeof err === 'string' ? err : 'Cập nhật hồ sơ thất bại.');
    }
  };

  // --- LOGIC ĐỔI MẬT KHẨU ---
  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mật khẩu.');
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

    // Mật khẩu mới không được giống mật khẩu cũ (tùy chọn)
    // if (newPassword === oldPassword) {
    //   Alert.alert('Lỗi', 'Mật khẩu mới phải khác mật khẩu cũ.');
    //   return;
    // }

    const payload = {
      id: user.id,
      oldPassword,
      newPassword,
    };

    try {
      await dispatch(updatePasswordAsync(payload)).unwrap();
      Alert.alert('Thành công', 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      // Xóa hết trạng thái mật khẩu cũ
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setIsPasswordChanging(false); // Đóng form đổi mật khẩu
      dispatch(logout()); // Đăng xuất để yêu cầu đăng nhập lại với mật khẩu mới
    } catch (err) {
      Alert.alert('Lỗi Đổi mật khẩu', typeof err === 'string' ? err : 'Đổi mật khẩu thất bại.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarPlaceholder}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <Ionicons name="camera" size={40} color="#FFFFFF" />
          )}
          <View style={styles.cameraIconContainer}>
            <Ionicons name="create" size={18} color={Colors.primary} />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{user?.fullname}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
        <TextInput
          style={styles.input}
          placeholder="Họ và Tên"
          value={fullname}
          onChangeText={setFullname}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={false} // Thường không cho sửa Email
          
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Lưu Thay Đổi</Text>
          )}
        </TouchableOpacity>

        {/* --- ĐỔI MẬT KHẨU --- */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          Quản lý bảo mật
        </Text>
        
        {!isPasswordChanging ? (
          <TouchableOpacity
            style={[styles.linkButton]}
            onPress={() => setIsPasswordChanging(true)}
          >
            <Text style={styles.linkText}>Đổi mật khẩu</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.passwordForm}>
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu cũ"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
            />
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
              style={[styles.button, { backgroundColor: Colors.warning }]}
              onPress={handleUpdatePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Xác nhận Đổi Mật Khẩu</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsPasswordChanging(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
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
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
  formContainer: {
    padding: Spacing.xl,
    backgroundColor: '#FFFFFF',
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
    color: Colors.primary,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: Colors.light.secondary,
    color: Colors.light.textSecondary,
  },
  button: {
    backgroundColor: Colors.success,
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
  linkButton: {
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
  passwordForm: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
  },
  cancelButton: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.light.textSecondary,
    fontSize: FontSizes.sm,
  },
});

export default EditProfileScreen;