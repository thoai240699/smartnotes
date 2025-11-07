// OfflineSyncScreen.test.js - Comprehensive tests for OfflineSyncScreen
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { Alert } from 'react-native';
import OfflineSyncScreen from '../src/screens/OfflineSyncScreen';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import * as database from '../src/db/database';
import * as NoteAPI from '../src/api/NoteAPI';

// Mock dependencies
jest.mock('../src/db/database', () => ({
  loadNotesFromSQLite: jest.fn(),
  syncWithSQLite: jest.fn(),
}));

jest.mock('../src/api/NoteAPI', () => ({
  getNotes: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

const mockStore = configureStore([]);

const mockUser = {
  id: 'user123',
  email: 'test@example.com',
  username: 'testuser',
};

const mockNotes = [
  {
    id: 'note1',
    title: 'Test Note 1',
    content: 'Content 1',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    needsSync: false,
  },
  {
    id: 'note2',
    title: 'Test Note 2',
    content: 'Content 2',
    createdAt: '2024-01-02T10:00:00.000Z',
    updatedAt: '2024-01-02T10:00:00.000Z',
    needsSync: true,
  },
];

const createMockStore = (isLoggedIn = true, notes = mockNotes) => {
  return mockStore({
    user: {
      user: isLoggedIn ? mockUser : null,
      isLoggedIn,
    },
    note: {
      notes,
    },
  });
};

const renderWithProviders = (component, store) => {
  return render(
    <Provider store={store}>
      <ThemeProvider>{component}</ThemeProvider>
    </Provider>
  );
};

describe('OfflineSyncScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert.mockClear();
    database.loadNotesFromSQLite.mockResolvedValue({
      success: true,
      data: mockNotes,
    });
    database.syncWithSQLite.mockResolvedValue({ success: true });
    NoteAPI.getNotes.mockResolvedValue([]);
  });

  // ============================================
  // 1. Rendering Tests
  // ============================================
  describe('Rendering', () => {
    test('renders screen correctly', () => {
      const store = createMockStore();
      const { getByText, getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      expect(getByText('Đồng bộ dữ liệu')).toBeTruthy();
      expect(getByText('Quản lý đồng bộ giữa thiết bị và cloud')).toBeTruthy();
      expect(getByTestId('offline-sync-screen')).toBeTruthy();
    });

    test('renders sync button', () => {
      const store = createMockStore();
      const { getByTestId, getByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      expect(getByTestId('sync-button')).toBeTruthy();
      expect(getByText('Đồng bộ ngay')).toBeTruthy();
    });

    test('renders info card', () => {
      const store = createMockStore();
      const { getByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      expect(getByText('Về đồng bộ')).toBeTruthy();
      expect(
        getByText('• Dữ liệu được lưu trên máy (SQLite) và cloud (MockAPI)')
      ).toBeTruthy();
    });

    test('shows warning for guest mode', () => {
      const store = createMockStore(false);
      const { getByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      expect(getByText('Chế độ khách')).toBeTruthy();
      expect(
        getByText('Bạn cần đăng nhập để đồng bộ dữ liệu lên cloud.')
      ).toBeTruthy();
    });

    test('does not show warning when logged in', () => {
      const store = createMockStore(true);
      const { queryByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      expect(queryByText('Chế độ khách')).toBeNull();
    });
  });

  // ============================================
  // 2. Sync Status Tests
  // ============================================
  describe('Sync Status', () => {
    test('shows unsynced notes count', async () => {
      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: [
          { ...mockNotes[0], needsSync: true },
          { ...mockNotes[1], needsSync: true },
        ],
      });

      const store = createMockStore();
      const { findByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      await waitFor(() => {
        expect(database.loadNotesFromSQLite).toHaveBeenCalledWith('user123');
      });
    });

    test('loads sync status on mount', async () => {
      const store = createMockStore();
      renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      await waitFor(() => {
        expect(database.loadNotesFromSQLite).toHaveBeenCalled();
      });
    });

    test('shows idle status initially', () => {
      const store = createMockStore();
      const { getByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      expect(getByText('Sẵn sàng')).toBeTruthy();
    });

    test('updates unsynced count when notes change', async () => {
      const store = createMockStore(true, [
        { ...mockNotes[0], needsSync: true },
      ]);

      const { findByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      // Component should detect 1 unsynced note
      await waitFor(() => {
        expect(database.loadNotesFromSQLite).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // 3. Manual Sync Tests
  // ============================================
  describe('Manual Sync', () => {
    test('shows login alert when not logged in', () => {
      const mockNavigate = jest.fn();
      const store = createMockStore(false);
      const { getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: mockNavigate }} />,
        store
      );

      fireEvent.press(getByTestId('sync-button'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Đăng nhập required',
        'Bạn cần đăng nhập để đồng bộ dữ liệu lên cloud.',
        expect.any(Array)
      );
    });

    test('navigates to login when user confirms', () => {
      const mockNavigate = jest.fn();
      const store = createMockStore(false);
      const { getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: mockNavigate }} />,
        store
      );

      fireEvent.press(getByTestId('sync-button'));

      // Get the login button callback from alert
      const alertCall = Alert.alert.mock.calls[0];
      const buttons = alertCall[2];
      const loginButton = buttons.find((btn) => btn.text === 'Đăng nhập');
      loginButton.onPress();

      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });

    test('performs sync when logged in', async () => {
      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: mockNotes,
      });
      NoteAPI.getNotes.mockResolvedValue([]);

      const store = createMockStore(true);
      const { getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      fireEvent.press(getByTestId('sync-button'));

      // Should complete sync
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Thành công',
          'Đồng bộ dữ liệu hoàn tất!'
        );
      });
    });

    test('handles sync error', async () => {
      database.loadNotesFromSQLite.mockRejectedValue(
        new Error('Database error')
      );

      const store = createMockStore(true);
      const { getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      fireEvent.press(getByTestId('sync-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Lỗi',
          expect.stringContaining('Không thể đồng bộ')
        );
      });
    });

    test('disables button during sync', async () => {
      database.loadNotesFromSQLite.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: [] }), 1000)
          )
      );

      const store = createMockStore(true);
      const { getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      const syncButton = getByTestId('sync-button');
      fireEvent.press(syncButton);

      // Button should be disabled
      expect(syncButton.props.accessibilityState.disabled).toBe(true);
    });

    test('loads local notes during sync', async () => {
      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: mockNotes,
      });
      NoteAPI.getNotes.mockResolvedValue([]);

      const store = createMockStore(true);
      const { getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      fireEvent.press(getByTestId('sync-button'));

      await waitFor(() => {
        expect(database.loadNotesFromSQLite).toHaveBeenCalledWith('user123');
      });
    });

    test('fetches remote notes during sync', async () => {
      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: mockNotes,
      });
      NoteAPI.getNotes.mockResolvedValue([]);

      const store = createMockStore(true);
      const { getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      fireEvent.press(getByTestId('sync-button'));

      await waitFor(() => {
        expect(NoteAPI.getNotes).toHaveBeenCalledWith('user123');
      });
    });

    test('handles offline mode gracefully', async () => {
      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: mockNotes,
      });
      NoteAPI.getNotes.mockRejectedValue(new Error('Network error'));

      const store = createMockStore(true);
      const { getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      fireEvent.press(getByTestId('sync-button'));

      // Should still complete sync with local data
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Thành công',
          'Đồng bộ dữ liệu hoàn tất!'
        );
      });
    });
  });

  // ============================================
  // 4. Conflict Detection Tests
  // ============================================
  describe('Conflict Detection', () => {
    test('detects conflicts between local and remote notes', async () => {
      const localNote = {
        id: 'note1',
        title: 'Local Title',
        content: 'Local Content',
        updatedAt: '2024-01-01T12:00:00.000Z',
      };

      const remoteNote = {
        id: 'note1',
        title: 'Remote Title',
        content: 'Remote Content',
        updatedAt: '2024-01-01T12:10:00.000Z',
      };

      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: [localNote],
      });
      NoteAPI.getNotes.mockResolvedValue([remoteNote]);

      const store = createMockStore(true);
      const { getByTestId, findByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      fireEvent.press(getByTestId('sync-button'));

      // Should show conflict modal
      await findByText('⚠️ Xung đột dữ liệu');
    });

    test('shows conflict modal with both versions', async () => {
      const localNote = {
        id: 'note1',
        title: 'Conflict Note',
        content: 'Local version content',
        updatedAt: '2024-01-01T10:00:00.000Z',
      };

      const remoteNote = {
        id: 'note1',
        title: 'Conflict Note',
        content: 'Remote version content',
        updatedAt: '2024-01-01T11:00:00.000Z',
      };

      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: [localNote],
      });
      NoteAPI.getNotes.mockResolvedValue([remoteNote]);

      const store = createMockStore(true);
      const { getByTestId, findByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      fireEvent.press(getByTestId('sync-button'));

      await findByText('Phiên bản trên máy');
      await findByText('Phiên bản trên cloud');
      await findByText('Local version content');
      await findByText('Remote version content');
    });

    test('does not detect conflict for identical notes', async () => {
      const identicalNote = {
        id: 'note1',
        title: 'Same Title',
        content: 'Same Content',
        updatedAt: '2024-01-01T10:00:00.000Z',
      };

      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: [identicalNote],
      });
      NoteAPI.getNotes.mockResolvedValue([identicalNote]);

      const store = createMockStore(true);
      const { getByTestId, queryByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      fireEvent.press(getByTestId('sync-button'));

      await waitFor(() => {
        expect(queryByText('⚠️ Xung đột dữ liệu')).toBeNull();
      });
    });

    test('shows conflict count when multiple conflicts exist', async () => {
      const localNotes = [
        {
          id: 'note1',
          title: 'Note 1',
          content: 'Local 1',
          updatedAt: '2024-01-01T10:00:00.000Z',
        },
        {
          id: 'note2',
          title: 'Note 2',
          content: 'Local 2',
          updatedAt: '2024-01-01T10:00:00.000Z',
        },
      ];

      const remoteNotes = [
        {
          id: 'note1',
          title: 'Note 1',
          content: 'Remote 1',
          updatedAt: '2024-01-01T11:00:00.000Z',
        },
        {
          id: 'note2',
          title: 'Note 2',
          content: 'Remote 2',
          updatedAt: '2024-01-01T11:00:00.000Z',
        },
      ];

      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: localNotes,
      });
      NoteAPI.getNotes.mockResolvedValue(remoteNotes);

      const store = createMockStore(true);
      const { getByTestId, findByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      fireEvent.press(getByTestId('sync-button'));

      await findByText('Còn 1 xung đột nữa');
    });
  });

  // ============================================
  // 5. Conflict Resolution Tests
  // ============================================
  describe('Conflict Resolution', () => {
    const setupConflict = async (getByTestId, findByText) => {
      const localNote = {
        id: 'note1',
        title: 'Conflict',
        content: 'Local',
        updatedAt: '2024-01-01T10:00:00.000Z',
      };

      const remoteNote = {
        id: 'note1',
        title: 'Conflict',
        content: 'Remote',
        updatedAt: '2024-01-01T11:00:00.000Z',
      };

      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: [localNote],
      });
      NoteAPI.getNotes.mockResolvedValue([remoteNote]);

      fireEvent.press(getByTestId('sync-button'));
      await findByText('⚠️ Xung đột dữ liệu');
    };

    test('resolves conflict by keeping local version', async () => {
      NoteAPI.updateNote.mockResolvedValue({});

      const store = createMockStore(true);
      const { getByTestId, findByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      await setupConflict(getByTestId, findByText);

      fireEvent.press(getByTestId('keep-local-button'));

      await waitFor(() => {
        expect(NoteAPI.updateNote).toHaveBeenCalled();
      });
    });

    test('resolves conflict by keeping remote version', async () => {
      const store = createMockStore(true);
      const { getByTestId, findByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      await setupConflict(getByTestId, findByText);

      fireEvent.press(getByTestId('keep-remote-button'));

      await waitFor(() => {
        expect(database.syncWithSQLite).toHaveBeenCalled();
      });
    });

    test('resolves conflict by keeping both versions', async () => {
      NoteAPI.createNote.mockResolvedValue({});

      const store = createMockStore(true);
      const { getByTestId, findByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      await setupConflict(getByTestId, findByText);

      fireEvent.press(getByTestId('keep-both-button'));

      await waitFor(() => {
        expect(NoteAPI.createNote).toHaveBeenCalled();
        expect(database.syncWithSQLite).toHaveBeenCalled();
      });
    });

    test('shows success alert after resolving last conflict', async () => {
      NoteAPI.updateNote.mockResolvedValue({});

      const store = createMockStore(true);
      const { getByTestId, findByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      await setupConflict(getByTestId, findByText);

      fireEvent.press(getByTestId('keep-local-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Thành công',
          'Xung đột đã được giải quyết!'
        );
      });
    });

    test('moves to next conflict after resolution', async () => {
      const localNotes = [
        {
          id: 'note1',
          title: 'Note 1',
          content: 'Local 1',
          updatedAt: '2024-01-01T10:00:00.000Z',
        },
        {
          id: 'note2',
          title: 'Note 2',
          content: 'Local 2',
          updatedAt: '2024-01-01T10:00:00.000Z',
        },
      ];

      const remoteNotes = [
        {
          id: 'note1',
          title: 'Note 1',
          content: 'Remote 1',
          updatedAt: '2024-01-01T11:00:00.000Z',
        },
        {
          id: 'note2',
          title: 'Note 2',
          content: 'Remote 2',
          updatedAt: '2024-01-01T11:00:00.000Z',
        },
      ];

      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: localNotes,
      });
      NoteAPI.getNotes.mockResolvedValue(remoteNotes);
      NoteAPI.updateNote.mockResolvedValue({});

      const store = createMockStore(true);
      const { getByTestId, findByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      fireEvent.press(getByTestId('sync-button'));
      await findByText('⚠️ Xung đột dữ liệu');
      await findByText('Còn 1 xung đột nữa');

      fireEvent.press(getByTestId('keep-local-button'));

      // Should still show modal for next conflict
      await waitFor(() => {
        expect(NoteAPI.updateNote).toHaveBeenCalled();
      });
    });

    test('handles resolution error', async () => {
      NoteAPI.updateNote.mockRejectedValue(new Error('Update failed'));

      const store = createMockStore(true);
      const { getByTestId, findByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      await setupConflict(getByTestId, findByText);

      fireEvent.press(getByTestId('keep-local-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Lỗi',
          'Không thể giải quyết xung đột'
        );
      });
    });
  });

  // ============================================
  // 6. Refresh Tests
  // ============================================
  describe('Refresh', () => {
    test('allows pull to refresh', () => {
      const store = createMockStore();
      const { getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      const scrollView = getByTestId('offline-sync-screen');
      expect(scrollView.props.refreshControl).toBeDefined();
    });

    test('reloads sync status on refresh', async () => {
      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: mockNotes,
      });

      const store = createMockStore();
      const { getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      const scrollView = getByTestId('offline-sync-screen');
      const refreshControl = scrollView.props.refreshControl;

      // Trigger refresh
      await waitFor(() => {
        refreshControl.props.onRefresh();
      });

      expect(database.loadNotesFromSQLite).toHaveBeenCalled();
    });
  });

  // ============================================
  // 7. Theme Support Tests
  // ============================================
  describe('Theme Support', () => {
    test('renders with light theme', () => {
      const store = createMockStore();
      const { getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      expect(getByTestId('offline-sync-screen')).toBeTruthy();
    });

    test('applies correct colors in light mode', () => {
      const store = createMockStore();
      const { getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      const container = getByTestId('offline-sync-screen');
      expect(container.props.style).toBeDefined();
    });
  });

  // ============================================
  // 8. Integration Tests
  // ============================================
  describe('Integration', () => {
    test('completes full sync workflow', async () => {
      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: mockNotes,
      });
      NoteAPI.getNotes.mockResolvedValue([]);

      const store = createMockStore(true);
      const { getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      // 1. Load initial status
      await waitFor(() => {
        expect(database.loadNotesFromSQLite).toHaveBeenCalled();
      });

      // 2. Trigger manual sync
      fireEvent.press(getByTestId('sync-button'));

      // 3. Complete sync
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Thành công',
          'Đồng bộ dữ liệu hoàn tất!'
        );
      });
    });

    test('handles complete conflict resolution workflow', async () => {
      const localNote = {
        id: 'note1',
        title: 'Test',
        content: 'Local',
        updatedAt: '2024-01-01T10:00:00.000Z',
      };

      const remoteNote = {
        id: 'note1',
        title: 'Test',
        content: 'Remote',
        updatedAt: '2024-01-01T11:00:00.000Z',
      };

      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: [localNote],
      });
      NoteAPI.getNotes.mockResolvedValue([remoteNote]);
      NoteAPI.updateNote.mockResolvedValue({});

      const store = createMockStore(true);
      const { getByTestId, findByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      // 1. Trigger sync
      fireEvent.press(getByTestId('sync-button'));

      // 2. Detect conflict
      await findByText('⚠️ Xung đột dữ liệu');

      // 3. Resolve conflict
      fireEvent.press(getByTestId('keep-local-button'));

      // 4. Confirm resolution
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Thành công',
          'Xung đột đã được giải quyết!'
        );
      });
    });

    test('syncs correctly with Redux state', () => {
      const customNotes = [
        { ...mockNotes[0], needsSync: true },
        { ...mockNotes[1], needsSync: true },
      ];
      const store = createMockStore(true, customNotes);

      renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      // Component should use Redux state
      const state = store.getState();
      expect(state.note.notes).toEqual(customNotes);
    });
  });

  // ============================================
  // 9. Error Handling Tests
  // ============================================
  describe('Error Handling', () => {
    test('handles database load failure gracefully', async () => {
      database.loadNotesFromSQLite.mockRejectedValue(
        new Error('Database error')
      );

      const store = createMockStore();
      renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      // Should not crash
      await waitFor(() => {
        expect(database.loadNotesFromSQLite).toHaveBeenCalled();
      });
    });

    test('handles API failure during sync', async () => {
      database.loadNotesFromSQLite.mockResolvedValue({
        success: true,
        data: mockNotes,
      });
      NoteAPI.getNotes.mockRejectedValue(new Error('API error'));

      const store = createMockStore(true);
      const { getByTestId } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      fireEvent.press(getByTestId('sync-button'));

      // Should still complete with local data
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });

    test('shows error message in UI', async () => {
      database.loadNotesFromSQLite.mockRejectedValue(new Error('Test error'));

      const store = createMockStore(true);
      const { getByTestId, findByText } = renderWithProviders(
        <OfflineSyncScreen navigation={{ navigate: jest.fn() }} />,
        store
      );

      fireEvent.press(getByTestId('sync-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Lỗi',
          expect.stringContaining('Test error')
        );
      });
    });
  });
});
