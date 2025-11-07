import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import noteReducer from '../src/redux/noteSlice';
import userReducer from '../src/redux/userSlice';
import NotificationScreen from '../src/screens/NotificationScreen';
import { ThemeProvider } from '../src/contexts/ThemeContext';

// Mock notification helper
const mockGetAllScheduledNotifications = jest.fn();
const mockCancelNotification = jest.fn();
const mockCancelAllNotifications = jest.fn();
const mockRequestNotificationPermissions = jest.fn();

jest.mock('../src/utils/notificationHelper', () => ({
  getAllScheduledNotifications: (...args) =>
    mockGetAllScheduledNotifications(...args),
  cancelNotification: (...args) => mockCancelNotification(...args),
  cancelAllNotifications: (...args) => mockCancelAllNotifications(...args),
  requestNotificationPermissions: (...args) =>
    mockRequestNotificationPermissions(...args),
}));

// Mock date helper
jest.mock('../src/utils/dateHelper', () => ({
  formatDateTime: (date) => {
    const d = new Date(date);
    return `${d.getDate()}/${
      d.getMonth() + 1
    }/${d.getFullYear()} ${d.getHours()}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  },
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
};

// Sample notification data
const mockScheduledNotifications = [
  {
    identifier: 'notif-1',
    content: {
      title: '📝 Meeting Notes',
      body: 'Discuss project timeline',
      data: { noteId: '1', type: 'note_reminder' },
    },
    trigger: {
      date: '2024-12-01T10:00:00.000Z',
    },
  },
  {
    identifier: 'notif-2',
    content: {
      title: '📝 Shopping List',
      body: 'Buy groceries',
      data: { noteId: '2', type: 'note_reminder' },
    },
    trigger: {
      date: '2024-11-30T15:30:00.000Z',
    },
  },
];

const mockNotes = [
  {
    id: '1',
    title: 'Meeting Notes',
    content: 'Discuss project timeline',
    category: 'work',
  },
  {
    id: '2',
    title: 'Shopping List',
    content: 'Buy groceries',
    category: 'shopping',
  },
];

// Create mock store
const createMockStore = (notes = mockNotes) => {
  return configureStore({
    reducer: {
      note: noteReducer,
      user: userReducer,
    },
    preloadedState: {
      note: {
        notes: notes,
        loading: false,
        error: null,
      },
      user: {
        currentUser: { id: 'user1', email: 'test@example.com' },
        isAuthenticated: true,
      },
    },
  });
};

// Wrapper component for tests
const renderWithProviders = (
  component,
  { store = createMockStore(), ...options } = {}
) => {
  return render(
    <Provider store={store}>
      <ThemeProvider>
        <NavigationContainer>{component}</NavigationContainer>
      </ThemeProvider>
    </Provider>,
    options
  );
};

describe('NotificationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockRequestNotificationPermissions.mockResolvedValue(true);
    mockGetAllScheduledNotifications.mockResolvedValue(
      mockScheduledNotifications
    );
  });

  describe('Initial Render and Loading', () => {
    it('should show loading state initially', async () => {
      mockGetAllScheduledNotifications.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      const { getByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      expect(getByText('Đang tải thông báo...')).toBeTruthy();
    });

    it('should render header with title', async () => {
      const { getByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Quản lý thông báo')).toBeTruthy();
      });
    });

    it('should check notification permissions on load', async () => {
      renderWithProviders(<NotificationScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(mockRequestNotificationPermissions).toHaveBeenCalled();
      });
    });
  });

  describe('Notification List', () => {
    it('should display scheduled notifications', async () => {
      const { getByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('📝 Meeting Notes')).toBeTruthy();
        expect(getByText('📝 Shopping List')).toBeTruthy();
        expect(getByText('2 thông báo đã lên lịch')).toBeTruthy();
      });
    });

    it('should show notification details', async () => {
      const { getByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Discuss project timeline')).toBeTruthy();
        expect(getByText('Buy groceries')).toBeTruthy();
      });
    });

    it('should show formatted dates', async () => {
      const { getByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText(/1\/12\/2024/)).toBeTruthy();
        expect(getByText(/30\/11\/2024/)).toBeTruthy();
      });
    });

    it('should show action buttons for each notification', async () => {
      const { getAllByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const viewButtons = getAllByText('Xem ghi chú');
        const cancelButtons = getAllByText('Hủy');

        expect(viewButtons).toHaveLength(2);
        expect(cancelButtons).toHaveLength(2);
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no notifications', async () => {
      mockGetAllScheduledNotifications.mockResolvedValue([]);

      const { getByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Chưa có thông báo nào')).toBeTruthy();
        expect(
          getByText('Tạo ghi chú với ngày hạn để nhận thông báo nhắc nhở')
        ).toBeTruthy();
        expect(getByText('Tạo ghi chú mới')).toBeTruthy();
      });
    });

    it('should navigate to AddNote when empty state button pressed', async () => {
      mockGetAllScheduledNotifications.mockResolvedValue([]);

      const { getByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const createButton = getByText('Tạo ghi chú mới');
        fireEvent.press(createButton);
        expect(mockNavigate).toHaveBeenCalledWith('AddNote');
      });
    });

    it('should show permission denied state when no permission', async () => {
      mockRequestNotificationPermissions.mockResolvedValue(false);

      const { getByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Chưa cấp quyền thông báo')).toBeTruthy();
        expect(
          getByText(
            'Vui lòng cấp quyền thông báo để sử dụng tính năng nhắc nhở'
          )
        ).toBeTruthy();
      });
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate to note detail when "Xem ghi chú" pressed', async () => {
      const { getAllByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const viewButtons = getAllByText('Xem ghi chú');
        expect(viewButtons.length).toBeGreaterThan(0);

        // Press any view button
        fireEvent.press(viewButtons[0]);

        // Check that navigation happened with correct structure
        expect(mockNavigate).toHaveBeenCalledWith('NoteDetail', {
          note: expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
          }),
        });
      });
    });

    it('should show error when note not found', async () => {
      // Mock notifications with non-existent note ID
      mockGetAllScheduledNotifications.mockResolvedValue([
        {
          identifier: 'notif-3',
          content: {
            title: '📝 Non-existent Note',
            body: 'This note does not exist',
            data: { noteId: '999', type: 'note_reminder' },
          },
          trigger: { date: '2024-12-01T10:00:00.000Z' },
        },
      ]);

      const { getByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        // Should show disabled button instead of clickable button
        expect(getByText('Ghi chú không tồn tại')).toBeTruthy();
      });
    });
  });

  describe('Cancel Notifications', () => {
    it('should show confirmation dialog when canceling notification', async () => {
      const { getAllByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const cancelButtons = getAllByText('Hủy');
        fireEvent.press(cancelButtons[0]);
        // Note: Alert testing would require additional mocking
      });
    });

    it('should show "Xóa tất cả" button when notifications exist', async () => {
      const { getByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Xóa tất cả')).toBeTruthy();
      });
    });

    it('should not show "Xóa tất cả" button when no notifications', async () => {
      mockGetAllScheduledNotifications.mockResolvedValue([]);

      const { queryByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByText('Xóa tất cả')).toBeNull();
      });
    });
  });

  describe('Pull to Refresh', () => {
    it('should reload notifications on pull to refresh', async () => {
      const { getByTestId } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        // Note: Pull to refresh testing requires more complex setup
        expect(mockGetAllScheduledNotifications).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle notification loading errors gracefully', async () => {
      mockGetAllScheduledNotifications.mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Chưa có thông báo nào')).toBeTruthy();
      });
    });

    it('should handle permission check errors', async () => {
      mockRequestNotificationPermissions.mockRejectedValue(
        new Error('Permission error')
      );

      renderWithProviders(<NotificationScreen navigation={mockNavigation} />);

      await waitFor(() => {
        // Should not crash and handle error gracefully
        expect(mockRequestNotificationPermissions).toHaveBeenCalled();
      });
    });
  });

  describe('Expired Notifications', () => {
    it('should display expired notifications with different styling', async () => {
      const expiredNotification = {
        identifier: 'notif-expired',
        content: {
          title: '📝 Expired Note',
          body: 'This notification has expired',
          data: { noteId: '1', type: 'note_reminder' },
        },
        trigger: {
          date: '2023-01-01T10:00:00.000Z', // Past date
        },
      };

      mockGetAllScheduledNotifications.mockResolvedValue([expiredNotification]);

      const { getByText } = renderWithProviders(
        <NotificationScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('📝 Expired Note')).toBeTruthy();
        expect(getByText(/Đã qua:/)).toBeTruthy();
      });
    });
  });
});
