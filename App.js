// App.js - Main Application Entry Point
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { store } from './src/redux/store';
import { initDatabase } from './src/db/database';
import { configureNotificationHandler } from './src/utils/notificationHelper';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddNoteScreen from './src/screens/AddNoteScreen';
import EditNoteScreen from './src/screens/EditNoteScreen';
import NoteDetailScreen from './src/screens/NoteDetailScreen';
import SearchScreen from './src/screens/SearchScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import OfflineSyncScreen from './src/screens/OfflineSyncScreen';
import ForgotEmailScreen from './src/screens/ForgotEmailScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import VerifyCodeScreen from './src/screens/VerifyCodeScreen';

import { Colors } from './src/styles/globalStyles';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// Bottom Tab Navigator
function MainTabs() {
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: themeColors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          paddingBottom: insets.bottom + 5,
          paddingTop: 5,
          height: 55 + insets.bottom,
          backgroundColor: themeColors.card,
          borderTopColor: themeColors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        }
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Ghi chú',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Tìm kiếm',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="NotificationTab"
        component={NotificationScreen}
        options={{
          tabBarLabel: 'Thông báo',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Stack Navigator
function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddNote"
        component={AddNoteScreen}
        options={{ title: 'Thêm ghi chú' }}
      />
      <Stack.Screen
        name="EditNote"
        component={EditNoteScreen}
        options={{ title: 'Chỉnh sửa ghi chú' }}
      />
      <Stack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{ title: 'Chi tiết ghi chú' }}
      />
      <Stack.Screen
        name="OfflineSync"
        component={OfflineSyncScreen}
        options={{ title: 'Đồng bộ dữ liệu' }}
      />

      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Chỉnh sửa hồ sơ' }}
      />

      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ForgotEmail"
        component={ForgotEmailScreen}
        options={{ title: 'Quên Mật Khẩu' }}
      />
      <Stack.Screen
        name="VerifyCode"
        component={VerifyCodeScreen}
        options={{ title: 'Xác thực Mã' }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ title: 'Tạo Mật Khẩu Mới' }}
      />
    </Stack.Navigator>
  );
}

// Root Navigator - Always start with Main (no login required)
function RootNavigator() {
  //const isSplashLoading = useSelector((state) => state.app.isLoading);
  const dispatch = useDispatch();
  const [navigationRef, setNavigationRef] = useState(null);

  useEffect(() => {
    // Initialize app
    const initApp = async () => {
      try {
        // Initialize SQLite database
        await initDatabase();

        // Configure notifications with navigation handlers
        configureNotificationHandler(
          // onNotificationReceived
          (notification) => {
            console.log(
              'App received notification:',
              notification.request.content.title
            );
          },
          // onNotificationTapped
          (data) => {
            console.log('App notification tapped with data:', data);
            handleNotificationTap(data);
          }
        );

        // Check saved authentication from AsyncStorage
        //   const savedUser = await AsyncStorage.getItem('currentUser');
        //   if (savedUser) {
        //     // TODO: dispatch(setUser(JSON.parse(savedUser)));
        //     console.log('Found saved user:', savedUser);
        //   }

        //   setIsLoading(false);
      } catch (error) {
        console.log('Error initializing app:', error);
        // setIsLoading(false);
      }
    };

    initApp();
  }, [dispatch]);

  // Handle notification tap navigation
  const handleNotificationTap = (data) => {
    if (!navigationRef) return;

    try {
      if (data.type === 'note_reminder' && data.noteId) {
        // Navigate to the specific note
        navigationRef.navigate('MainApp', {
          screen: 'Main',
          params: {
            screen: 'HomeTab',
          },
        });

        // Then navigate to note detail after a short delay
        setTimeout(() => {
          navigationRef.navigate('NoteDetail', { noteId: data.noteId });
        }, 500);
      }
    } catch (error) {
      console.log('Error handling notification tap:', error);
    }
  };

  // if (isLoading) {
  //   return <SplashScreen />;
  // }

  // Always start with AppStack (Main tabs), now alway start with SplashScreen
  // Login/Register accessible from Profile tab
  return (
    <NavigationContainer ref={setNavigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="MainApp" component={AppStack} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// Main App Component with Redux Provider
export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </Provider>
  );
}
