// MapPicker.js - Component chọn vị trí trên bản đồ
import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../styles/globalStyles';
import { DEFAULT_REGION } from '../utils/mapHelper';

const MapPicker = ({ initialLocation, onLocationSelect, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || DEFAULT_REGION
  );

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newLocation = { latitude, longitude };
    setSelectedLocation(newLocation);
    onLocationSelect && onLocationSelect(newLocation);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          ...selectedLocation,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={handleMapPress}
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title="Vị trí đã chọn"
            pinColor={Colors.primary}
          />
        )}
      </MapView>

      {selectedLocation && (
        <View style={[styles.infoBox, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.infoText, { color: themeColors.text }]}>
            Vĩ độ: {selectedLocation.latitude.toFixed(6)}
          </Text>
          <Text style={[styles.infoText, { color: themeColors.text }]}>
            Kinh độ: {selectedLocation.longitude.toFixed(6)}
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
  },
  map: {
    flex: 1,
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
  },
  infoText: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
});

export default MapPicker;
