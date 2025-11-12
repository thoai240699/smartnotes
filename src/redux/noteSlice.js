// noteSlice.js - Note State Management
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  insertNoteToSQLite,
  getAllNotesFromSQLite,
  updateNoteInSQLite,
  deleteNoteFromSQLite,
  getNotesToSync,
  updateSyncStatus,
  upsertNoteFromCloud,
  updateLocalIdToCloudId,
  markNoteAsDeleted,
  cleanLocalDeletedNotes,
} from '../db/database';
import {
  fetchNotesByUserId,
  createCloudNote,
  updateCloudNote,
  deleteCloudNote,
} from '../api/NoteAPI';

const initialState = {
  notes: [], // Danh sách ghi chú hiển thị
  loading: false, // Trạng thái tải chung (ví dụ: tải ban đầu)
  syncing: false, // Trạng thái đồng bộ hóa (tải lên/kéo về)
  error: null,
  isNotesLoaded: false, // Cờ đảm bảo Notes chỉ tải từ DB 1 lần lúc khởi động
  filteredNotes: [], // Dùng để hiển thị danh sách đã lọc/tìm kiếm
  searchQuery: '',
  filterCategory: 'all',
  currentNote: null,
  isOffline: false,
  syncHasError: false,
};


//----ASYNC THUNKS----

/**
 * Tải Notes từ SQLite (Cloud Notes hoặc Guest Notes)
 * @param {string | null} userId - Lấy từ state.user.userId
 */
export const loadNotesAsync = createAsyncThunk(
  'note/loadNotesFromSQLite',
  async (userId, { rejectWithValue }) => {
    try {
      const result = await getAllNotesFromSQLite(userId);

      if (!result.success) {
        return rejectWithValue(result.error || 'Lỗi khi tải ghi chú từ Local DB.');
      }
      return result.notes;
    } catch (error) {
      console.error('Lỗi Thunk Load Notes:', error);
      return rejectWithValue('Lỗi hệ thống khi tải ghi chú.');
    }
  }
);

/**
 * Thêm/Tạo Note mới (Luôn lưu Local trước)
 */
export const createNoteAsync = createAsyncThunk(
  'note/createNote',
  async (noteData, { rejectWithValue, getState }) => {
    try {
      const userId = getState().user.userId;
      const noteToInsert = { ...noteData, userId };

      const localResult = await insertNoteToSQLite(noteToInsert);

      if (!localResult.success) {
        return rejectWithValue(localResult.error || 'Không thể lưu ghi chú local.');
      }

      return localResult.note;

    } catch (error) {
      console.error('Lỗi Thunk Create Note:', error);
      return rejectWithValue('Lỗi hệ thống khi tạo ghi chú.');
    }
  }
);

/**
 * Cập nhật Note (Luôn cập nhật Local trước)
 */
export const updateNoteAsync = createAsyncThunk(
  'note/updateNote',
  async (noteData, { rejectWithValue }) => {
    try {
      const localResult = await updateNoteInSQLite(noteData);

      if (!localResult.success) {
        return rejectWithValue(localResult.error || 'Không thể cập nhật ghi chú local.');
      }

      return localResult.note;

    } catch (error) {
      console.error('Lỗi Thunk Update Note:', error);
      return rejectWithValue('Lỗi hệ thống khi cập nhật ghi chú.');
    }
  }
);

/**
 * Xóa Note (Luôn xóa Local trước)
 */
export const deleteNoteAsync = createAsyncThunk(
  'note/deleteNote',
  async (noteId, { rejectWithValue, getState }) => {
    const userId = getState().user.userId;

    try {
      let localResult;
      if (userId) {
        // Đã đăng nhập: Đánh dấu xóa để sync xử lý xóa Cloud sau
        localResult = await markNoteAsDeleted(noteId);

        if (!localResult.success) {
          return rejectWithValue(localResult.error || 'Không thể đánh dấu xóa ghi chú local.');
        }
      } else {
        // Chế độ khách: Xóa cứng local
        localResult = await deleteNoteFromSQLite(noteId);

        if (!localResult.success) {
          return rejectWithValue(localResult.error || 'Không thể xóa ghi chú local.');
        }
      }
      return localResult.id;

    } catch (error) {
      console.error('Lỗi Thunk Delete Note:', error);
      return rejectWithValue('Lỗi hệ thống khi xóa ghi chú.');
    }
  }
);

/**
 * Đồng bộ hóa Local Notes với Cloud MockAPI
 * @param {string} userId - ID của User đang đăng nhập
 */
