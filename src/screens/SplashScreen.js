// SplashScreen.js - Màn hình khởi động
// TODO: Person A - Create splash screen with logo animation

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, FontSizes } from '../styles/globalStyles';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    // TODO: Check authentication status
    // TODO: Navigate to Login or Home after 2 seconds
    setTimeout(() => {
      // navigation.replace('Login');
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>📝</Text>
      <Text style={styles.title}>SmartNotes+</Text>
      <Text style={styles.subtitle}>Ghi chú thông minh</Text>
      <ActivityIndicator
        size="large"
        color={Colors.primary}
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  loader: {
    marginTop: 40,
  },
});

export default SplashScreen;
