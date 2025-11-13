// MapPicker.js - Component chọn vị trí (Mock version - không dùng Maps)
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';

const INITIAL_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const MapPicker = ({ initialLocation, onLocationSelect, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || null
  );
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);

      // Xin quyền truy cập vị trí
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Không có quyền truy cập',
          'Vui lòng cho phép ứng dụng truy cập vị trí của bạn.'
        );
        return;
      }

      // Lấy vị trí hiện tại
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setSelectedLocation(newLocation);
      onLocationSelect && onLocationSelect(newLocation);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.mockMap, { backgroundColor: themeColors.card }]}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          📍 Chọn vị trí
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: Colors.primary }]}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Đang lấy vị trí...' : 'Lấy vị trí hiện tại'}
          </Text>
        </TouchableOpacity>

        {selectedLocation && (
          <View
            style={[
              styles.infoBox,
              { backgroundColor: themeColors.backgroundSecondary },
            ]}
          >
            <Text
              style={[styles.infoLabel, { color: themeColors.textSecondary }]}
            >
              Vị trí đã chọn:
            </Text>
            <Text style={[styles.infoText, { color: themeColors.text }]}>
              📍 Vĩ độ: {selectedLocation.latitude.toFixed(6)}
            </Text>
            <Text style={[styles.infoText, { color: themeColors.text }]}>
              📍 Kinh độ: {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  mapWrapper: {
    flex: 1,
    height: 250,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  mockMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
  },
  button: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  infoBox: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  infoLabel: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  infoText: {
    fontSize: FontSizes.sm,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  hintBox: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    shadowColor: '#000',
    elevation: 5,
  },
  hintText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  }
});

export default MapPicker;
