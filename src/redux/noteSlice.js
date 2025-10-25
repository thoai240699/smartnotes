// noteSlice.js - Note State Management
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getNotes, createNote, updateNote, deleteNote } from '../api/NoteAPI';
import { syncWithSQLite, loadNotesFromSQLite } from '../db/database';

// Async thunks
export const fetchNotesAsync = createAsyncThunk(
  'note/fetchNotes',
  async (userId, { rejectWithValue }) => {
    try {
      const data = await getNotes(userId);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createNoteAsync = createAsyncThunk(
  'note/createNote',
  async (noteData, { rejectWithValue }) => {
    try {
      const data = await createNote(noteData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateNoteAsync = createAsyncThunk(
  'note/updateNote',
  async ({ id, noteData }, { rejectWithValue }) => {
    try {
      const data = await updateNote(id, noteData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteNoteAsync = createAsyncThunk(
  'note/deleteNote',
  async (id, { rejectWithValue }) => {
    try {
      await deleteNote(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  notes: [],
  filteredNotes: [],
  currentNote: null,
  loading: false,
  error: null,
  searchQuery: '',
  filterCategory: 'all',
  isOffline: false,
};

const noteSlice = createSlice({
  name: 'note',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.filteredNotes = state.notes.filter(
        (note) =>
          note.title.toLowerCase().includes(action.payload.toLowerCase()) ||
          note.content.toLowerCase().includes(action.payload.toLowerCase())
      );
    },
    setFilterCategory: (state, action) => {
      state.filterCategory = action.payload;
      if (action.payload === 'all') {
        state.filteredNotes = state.notes;
      } else {
        state.filteredNotes = state.notes.filter(
          (note) => note.category === action.payload
        );
      }
    },
    setCurrentNote: (state, action) => {
      state.currentNote = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setOfflineMode: (state, action) => {
      state.isOffline = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notes
      .addCase(fetchNotesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload;
        state.filteredNotes = action.payload;
      })
      .addCase(fetchNotesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Note
      .addCase(createNoteAsync.fulfilled, (state, action) => {
        state.notes.push(action.payload);
        state.filteredNotes = state.notes;
      })
      // Update Note
      .addCase(updateNoteAsync.fulfilled, (state, action) => {
        const index = state.notes.findIndex(
          (note) => note.id === action.payload.id
        );
        if (index !== -1) {
          state.notes[index] = action.payload;
          state.filteredNotes = state.notes;
        }
      })
      // Delete Note
      .addCase(deleteNoteAsync.fulfilled, (state, action) => {
        state.notes = state.notes.filter((note) => note.id !== action.payload);
        state.filteredNotes = state.notes;
      });
  },
});

export const {
  setSearchQuery,
  setFilterCategory,
  setCurrentNote,
  clearError,
  setOfflineMode,
} = noteSlice.actions;

export default noteSlice.reducer;
