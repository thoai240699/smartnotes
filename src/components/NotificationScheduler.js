// NotificationScheduler.js - Component quản lý thông báo
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';
import { formatDateTime } from '../utils/dateHelper';

const NotificationScheduler = ({
  initialDate,
  onDateSelect,
  enabled,
  onEnabledChange,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const [date, setDate] = useState(
    initialDate ? new Date(initialDate) : new Date(Date.now() + 60000) // Mặc định là 1 phút sau
  );
  const [showPicker, setShowPicker] = useState(false);
  const [showTimePickerForAndroid, setShowTimePickerForAndroid] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState(null);

  useEffect(() => {
    if (initialDate) {
      setDate(new Date(initialDate));
    }
  }, [initialDate]);

  // Hàm xử lý khi chọn ngày trên Android
  const handleDateChangeAndroid = (event, selectedDate) => {
    const { type } = event;

    if (type === 'set' && selectedDate) {
      if (selectedDate <= new Date()) {
        Alert.alert('Lỗi', 'Thời gian nhắc nhở phải ở tương lai.');
        setShowPicker(false); // Đóng picker ngày
        setShowTimePickerForAndroid(false); // Đảm bảo picker giờ cũng đóng
        return;
      }
      // Lưu ngày đã chọn vào temp và chuyển sang picker giờ
      setTempSelectedDate(selectedDate);
      setShowPicker(false); // Đóng picker ngày
      setShowTimePickerForAndroid(true); // Mở picker giờ
    } else {
      // Người dùng huỷ picker ngày
      setShowPicker(false);
    }
  };

  // Hàm xử lý khi chọn giờ trên Android sau khi đã chọn ngày
  const handleTimeChangeForAndroid = (event, selectedTime) => {
    const { type } = event;

    if (type === 'set' && selectedTime && tempSelectedDate) {
      // Ghép giờ đã chọn với ngày đã chọn trước đó
      const combinedDateTime = new Date(tempSelectedDate);
      combinedDateTime.setHours(selectedTime.getHours());
      combinedDateTime.setMinutes(selectedTime.getMinutes());

      if (combinedDateTime <= new Date()) {
        Alert.alert('Lỗi', 'Thời gian nhắc nhở phải ở tương lai.');
      } else {
        setDate(combinedDateTime);
        onDateSelect(combinedDateTime.toISOString());
      }
    }
    
    setShowPicker(false);
    setShowTimePickerForAndroid(false);
    setTempSelectedDate(null); // Reset temp date
  };

  
  const handleDateChangeIOS = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  
  const openPicker = () => {
    if (Platform.OS === 'android') {
      // Trên Android, mở picker ngày đầu tiên
      setShowTimePickerForAndroid(false); // Đảm bảo picker giờ không mở
    }
    setShowPicker(true);
  };

  
  const handleIOSConfirm = () => {
    setShowPicker(false);

    if (date <= new Date()) {
      Alert.alert('Lỗi', 'Thời gian nhắc nhở phải ở tương lai.');
      const futureDate = new Date(Date.now() + 60000);
      setDate(futureDate);
      onDateSelect(futureDate.toISOString());
    } else {
      onDateSelect(date.toISOString());
    }
  };

  const toggleEnabled = (value) => {
    onEnabledChange(value);

    if (!value) {
      onDateSelect(null);
    } else {
      if (date <= new Date()) {
        const futureDate = new Date(Date.now() + 60000); // 1 phút sau
        setDate(futureDate);
        onDateSelect(futureDate.toISOString());
      } else {
        onDateSelect(date.toISOString()); // Gửi lại ngày cũ nếu nó hợp lệ
      }
    }
  };

  const displayDate = enabled ? formatDateTime(date.toISOString()) : 'Chưa thiết lập';
  return (
    <View style={styles.container}>
      {/* --- BẬT/TẮT REMINDER --- */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="alarm-outline" size={24} color={themeColors.text} style={{ marginRight: Spacing.sm }} />
          <Text style={[styles.title, { color: themeColors.text }]}>
            Kích hoạt Nhắc nhở
          </Text>
        </View>

        <Switch
          value={enabled}
          onValueChange={toggleEnabled}
          trackColor={{ false: themeColors.border, true: Colors.success }}
          thumbColor={'#FFFFFF'}
        />
      </View>

      {enabled && ( 
        <>
          <TouchableOpacity
            style={[
              styles.dateButton,
              {
                backgroundColor: themeColors.backgroundSecondary,
                borderColor: themeColors.border,
              },
            ]}
            onPress={openPicker} 
          >
            <Text style={[styles.dateText, { color: themeColors.text }]}>
              <Ionicons name="calendar-outline" size={FontSizes.md} /> {displayDate}
            </Text>
          </TouchableOpacity>

          {/* Picker cho Android: Chia thành ngày và giờ */}
          {showPicker && Platform.OS === 'android' && !showTimePickerForAndroid && (
            <DateTimePicker
              value={date}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={handleDateChangeAndroid}
              minimumDate={new Date()}
              
            />
          )}
          {showTimePickerForAndroid && Platform.OS === 'android' && (
            <DateTimePicker
              value={tempSelectedDate || date} // Dùng ngày đã chọn, nếu chưa thì dùng ngày hiện tại
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleTimeChangeForAndroid}
            />
          )}

          {/* Picker cho iOS */}
          {showPicker && Platform.OS === 'ios' && (
            <DateTimePicker
              value={date}
              mode="datetime"
              is24Hour={true}
              display="spinner"
              onChange={handleDateChangeIOS}
              minimumDate={new Date()}
            />
          )}
        </>
      )}

      {/* Nút đóng Picker cho iOS */}
      {Platform.OS === 'ios' && enabled && showPicker && (
        <TouchableOpacity style={styles.closePickerButton} onPress={handleIOSConfirm}>
          <Text style={[styles.closePickerText, { color: Colors.primary }]}>Xong</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  dateButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  closePickerButton: {
    alignSelf: 'flex-end',
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  closePickerText: {
    fontWeight: 'bold',
    fontSize: FontSizes.md,
  }
});

export default NotificationScheduler;