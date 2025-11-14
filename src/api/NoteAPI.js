// NoteAPI.js - Note CRUD API Functions
import axiosInstance from './axiosInstance';

const USER_RESOURCE = '/users';

// Hàm mô phỏng tải ảnh lên dịch vụ hosting (tạm thời không implement)
const uploadImageToHost = async (localUri) => {
  // Logic tải ảnh lên Imgur/Firebase Storage...
  // Hiện tại: chỉ trả về đường dẫn cục bộ (nếu là MockAPI) hoặc default URL
  return localUri;
};

/**
 * @description Lấy tất cả ghi chú của một User từ MockAPI (GET)
 */
export const fetchNotesByUserId = async (userId) => {
  if (!userId) {
    return { success: false, error: 'User ID là bắt buộc để tải ghi chú từ Cloud.' };
  }
  try {
    const url = `${USER_RESOURCE}/${userId}/notes`;
    const response = await axiosInstance.get(url);

    return { success: true, notes: response.data };
  } catch (error) {
    if (
      error.response &&
      error.response.status === 404 &&
      error.response.data === "Not found" 
    ) {
      console.log('Thông báo: Không tìm thấy notes trên cloud (404 - Not Found), trả về danh sách rỗng.');
      return { success: true, notes: [] };
    }
    console.error('Lỗi khi tải ghi chú từ Cloud:', error);
    return { success: false, error: error.message, notes: [] };
  }
};


/**
 * @description Tạo ghi chú mới trên MockAPI (POST)
 */
export const createCloudNote = async (noteData) => {
  try {
    // Tải ảnh lên Hosting và lấy URL (giả định)
    const imageUrl = await uploadImageToHost(noteData.image);
    
    // Loại bỏ các trường không cần thiết (id local, syncStatus)
    const { id, syncStatus, ...payloadData } = noteData;

    const url = `${USER_RESOURCE}/${noteData.userId}/notes`;
    const payload = {
      ...payloadData,
      image: imageUrl,
    };

    const response = await axiosInstance.post(url, payload);
    return { success: true, note: response.data };
  } catch (error) {
    console.error('Lỗi khi tạo ghi chú Cloud:', error);
    return { success: false, error: error.message };
  }
};

/**
 * @description Cập nhật ghi chú trên MockAPI (PUT)
 */
export const updateCloudNote = async (noteData) => {
  try {
    // Tải ảnh lên Hosting và lấy URL (giả định)
    const imageUrl = await uploadImageToHost(noteData.image);
    
    // *** SỬA LỖI LOGIC: ***
    // Chỉ loại bỏ 'id' và 'syncStatus', giữ lại 'updatedAt'
    const { id, syncStatus, ...payloadData } = noteData;

    const url = `${USER_RESOURCE}/${noteData.userId}/notes/${noteData.id}`;

    const payload = {
      ...payloadData, 
      image: imageUrl,
      
    };

    const response = await axiosInstance.put(url, payload);
    return { success: true, note: response.data };
  } catch (error) {
    console.error('Lỗi khi cập nhật ghi chú Cloud:', error);
    return { success: false, error: error.message };
  }
};

/**
 * @description Xóa ghi chú trên MockAPI (DELETE)
 */
export const deleteCloudNote = async (userId, noteId) => {
  try {
    const url = `${USER_RESOURCE}/${userId}/notes/${noteId}`;
    await axiosInstance.delete(url);

    return { success: true, id: noteId };
  } catch (error) {
    console.error('Lỗi khi xóa ghi chú Cloud:', error);
    return { success: false, error: error.message };
  }
};

/**
 * @description Lấy chi tiết một ghi chú từ MockAPI theo ID.
 * * @param {string} userId - ID người dùng.
 * @param {string} noteId - ID ghi chú.
 * @returns {Promise<Object>} { success: boolean, note?: object, error?: string }
*/
export const getNoteById = async (userId, noteId) => {
  if (!userId || !noteId) {
    return { success: false, error: 'User ID và Note ID là bắt buộc.' };
  }
  try {
    const url = `${USER_RESOURCE}/${userId}/notes/${noteId}`;
    const response = await axiosInstance.get(url);

    return { success: true, note: response.data };
  } catch (error) {
    console.error('Lỗi khi tải chi tiết ghi chú từ Cloud:', error);
    return { success: false, error: 'Không tìm thấy ghi chú trên Cloud.' };
  }
};


/**
 * Search notes by keyword
 * @param {string} userId
 * @param {string} keyword
 * @returns {Promise} Array of matching notes
 */
export const searchNotes = async (userId, keyword) => {
  try {
    const response = await axiosInstance.get(`/notes?userId=${userId}`);
    const notes = response.data;

    if (!keyword) return notes;

    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(keyword.toLowerCase()) ||
        note.content.toLowerCase().includes(keyword.toLowerCase())
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Filter notes by category
 * @param {string} userId
 * @param {string} category
 * @returns {Promise} Array of notes in category
 */
export const filterNotesByCategory = async (userId, category) => {
  try {
    const response = await axiosInstance.get(
      `/notes?userId=${userId}&category=${category}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/*
/**
 * @description Tìm kiếm/Lọc Notes bằng cách tải tất cả notes của user và lọc local.
 * @param {string} userId
 * @param {string} [keyword='']
 * @param {string} [category=null]
 * @returns {object} { success: boolean, notes?: Array, error?: string }
 */
/*
export const searchAndFilterNotes = async (userId, keyword = '', category = null) => {
  if (!userId) {
    return { success: false, error: 'User ID là bắt buộc.' };
  }

  try {
    let url = `${USER_RESOURCE}/${userId}/notes`;
    let params = {};

    // Lọc theo category
    if (category && category !== 'Tat Ca') {
      url += `?category=${category}`;
    }

    const response = await axiosInstance.get(url);
    let notes = response.data;

    // Lọc theo keyword
    if (keyword) {
      const lowerCaseKeyword = keyword.toLowerCase();
      notes = notes.filter(
        (note) =>
          note.title?.toLowerCase().includes(lowerCaseKeyword) ||
          note.content?.toLowerCase().includes(lowerCaseKeyword)
      );
    }

    return { success: true, notes: notes };
  } catch (error) {
    console.error('Lỗi khi tìm kiếm/lọc ghi chú:', error);
    return { success: false, error: error.message, notes: [] };
  }
};
*/