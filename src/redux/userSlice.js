// userSlice.js - User State Management
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  loginUser, 
  registerUser,
  updateUser,
  updatePassword
} from '../api/AuthAPI';

// AsyncStorage key
const USER_SESSION_KEY = '@SmartNotesUser';

// --- INITIAL STATE ---
const initialState = {
  user: null, // Lưu trữ toàn bộ thông tin user
  userId: null, // Lưu trữ ID để Person B dùng lọc notes
  isLoggedIn: false,
  loading: false,
  error: null,
};

// --- ASYNC THUNKS ---

/**
 * @description Thunk xử lý đăng nhập, gọi API và lưu session.
 */
export const loginAsync = createAsyncThunk(
  'user/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const result = await loginUser(email, password);
      if (!result.success) {
        return rejectWithValue(result.error || 'Đăng nhập thất bại.');
      }
      const user = result.user;
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      return rejectWithValue('Lỗi kết nối hoặc hệ thống không phản hồi.');
    }
  }
);


/**
 * @description Thunk xử lý đăng ký, gọi API và tự động đăng nhập/lưu session.
 */

export const registerAsync = createAsyncThunk(
  'user/register',
  async (userData, { rejectWithValue }) => {
    try {
      const result = await registerUser(userData);
      if (!result.success) {
        return rejectWithValue(result.error || 'Đăng ký thất bại.');
      }
      const user = result.user;
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Lỗi Thunk Đăng ký:', error);
      return rejectWithValue('Lỗi kết nối hoặc hệ thống không phản hồi.');
    }
  }
);

/**
 * @description Thunk xử lý cập nhật hồ sơ người dùng.
 */
export const updateProfileAsync = createAsyncThunk(
  'user/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const result = await updateUser(userData);
      if (!result.success) {
        return rejectWithValue(result.error || 'Cập nhật hồ sơ thất bại.');
      }
      const user = result.user;
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
      return user; 
    } catch (error) {
      return rejectWithValue('Lỗi hệ thống khi cập nhật hồ sơ.');
    }
  }
);

/**
 * @description Thunk xử lý đổi mật khẩu.
 */
export const updatePasswordAsync = createAsyncThunk(
    'user/updatePassword',
    async (payload, { rejectWithValue }) => {
      try {
        const result = await updatePassword(payload);

        if (!result.success) {
          return rejectWithValue(result.error || 'Đổi mật khẩu thất bại.');
        }
        return result.user; 
      } catch (error) {
        return rejectWithValue('Lỗi hệ thống khi đổi mật khẩu.');
      }
    }
);


/**
 * @description Thunk kiểm tra và tải session từ AsyncStorage (dùng trong SplashScreen).
 */
export const loadSessionAsync = createAsyncThunk(
  'user/loadSession',
  async (_, { rejectWithValue }) => {
    try {
        const userString = await AsyncStorage.getItem(USER_SESSION_KEY);
        if (!userString) {
            return rejectWithValue('No session found');
        }
        const user = JSON.parse(userString);
        return user;
    } catch (error) {
        console.error('Lỗi khi tải session:', error);
        await AsyncStorage.removeItem(USER_SESSION_KEY); // Xóa session lỗi
        return rejectWithValue('Error loading session');
    }
}
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.userId = null;
      state.isLoggedIn = false;
      state.error = null;
      AsyncStorage.removeItem(USER_SESSION_KEY); // Xóa session khi đăng xuất
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {


    // Login and Register
    const handleAuthFulfilled = (state, action) => {
      state.loading = false;
      state.user = action.payload; // Lưu toàn bộ user data
      state.userId = action.payload.id; // Lấy ID cho Person B
      state.isLoggedIn = true;
      state.error = null;
    };


    builder
    // Login
    .addCase(loginAsync.pending, (state) => { 
      state.loading = true; 
      state.error = null; 
    })
    .addCase(loginAsync.fulfilled, handleAuthFulfilled)
    .addCase(loginAsync.rejected, (state, action) => {
      state.loading = false;
      state.isLoggedIn = false;
      state.error = action.payload || 'Đăng nhập thất bại.';
    });

    builder
    // Register
    .addCase(registerAsync.pending, (state) => { 
      state.loading = true; 
      state.error = null; 
    })
    .addCase(registerAsync.fulfilled, handleAuthFulfilled)
    .addCase(registerAsync.rejected, (state, action) => {
      state.loading = false;
      state.isLoggedIn = false;
      state.error = action.payload || 'Đăng ký thất bại.';
    });

    builder
    // Load Session
    .addCase(loadSessionAsync.pending, (state) => { 
      state.loading = true; 
    })
    .addCase(loadSessionAsync.fulfilled, handleAuthFulfilled)
    .addCase(loadSessionAsync.rejected, (state) => {
        state.loading = false;
    });

    builder
    // Update Profile
    .addCase(updateProfileAsync.pending, (state) => { 
      state.loading = true; 
      state.error = null; 
    })
    .addCase(updateProfileAsync.fulfilled, handleAuthFulfilled) 
    .addCase(updateProfileAsync.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Cập nhật hồ sơ thất bại.';
    });

    builder
    // Update Password
    .addCase(updatePasswordAsync.pending, (state) => { 
      state.loading = true; 
      state.error = null; 
    })
    .addCase(updatePasswordAsync.fulfilled, (state) => { 
      state.loading = false; 
      state.error = null; 
    })
    .addCase(updatePasswordAsync.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Đổi mật khẩu thất bại.';
    });
  },
});

export const { logout, clearError } = userSlice.actions;
export default userSlice.reducer;
