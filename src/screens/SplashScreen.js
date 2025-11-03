// SplashScreen.js - Màn hình khởi động
// TODO: Person A - Create splash screen with logo animation

import React, { useEffect, useRef } from 'react'; 
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loadSessionAsync } from '../redux/userSlice';
import { Colors, FontSizes } from '../styles/globalStyles';

const SplashScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.user.loading);
  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;


  useEffect(() => {
    
    Animated.parallel([
      // Fade In
      Animated.timing(fadeAnim, {
        toValue: 1, 
        duration: 1000, 
        useNativeDriver: true,
      }),
      // Slide Up
      Animated.timing(translateYAnim, {
        toValue: 0, 
        duration: 1200, 
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateYAnim]);


  useEffect(() => {
    dispatch(loadSessionAsync())
      .unwrap()
      .then(() => {})
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    const minDelay = new Promise(resolve => setTimeout(resolve, 2000));

    if (!loading) {
      minDelay.then(() => {
        navigation.replace('MainApp');
      });
    }
  }, [loading, isLoggedIn, navigation]);


  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim, 
          transform: [{ translateY: translateYAnim }], 
          alignItems: 'center',
          marginBottom: 40, 
        }}
      >
        <Text style={styles.logo}>📝</Text>
        <Text style={styles.title}>SmartNotes+</Text>
        <Text style={styles.subtitle}>Ghi chú thông minh</Text>
      </Animated.View>

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
    position: 'absolute',
    bottom: 50,
  },
});

export default SplashScreen;