export const syncNotesAsync = createAsyncThunk(
  'note/syncWithAPI',
  async (userId, { rejectWithValue, dispatch }) => {
    if (!userId) {
      // Không đồng bộ nếu ở Guest Mode
      return rejectWithValue('Không đăng nhập, bỏ qua đồng bộ Cloud.');
    }

    const MOCK_USER_ID = userId;

    try {
      // Lấy tất cả Notes cần đồng bộ (Pending Notes)
      const pendingResult = await getNotesToSync();
      const pendingNotes = pendingResult.notes;

      //----Đẩy thay đổi Local lên Cloud (Xử lý PENDING Notes)----
      for (const note of pendingNotes) {
        if (note.userId !== MOCK_USER_ID) continue; // Bỏ qua Notes của User khác

        let cloudOpResult;
        const isNewNote = note.id.length > 30; // Giả định ID dài là ID local (UUID)

        if (note.syncStatus === 'deleted-pending') {
          // XỬ LÝ XÓA CLOUD
          cloudOpResult = await deleteCloudNote(MOCK_USER_ID, note.id);
          if (cloudOpResult.success) {
            // Xóa cứng khỏi SQLite sau khi xóa Cloud thành công
            await deleteNoteFromSQLite(note.id);
          }
        } else {
          // XỬ LÝ THÊM MỚI HOẶC CẬP NHẬT
          if (isNewNote) {
            // Nếu id của note trên local đang là ID local -> Cần tạo mới trên Cloud
            cloudOpResult = await createCloudNote(note);
          } else {
            // Ngược lại id của mote trên local đang là ID Cloud -> Cần cập nhật
            cloudOpResult = await updateCloudNote(note);
          }

          if (cloudOpResult.success) {
            if (isNewNote) {
              const newCloudId = cloudOpResult.note.id;
              await updateLocalIdToCloudId(note.id, newCloudId);
              dispatch(noteSlice.actions.updateNoteId({ oldId: note.id, newId: newCloudId }));
            } else {
              await updateSyncStatus(note.id, 'synced');
            }
          } else {
            console.error(`⚠️ PUSH failed for note ${note.id}:`, cloudOpResult.error);
          }
        }
      }

      //----Kéo dữ liệu mới nhất từ Cloud về Local (Xử lý Cloud Notes)----

      // Lấy tất cả Notes từ Cloud
      const cloudNotesResult = await fetchNotesByUserId(MOCK_USER_ID);
      const cloudNotes = cloudNotesResult.notes;

      for (const cloudNote of cloudNotes) {
        await upsertNoteFromCloud(cloudNote);
      }

      const cloudNoteIds = cloudNotes.map(note => note.id);
      await cleanLocalDeletedNotes(cloudNoteIds, MOCK_USER_ID);

      const finalLocalNotes = await getAllNotesFromSQLite(MOCK_USER_ID);

      // Trả về danh sách cuối cùng để Redux cập nhật UI
      return finalLocalNotes.notes;

    } catch (error) {
      console.error('❌ Lỗi Thunk Sync Notes:', error);
      return rejectWithValue('Đồng bộ thất bại, có thể do lỗi kết nối.');
    }
  }
);

const applyFilters = (state) => {
  let filtered = state.notes;

  // 1. Áp dụng Lọc theo Category
  if (state.filterCategory && state.filterCategory !== 'all') {
    filtered = filtered.filter(
      (note) => note.category === state.filterCategory
    );
  }

  // 2. Áp dụng Lọc theo Tìm kiếm
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (note) =>
        note.title?.toLowerCase().includes(query) ||
        note.content?.toLowerCase().includes(query)
    );
  }

  state.filteredNotes = [...filtered];
};

const noteSlice = createSlice({
  name: 'note',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      applyFilters(state);
    },
    setFilterCategory: (state, action) => {
      state.filterCategory = action.payload;
      applyFilters(state);
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
    updateNoteId: (state, action) => {
      const { oldId, newId } = action.payload;
      const index = state.notes.findIndex(n => n.id === oldId);
      if (index !== -1) {
        state.notes[index].id = newId;
        state.notes[index].syncStatus = 'synced';
      }
      applyFilters(state);
    },
    resetSyncError: (state) => {
      state.syncHasError = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load Notes
      .addCase(loadNotesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadNotesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload; // Cập nhật danh sách notes
        applyFilters(state);
        state.isNotesLoaded = true;
      })
      .addCase(loadNotesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isNotesLoaded = true;
      })
      // Create Note
      .addCase(createNoteAsync.fulfilled, (state, action) => {
        state.notes.unshift(action.payload);
        applyFilters(state);
      })
      // Update note
      .addCase(updateNoteAsync.fulfilled, (state, action) => {
        const updatedNote = action.payload;
        const index = state.notes.findIndex(n => n.id === updatedNote.id);
        if (index !== -1) {
          state.notes[index] = updatedNote;
        }
        applyFilters(state);
      })
      // Delete Note
      .addCase(deleteNoteAsync.fulfilled, (state, action) => {
        state.notes = state.notes.filter(n => n.id !== action.payload);
        applyFilters(state); // Cập nhật danh sách notes sau khi xóa
      })

      // ------------------- SYNC NOTES -------------------
      .addCase(syncNotesAsync.pending, (state) => {
        state.syncing = true;
        //state.syncHasError = false;
      })
      .addCase(syncNotesAsync.fulfilled, (state, action) => {
        state.syncing = false;
        state.syncHasError = false;
        // Giả sử action.payload là danh sách notes mới từ Cloud
        state.notes = action.payload;
        applyFilters(state);
      })
      .addCase(syncNotesAsync.rejected, (state, action) => {
        state.syncing = false;
        state.syncHasError = true;
        state.error = action.payload;
        console.error("Sync Failed:", action.payload);
        // Có thể set error ở đây nếu muốn thông báo cho người dùng
      });
  },
});

export const {
  setSearchQuery,
  setFilterCategory,
  setCurrentNote,
  clearError,
  setOfflineMode,
  resetSyncError,
} = noteSlice.actions;

export default noteSlice.reducer;
