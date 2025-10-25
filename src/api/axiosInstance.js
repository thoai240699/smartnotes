// axiosInstance.js - Axios Configuration
import axios from 'axios';

// TODO: Thay đổi BASE_URL thành URL MockAPI của bạn
const BASE_URL = 'https://YOUR_MOCKAPI_ID.mockapi.io/api/v1';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Có thể thêm token vào header ở đây
    // const token = await AsyncStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi global
    if (error.response) {
      // Server trả về lỗi
      console.log('API Error:', error.response.data);
    } else if (error.request) {
      // Request được gửi nhưng không nhận được response
      console.log('Network Error:', error.request);
    } else {
      console.log('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
