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
  }
};

module.exports = taskDB;

