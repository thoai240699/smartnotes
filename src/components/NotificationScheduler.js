// NotificationScheduler.js - Component quản lý thông báo
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  enabled = true,
  onEnabledChange,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const [date, setDate] = useState(
    initialDate ? new Date(initialDate) : new Date()
  );
  const [showPicker, setShowPicker] = useState(false);
  const [isEnabled, setIsEnabled] = useState(enabled);

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      setDate(selectedDate);
      onDateSelect && onDateSelect(selectedDate.toISOString());
    }
  };

  const toggleEnabled = (value) => {
    setIsEnabled(value);
    onEnabledChange && onEnabledChange(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          Nhắc nhở
        </Text>
        <Switch
          value={isEnabled}
          onValueChange={toggleEnabled}
          trackColor={{ false: themeColors.border, true: Colors.primary }}
          thumbColor={
            isEnabled ? Colors.primaryLight : themeColors.textSecondary
          }
        />
      </View>

      {isEnabled && (
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
              📅 {formatDateTime(date)}
            </Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  dateButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  dateText: {
    fontSize: FontSizes.md,
  },
});

export default NotificationScheduler;
