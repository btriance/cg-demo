const Database = require('better-sqlite3');
const path = require('path');

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'tasks.db'));

// Create tasks table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create attachments table for file uploads
db.exec(`
  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  )
`);

// Database operations
const taskDB = {
  // Get all tasks
  getAllTasks: () => {
    const stmt = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
    return stmt.all();
  },

  // Get task by ID
  getTaskById: (id) => {
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    return stmt.get(id);
  },

  // Create new task
  createTask: (title, description) => {
    const stmt = db.prepare('INSERT INTO tasks (title, description) VALUES (?, ?)');
    const result = stmt.run(title, description);
    return result.lastInsertRowid;
  },

  // Update task
  updateTask: (id, title, description, status) => {
    const stmt = db.prepare(
      'UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    const result = stmt.run(title, description, status, id);
    return result.changes > 0;
  },

  // Delete task
  deleteTask: (id) => {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // Attachment operations

  // Create attachment record
  createAttachment: (taskId, filename, originalName, filePath, fileSize, mimeType) => {
    const stmt = db.prepare(
      'INSERT INTO attachments (task_id, filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(taskId, filename, originalName, filePath, fileSize, mimeType);
    return result.lastInsertRowid;
  },

  // Get attachments for a task
  getAttachmentsByTaskId: (taskId) => {
    const stmt = db.prepare('SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at DESC');
    return stmt.all(taskId);
  },

  // Get attachment by ID
  getAttachmentById: (id) => {
    const stmt = db.prepare('SELECT * FROM attachments WHERE id = ?');
    return stmt.get(id);
  },

  // Delete attachment
  deleteAttachment: (id) => {
    const stmt = db.prepare('DELETE FROM attachments WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

module.exports = taskDB;

