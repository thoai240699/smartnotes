// database.js - SQLite Database Configuration
import * as SQLite from 'expo-sqlite';

// Open database with new API
const db = SQLite.openDatabaseSync('smartnotes.db');

/**
 * Initialize database tables
 */
export const initDatabase = async () => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        category TEXT,
        dueDate TEXT,
        latitude REAL,
        longitude REAL,
        image TEXT,
        isCompleted INTEGER DEFAULT 0,
        createdAt TEXT,
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
 * Insert note to SQLite
 * @param {Object} note
 * @returns {Object} { success: boolean, id?: string, error?: string }
 */
export const insertNoteToSQLite = async (note) => {
  try {
    // Validate required fields
    if (!note.id || !note.userId || !note.title) {
      throw new Error('Missing required fields: id, userId, or title');
    }

    const result = await db.runAsync(
      `INSERT INTO notes (id, userId, title, content, category, dueDate, latitude, longitude, image, isCompleted, createdAt, syncStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        note.id,
        note.userId,
        note.title,
        note.content || '',
        note.category || 'other',
        note.dueDate || '',
        note.latitude || null,
        note.longitude || null,
        note.image || '',
        note.isCompleted ? 1 : 0,
        note.createdAt || new Date().toISOString(),
        'synced',
      ]
    );
    console.log('✅ Note inserted to SQLite:', note.id);
    return { success: true, id: note.id };
  } catch (error) {
    console.error('❌ Error inserting note to SQLite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all notes from SQLite
 * @param {string} userId
 * @returns {Promise<Array>} Array of notes or empty array on error
 */
export const loadNotesFromSQLite = async (userId) => {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const result = await db.getAllAsync(
      `SELECT * FROM notes WHERE userId = ? ORDER BY createdAt DESC;`,
      [userId]
    );
    const notes = result.map((note) => ({
      ...note,
      isCompleted: note.isCompleted === 1,
    }));
    console.log(`✅ Loaded ${notes.length} notes from SQLite`);
    return notes;
  } catch (error) {
    console.error('❌ Error loading notes from SQLite:', error);
    return []; // Return empty array instead of throwing
  }
};

/**
 * Update note in SQLite
 * @param {string} noteId
 * @param {Object} noteData
 * @returns {Object} { success: boolean, error?: string }
 */
export const updateNoteInSQLite = async (noteId, noteData) => {
  try {
    if (!noteId || !noteData) {
      throw new Error('noteId and noteData are required');
    }

    const result = await db.runAsync(
      `UPDATE notes 
       SET title = ?, content = ?, category = ?, dueDate = ?, 
           latitude = ?, longitude = ?, image = ?, isCompleted = ?, syncStatus = ?
       WHERE id = ?;`,
      [
        noteData.title,
        noteData.content || '',
        noteData.category || 'other',
        noteData.dueDate || '',
        noteData.latitude || null,
        noteData.longitude || null,
        noteData.image || '',
        noteData.isCompleted ? 1 : 0,
        'synced',
        noteId,
      ]
    );

    if (result.changes === 0) {
      throw new Error(`Note with id ${noteId} not found`);
    }

    console.log('✅ Note updated in SQLite:', noteId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating note in SQLite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete note from SQLite
 * @param {string} noteId
 * @returns {Object} { success: boolean, error?: string }
 */
export const deleteNoteFromSQLite = async (noteId) => {
  try {
    if (!noteId) {
      throw new Error('noteId is required');
    }

    const result = await db.runAsync(`DELETE FROM notes WHERE id = ?;`, [
      noteId,
    ]);

    if (result.changes === 0) {
      console.warn(`⚠️ Note with id ${noteId} not found for deletion`);
    } else {
      console.log('✅ Note deleted from SQLite:', noteId);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting note from SQLite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync notes between SQLite and MockAPI
 * @param {Array} apiNotes - Notes from API
 * @param {string} userId
 * @returns {Object} { success: boolean, error?: string }
 */
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
