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
    const response = await axiosInstance.get(`/users`);
    const users = response.data;

    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return { success: false, error: 'Email hoặc mật khẩu không đúng.' };
    }

    return {success: true, user}
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    return { success: false, error: 'Lỗi kết nối hoặc hệ thống.' };
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
    const response = await axiosInstance.get(`/users`);
    const users = response.data;

    const existingUser = users.find((u) => u.email === userData.email);

    if (existingUser) {
      return { success: false, error: 'Email đã được đăng ký.' };
    }

    // Tạo user mới
    const newUser = await axiosInstance.post(`/users`, {
      email: userData.email,
      password: userData.password,
      fullname: userData.fullname,
      avatar: userData.avatar || '',
      createdAt: new Date().toISOString(),
    });

    return { success: true, user: newUser.data };
  } catch (error) {
    console.error('Lỗi khi đăng ký:', error);
    return { success: false, error: 'Lỗi kết nối hoặc hệ thống.' };
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
    return { success: true, user: response.data };
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    return { success: false, error: 'Lỗi kết nối hoặc hệ thống.' };
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
    return { success: true, user: response.data };
  } catch (error) {
    console.error('Lỗi khi cập nhật hồ sơ người dùng:', error);
    return { success: false, error: 'Lỗi kết nối hoặc hệ thống.' };
  }
};


/**
 * @description Thay đổi mật khẩu người dùng.
 * @param {object} payload - { id, oldPassword, newPassword }
 */

export const updatePassword = async ({ id, oldPassword, newPassword }) => {
  try{
      const response = await axiosInstance.get(`/users/${id}`);
      const user = response.data;
      if(user.password !== oldPassword){
          return { success: false, error: 'Mật khẩu cũ không đúng.' };
      }

      const updatedUser = await axiosInstance.put(`/users/${id}`, { password: newPassword });
      return { success: true, user: updatedUser.data };
  } catch (error) {
    console.error('Lỗi khi đổi mật khẩu:', error);
    return { success: false, error: 'Lỗi khi đổi mật khẩu' };
  }
};


/**
 * @description Tìm kiếm người dùng theo Email
 * @param {string} email
 * @returns {Promise}} - Trả về dữ liệu người dùng 
 */
export const findUserByEmail = async (email) => {
  try {
    const response = await axiosInstance.get(`/users`, {
      params: { email: email },
    });
    const userList = response.data;
    if (!userList || userList.length === 0) {
      return { success: false, error: 'Email không tồn tại trong hệ thống.' };
    }
    return { success: true, user: userList[0] };
  } catch (error) {
    console.error('Lỗi khi tìm user theo email:', error);
    return { success: false, error: 'Lỗi kết nối hoặc hệ thống.' };
  }
};


/**
 * @description Cập nhật mật khẩu mới sau khi xác thực mã (Bước cuối Quên Mật Khẩu)
 * @param {string} userId
 * @param {string} newPassword
 * @returns {Promise}} - Trả về dữ liệu người dùng đã cập nhật
 */
export const resetPassword = async (userId, newPassword) => {
  try {
    
    const getResponse = await axiosInstance.get(`/users/${userId}`);
    const existingUser = getResponse.data;
    
    const updateResponse = await axiosInstance.put(`${USER_RESOURCE}/${userId}`, {
      ...existingUser,
      password: newPassword, 
    });
    
    return { success: true, user: updateResponse.data };

  } catch (error) {
    console.error('Lỗi khi reset mật khẩu:', error);
    return { success: false, error: 'Lỗi hệ thống khi tạo mật khẩu mới.' };
  }
};