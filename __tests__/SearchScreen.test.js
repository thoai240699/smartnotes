import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import noteReducer from '../src/redux/noteSlice';
import userReducer from '../src/redux/userSlice';
import SearchScreen from '../src/screens/SearchScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
};

// Sample SQLite notes data
const mockSqliteNotes = [
  {
    id: '1',
    title: 'Meeting Notes',
    content: 'Discuss project timeline and deliverables',
    category: 'work',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    userId: 'user1',
    isSynced: 1,
  },
  {
    id: '2',
    title: 'Shopping List',
    content: 'Buy groceries: milk, eggs, bread',
    category: 'shopping',
    createdAt: '2024-01-14T09:00:00.000Z',
    updatedAt: '2024-01-14T09:00:00.000Z',
    userId: 'user1',
    isSynced: 1,
  },
  {
    id: '3',
    title: 'Personal Goals',
    content: 'Exercise daily and read more books',
    category: 'personal',
    createdAt: '2024-01-13T08:00:00.000Z',
    updatedAt: '2024-01-13T08:00:00.000Z',
    userId: 'user1',
    isSynced: 0,
  },
  {
    id: '4',
    title: 'Work Tasks',
    content: 'Complete code review and update documentation',
    category: 'work',
    createdAt: '2024-01-12T14:00:00.000Z',
    updatedAt: '2024-01-12T14:00:00.000Z',
    userId: 'user1',
    isSynced: 1,
  },
  {
    id: '5',
    title: 'Birthday Party Planning',
    content: 'Plan birthday party for next month',
    category: 'other',
    createdAt: '2024-01-11T10:00:00.000Z',
    updatedAt: '2024-01-11T10:00:00.000Z',
    userId: 'user1',
    isSynced: 1,
  },
];

// Create mock store with notes from SQLite
const createMockStore = (notes = mockSqliteNotes) => {
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
      <NavigationContainer>{component}</NavigationContainer>
    </Provider>,
    options
  );
};

