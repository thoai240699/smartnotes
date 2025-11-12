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

  useEffect(() => {
    if (initialDate) {
      setDate(new Date(initialDate));
    }
  }, [initialDate]);

  const handleDateChange = (event, selectedDate) => {
    // 1. Logic đóng picker (Android)
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      if (selectedDate <= new Date()) {
        Alert.alert('Lỗi', 'Thời gian nhắc nhở phải ở tương lai.');
        return;
      }

      setDate(selectedDate);
      onDateSelect(selectedDate.toISOString());
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

      {enabled && ( // Chỉ hiển thị khi được bật
        <>
          <TouchableOpacity
            style={[
              styles.dateButton,
              {
                backgroundColor: themeColors.backgroundSecondary,
                borderColor: themeColors.border,
              },
            ]}
            onPress={() => setShowPicker(true)}
          >
            <Text style={[styles.dateText, { color: themeColors.text }]}>
              <Ionicons name="calendar-outline" size={FontSizes.md} /> {displayDate}
            </Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()} // Ngày hiện tại trở đi
            />
          )}
        </>
      )}

      {/* Nút đóng Picker cho iOS */}
      {Platform.OS === 'ios' && enabled && showPicker && (
        <TouchableOpacity style={styles.closePickerButton} onPress={() => setShowPicker(false)}>
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
