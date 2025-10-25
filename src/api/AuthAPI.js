// AuthAPI.js - Authentication API Functions
import axiosInstance from './axiosInstance';

/**
 * Login user
 * @param {string} email
 * @param {string} password
 * @returns {Promise} User data
 */
export const loginUser = async (email, password) => {
  try {
    // MockAPI không hỗ trợ authentication thực sự
    // Giải pháp: Lấy tất cả users và tìm user với email/password khớp
    const response = await axiosInstance.get('/users');
    const users = response.data;

    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Register new user
 * @param {Object} userData - {email, password, fullname, avatar}
 * @returns {Promise} Created user data
 */
export const registerUser = async (userData) => {
  try {
    // Kiểm tra email đã tồn tại chưa
    const response = await axiosInstance.get('/users');
    const users = response.data;

    const existingUser = users.find((u) => u.email === userData.email);

    if (existingUser) {
      throw new Error('Email đã được sử dụng');
    }

    // Tạo user mới
    const newUser = await axiosInstance.post('/users', {
      email: userData.email,
      password: userData.password,
      fullname: userData.fullname,
      avatar: userData.avatar || '',
      createdAt: new Date().toISOString(),
    });

    return newUser.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user by ID
 * @param {string} userId
 * @returns {Promise} User data
 */
export const getUserById = async (userId) => {
  try {
    const response = await axiosInstance.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} userId
 * @param {Object} updateData
 * @returns {Promise} Updated user data
 */
export const updateUser = async (userId, updateData) => {
  try {
    const response = await axiosInstance.put(`/users/${userId}`, updateData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
