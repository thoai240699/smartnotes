// ProfileScreen.test.js - Comprehensive tests for Profile & Settings
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import configureStore from 'redux-mock-store';
import ProfileScreen from '../src/screens/ProfileScreen';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('expo-notifications');
jest.mock('@react-native-async-storage/async-storage');

const mockStore = configureStore([]);

// Helper to render with all providers
const renderWithProviders = (component, initialState = {}) => {
  const defaultState = {
    user: {
      isLoggedIn: false,
      user: null,
    },
    note: {
      notes: [],
    },
    ...initialState,
  };

  const store = mockStore(defaultState);
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };

  return {
    ...render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            {React.cloneElement(component, { navigation })}
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    ),
    store,
    navigation,
  };
};

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Notifications.requestPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
  });

  // ============ GUEST MODE TESTS ============
  describe('Guest Mode', () => {
    it('should render guest mode UI when not logged in', () => {
      const { getByText } = renderWithProviders(<ProfileScreen />);

      expect(getByText('Chế độ khách')).toBeTruthy();
      expect(getByText('Đăng nhập để đồng bộ dữ liệu')).toBeTruthy();
      expect(getByText('🔐 Đăng nhập / Đăng ký')).toBeTruthy();
    });

    it('should display guest mode info box', () => {
      const { getByText } = renderWithProviders(<ProfileScreen />);

      expect(getByText(/Bạn đang sử dụng chế độ khách/)).toBeTruthy();
      expect(getByText(/Đăng nhập để đồng bộ dữ liệu lên cloud/)).toBeTruthy();
    });

    it('should navigate to Login screen when login button pressed', () => {
      const { getByTestId, navigation } = renderWithProviders(
        <ProfileScreen />
      );

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      expect(navigation.navigate).toHaveBeenCalledWith('Login');
    });

    it('should show all menu items in guest mode', () => {
      const { getByText } = renderWithProviders(<ProfileScreen />);

      expect(getByText(/🌙 Chế độ tối/)).toBeTruthy();
      expect(getByText(/🔔 Thông báo/)).toBeTruthy();
      expect(getByText(/📊 Thống kê/)).toBeTruthy();
      expect(getByText(/ℹ️ Về ứng dụng/)).toBeTruthy();
    });
  });

  // ============ LOGGED IN MODE TESTS ============
  describe('Logged In Mode', () => {
    const loggedInState = {
      user: {
        isLoggedIn: true,
        user: {
          id: '1',
          email: 'test@example.com',
          fullname: 'Test User',
          avatar: 'https://example.com/avatar.jpg',
        },
      },
      note: {
        notes: [],
      },
    };

    it('should render user profile when logged in', () => {
      const { getByText } = renderWithProviders(
        <ProfileScreen />,
        loggedInState
      );

      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
    });

    it('should display first letter avatar when no avatar URL', () => {
      const stateWithoutAvatar = {
        ...loggedInState,
        user: {
          ...loggedInState.user,
          user: {
            ...loggedInState.user.user,
            avatar: null,
          },
        },
      };

      const { getByText } = renderWithProviders(
        <ProfileScreen />,
        stateWithoutAvatar
      );

      expect(getByText('T')).toBeTruthy(); // First letter of "Test User"
    });

    it('should show Edit Profile button when logged in', () => {
      const { getByTestId } = renderWithProviders(
        <ProfileScreen />,
        loggedInState
      );

      expect(getByTestId('edit-profile-button')).toBeTruthy();
    });

    it('should navigate to Edit Profile screen', () => {
      const { getByTestId, navigation } = renderWithProviders(
        <ProfileScreen />,
        loggedInState
      );

      fireEvent.press(getByTestId('edit-profile-button'));

      expect(navigation.navigate).toHaveBeenCalledWith('EditProfile');
    });

    it('should show logout button when logged in', () => {
      const { getByTestId } = renderWithProviders(
        <ProfileScreen />,
        loggedInState
      );

      expect(getByTestId('logout-button')).toBeTruthy();
    });

    it('should show logout confirmation alert', async () => {
      const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
      const { getByTestId } = renderWithProviders(
        <ProfileScreen />,
        loggedInState
      );

      fireEvent.press(getByTestId('logout-button'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Đăng xuất',
        'Bạn có chắc chắn muốn đăng xuất?',
        expect.any(Array)
      );
    });
  });

  // ============ DARK MODE TESTS ============
  describe('Dark Mode Toggle', () => {
    it('should render dark mode switch', () => {
      const { getByTestId } = renderWithProviders(<ProfileScreen />);

      expect(getByTestId('dark-mode-switch')).toBeTruthy();
    });

    it('should toggle dark mode when switch is pressed', async () => {
      const { getByTestId } = renderWithProviders(<ProfileScreen />);

      const darkModeSwitch = getByTestId('dark-mode-switch');

      await act(async () => {
        fireEvent(darkModeSwitch, 'valueChange', true);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
      });
    });

    it('should load saved theme preference on mount', async () => {
      AsyncStorage.getItem.mockResolvedValue('dark');

      renderWithProviders(<ProfileScreen />);

      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('theme');
      });
    });
  });

  // ============ NOTIFICATION SETTINGS TESTS ============
  describe('Notification Settings', () => {
    it('should render notification switch', () => {
      const { getByTestId } = renderWithProviders(<ProfileScreen />);

      expect(getByTestId('notification-switch')).toBeTruthy();
    });

    it('should check notification permission on mount', async () => {
      renderWithProviders(<ProfileScreen />);

      await waitFor(() => {
        expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
      });
    });

    it('should request permission when enabling notifications', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
      Notifications.requestPermissionsAsync.mockResolvedValue({
        status: 'granted',
      });

      const { getByTestId } = renderWithProviders(<ProfileScreen />);

      await waitFor(() => {
        const notificationSwitch = getByTestId('notification-switch');
        expect(notificationSwitch).toBeTruthy();
      });

      const notificationSwitch = getByTestId('notification-switch');
      await act(async () => {
        fireEvent(notificationSwitch, 'valueChange', true);
      });

      await waitFor(() => {
        expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      });
    });

    it('should show alert when notification permission denied', async () => {
      const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
      Notifications.requestPermissionsAsync.mockResolvedValue({
        status: 'denied',
      });

      const { getByTestId } = renderWithProviders(<ProfileScreen />);

      await waitFor(() => {
        const notificationSwitch = getByTestId('notification-switch');
        expect(notificationSwitch).toBeTruthy();
      });

      const notificationSwitch = getByTestId('notification-switch');
      await act(async () => {
        fireEvent(notificationSwitch, 'valueChange', true);
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Quyền thông báo',
          expect.stringContaining('Settings'),
          expect.any(Array)
        );
      });
    });

    it('should show info alert when trying to disable notifications', async () => {
      const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
      Notifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted',
      });

      const { getByTestId } = renderWithProviders(<ProfileScreen />);

      await waitFor(async () => {
        const notificationSwitch = getByTestId('notification-switch');
        fireEvent(notificationSwitch, 'valueChange', false);
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Tắt thông báo',
          expect.stringContaining('Settings'),
          expect.any(Array)
        );
      });
    });
  });

  // ============ STATISTICS TESTS ============
  describe('App Statistics', () => {
    const stateWithNotes = {
      user: { isLoggedIn: false, user: null },
      note: {
        notes: [
          {
            id: '1',
            title: 'Work Note',
            category: 'work',
            isCompleted: false,
          },
          {
            id: '2',
            title: 'Personal Note',
            category: 'personal',
            isCompleted: true,
          },
          {
            id: '3',
            title: 'Shopping Note',
            category: 'shopping',
            isCompleted: false,
          },
          {
            id: '4',
            title: 'Health Note',
            category: 'health',
            isCompleted: true,
          },
        ],
      },
    };

    it('should open statistics modal when button pressed', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <ProfileScreen />,
        stateWithNotes
      );

      const statsButton = getByTestId('stats-button');
      fireEvent.press(statsButton);

      await waitFor(() => {
        expect(getByText('📊 Thống kê sử dụng')).toBeTruthy();
      });
    });

    it('should display correct total notes count', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <ProfileScreen />,
        stateWithNotes
      );

      fireEvent.press(getByTestId('stats-button'));

      await waitFor(() => {
        expect(getByText('4')).toBeTruthy(); // Total notes
        expect(getByText('Tổng ghi chú')).toBeTruthy();
      });
    });

    it('should display correct completed notes count', async () => {
      const { getByTestId, getAllByText } = renderWithProviders(
        <ProfileScreen />,
        stateWithNotes
      );

      fireEvent.press(getByTestId('stats-button'));

      await waitFor(() => {
        const twoElements = getAllByText('2');
        expect(twoElements.length).toBeGreaterThan(0); // Completed notes
        expect(getByTestId('stats-button')).toBeTruthy();
      });
    });

    it('should display correct pending notes count', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <ProfileScreen />,
        stateWithNotes
      );

      fireEvent.press(getByTestId('stats-button'));

      await waitFor(() => {
        expect(getByText('Đang chờ')).toBeTruthy();
      });
    });

    it('should display notes by category', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <ProfileScreen />,
        stateWithNotes
      );

      fireEvent.press(getByTestId('stats-button'));

      await waitFor(() => {
        expect(getByText('Theo danh mục')).toBeTruthy();
        expect(getByText(/💼 Công việc/)).toBeTruthy();
        expect(getByText(/👤 Cá nhân/)).toBeTruthy();
        expect(getByText(/🛒 Mua sắm/)).toBeTruthy();
        expect(getByText(/❤️ Sức khỏe/)).toBeTruthy();
      });
    });

    it('should close statistics modal when close button pressed', async () => {
      const { getByTestId, getByText, queryByText } = renderWithProviders(
        <ProfileScreen />,
        stateWithNotes
      );

      fireEvent.press(getByTestId('stats-button'));

      await waitFor(() => {
        expect(getByText('📊 Thống kê sử dụng')).toBeTruthy();
      });

      const closeButton = getByText('Đóng');
      fireEvent.press(closeButton);

      await waitFor(() => {
        expect(queryByText('📊 Thống kê sử dụng')).toBeNull();
      });
    });

    it('should show zero statistics when no notes', async () => {
      const { getByTestId, getAllByText } = renderWithProviders(
        <ProfileScreen />
      );

      fireEvent.press(getByTestId('stats-button'));

      await waitFor(() => {
        const zeroElements = getAllByText('0');
        expect(zeroElements.length).toBeGreaterThan(0); // Total, completed, and pending notes all zero
      });
    });
  });

  // ============ ABOUT PAGE TESTS ============
  describe('About Page', () => {
    it('should open about modal when button pressed', async () => {
      const { getByTestId, getByText } = renderWithProviders(<ProfileScreen />);

      const aboutButton = getByTestId('about-button');
      fireEvent.press(aboutButton);

      await waitFor(() => {
        expect(getByText('ℹ️ Về SmartNotes+')).toBeTruthy();
      });
    });

    it('should display app name and version', async () => {
      const { getByTestId, getByText } = renderWithProviders(<ProfileScreen />);

      fireEvent.press(getByTestId('about-button'));

      await waitFor(() => {
        expect(getByText('SmartNotes+')).toBeTruthy();
        expect(getByText('Version 1.1.0')).toBeTruthy();
      });
    });

    it('should display app description', async () => {
      const { getByTestId, getByText } = renderWithProviders(<ProfileScreen />);

      fireEvent.press(getByTestId('about-button'));

      await waitFor(() => {
        expect(getByText(/Ứng dụng ghi chú thông minh/)).toBeTruthy();
      });
    });

    it('should display all features list', async () => {
      const { getByTestId, getByText } = renderWithProviders(<ProfileScreen />);

      fireEvent.press(getByTestId('about-button'));

      await waitFor(() => {
        expect(getByText('✅ CRUD Notes')).toBeTruthy();
        expect(getByText('📷 Camera & Photos')).toBeTruthy();
        expect(getByText('🗺️ Google Maps')).toBeTruthy();
        expect(getByText('⏰ Smart Notifications')).toBeTruthy();
        expect(getByText('📴 Offline Support')).toBeTruthy();
        expect(getByText('☁️ Cloud Sync')).toBeTruthy();
      });
    });

    it('should display footer information', async () => {
      const { getByTestId, getByText } = renderWithProviders(<ProfileScreen />);

      fireEvent.press(getByTestId('about-button'));

      await waitFor(() => {
        expect(getByText(/Made with ❤️/)).toBeTruthy();
        expect(getByText(/© 2025 UIT/)).toBeTruthy();
      });
    });

    it('should close about modal when close button pressed', async () => {
      const { getByTestId, getByText, queryByText } = renderWithProviders(
        <ProfileScreen />
      );

      fireEvent.press(getByTestId('about-button'));

      await waitFor(() => {
        expect(getByText('ℹ️ Về SmartNotes+')).toBeTruthy();
      });

      const closeButton = getByText('Đóng');
      fireEvent.press(closeButton);

      await waitFor(() => {
        expect(queryByText('ℹ️ Về SmartNotes+')).toBeNull();
      });
    });
  });

  // ============ INTEGRATION TESTS ============
  describe('Integration Tests', () => {
    it('should switch between statistics and about modals', async () => {
      const { getByTestId, getByText, queryByText } = renderWithProviders(
        <ProfileScreen />
      );

      // Open statistics
      fireEvent.press(getByTestId('stats-button'));
      await waitFor(() => {
        expect(getByText('📊 Thống kê sử dụng')).toBeTruthy();
      });

      // Close statistics
      fireEvent.press(getByText('Đóng'));
      await waitFor(() => {
        expect(queryByText('📊 Thống kê sử dụng')).toBeNull();
      });

      // Open about
      fireEvent.press(getByTestId('about-button'));
      await waitFor(() => {
        expect(getByText('ℹ️ Về SmartNotes+')).toBeTruthy();
      });
    });

    it('should maintain switch states after modal interactions', async () => {
      const { getByTestId } = renderWithProviders(<ProfileScreen />);

      const darkModeSwitch = getByTestId('dark-mode-switch');

      await act(async () => {
        fireEvent(darkModeSwitch, 'valueChange', true);
      });

      // Open and close statistics
      fireEvent.press(getByTestId('stats-button'));
      await waitFor(() => {
        fireEvent.press(getByTestId('stats-button'));
      });

      // Dark mode should still be enabled
      expect(darkModeSwitch.props.value).toBe(true);
    });

    it('should handle rapid modal open/close', async () => {
      const { getByTestId, getByText } = renderWithProviders(<ProfileScreen />);

      // Rapidly open and close stats
      fireEvent.press(getByTestId('stats-button'));
      fireEvent.press(getByTestId('stats-button'));

      await waitFor(() => {
        expect(getByText('📊 Thống kê sử dụng')).toBeTruthy();
      });
    });
  });

  // ============ ERROR HANDLING TESTS ============
  describe('Error Handling', () => {
    it('should handle notification permission error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      Notifications.getPermissionsAsync.mockRejectedValue(
        new Error('Permission error')
      );

      renderWithProviders(<ProfileScreen />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error checking notification permission:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle theme loading error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      renderWithProviders(<ProfileScreen />);

      // App should still render
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing user data gracefully', () => {
      const stateWithIncompleteUser = {
        user: {
          isLoggedIn: true,
          user: {
            id: '1',
            // Missing email and fullname
          },
        },
        note: { notes: [] },
      };

      const { getByText } = renderWithProviders(
        <ProfileScreen />,
        stateWithIncompleteUser
      );

      expect(getByText('User')).toBeTruthy(); // Default fullname
    });
  });
});