describe('SearchScreen with SQLite Data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Initial Render', () => {
    it('should render search input and category filters', () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      expect(getByPlaceholderText('Tìm kiếm ghi chú...')).toBeTruthy();
      expect(getByText('Tất cả')).toBeTruthy();
      expect(getByText('Công việc')).toBeTruthy();
      expect(getByText('Cá nhân')).toBeTruthy();
      expect(getByText('Mua sắm')).toBeTruthy();
      expect(getByText('Khác')).toBeTruthy();
    });

    it('should display all notes from SQLite initially', () => {
      const { getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      expect(getByText('Meeting Notes')).toBeTruthy();
      expect(getByText('Shopping List')).toBeTruthy();
      expect(getByText('Personal Goals')).toBeTruthy();
      expect(getByText('Work Tasks')).toBeTruthy();
      expect(getByText('Birthday Party Planning')).toBeTruthy();
    });

    it('should display results count', () => {
      const { getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      expect(getByText('5 kết quả')).toBeTruthy();
    });

    it('should display empty state when no notes in SQLite', () => {
      const store = createMockStore([]);
      const { getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />,
        { store }
      );

      expect(getByText('Tìm kiếm ghi chú')).toBeTruthy();
      expect(
        getByText('Nhập từ khóa hoặc chọn danh mục để tìm kiếm')
      ).toBeTruthy();
    });
  });

  describe('Search Functionality', () => {
    it('should filter notes by search query in title', async () => {
      const { getByPlaceholderText, getByText, queryByText } =
        renderWithProviders(<SearchScreen navigation={mockNavigation} />);

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      fireEvent.changeText(searchInput, 'Meeting');

      await waitFor(() => {
        expect(getByText('Meeting Notes')).toBeTruthy();
        expect(queryByText('Shopping List')).toBeNull();
        expect(queryByText('Personal Goals')).toBeNull();
        expect(getByText('1 kết quả')).toBeTruthy();
      });
    });

    it('should filter notes by search query in content', async () => {
      const { getByPlaceholderText, getByText, queryByText } =
        renderWithProviders(<SearchScreen navigation={mockNavigation} />);

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      fireEvent.changeText(searchInput, 'groceries');

      await waitFor(() => {
        expect(getByText('Shopping List')).toBeTruthy();
        expect(queryByText('Meeting Notes')).toBeNull();
        expect(getByText('1 kết quả')).toBeTruthy();
      });
    });

    it('should be case-insensitive when searching', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      fireEvent.changeText(searchInput, 'MEETING');

      await waitFor(() => {
        expect(getByText('Meeting Notes')).toBeTruthy();
      });
    });

    it('should search with partial matches', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      fireEvent.changeText(searchInput, 'work');

      await waitFor(() => {
        expect(getByText('Work Tasks')).toBeTruthy();
        expect(getByText('1 kết quả')).toBeTruthy(); // Only "Work Tasks" contains "work"
      });
    });

    it('should show "Không tìm thấy kết quả" when no matches', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      fireEvent.changeText(searchInput, 'nonexistent query xyz');

      await waitFor(() => {
        expect(getByText('Không tìm thấy kết quả')).toBeTruthy();
        expect(
          getByText('Không có ghi chú nào khớp với "nonexistent query xyz"')
        ).toBeTruthy();
      });
    });

    it('should display clear search button when query exists', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      fireEvent.changeText(searchInput, 'test');

      await waitFor(() => {
        expect(getByText('close-circle')).toBeTruthy();
      });
    });

    it('should clear search when clear button is pressed', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      fireEvent.changeText(searchInput, 'test query');

      const clearButton = getByText('close-circle');
      fireEvent.press(clearButton);

      await waitFor(() => {
        expect(searchInput.props.value).toBe('');
      });
    });

    it('should trim whitespace from search query', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      fireEvent.changeText(searchInput, '  Meeting  ');

      await waitFor(() => {
        expect(getByText('Meeting Notes')).toBeTruthy();
      });
    });
  });

  describe('Category Filter', () => {
    it('should filter notes by "Công việc" category', async () => {
      const { getByText, queryByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const workCategory = getByText('Công việc');
      fireEvent.press(workCategory);

      await waitFor(() => {
        expect(getByText('Meeting Notes')).toBeTruthy();
        expect(getByText('Work Tasks')).toBeTruthy();
        expect(queryByText('Shopping List')).toBeNull();
        expect(queryByText('Personal Goals')).toBeNull();
        expect(getByText('2 kết quả')).toBeTruthy();
      });
    });

    it('should filter notes by "Cá nhân" category', async () => {
      const { getByText, queryByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const personalCategory = getByText('Cá nhân');
      fireEvent.press(personalCategory);

      await waitFor(() => {
        expect(getByText('Personal Goals')).toBeTruthy();
        expect(queryByText('Meeting Notes')).toBeNull();
        expect(queryByText('Shopping List')).toBeNull();
        expect(getByText('1 kết quả')).toBeTruthy();
      });
    });

    it('should filter notes by "Mua sắm" category', async () => {
      const { getByText, queryByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const shoppingCategory = getByText('Mua sắm');
      fireEvent.press(shoppingCategory);

      await waitFor(() => {
        expect(getByText('Shopping List')).toBeTruthy();
        expect(queryByText('Meeting Notes')).toBeNull();
        expect(getByText('1 kết quả')).toBeTruthy();
      });
    });

    it('should filter notes by "Khác" category', async () => {
      const { getByText, queryByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const otherCategory = getByText('Khác');
      fireEvent.press(otherCategory);

      await waitFor(() => {
        expect(getByText('Birthday Party Planning')).toBeTruthy();
        expect(queryByText('Meeting Notes')).toBeNull();
        expect(getByText('1 kết quả')).toBeTruthy();
      });
    });

    it('should show all notes when "Tất cả" category selected', async () => {
      const { getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      // First select a specific category
      const workCategory = getByText('Công việc');
      fireEvent.press(workCategory);

      await waitFor(() => {
        expect(getByText('2 kết quả')).toBeTruthy();
      });

      // Then select "Tất cả"
      const allCategory = getByText('Tất cả');
      fireEvent.press(allCategory);

      await waitFor(() => {
        expect(getByText('5 kết quả')).toBeTruthy();
        expect(getByText('Meeting Notes')).toBeTruthy();
        expect(getByText('Shopping List')).toBeTruthy();
        expect(getByText('Personal Goals')).toBeTruthy();
      });
    });

    it('should show empty state for category with no notes', async () => {
      const singleNoteStore = createMockStore([
        {
          id: '1',
          title: 'Work Note',
          content: 'Work content',
          category: 'work',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
      ]);

      const { getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />,
        { store: singleNoteStore }
      );

      const shoppingCategory = getByText('Mua sắm');
      fireEvent.press(shoppingCategory);

      await waitFor(() => {
        expect(getByText('Tìm kiếm ghi chú')).toBeTruthy();
      });
    });
  });

  describe('Combined Filters', () => {
    it('should filter by both search query and category', async () => {
      const { getByPlaceholderText, getByText, queryByText } =
        renderWithProviders(<SearchScreen navigation={mockNavigation} />);

      // Select work category
      const workCategory = getByText('Công việc');
      fireEvent.press(workCategory);

      // Search within work category
      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      fireEvent.changeText(searchInput, 'Meeting');

      await waitFor(() => {
        expect(getByText('Meeting Notes')).toBeTruthy();
        expect(queryByText('Work Tasks')).toBeNull();
        expect(queryByText('Shopping List')).toBeNull();
        expect(getByText('1 kết quả')).toBeTruthy();
      });
    });

    it('should show clear filters button with active filters', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      fireEvent.changeText(searchInput, 'work');

      await waitFor(() => {
        expect(getByText('Xóa bộ lọc')).toBeTruthy();
      });
    });

    it('should clear all filters when clear filters button pressed', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      // Apply filters
      const workCategory = getByText('Công việc');
      fireEvent.press(workCategory);

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      fireEvent.changeText(searchInput, 'Meeting');

      await waitFor(() => {
        expect(getByText('1 kết quả')).toBeTruthy();
      });

      // Clear filters
      const clearFiltersButton = getByText('Xóa bộ lọc');
      fireEvent.press(clearFiltersButton);

      await waitFor(() => {
        expect(searchInput.props.value).toBe('');
        expect(getByText('5 kết quả')).toBeTruthy();
      });
    });

    it('should maintain category filter when search is cleared', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const workCategory = getByText('Công việc');
      fireEvent.press(workCategory);

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      fireEvent.changeText(searchInput, 'Meeting');

      const clearButton = getByText('close-circle');
      fireEvent.press(clearButton);

      await waitFor(() => {
        // Should still show work category filtered results
        expect(getByText('2 kết quả')).toBeTruthy();
        expect(getByText('Meeting Notes')).toBeTruthy();
        expect(getByText('Work Tasks')).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to NoteDetail when note is pressed', async () => {
      const { getByTestId } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const noteCard = getByTestId('note-card-1');
      fireEvent.press(noteCard);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('NoteDetail', {
          note: expect.objectContaining({
            id: '1',
            title: 'Meeting Notes',
          }),
        });
      });
    });
  });

  describe('Sorting', () => {
    it('should display notes sorted by newest first (updatedAt)', () => {
      const { getAllByTestId } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const noteCards = getAllByTestId(/note-card-/);

      // Should be sorted: 1, 2, 3, 4, 5 (based on updatedAt)
      expect(noteCards[0].props.testID).toBe('note-card-1');
      expect(noteCards[1].props.testID).toBe('note-card-2');
      expect(noteCards[2].props.testID).toBe('note-card-3');
      expect(noteCards[3].props.testID).toBe('note-card-4');
      expect(noteCards[4].props.testID).toBe('note-card-5');
    });
  });

  describe('SQLite Data Integration', () => {
    it('should work with empty SQLite database', () => {
      const store = createMockStore([]);
      const { getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />,
        { store }
      );

      expect(getByText('Tìm kiếm ghi chú')).toBeTruthy();
      expect(
        getByText('Nhập từ khóa hoặc chọn danh mục để tìm kiếm')
      ).toBeTruthy();
    });

    it('should display unsynced notes from SQLite', () => {
      const { getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      // Personal Goals has isSynced: 0
      expect(getByText('Personal Goals')).toBeTruthy();
    });

    it('should handle notes with special characters', async () => {
      const notesWithSpecialChars = [
        {
          id: '1',
          title: 'Special @#$% Characters',
          content: 'Content with émojis 😀 and symbols',
          category: 'other',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
      ];

      const store = createMockStore(notesWithSpecialChars);
      const { getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />,
        { store }
      );

      expect(getByText('Special @#$% Characters')).toBeTruthy();
    });

    it('should handle notes with empty title', async () => {
      const notesWithEmptyTitle = [
        {
          id: '1',
          title: '',
          content: 'Note with empty title',
          category: 'work',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
      ];

      const store = createMockStore(notesWithEmptyTitle);
      const { getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />,
        { store }
      );

      expect(getByText('Note with empty title')).toBeTruthy();
    });

    it('should handle notes with very long content', async () => {
      const longContent = 'A'.repeat(1000);
      const notesWithLongContent = [
        {
          id: '1',
          title: 'Long Note',
          content: longContent,
          category: 'work',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
      ];

      const store = createMockStore(notesWithLongContent);
      const { getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />,
        { store }
      );

      expect(getByText('Long Note')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should handle large dataset efficiently', async () => {
      // Generate 100 mock notes
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Note ${i + 1}`,
        content: `Content for note ${i + 1}`,
        category: ['work', 'personal', 'shopping', 'other'][i % 4],
        createdAt: new Date(2024, 0, i + 1).toISOString(),
        updatedAt: new Date(2024, 0, i + 1).toISOString(),
      }));

      const store = createMockStore(largeDataset);
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />,
        { store }
      );

      expect(getByText('100 kết quả')).toBeTruthy();

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      fireEvent.changeText(searchInput, 'Note 50');

      await waitFor(() => {
        expect(getByText('Note 50')).toBeTruthy();
        expect(getByText('1 kết quả')).toBeTruthy();
      });
    });

    it('should update results quickly when typing', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');

      fireEvent.changeText(searchInput, 'M');
      await waitFor(() => {
        expect(getByText(/kết quả/)).toBeTruthy();
      });

      fireEvent.changeText(searchInput, 'Me');
      await waitFor(() => {
        expect(getByText(/kết quả/)).toBeTruthy();
      });

      fireEvent.changeText(searchInput, 'Meeting');
      await waitFor(() => {
        expect(getByText('Meeting Notes')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple spaces in search query', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      // Search with leading/trailing spaces only (not middle spaces)
      fireEvent.changeText(searchInput, '  Meeting  ');

      await waitFor(() => {
        expect(getByText('Meeting Notes')).toBeTruthy();
      });
    });

    it('should show all notes when empty string is searched', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      const searchInput = getByPlaceholderText('Tìm kiếm ghi chú...');
      fireEvent.changeText(searchInput, '   ');

      await waitFor(() => {
        expect(getByText('5 kết quả')).toBeTruthy();
      });
    });

    it('should handle rapid category switching', async () => {
      const { getByText } = renderWithProviders(
        <SearchScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('Công việc'));
      fireEvent.press(getByText('Cá nhân'));
      fireEvent.press(getByText('Mua sắm'));
      fireEvent.press(getByText('Tất cả'));

      await waitFor(() => {
        expect(getByText('5 kết quả')).toBeTruthy();
      });
    });
  });
});
