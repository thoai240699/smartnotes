// store.js - Redux Store Configuration
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import noteReducer from './noteSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    note: noteReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore specific actions that contain Date objects
        ignoredActions: [
          'note/addNote',
          'note/updateNote',
          'note/loadNotesFromSQLite/fulfilled',
          'note/syncWithAPI/fulfilled',
        ],
        // Ignore Date fields in note state
        ignoredPaths: ['note.notes', 'note.filteredNotes'],
        // Ignore action payload fields with Date
        ignoredActionPaths: ['payload.dueDate', 'payload.createdAt'],
      },
    }),
});
