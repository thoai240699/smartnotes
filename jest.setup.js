import 'react-native-gesture-handler/jestSetup';

// Mock @expo/vector-icons
jest.mock(
  '@expo/vector-icons',
  () => {
    const React = require('react');
    const { Text } = require('react-native');

    const MockIcon = (props) => {
      return React.createElement(Text, props, props.name || 'Icon');
    };

    return {
      Ionicons: MockIcon,
      MaterialIcons: MockIcon,
      FontAwesome: MockIcon,
    };
  },
  { virtual: true }
);

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
}));

// Mock SQLite database
jest.mock('./src/db/database', () => ({
  initDatabase: jest.fn(() => Promise.resolve()),
  searchNotesOffline: jest.fn(() => Promise.resolve([])),
  getAllNotes: jest.fn(() => Promise.resolve([])),
  addNote: jest.fn(() => Promise.resolve({ id: '1' })),
  updateNote: jest.fn(() => Promise.resolve()),
  deleteNote: jest.fn(() => Promise.resolve()),
}));

// Mock NoteCard component for cleaner tests
jest.mock('./src/components/NoteCard', () => {
  const React = require('react');
  const { TouchableOpacity, Text, View } = require('react-native');

  return function NoteCardMock({ note, onPress }) {
    return React.createElement(
      TouchableOpacity,
      {
        onPress: onPress,
        testID: `note-card-${note.id}`,
      },
      React.createElement(
        View,
        null,
        React.createElement(Text, { testID: 'note-title' }, note.title),
        React.createElement(Text, { testID: 'note-content' }, note.content)
      )
    );
  };
});

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
