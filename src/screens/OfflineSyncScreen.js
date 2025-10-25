// OfflineSyncScreen.js - Màn hình đồng bộ offline
// TODO: Person C (Advanced) - Implement offline sync management

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes } from '../styles/globalStyles';

const OfflineSyncScreen = ({ navigation }) => {
  // TODO: Show sync status
  // TODO: Display unsync notes from SQLite
  // TODO: Manual sync button
  // TODO: Conflict resolution

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đồng bộ dữ liệu</Text>
      <Text style={styles.subtitle}>
        TODO: Implement offline sync management
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
  },
});

export default OfflineSyncScreen;
