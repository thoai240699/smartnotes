// MapPicker.js - Component chọn vị trí trên bản đồ
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';
import { DEFAULT_REGION } from '../utils/mapHelper';

const INITIAL_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const MapPicker = ({ initialLocation, onLocationSelect, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const mapRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);

  const [region, setRegion] = useState(
    initialLocation
      ? { ...initialLocation, ...INITIAL_DELTA }
      : { ...DEFAULT_REGION, ...INITIAL_DELTA } // Dùng DEFAULT_REGION từ utils/mapHelper
  );

  const [showInfoBox, setShowInfoBox] = useState(true);

  useEffect(() => { // Lấy vị trí hiện tại nếu không có vị trí ban đầu
    if (!isInitialized && !initialLocation) {
      (async () => {
        setLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          try {
            let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
            const newLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };

            setRegion({
              ...newLocation,
              ...INITIAL_DELTA
            });

            //setSelectedLocation(newLocation);
            //onLocationSelect(newLocation);

          } catch (error) {
            console.error('Error fetching current location:', error);
          }
        } else {
          Alert.alert('Không thể lấy vị trí hiện tại', 'Vui lòng cấp quyền truy cập vị trí');
          setRegion({ ...DEFAULT_REGION, ...INITIAL_DELTA });
        }
        setLoading(false);
        setIsInitialized(true);
      })();
    } else if (initialLocation) {
        setIsInitialized(true); 
    }
  }, [initialLocation]);

  // --- LOGIC CHỌN VÀ CẬP NHẬT VỊ TRÍ ---
  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newLocation = { latitude, longitude };

    // Cập nhật Marker và gửi tọa độ cho màn hình cha
    setSelectedLocation(newLocation);
    onLocationSelect(newLocation);

    // Di chuyển bản đồ đến vị trí vừa chọn
    mapRef.current?.animateToRegion({
      ...newLocation,
      ...INITIAL_DELTA
    }, 300);
    setShowInfoBox(true);
  };

  const fetchCurrentLocation = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần cấp quyền vị trí để sử dụng tính năng này.');
      setLoading(false);
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Cập nhật tất cả state
      setSelectedLocation(newLocation);
      onLocationSelect(newLocation);

      // Di chuyển bản đồ đến vị trí hiện tại
      mapRef.current?.animateToRegion({
        ...newLocation,
        ...INITIAL_DELTA
      }, 500);

    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại. Vui lòng kiểm tra GPS.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi Marker bị kéo thả
  const handleMarkerDragEnd = (event) => {
    handleMapPress(event);
  };

  // --- LOGIC XÓA VỊ TRÍ ---
  const removeLocation = () => {
    setSelectedLocation(null);
    onLocationSelect(null);
    setShowInfoBox(false);
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải vị trí...</Text>
        </View>
      )}

      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={handleMapPress}
          showsPointsOfInterest={false}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title="Vị trí đã chọn"
              pinColor={Colors.primary}
              draggable
              onDragEnd={handleMarkerDragEnd}
            />
          )}
        </MapView>

        {/* ✅ NÚT GPS */}
        <View style={styles.absoluteControls}>
          <TouchableOpacity
            style={styles.gpsButton}
            onPress={fetchCurrentLocation}
            disabled={loading}
          >
            <Ionicons name="locate-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>

          {selectedLocation && (
            <TouchableOpacity
              style={[styles.gpsButton, styles.deleteButton]}
              onPress={removeLocation} // Gọi hàm xóa data
              disabled={loading}
            >
              <Ionicons name="trash-outline" size={24} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {selectedLocation && showInfoBox ? (
        <View style={[styles.infoBox, { backgroundColor: themeColors.card }]}>
          <View style={styles.infoRow}>
            <Ionicons name="pin" size={16} color={Colors.primary} style={{ marginRight: Spacing.xs }} />
            <View>
              <Text style={[styles.infoText, { color: themeColors.text }]}>
                Vĩ độ: {selectedLocation.latitude.toFixed(6)}
              </Text>
              <Text style={[styles.infoText, { color: themeColors.text }]}>
                Kinh độ: {selectedLocation.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowInfoBox(false)} style={styles.removeButton}>
            <Ionicons name="close-circle" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.hintBox, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.hintText, { color: themeColors.textSecondary }]}>
            Chạm vào bản đồ để chọn vị trí ghi chú hoặc sử dụng nút GPS.
          </Text>
        </View>
      )}
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  absoluteControls: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 20,
  },
  gpsButton: {
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    zIndex: 20,
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    shadowColor: '#000',
    elevation: 2,
    marginTop: Spacing.sm,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  infoBox: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
