// RegisterScreen.js - Màn hình đăng ký
// TODO: Person A - Implement registration UI and logic

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes } from '../styles/globalStyles';

const RegisterScreen = ({ navigation }) => {
  // TODO: Implement registration form
  // - Full name input
  // - Email input
  // - Password input
  // - Confirm password input
  // - Avatar picker (optional)
  // - Register button
  // - Navigate to Login after success

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng ký tài khoản</Text>
      <Text style={styles.subtitle}>TODO: Implement registration form</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});

export default RegisterScreen;
