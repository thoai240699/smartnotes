// NotificationScreen.js - Màn hình quản lý thông báo
// TODO: Person C - Display and manage scheduled notifications

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes } from '../styles/globalStyles';

const NotificationScreen = ({ navigation }) => {
  // TODO: List all scheduled notifications
  // TODO: Show notification details
  // TODO: Cancel notification button
  // TODO: Navigate to related note

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý thông báo</Text>
      <Text style={styles.subtitle}>
        TODO: Implement notification management
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

export default NotificationScreen;
