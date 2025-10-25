// NoteAPI.js - Note CRUD API Functions
import axiosInstance from './axiosInstance';

/**
 * Get all notes for a user
 * @param {string} userId
 * @returns {Promise} Array of notes
 */
export const getNotes = async (userId) => {
  try {
    const response = await axiosInstance.get(`/notes?userId=${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get single note by ID
 * @param {string} noteId
 * @returns {Promise} Note data
 */
export const getNoteById = async (noteId) => {
  try {
    const response = await axiosInstance.get(`/notes/${noteId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new note
 * @param {Object} noteData - Note object with all fields
 * @returns {Promise} Created note data
 */
export const createNote = async (noteData) => {
  try {
    const response = await axiosInstance.post('/notes', {
      ...noteData,
      createdAt: new Date().toISOString(),
      isCompleted: false,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update existing note
 * @param {string} noteId
 * @param {Object} noteData - Updated note data
 * @returns {Promise} Updated note data
 */
export const updateNote = async (noteId, noteData) => {
  try {
    const response = await axiosInstance.put(`/notes/${noteId}`, noteData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete note
 * @param {string} noteId
 * @returns {Promise} Deleted note ID
 */
export const deleteNote = async (noteId) => {
  try {
    await axiosInstance.delete(`/notes/${noteId}`);
    return noteId;
  } catch (error) {
    throw error;
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
