// database.js - SQLite Database Configuration
import * as SQLite from 'expo-sqlite';
import 'react-native-get-random-values'; 
import { v4 as uuidv4 } from 'uuid';

// Open database with new API
const db = SQLite.openDatabaseSync('smartnotes.db');
const NOTES_TABLE = 'notes';

/**
 * Initialize database tables
 */
export const initDatabase = async () => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${NOTES_TABLE} (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        title TEXT NOT NULL,
        content TEXT,
        category TEXT,
        dueDate TEXT,
        latitude REAL,
        longitude REAL,
        image TEXT,
        isCompleted INTEGER DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT,
        syncStatus TEXT DEFAULT 'synced'
      );
    `);
    console.log('✅ Notes table created successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error creating notes table:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Thêm ghi chú mới vào SQLite (Create)
 * @param {Object} note - Dữ liệu ghi chú từ UI
 * @returns {Promise} { success: boolean, note?: object, error?: string }
 */
export const insertNoteToSQLite = async (note) => {
  try {
    const localId = uuidv4(); 
    const timestamp = new Date().toISOString();

    const noteData = {
      ...note,
      id: localId,
      userId: note.userId || null,
      content: note.content || null,
      category: note.category || 'other',
      dueDate: note.dueDate || null,
      latitude: note.latitude || null,
      longitude: note.longitude || null,
      image: note.image || null,
      isCompleted: note.isCompleted ? 1 : 0,
      createdAt: timestamp,
      updatedAt: timestamp, 
      syncStatus: 'pending', // Đánh dấu cần đồng bộ (Pending)
    };

    const sql = `
      INSERT INTO ${NOTES_TABLE} (id, userId, title, content, category, dueDate, latitude, longitude, image, isCompleted, createdAt, updatedAt, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      noteData.id, noteData.userId, noteData.title, noteData.content, 
      noteData.category, noteData.dueDate, noteData.latitude, 
      noteData.longitude, noteData.image, noteData.isCompleted, 
      noteData.createdAt, noteData.updatedAt, noteData.syncStatus
    ];

    await db.runAsync(sql, params);

    console.log('✅ Note inserted to SQLite:', noteData);
    return { success: true, note: noteData };

  } catch (error) {
    console.error('❌ Error inserting note to SQLite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Đọc tất cả ghi chú của một user hoặc guest mode (Read)
 * @param {string} userId - - ID của user. Nếu null, đọc tất cả guest notes.
 * @returns {Promise<Object>} { success: boolean, notes?: Array<object>, error?: string }
 */
export const getAllNotesFromSQLite = async (userId) => {
  try {
    let sql = `SELECT * FROM ${NOTES_TABLE} WHERE userId = ? OR userId IS NULL ORDER BY updatedAt DESC;`;
    let params = [userId];

    // Xử lý khi là Guest Mode (chỉ lấy userId IS NULL)
    if (userId === null || userId === undefined) {
      sql = `SELECT * FROM ${NOTES_TABLE} WHERE userId IS NULL ORDER BY updatedAt DESC;`;
      params = [];
    }

    const result = await db.getAllAsync(sql, params);

    const notes = result.map(note => ({
        ...note,
        isCompleted: note.isCompleted === 1,
    }));
    
    return { success: true, notes: notes };
  } catch (error) {
    console.error('❌ Error loading notes from SQLite:', error);
    return { success: false, error: error.message, notes: [] }; 
  }
};

/**
 * Cập nhật ghi chú trong SQLite (Update)
 * @param {object} note - Dữ liệu ghi chú cần cập nhật (phải có id)
 * @returns {Promise<Object>} { success: boolean, note?: object, error?: string }
 */
export const updateNoteInSQLite = async (note) => {
  try {
    if (!note.id) {
        throw new Error('Note ID is required for update.');
    }
    const timestamp = new Date().toISOString();
    
    const sql = `
      UPDATE ${NOTES_TABLE} 
      SET title=?, content=?, category=?, dueDate=?, latitude=?, longitude=?, image=?, isCompleted=?, updatedAt=?, syncStatus='pending' 
      WHERE id=?;
    `;
    const params = [
      note.title,
      note.content || null,
      note.category || 'other',
      note.dueDate || null,
      note.latitude || null,
      note.longitude || null,
      note.image || null,
      note.isCompleted ? 1 : 0,
      timestamp, 
      note.id,
    ];

    await db.runAsync(sql, params);
    
    // Trả về dữ liệu note đã cập nhật để Redux cập nhật state
    return { 
        success: true, 
        note: {
            ...note, 
            updatedAt: timestamp, 
            syncStatus: 'pending',
            isCompleted: note.isCompleted ? 1 : 0 
        }
    };
  } catch (error) {
    console.error('❌ Error updating note in SQLite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Đánh dấu note để xóa (Soft Delete)
 */
export const markNoteAsDeleted = async (noteId) => {
  try {
    // Thêm trường isDeleted=1 (hoặc dùng syncStatus='deleted-pending')
    const sql = `UPDATE ${NOTES_TABLE} SET syncStatus = 'deleted-pending' WHERE id = ?;`;
    await db.runAsync(sql, [noteId]);
    console.log('✅ Note is marked as deleted (not really) from SQLite:', noteId);
    return { success: true, id: noteId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 Xóa ghi chú khỏi SQLite (Delete)
 * @param {string} id - ID của ghi chú cần xóa
 * @returns {Promise<Object>} { success: boolean, id: string, error?: string }
 */
export const deleteNoteFromSQLite = async (id) => {
  try {
    const result = await db.runAsync(`DELETE FROM ${NOTES_TABLE} WHERE id = ?;`, [id]);
    
    if (result.changes === 0) {
        console.warn(`⚠️ Note with id ${noteId} not found for deletion`);
    } else {
        console.log('✅ Note deleted from SQLite:', id);
    }
    
    return { success: true, id: id };
  } catch (error) {
    console.error('❌ Error deleting note from SQLite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lấy tất cả ghi chú đang ở trạng thái 'pending' để đẩy lên Cloud.
 * @returns {Promise<Object>} { success: boolean, notes?: Array<object>, error?: string }
 */
export const getNotesToSync = async () => {
  try {
    const sql = `SELECT * FROM ${NOTES_TABLE} WHERE syncStatus = 'pending' ORDER BY updatedAt ASC;`;
    const result = await db.getAllAsync(sql);

    const notes = result.map(note => ({
        ...note,
        isCompleted: note.isCompleted === 1,
    }));

    return { success: true, notes: notes };
  } catch (error) {
    console.error('❌ Error getting notes to sync:', error);
    return { success: false, error: error.message, notes: [] }; 
  }
};

/**
 * Cập nhật trạng thái đồng bộ của một ghi chú.
 * @param {string} noteId - ID của ghi chú cần cập nhật.
 * @param {string} newSyncStatus - Trạng thái mới ('synced', 'pending', 'error').
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export const updateSyncStatus = async (noteId, newSyncStatus) => {
  try {
    const sql = `UPDATE ${NOTES_TABLE} SET syncStatus = ? WHERE id = ?;`;
    await db.runAsync(sql, [newSyncStatus, noteId]);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error updating sync status for ${noteId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Thêm/Cập nhật ghi chú từ nguồn Cloud vào SQLite.
 * Hàm này dùng để Pull dữ liệu từ Cloud về Local.
 * @param {Object} cloudNote - Note từ MockAPI.
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export const upsertNoteFromCloud = async (cloudNote) => {
  try {
    const { 
        id, userId, title, content, category, dueDate, 
        latitude, longitude, image, isCompleted, createdAt, 
        updatedAt 
    } = cloudNote;

    const existingNote = await db.getFirstAsync(`SELECT updatedAt FROM ${NOTES_TABLE} WHERE id = ?;`, [id]);
    
    if (existingNote) {
        // Nếu bản ghi tồn tại, so sánh thời gian cập nhật
        if (new Date(existingNote.updatedAt) >= new Date(updatedAt)) {
            return { success: true, message: 'Local data is newer/equal, skipped update.' };
        }
        const updateSql = `
            UPDATE ${NOTES_TABLE} SET userId=?, title=?, content=?, category=?, dueDate=?, latitude=?, longitude=?, image=?, isCompleted=?, updatedAt=?, syncStatus='synced'
            WHERE id=?;
        `;
        const updateParams = [
            userId || null, title, content || null, category, dueDate, 
            latitude, longitude, image, isCompleted ? 1 : 0, updatedAt, id
        ];
        await db.runAsync(updateSql, updateParams);
        
    } else {
        // Bản ghi chưa tồn tại, THÊM MỚI
        const insertSql = `
            INSERT INTO ${NOTES_TABLE} (id, userId, title, content, category, dueDate, latitude, longitude, image, isCompleted, createdAt, updatedAt, syncStatus)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced');
        `;
        const insertParams = [
            id, userId || null, title, content, category, dueDate, 
            latitude, longitude, image, isCompleted ? 1 : 0, createdAt, updatedAt
        ];
        await db.runAsync(insertSql, insertParams);
    }

    return { success: true, id: id };
  } catch (error) {
    console.error(`❌ Error upserting note ${cloudNote.id}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Cập nhật ID Local (UUID) và trạng thái Sync thành ID Cloud chính thức.
 * Chỉ dùng sau khi POST thành công một note mới lên Cloud.
 * @param {string} localId - ID UUID tạm thời.
 * @param {string} cloudId - ID do MockAPI tạo.
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export const updateLocalIdToCloudId = async (localId, cloudId) => {
  try {
    const sql = `
      UPDATE ${NOTES_TABLE} 
      SET id = ?, syncStatus = 'synced' 
      WHERE id = ?;
    `;
    // Cập nhật trường ID từ localId thành cloudId
    await db.runAsync(sql, [cloudId, localId]); 
    return { success: true };
  } catch (error) {
    console.error(`❌ Error updating ID from ${localId} to ${cloudId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Xóa các notes local không còn tồn tại trên Cloud (Chỉ xóa notes đã synced)
 * @param {Array<string>} cloudNoteIds - Danh sách IDs từ Cloud
 * @param {string} userId - ID của User hiện tại
 */
export const cleanLocalDeletedNotes = async (cloudNoteIds, userId) => {
  try {
    const idList = cloudNoteIds.map(id => `'${id}'`).join(', ');
    const sql = `
      DELETE FROM ${NOTES_TABLE}
      WHERE userId = ? 
      AND id NOT IN (${idList.length > 0 ? idList : "''"})
      AND syncStatus = 'synced'; 
    `;

    const result = await db.runAsync(sql, [userId]);
    console.log(`✅ Đã xóa ${result.changes} notes local không còn trên Cloud.`);
    return { success: true };
  } catch (error) {
    console.error('❌ Lỗi Clean Deleted Notes:', error);
    return { success: false, error: error.message };
  }
};

/* Dời qua luồng xử lý khác
/**
 * Sync notes between SQLite and MockAPI
 * @param {Array} apiNotes - Notes from API
 * @param {string} userId
 * @returns {Object} { success: boolean, error?: string }
 */
/*
export const syncWithSQLite = async (apiNotes, userId) => {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    if (!Array.isArray(apiNotes)) {
      throw new Error('apiNotes must be an array');
    }

    // Get local notes
    const localNotes = await loadNotesFromSQLite(userId);

    // Clear SQLite and insert all API notes
    await db.runAsync(`DELETE FROM notes WHERE userId = ?;`, [userId]);

    // Insert all API notes
    for (const note of apiNotes) {
      const result = await insertNoteToSQLite(note);
      if (!result.success) {
        console.warn(`⚠️ Failed to sync note ${note.id}:`, result.error);
      }
    }

    console.log('✅ Sync completed successfully');
    return { success: true, synced: apiNotes.length };
  } catch (error) {
    console.error('❌ Error syncing with SQLite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear all data from SQLite
 * @returns {Object} { success: boolean, error?: string }
 */
/*
export const clearDatabase = async () => {
  try {
    await db.runAsync(`DELETE FROM notes;`);
    console.log('✅ Database cleared');
    return { success: true };
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    return { success: false, error: error.message };
  }
};

export default db; 
*/
